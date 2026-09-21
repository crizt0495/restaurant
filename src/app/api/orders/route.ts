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
        product_name: z.string(),
        quantity: z.number().min(1),
        unit_price: z.number().min(0),
      })
    )
    .min(1),
  notes: z.string().optional(),
})

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

  const admin = createClient(serviceUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { branchId, tableId, items, notes } = parsed.data

  // Validate branch exist and is active
  const { data: branch } = await admin.from("branches").select("organization_id, is_active").eq("id", branchId).single()
  if (!branch || !branch.is_active) return NextResponse.json({ error: "Branch not valid" }, { status: 404 })

  // Validate products exist and are active
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

  // Ensure prices match DB prices to prevent tampering
  const validatedItems = items.map(item => {
    const p = products.find(prod => prod.id === item.product_id)!
    return {
      product_id: item.product_id,
      product_name: p.name,
      variant_id: null,
      variant_name: null,
      quantity: item.quantity,
      unit_price: Number(p.selling_price),
      discount: 0,
      tax_percentage: Number(p.tax_percentage),
      notes: null,
      modifiers: [],
    }
  })

  const subtotal = validatedItems.reduce((s, i) => s + i.unit_price * i.quantity, 0)
  
  // Note: For public endpoints we should ideally use a transaction.
  // We can just use the atomic RPC created for POS by passing a generic profile_id, 
  // but the RPC uses auth.uid(). Since this is a public endpoint with service role, 
  // we either create a separate service-role RPC or insert manually here.
  // For safety, let's just insert manually with a specific source = 'QR_MENU'
  
  // Create the order with a collision-safe order number (retry on unique violation)
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
          total: subtotal,
          payment_status: "UNPAID",
          notes: notes?.trim() || undefined,
          source: "QR_MENU",
        })
        .select()
        .single()

      if (order) return { order, orderNumber }
      // Retry only on order_number unique-violation; fail on anything else
      if (!(error && error.code === "23505")) return { error }
    }
    return { error: new Error("Gagal membuat nomor order") }
  }

  const { order, error: orderError } = await insertOrder()

  if (orderError || !order) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }

  // Insert items
  for (const item of validatedItems) {
    const { error: itemError } = await admin.from("order_items").insert({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_percentage: item.tax_percentage,
      tax_amount: (item.unit_price * item.quantity) * (item.tax_percentage / 100),
      subtotal: item.unit_price * item.quantity,
      total: (item.unit_price * item.quantity) + ((item.unit_price * item.quantity) * (item.tax_percentage / 100)),
    })
    if (itemError) {
      return NextResponse.json({ error: "Failed to add items" }, { status: 500 })
    }
  }

  // Mark table as occupied if a table is set
  if (tableId) {
    await admin
      .from("restaurant_tables")
      .update({ status: "OCCUPIED" })
      .eq("id", tableId)
  }

  // Notify staff (one row per active staff member so each user can mark as read)
  await admin.rpc("notify_staff", {
    p_org: branch.organization_id,
    p_type: "new_order",
    p_title: "Order Baru (QR Menu)",
    p_message: `Order ${order.order_number} dari meja dikirim ke dapur`,
    p_data: { order_id: order.id },
  })

  return NextResponse.json({ success: true, order_id: order.id, order_number: order.order_number })
}