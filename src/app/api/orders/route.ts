import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"

const schema = z.object({
  branchId: z.string().uuid(),
  tableId: z.string().uuid().optional(),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        quantity: z.number().int().min(1).max(99),
      })
    )
    .min(1)
    .max(50),
  notes: z.string().max(500).optional(),
})

// Best-effort in-memory rate limiting (per serverless instance).
const RATE_WINDOW_MS = 10 * 60 * 1000
const RATE_MAX_ORDERS = 5
const rateHits = new Map<string, { count: number; reset: number }>()

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const hit = rateHits.get(key)
  if (!hit || now >= hit.reset) {
    rateHits.set(key, { count: 1, reset: now + RATE_WINDOW_MS })
    return false
  }
  hit.count += 1
  return hit.count > RATE_MAX_ORDERS
}

export async function POST(req: Request) {
  const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceUrl || !serviceKey) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  const rateKey = `${clientIp}|${parsed.data.tableId || parsed.data.branchId}`
  if (isRateLimited(rateKey)) {
    return NextResponse.json({ error: "Terlalu banyak pesanan, coba lagi nanti" }, { status: 429 })
  }

  const admin = createClient(serviceUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { branchId, tableId, items, notes } = parsed.data

  const { data: branch } = await admin
    .from("branches")
    .select("organization_id, is_active")
    .eq("id", branchId)
    .single()
  if (!branch || !branch.is_active) {
    return NextResponse.json({ error: "Branch not valid" }, { status: 404 })
  }

  if (tableId) {
    const { data: table } = await admin
      .from("restaurant_tables")
      .select("id, is_active")
      .eq("id", tableId)
      .eq("branch_id", branchId)
      .single()
    if (!table || !table.is_active) {
      return NextResponse.json({ error: "Table not valid" }, { status: 404 })
    }
  }

  const { data: org } = await admin
    .from("organizations")
    .select("service_charge_percentage, is_service_charge_active, tax_inclusive")
    .eq("id", branch.organization_id)
    .single()

  const serviceChargePercent = Boolean(org?.is_service_charge_active)
    ? Number(org?.service_charge_percentage ?? 0)
    : 0
  const taxInclusive = Boolean(org?.tax_inclusive)

  const productIds = items.map((i) => i.product_id)
  const { data: products } = await admin
    .from("products")
    .select("id, name, is_active, deleted_at, selling_price, tax_percentage")
    .in("id", productIds)

  if (!products || products.length !== productIds.length) {
    return NextResponse.json({ error: "Some products are invalid" }, { status: 400 })
  }
  for (const p of products) {
    if (!p.is_active || p.deleted_at) {
      return NextResponse.json({ error: "Some products are unavailable" }, { status: 400 })
    }
  }

  const validatedItems = items.map((item) => {
    const p = products.find((prod) => prod.id === item.product_id)!
    const unitPrice = Number(p.selling_price)
    const taxPerc = Number(p.tax_percentage ?? 0)
    const lineSubtotal = unitPrice * item.quantity
    const taxAmount = taxInclusive
      ? lineSubtotal - lineSubtotal / (1 + taxPerc / 100)
      : (lineSubtotal * taxPerc) / 100
    return {
      product_id: item.product_id,
      product_name: p.name,
      quantity: item.quantity,
      unit_price: unitPrice,
      tax_percentage: taxPerc,
      tax_amount: taxAmount,
      subtotal: lineSubtotal,
      total: lineSubtotal + taxAmount,
    }
  })

  const subtotal = validatedItems.reduce((s, i) => s + i.subtotal, 0)
  const taxAmount = validatedItems.reduce((s, i) => s + i.tax_amount, 0)
  const serviceCharge = (subtotal * serviceChargePercent) / 100
  const total = subtotal + taxAmount + serviceCharge

  const insertOrder = async () => {
    for (let attempt = 0; attempt < 10; attempt++) {
      const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "")
      const orderNumber = `ORD-${stamp}-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`
      const { data: order, error } = await admin
        .from("orders")
        .insert({
          organization_id: branch.organization_id,
          branch_id: branchId,
          order_number: orderNumber,
          status: "NEW",
          order_type: "DINE_IN",
          table_id: tableId || null,
          subtotal,
          discount: 0,
          tax_amount: taxAmount,
          service_charge: serviceCharge,
          total,
          paid_amount: 0,
          change_amount: 0,
          payment_status: "UNPAID",
          notes: notes?.trim() || undefined,
          source: "QR_MENU",
        })
        .select()
        .single()

      if (order) return order as { id: string; order_number: string }
      if (!(error && error.code === "23505")) return null
    }
    return null
  }

  const order = await insertOrder()
  if (!order) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }

  for (const item of validatedItems) {
    const { error: itemError } = await admin.from("order_items").insert({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_percentage: item.tax_percentage,
      tax_amount: item.tax_amount,
      subtotal: item.subtotal,
      total: item.total,
    })
    if (itemError) {
      await admin.from("orders").delete().eq("id", order.id)
      if (tableId) {
        await admin.from("restaurant_tables").update({ status: "AVAILABLE" }).eq("id", tableId)
      }
      return NextResponse.json({ error: "Failed to add items" }, { status: 500 })
    }
  }

  if (tableId) {
    await admin.from("restaurant_tables").update({ status: "OCCUPIED" }).eq("id", tableId)
  }

  await admin.rpc("notify_staff", {
    p_org: branch.organization_id,
    p_type: "new_order",
    p_title: "Order Baru (QR Menu)",
    p_message: `Order ${order.order_number} dari meja dikirim ke dapur`,
    p_data: { order_id: order.id },
  })

  return NextResponse.json({ success: true, order_id: order.id, order_number: order.order_number })
}