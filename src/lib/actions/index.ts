"use server"

import { revalidatePath } from "next/cache"
import { getServerClient, getCurrentUser } from "@/lib/helpers"
import { z } from "zod"
import { generatePONumber } from "@/lib/utils"

// ============================================================
// PRODUCTS
// ============================================================

const productSchema = z.object({
  name: z.string().min(1),
  category_id: z.string().min(1),
  sku: z.string().min(1),
  barcode: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  selling_price: z.coerce.number().min(0),
  purchase_price: z.coerce.number().min(0).default(0),
  cost_price: z.coerce.number().min(0).default(0),
  tax_percentage: z.coerce.number().min(0).default(0),
  unit: z.string().default("pcs"),
  stock_tracking: z.boolean().default(true),
  minimum_stock: z.coerce.number().min(0).default(0),
  is_active: z.boolean().default(true),
  is_favorite: z.boolean().default(false),
})

export async function createProduct(input: z.infer<typeof productSchema>) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("products.create")) {
    return { error: "Forbidden" }
  }

  const parsed = productSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Invalid input" }

  const supabase = await getServerClient()
  const data = parsed.data

  const { data: orgRow } = await supabase
    .from("branches")
    .select("organization_id")
    .eq("id", user.branch_id ?? "")
    .single()

  const organization_id = orgRow?.organization_id

  const { error } = await supabase.from("products").insert({
    ...data,
    organization_id,
  })

  if (error) return { error: error.message }
  revalidatePath("/products")
  return { success: true }
}

export async function updateProduct(
  id: string,
  input: z.infer<typeof productSchema>
) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("products.edit")) {
    return { error: "Forbidden" }
  }

  const parsed = productSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Invalid input" }

  const supabase = await getServerClient()
  const { error } = await supabase.from("products").update(parsed.data).eq("id", id)
  if (error) return { error: error.message }

  revalidatePath("/products")
  return { success: true }
}

export async function deleteProduct(id: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("products.delete")) {
    return { error: "Forbidden" }
  }

  const supabase = await getServerClient()
  // Soft delete
  const { error } = await supabase
    .from("products")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/products")
  return { success: true }
}

// ============================================================
// CATEGORIES
// ============================================================

export async function createCategory(name: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("products.create")) {
    return { error: "Forbidden" }
  }
  if (!name.trim()) return { error: "Nama kategori wajib diisi" }
  const supabase = await getServerClient()
  const { data: orgRow } = await supabase
    .from("branches")
    .select("organization_id")
    .eq("id", user.branch_id ?? "")
    .single()

  const slug = name.toLowerCase().replace(/[^\w ]+/g, "").replace(/ +/g, "-")
  const { error } = await supabase.from("categories").insert({
    name,
    slug,
    organization_id: orgRow?.organization_id,
  })
  if (error) return { error: error.message }
  revalidatePath("/products/categories")
  return { success: true }
}

// ============================================================
// INVENTORY ITEMS
// ============================================================

const inventoryItemSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  unit: z.string().default("pcs"),
  quantity: z.coerce.number().min(0).default(0),
  minimum_stock: z.coerce.number().min(0).default(0),
  maximum_stock: z.coerce.number().min(0).optional().nullable(),
  cost_price: z.coerce.number().min(0).default(0),
  barcode: z.string().optional().nullable(),
  category: z.string().default("RAW"),
})

export async function createInventoryItem(input: z.infer<typeof inventoryItemSchema>) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("inventory.create")) {
    return { error: "Forbidden" }
  }

  const parsed = inventoryItemSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Invalid input" }

  const supabase = await getServerClient()
  const data = parsed.data

  const { error } = await supabase.from("inventory_items").insert({
    ...data,
    organization_id: user.organization_id,
    is_active: true,
  })

  if (error) return { error: error.message }
  revalidatePath("/inventory")
  return { success: true }
}

export async function updateInventoryItem(
  id: string,
  input: z.infer<typeof inventoryItemSchema>
) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("inventory.edit")) {
    return { error: "Forbidden" }
  }

  const parsed = inventoryItemSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Invalid input" }

  const supabase = await getServerClient()
  const { error } = await supabase
    .from("inventory_items")
    .update({
      name: parsed.data.name,
      sku: parsed.data.sku,
      unit: parsed.data.unit,
      minimum_stock: parsed.data.minimum_stock,
      maximum_stock: parsed.data.maximum_stock ?? null,
      cost_price: parsed.data.cost_price,
      barcode: parsed.data.barcode ?? null,
      category: parsed.data.category,
    })
    .eq("id", id)
  if (error) return { error: error.message }

  revalidatePath("/inventory")
  return { success: true }
}

export async function deleteInventoryItem(id: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("inventory.delete")) {
    return { error: "Forbidden" }
  }

  const supabase = await getServerClient()
  // Soft delete
  const { error } = await supabase
    .from("inventory_items")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/inventory")
  return { success: true }
}

export async function adjustStock(
  inventoryItemId: string,
  adjustment: number,
  notes?: string,
  movementType: "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT" | "TRANSFER" | "WASTE" = "ADJUSTMENT"
) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("inventory.adjust")) {
    return { error: "Forbidden" }
  }

  if (adjustment === 0) return { error: "Penyesuaian tidak boleh 0" }

  const supabase = await getServerClient()
  const { data: item, error: itemError } = await supabase
    .from("inventory_items")
    .select("quantity")
    .eq("id", inventoryItemId)
    .single()

  if (itemError || !item) return { error: itemError?.message || "Item tidak ditemukan" }

  const before = Number(item.quantity)
  const after = Math.max(0, before + Number(adjustment))

  const { error: updateError } = await supabase
    .from("inventory_items")
    .update({ quantity: after })
    .eq("id", inventoryItemId)

  if (updateError) return { error: updateError.message }

  const { error: movementError } = await supabase.from("stock_movements").insert({
    organization_id: user.organization_id,
    branch_id: user.branch_id,
    inventory_item_id: inventoryItemId,
    movement_type: movementType,
    quantity: Number(adjustment),
    before_quantity: before,
    after_quantity: after,
    notes: notes || `Manual ${movementType}`,
    created_by: user.profile_id,
  })

  if (movementError) return { error: movementError.message }

  revalidatePath("/inventory")
  return { success: true }
}

// ============================================================
// SUPPLIERS
// ============================================================

const supplierSchema = z.object({
  name: z.string().min(1),
  company: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  npwp: z.string().optional().nullable(),
  payment_terms: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function createSupplier(input: z.infer<typeof supplierSchema>) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("suppliers.create")) {
    return { error: "Forbidden" }
  }

  const parsed = supplierSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Invalid input" }

  const supabase = await getServerClient()
  const { error } = await supabase.from("suppliers").insert({
    ...parsed.data,
    organization_id: user.organization_id,
    is_active: true,
  })

  if (error) return { error: error.message }
  revalidatePath("/suppliers")
  return { success: true }
}

export async function updateSupplier(
  id: string,
  input: z.infer<typeof supplierSchema>
) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("suppliers.edit")) {
    return { error: "Forbidden" }
  }

  const parsed = supplierSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Invalid input" }

  const supabase = await getServerClient()
  const { error } = await supabase.from("suppliers").update(parsed.data).eq("id", id)
  if (error) return { error: error.message }

  revalidatePath("/suppliers")
  return { success: true }
}

export async function deleteSupplier(id: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("suppliers.delete")) {
    return { error: "Forbidden" }
  }

  const supabase = await getServerClient()
  // Soft delete
  const { error } = await supabase
    .from("suppliers")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/suppliers")
  return { success: true }
}

// ============================================================
// PURCHASE ORDERS
// ============================================================

export interface PurchaseOrderLineInput {
  inventory_item_id: string
  quantity: number
  unit_price: number
}

export interface CreatePurchaseOrderInput {
  supplier_id: string
  expected_date?: string | null
  notes?: string | null
  items: PurchaseOrderLineInput[]
}

export async function createPurchaseOrder(input: CreatePurchaseOrderInput) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("purchases.create")) {
    return { error: "Forbidden" }
  }

  if (!input.items || input.items.length === 0) {
    return { error: "Minimal satu item" }
  }

  const supabase = await getServerClient()
  const poNumber = generatePONumber()

  const subtotal = input.items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
    0
  )
  const tax = 0
  const discount = 0
  const total = subtotal - discount + tax

  try {
    const { data: po, error: poError } = await supabase
      .from("purchase_orders")
      .insert({
        organization_id: user.organization_id,
        branch_id: user.branch_id,
        supplier_id: input.supplier_id,
        po_number: poNumber,
        status: "PENDING",
        order_date: new Date().toISOString().slice(0, 10),
        expected_date: input.expected_date || null,
        subtotal,
        discount,
        tax,
        total,
        notes: input.notes || null,
        created_by: user.profile_id,
      })
      .select()
      .single()

    if (poError || !po) return { error: poError?.message || "Gagal membuat PO" }

    const lines = input.items.map((item) => ({
      purchase_order_id: po.id,
      inventory_item_id: item.inventory_item_id,
      quantity: Number(item.quantity),
      received_quantity: 0,
      unit_price: Number(item.unit_price),
      discount: 0,
      tax_percentage: 0,
      total: Number(item.quantity) * Number(item.unit_price),
    }))

    const { error: itemsError } = await supabase
      .from("purchase_order_items")
      .insert(lines)

    if (itemsError) throw new Error(itemsError.message)

    revalidatePath("/purchases")
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal membuat PO"
    return { error: message }
  }
}

export interface ReceiveItemInput {
  inventory_item_id: string
  received_quantity: number
  unit_price: number
}

export async function receivePurchaseOrder(
  id: string,
  receivedItems: ReceiveItemInput[]
) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("purchases.receive")) {
    return { error: "Forbidden" }
  }

  const supabase = await getServerClient()

  try {
    const { data: po, error: poError } = await supabase
      .from("purchase_orders")
      .select("*")
      .eq("id", id)
      .single()

    if (poError || !po) return { error: poError?.message || "PO tidak ditemukan" }
    if (po.status === "RECEIVED") return { error: "PO sudah diterima" }

    const receiptNumber = `GR-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(
      Math.random() * 10000
    )
      .toString()
      .padStart(4, "0")}`

    const { data: receipt, error: receiptError } = await supabase
      .from("goods_receipts")
      .insert({
        organization_id: user.organization_id,
        branch_id: user.branch_id,
        purchase_order_id: id,
        receipt_number: receiptNumber,
        received_date: new Date().toISOString().slice(0, 10),
        created_by: user.profile_id,
      })
      .select()
      .single()

    if (receiptError || !receipt) {
      return { error: receiptError?.message || "Gagal membuat goods receipt" }
    }

    for (const item of receivedItems) {
      await supabase.from("goods_receipt_items").insert({
        goods_receipt_id: receipt.id,
        inventory_item_id: item.inventory_item_id,
        quantity: Number(item.received_quantity),
        unit_price: Number(item.unit_price),
      })

      const { data: inv } = await supabase
        .from("inventory_items")
        .select("quantity")
        .eq("id", item.inventory_item_id)
        .single()

      const before = inv ? Number(inv.quantity) : 0
      const after = before + Number(item.received_quantity)

      await supabase
        .from("inventory_items")
        .update({ quantity: after })
        .eq("id", item.inventory_item_id)

      await supabase.from("stock_movements").insert({
        organization_id: user.organization_id,
        branch_id: user.branch_id,
        inventory_item_id: item.inventory_item_id,
        movement_type: "PURCHASE",
        quantity: Number(item.received_quantity),
        before_quantity: before,
        after_quantity: after,
        reference: "PURCHASE_ORDER",
        reference_id: id,
        cost_price: Number(item.unit_price),
        notes: `Penerimaan PO ${po.po_number}`,
        created_by: user.profile_id,
      })

      await supabase
        .from("purchase_order_items")
        .update({ received_quantity: Number(item.received_quantity) })
        .eq("purchase_order_id", id)
        .eq("inventory_item_id", item.inventory_item_id)
    }

    await supabase
      .from("purchase_orders")
      .update({
        status: "RECEIVED",
        received_date: new Date().toISOString().slice(0, 10),
        approved_by: user.profile_id,
      })
      .eq("id", id)

    revalidatePath("/purchases")
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menerima PO"
    return { error: message }
  }
}

// ============================================================
// ORDERS
// ============================================================

export interface CartInput {
  product_id: string
  product_name: string
  variant_id?: string | null
  variant_name?: string | null
  quantity: number
  unit_price: number
  discount: number
  tax_percentage: number
  notes?: string
  modifiers?: { name: string; option_name: string; price: number }[]
}

export interface CreateOrderInput {
  order_type: "DINE_IN" | "TAKE_AWAY" | "DELIVERY" | "PICK_UP"
  table_id?: string | null
  customer_id?: string | null
  notes?: string
  items: CartInput[]
  discount: number
  service_charge_percentage: number
  tax_percentage: number
  payments: { method: string; amount: number }[]
  total: number
  subtotal: number
  tax_amount: number
  service_charge: number
  paid_amount: number
  change_amount: number
  cashier_id?: string | null
}

export async function createOrder(input: CreateOrderInput) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  const supabase = await getServerClient()

  try {
    const items = input.items.map((item) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      variant_id: item.variant_id ?? null,
      variant_name: item.variant_name ?? null,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount: item.discount,
      tax_percentage: item.tax_percentage,
      notes: item.notes ?? null,
      modifiers: item.modifiers ?? [],
    }))

    const payments = input.payments.map((p) => ({
      method: p.method,
      amount: p.amount,
    }))

    const { data, error } = await supabase.rpc("create_order_atomic", {
      p_order_type: input.order_type,
      p_table_id: input.table_id ?? null,
      p_customer_id: input.customer_id ?? null,
      p_subtotal: input.subtotal,
      p_discount: input.discount,
      p_tax_amount: input.tax_amount,
      p_service_charge: input.service_charge,
      p_total: input.total,
      p_paid_amount: input.paid_amount,
      p_change_amount: input.change_amount,
      p_notes: input.notes ?? null,
      p_items: items,
      p_payments: payments,
    })

    if (error) {
      return { error: error.message }
    }

    const result = data as { order_id: string; order_number: string }
    revalidatePath("/orders")
    revalidatePath("/pos")
    return { success: true, order_id: result.order_id, order_number: result.order_number }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal membuat order"
    return { error: message }
  }
}

export async function updateOrderStatus(id: string, status: string) {
  const supabase = await getServerClient()
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/orders")
  revalidatePath("/kitchen")
  return { success: true }
}

export async function cancelOrder(id: string, reason?: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  const supabase = await getServerClient()

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("payment_status, status")
    .eq("id", id)
    .single()

  if (fetchError || !order) return { error: "Order tidak ditemukan" }

  const newPaymentStatus = order.payment_status === "PAID" ? "REFUNDED" : order.payment_status

  const { error } = await supabase
    .from("orders")
    .update({
      status: "CANCELLED",
      void_reason: reason,
      cancelled_by: user.profile_id,
      cancelled_at: new Date().toISOString(),
      payment_status: newPaymentStatus,
    })
    .eq("id", id)
  if (error) return { error: error.message }

  // Update table status to AVAILABLE if this table... handled separately
  await supabase.from("audit_logs").insert({
    organization_id: user.organization_id,
    user_id: user.profile_id,
    action: "VOID",
    entity: "order",
    entity_id: id,
    new_data: { reason },
  })
  revalidatePath("/orders")
  return { success: true }
}

// ============================================================
// UPDATING ORDER STATUS & KITCHEN FLOW
// ============================================================
export async function updateOrderItemStatus(itemId: string, status: string) {
  const supabase = await getServerClient()
  const { error } = await supabase
    .from("order_items")
    .update({ status })
    .eq("id", itemId)
  if (error) return { error: error.message }
  revalidatePath("/kitchen")
  return { success: true }
}

// ============================================================
// RESERVATIONS
// ============================================================

const reservationSchema = z.object({
  customer_name: z.string().min(1),
  customer_phone: z.string().default(""),
  reservation_date: z.string().min(1),
  reservation_time: z.string().min(1),
  guests: z.coerce.number().min(1).default(2),
  table_id: z.string().optional(),
  notes: z.string().optional(),
})

export async function createReservation(input: z.infer<typeof reservationSchema>) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("reservations.create")) {
    return { error: "Forbidden" }
  }

  const parsed = reservationSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Invalid input" }

  const supabase = await getServerClient()
  const data = parsed.data

  const { data: orgRow } = await supabase
    .from("branches")
    .select("organization_id")
    .eq("id", user.branch_id ?? "")
    .single()

  const organization_id = orgRow?.organization_id

  const { error } = await supabase.from("reservations").insert({
    organization_id,
    branch_id: user.branch_id,
    customer_name: data.customer_name,
    customer_phone: data.customer_phone,
    reservation_date: data.reservation_date,
    reservation_time: data.reservation_time,
    guests: data.guests,
    table_id: data.table_id || null,
    notes: data.notes || null,
    status: "PENDING",
    created_by: user.profile_id,
  })

  if (error) return { error: error.message }
  revalidatePath("/reservations")
  return { success: true }
}

export async function updateReservationStatus(id: string, status: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }

  const supabase = await getServerClient()
  const { error } = await supabase
    .from("reservations")
    .update({ status })
    .eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/reservations")
  return { success: true }
}

// ============================================================
// PROMOTIONS
// ============================================================

const promotionSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["PERCENTAGE", "FIXED", "BUY_ONE_GET_ONE", "BUY_X_GET_Y", "HAPPY_HOUR"]),
  value: z.coerce.number().min(0).default(0),
  buy_quantity: z.coerce.number().min(1).optional(),
  get_quantity: z.coerce.number().min(1).optional(),
  product_id: z.string().optional(),
  category_id: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  is_active: z.boolean().default(true),
})

export async function createPromotion(input: z.infer<typeof promotionSchema>) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("promotions.create")) {
    return { error: "Forbidden" }
  }

  const parsed = promotionSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Invalid input" }

  const supabase = await getServerClient()
  const data = parsed.data

  const { data: orgRow } = await supabase
    .from("branches")
    .select("organization_id")
    .eq("id", user.branch_id ?? "")
    .single()

  const organization_id = orgRow?.organization_id

  const { error } = await supabase.from("promotions").insert({
    organization_id,
    name: data.name,
    type: data.type,
    value: data.value,
    buy_quantity: data.buy_quantity ?? null,
    get_quantity: data.get_quantity ?? null,
    product_id: data.product_id || null,
    category_id: data.category_id || null,
    start_date: data.start_date || null,
    end_date: data.end_date || null,
    start_time: data.start_time || null,
    end_time: data.end_time || null,
    is_active: data.is_active,
  })

  if (error) return { error: error.message }
  revalidatePath("/promotions")
  return { success: true }
}

export async function updatePromotion(
  id: string,
  input: z.infer<typeof promotionSchema>
) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("promotions.create")) {
    return { error: "Forbidden" }
  }

  const parsed = promotionSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Invalid input" }

  const supabase = await getServerClient()
  const data = parsed.data

  const { error } = await supabase
    .from("promotions")
    .update({
      name: data.name,
      type: data.type,
      value: data.value,
      buy_quantity: data.buy_quantity ?? null,
      get_quantity: data.get_quantity ?? null,
      product_id: data.product_id || null,
      category_id: data.category_id || null,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      start_time: data.start_time || null,
      end_time: data.end_time || null,
      is_active: data.is_active,
    })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/promotions")
  return { success: true }
}

export async function togglePromotion(id: string, isActive: boolean) {
  const supabase = await getServerClient()
  const { error } = await supabase
    .from("promotions")
    .update({ is_active: isActive })
    .eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/promotions")
  return { success: true }
}

// ============================================================
// EMPLOYEES
// ============================================================

const employeeSchema = z.object({
  name: z.string().min(1),
  employee_id: z.string().min(1),
  phone: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  branch_id: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
})

export async function createEmployee(input: z.infer<typeof employeeSchema>) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("employees.create")) {
    return { error: "Forbidden" }
  }

  const parsed = employeeSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Invalid input" }

  const supabase = await getServerClient()
  const data = parsed.data

  const { data: orgRow } = await supabase
    .from("branches")
    .select("organization_id")
    .eq("id", user.branch_id ?? "")
    .single()

  const organization_id = orgRow?.organization_id

  const { error } = await supabase.from("employees").insert({
    ...data,
    organization_id,
  })

  if (error) return { error: error.message }
  revalidatePath("/employees")
  return { success: true }
}

export async function updateEmployee(
  id: string,
  input: z.infer<typeof employeeSchema>
) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("employees.edit")) {
    return { error: "Forbidden" }
  }

  const parsed = employeeSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Invalid input" }

  const supabase = await getServerClient()
  const { error } = await supabase.from("employees").update(parsed.data).eq("id", id)
  if (error) return { error: error.message }

  revalidatePath("/employees")
  return { success: true }
}

const employeeShiftSchema = z.object({
  employee_id: z.string().min(1),
  shift_date: z.string().min(1),
  start_time: z.string().optional().nullable(),
  end_time: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function createEmployeeShift(input: z.infer<typeof employeeShiftSchema>) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("employees.create")) {
    return { error: "Forbidden" }
  }

  const parsed = employeeShiftSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Invalid input" }

  const supabase = await getServerClient()
  const { error } = await supabase.from("employee_shifts").insert(parsed.data)

  if (error) return { error: error.message }
  revalidatePath("/employees")
  return { success: true }
}

// ============================================================
// EXPENSES
// ============================================================

const expenseSchema = z.object({
  category_id: z.string().min(1),
  amount: z.coerce.number().min(0),
  description: z.string().optional().nullable(),
  expense_date: z.string().min(1),
  branch_id: z.string().optional().nullable(),
})

export async function createExpense(input: z.infer<typeof expenseSchema>) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("expenses.create")) {
    return { error: "Forbidden" }
  }

  const parsed = expenseSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Invalid input" }

  const supabase = await getServerClient()
  const data = parsed.data

  const { data: orgRow } = await supabase
    .from("branches")
    .select("organization_id")
    .eq("id", user.branch_id ?? "")
    .single()

  const organization_id = orgRow?.organization_id

  const { error } = await supabase.from("expenses").insert({
    ...data,
    organization_id,
    created_by: user.profile_id,
  })

  if (error) return { error: error.message }
  revalidatePath("/expenses")
  return { success: true }
}

export async function deleteExpense(id: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("expenses.create")) {
    return { error: "Forbidden" }
  }

  const supabase = await getServerClient()
  const { error } = await supabase.from("expenses").delete().eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/expenses")
  return { success: true }
}

// ============================================================
// CUSTOMERS
// ============================================================

const customerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  birthday: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  is_member: z.boolean().default(false),
  member_level: z.string().default("BRONZE"),
})

export async function createCustomer(input: z.infer<typeof customerSchema>) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("customers.create")) {
    return { error: "Forbidden" }
  }

  const parsed = customerSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Invalid input" }

  const supabase = await getServerClient()
  const { error } = await supabase.from("customers").insert({
    organization_id: user.organization_id,
    name: parsed.data.name,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    address: parsed.data.address || null,
    birthday: parsed.data.birthday || null,
    notes: parsed.data.notes || null,
    is_member: parsed.data.is_member,
    member_level: parsed.data.member_level,
  })

  if (error) return { error: error.message }
  revalidatePath("/customers")
  return { success: true }
}

export async function updateCustomer(
  id: string,
  input: z.infer<typeof customerSchema>
) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("customers.edit")) {
    return { error: "Forbidden" }
  }

  const parsed = customerSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Invalid input" }

  const supabase = await getServerClient()
  const { error } = await supabase.from("customers").update({
    name: parsed.data.name,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    address: parsed.data.address || null,
    birthday: parsed.data.birthday || null,
    notes: parsed.data.notes || null,
    is_member: parsed.data.is_member,
    member_level: parsed.data.member_level,
  }).eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/customers")
  return { success: true }
}

export async function redeemPoints(customerId: string, points: number) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("customers.edit")) {
    return { error: "Forbidden" }
  }

  if (points <= 0) return { error: "Jumlah poin harus lebih dari 0" }

  const supabase = await getServerClient()

  const { data: customer, error: fetchError } = await supabase
    .from("customers")
    .select("points")
    .eq("id", customerId)
    .single()

  if (fetchError || !customer) return { error: "Customer tidak ditemukan" }

  const currentPoints = Number(customer.points || 0)
  if (points > currentPoints) return { error: "Poin tidak mencukupi" }

  const newPoints = currentPoints - points

  const { error: updateError } = await supabase
    .from("customers")
    .update({ points: newPoints })
    .eq("id", customerId)

  if (updateError) return { error: updateError.message }

  const { error: insertError } = await supabase.from("customer_points").insert({
    customer_id: customerId,
    points: points,
    type: "REDEEM",
    description: `Redeem ${points} poin oleh ${user.full_name}`,
    reference: "MANUAL_REDEEM",
  })

  if (insertError) return { error: insertError.message }

  revalidatePath("/customers")
  return { success: true }
}

// ============================================================
// NOTIFICATIONS
// ============================================================

export async function markNotificationRead(id: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }

  const supabase = await getServerClient()
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/notifications")
  return { success: true }
}

export async function markAllNotificationsRead() {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }

  const supabase = await getServerClient()
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("is_read", false)

  if (error) return { error: error.message }
  revalidatePath("/notifications")
  return { success: true }
}

// ============================================================
// ROLE PERMISSIONS
// ============================================================

export async function setRolePermission(role: string, permissionId: string, enabled: boolean) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin) return { error: "Forbidden" }

  const supabase = await getServerClient()

  if (enabled) {
    const { error } = await supabase.from("role_permissions").insert({
      role,
      permission_id: permissionId,
    })
    if (error && error.code !== "23505") return { error: error.message }
  } else {
    const { error } = await supabase
      .from("role_permissions")
      .delete()
      .eq("role", role)
      .eq("permission_id", permissionId)
    if (error) return { error: error.message }
  }

  revalidatePath("/settings/roles")
  return { success: true }
}

// ============================================================
// ORGANIZATION
// ============================================================

const organizationSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  tax_name: z.string().optional().nullable(),
  tax_percentage: z.coerce.number().min(0).default(0),
  service_charge_percentage: z.coerce.number().min(0).default(0),
  currency: z.string().default("IDR"),
})

export async function updateOrganization(input: z.infer<typeof organizationSchema>) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("settings.manage")) {
    return { error: "Forbidden" }
  }

  const parsed = organizationSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Invalid input" }

  const supabase = await getServerClient()
  const { data: branch } = await supabase
    .from("branches")
    .select("organization_id")
    .eq("id", user.branch_id ?? "")
    .single()

  if (!branch) return { error: "Branch not found" }

  const { error } = await supabase
    .from("organizations")
    .update(parsed.data)
    .eq("id", branch.organization_id)

  if (error) return { error: error.message }
  revalidatePath("/settings/restaurant")
  return { success: true }
}

// ============================================================
// BRANCHES
// ============================================================

const branchSchema = z.object({
  name: z.string().min(1),
  is_active: z.boolean().default(true),
})

export async function updateBranch(id: string, input: z.infer<typeof branchSchema>) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("branches.manage")) {
    return { error: "Forbidden" }
  }

  const parsed = branchSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Invalid input" }

  const supabase = await getServerClient()
  const { error } = await supabase.from("branches").update(parsed.data).eq("id", id)
  if (error) return { error: error.message }

  revalidatePath("/settings/branches")
  return { success: true }
}

// ============================================================
// PAYMENT METHODS
// ============================================================

export async function updatePaymentMethods(methods: string[]) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("settings.manage")) {
    return { error: "Forbidden" }
  }

  const supabase = await getServerClient()

  const { data: branch } = await supabase
    .from("branches")
    .select("organization_id")
    .eq("id", user.branch_id ?? "")
    .single()

  if (!branch) return { error: "Branch not found" }

  const { error } = await supabase.from("settings").upsert(
    {
      organization_id: branch.organization_id,
      key: "payment_methods",
      value: methods,
    },
    { onConflict: "organization_id,key" }
  )

  if (error) return { error: error.message }
  revalidatePath("/settings/payment")
  return { success: true }
}

// ============================================================
// RECIPES
// ============================================================

export interface RecipeItemInput {
  inventory_item_id: string
  quantity: number
  unit: string
}

export async function createRecipe(
  productId: string,
  name: string,
  ingredients: RecipeItemInput[]
) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("products.create")) {
    return { error: "Forbidden" }
  }

  if (!ingredients || ingredients.length === 0) {
    return { error: "Minimal satu bahan" }
  }

  const supabase = await getServerClient()

  try {
    const { data: existing } = await supabase
      .from("recipes")
      .select("id")
      .eq("product_id", productId)
      .single()

    if (existing) {
      await supabase.from("recipe_items").delete().eq("recipe_id", existing.id)
      await supabase.from("recipes").delete().eq("id", existing.id)
    }

    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .insert({
        product_id: productId,
        name,
        organization_id: user.organization_id,
        branch_id: user.branch_id,
      })
      .select()
      .single()

    if (recipeError || !recipe) {
      return { error: recipeError?.message || "Gagal membuat resep" }
    }

    const lines = ingredients.map((ing) => ({
      recipe_id: recipe.id,
      inventory_item_id: ing.inventory_item_id,
      quantity: ing.quantity,
      unit: ing.unit,
    }))

    const { error: itemsError } = await supabase
      .from("recipe_items")
      .insert(lines)

    if (itemsError) throw new Error(itemsError.message)

    revalidatePath("/recipes")
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal membuat resep"
    return { error: message }
  }
}

export async function updateRecipe(
  recipeId: string,
  productId: string,
  name: string,
  ingredients: RecipeItemInput[]
) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("products.edit")) {
    return { error: "Forbidden" }
  }

  if (!ingredients || ingredients.length === 0) {
    return { error: "Minimal satu bahan" }
  }

  const supabase = await getServerClient()

  try {
    const { data: existing } = await supabase
      .from("recipes")
      .select("id")
      .eq("id", recipeId)
      .single()

    if (!existing) {
      return { error: "Resep tidak ditemukan" }
    }

    const { error: recipeError } = await supabase
      .from("recipes")
      .update({ product_id: productId, name })
      .eq("id", recipeId)

    if (recipeError) {
      return { error: recipeError.message || "Gagal memperbarui resep" }
    }

    await supabase.from("recipe_items").delete().eq("recipe_id", recipeId)

    const lines = ingredients.map((ing) => ({
      recipe_id: recipeId,
      inventory_item_id: ing.inventory_item_id,
      quantity: ing.quantity,
      unit: ing.unit,
    }))

    const { error: itemsError } = await supabase.from("recipe_items").insert(lines)

    if (itemsError) throw new Error(itemsError.message)

    revalidatePath("/recipes")
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui resep"
    return { error: message }
  }
}

export async function deleteRecipe(id: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("products.edit")) {
    return { error: "Forbidden" }
  }

  const supabase = await getServerClient()

  const { error: itemsError } = await supabase
    .from("recipe_items")
    .delete()
    .eq("recipe_id", id)

  if (itemsError) return { error: itemsError.message }

  const { error } = await supabase
    .from("recipes")
    .delete()
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/recipes")
  return { success: true }
}

// ============================================================
// STOCK OPNAME
// ============================================================

export interface StockOpnameItemInput {
  inventory_item_id: string
  physical_quantity: number
  reason?: string
}

export async function createStockOpname(
  warehouseId: string,
  items: StockOpnameItemInput[]
) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("inventory.adjust")) {
    return { error: "Forbidden" }
  }

  if (!items || items.length === 0) {
    return { error: "Minimal satu item" }
  }

  const supabase = await getServerClient()

  try {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "")
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0")
    const opnameNumber = `SO-${dateStr}-${random}`

    const enrichedItems = []
    for (const item of items) {
      const { data: inv } = await supabase
        .from("inventory_items")
        .select("quantity, cost_price")
        .eq("id", item.inventory_item_id)
        .single()

      const systemQuantity = inv ? Number(inv.quantity) : 0
      const costPrice = inv ? Number(inv.cost_price) : 0
      const difference = item.physical_quantity - systemQuantity

      enrichedItems.push({
        inventory_item_id: item.inventory_item_id,
        system_quantity: systemQuantity,
        physical_quantity: item.physical_quantity,
        difference,
        difference_value: difference * costPrice,
        reason: item.reason || null,
      })
    }

    const totalDifference = enrichedItems.reduce(
      (sum, i) => sum + Math.abs(i.difference_value),
      0
    )

    const { data: opname, error: opnameError } = await supabase
      .from("stock_opnames")
      .insert({
        opname_number: opnameNumber,
        warehouse_id: warehouseId,
        organization_id: user.organization_id,
        branch_id: user.branch_id,
        status: "SUBMITTED",
        notes: null,
        total_difference_value: totalDifference,
        created_by: user.profile_id,
      })
      .select()
      .single()

    if (opnameError || !opname) {
      return { error: opnameError?.message || "Gagal membuat opname" }
    }

    const lines = enrichedItems.map((i) => ({
      stock_opname_id: opname.id,
      inventory_item_id: i.inventory_item_id,
      system_quantity: i.system_quantity,
      physical_quantity: i.physical_quantity,
      difference: i.difference,
      difference_value: i.difference_value,
      reason: i.reason,
    }))

    const { error: linesError } = await supabase
      .from("stock_opname_items")
      .insert(lines)

    if (linesError) throw new Error(linesError.message)

    revalidatePath("/inventory/opname")
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal membuat opname"
    return { error: message }
  }
}

export async function approveStockOpname(id: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("inventory.adjust")) {
    return { error: "Forbidden" }
  }

  const supabase = await getServerClient()

  try {
    const { data: opname, error: opnameError } = await supabase
      .from("stock_opnames")
      .select("*, items:stock_opname_items(*)")
      .eq("id", id)
      .single()

    if (opnameError || !opname) {
      return { error: opnameError?.message || "Opname tidak ditemukan" }
    }

    if (opname.status !== "SUBMITTED") {
      return { error: "Hanya opname SUBMITTED yang bisa di-approve" }
    }

    for (const item of opname.items || []) {
      const physicalQty = Number(item.physical_quantity)
      const difference = Number(item.difference)

      await supabase
        .from("inventory_items")
        .update({ quantity: physicalQty })
        .eq("id", item.inventory_item_id)

      if (difference !== 0) {
        const { data: inv } = await supabase
          .from("inventory_items")
          .select("quantity")
          .eq("id", item.inventory_item_id)
          .single()

        const before = inv ? Number(inv.quantity) : 0

        await supabase.from("stock_movements").insert({
          organization_id: user.organization_id,
          branch_id: user.branch_id,
          inventory_item_id: item.inventory_item_id,
          movement_type: "ADJUSTMENT",
          quantity: difference,
          before_quantity: before - difference,
          after_quantity: before,
          reference: "STOCK_OPNAME",
          reference_id: id,
          notes: item.reason || `Opname ${opname.opname_number}`,
          created_by: user.profile_id,
        })
      }
    }

    const { error: updateError } = await supabase
      .from("stock_opnames")
      .update({
        status: "APPROVED",
        approved_by: user.profile_id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (updateError) throw new Error(updateError.message)

    revalidatePath("/inventory/opname")
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal approve opname"
    return { error: message }
  }
}

// ============================================================
// CASHIER SHIFTS
// ============================================================

export async function openCashierShift(openingCash: number) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("shifts.open")) {
    return { error: "Forbidden" }
  }

  if (openingCash < 0) return { error: "Kas awal tidak boleh negatif" }

  const supabase = await getServerClient()

  // Ensure no open shift exists for this user at this branch
  const { data: existing } = await supabase
    .from("cashier_shifts")
    .select("id")
    .eq("user_id", user.profile_id)
    .eq("status", "OPEN")
    .maybeSingle()

  if (existing) return { error: "Shift masih terbuka, tutup terlebih dahulu" }

  const { error } = await supabase.from("cashier_shifts").insert({
    organization_id: user.organization_id,
    branch_id: user.branch_id,
    user_id: user.profile_id,
    opening_cash: openingCash,
    status: "OPEN",
  })

  if (error) return { error: error.message }

  await supabase.from("audit_logs").insert({
    organization_id: user.organization_id,
    user_id: user.profile_id,
    action: "CREATE",
    entity: "cashier_shift",
    new_data: { opening_cash: openingCash },
  })

  revalidatePath("/shifts")
  revalidatePath("/pos")
  return { success: true }
}

export async function closeCashierShift(actualCash: number, notes?: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("shifts.close")) {
    return { error: "Forbidden" }
  }

  if (actualCash < 0) return { error: "Kas aktual tidak boleh negatif" }

  const supabase = await getServerClient()

  const { data: shift, error: shiftError } = await supabase
    .from("cashier_shifts")
    .select("*")
    .eq("user_id", user.profile_id)
    .eq("status", "OPEN")
    .maybeSingle()

  if (shiftError || !shift) return { error: "Tidak ada shift yang terbuka" }

  // Compute cash sales from payments linked to orders created during this shift
  const { data: payments } = await supabase
    .from("payments")
    .select("amount, created_at")
    .eq("method", "CASH")
    .gte("created_at", shift.opening_time)

  const cashSales = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0)

  // Cash refunds during shift
  const { data: refunds } = await supabase
    .from("refunds")
    .select("amount")
    .eq("refund_method", "CASH")
    .gte("created_at", shift.opening_time)

  const cashRefunds = (refunds ?? []).reduce((sum, r) => sum + Number(r.amount), 0)

  const expectedCash = Number(shift.opening_cash) + cashSales - cashRefunds
  const difference = actualCash - expectedCash

  const { error: updateError } = await supabase
    .from("cashier_shifts")
    .update({
      status: "CLOSED",
      closing_time: new Date().toISOString(),
      cash_sales: cashSales,
      cash_refunds: cashRefunds,
      expected_cash: expectedCash,
      actual_cash: actualCash,
      difference,
      notes: notes || null,
    })
    .eq("id", shift.id)

  if (updateError) return { error: updateError.message }

  await supabase.from("audit_logs").insert({
    organization_id: user.organization_id,
    user_id: user.profile_id,
    action: "CLOSE_SHIFT",
    entity: "cashier_shift",
    entity_id: shift.id,
    new_data: { expected: expectedCash, actual: actualCash, difference },
  })

  // Notify owner about shortage/overage
  const varianceType = difference > 0 ? "OVER" : difference < 0 ? "SHORT" : "MATCH"
  await supabase.from("notifications").insert({
    organization_id: user.organization_id,
    type: "warning",
    title: "Cashier Closing Shift",
    message:
      varianceType === "MATCH"
        ? `Shift ${shift.id.slice(0, 8)} ditutup, kas cocok (${expectedCash})`
        : `Shift ${shift.id.slice(0, 8)} ditutup dengan selisih ${varianceType} ${Math.abs(difference)}`,
    data: { shift_id: shift.id, difference },
  })

  revalidatePath("/shifts")
  return { success: true }
}

// ============================================================
// REFUND / VOID
// ============================================================

export async function refundOrder(
  orderId: string,
  amount: number,
  reason: string,
  refundMethod: string
) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("sales.edit")) {
    return { error: "Forbidden" }
  }

  if (amount <= 0) return { error: "Jumlah refund harus lebih dari 0" }
  if (!reason.trim()) return { error: "Alasan refund wajib diisi" }

  const supabase = await getServerClient()

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, status, payment_status, paid_amount, organization_id, branch_id")
    .eq("id", orderId)
    .single()

  if (fetchError || !order) return { error: "Order tidak ditemukan" }
  if (order.status === "REFUNDED") return { error: "Order sudah direfund" }
  if (Number(order.paid_amount) <= 0) return { error: "Order belum dibayar" }
  if (amount > Number(order.paid_amount)) return { error: "Refund melebihi total pembayaran" }

  const { error: refundError } = await supabase.from("refunds").insert({
    organization_id: order.organization_id,
    branch_id: order.branch_id,
    order_id: order.id,
    amount,
    reason,
    refund_method: refundMethod,
    refunded_by: user.profile_id,
  })

  if (refundError) return { error: refundError.message }

  const remainingPaid = Math.max(0, Number(order.paid_amount) - amount)
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      paid_amount: remainingPaid,
      payment_status: remainingPaid <= 0 ? "REFUNDED" : "PARTIAL",
      status: remainingPaid <= 0 ? "REFUNDED" : order.status,
    })
    .eq("id", order.id)

  if (updateError) return { error: updateError.message }

  await supabase.from("audit_logs").insert({
    organization_id: order.organization_id,
    user_id: user.profile_id,
    action: "REFUND",
    entity: "order",
    entity_id: order.id,
    new_data: { amount, reason },
  })

  await supabase.from("notifications").insert({
    organization_id: order.organization_id,
    type: "payment",
    title: "Refund",
    message: `Refund ${amount} untuk order ${order.id.slice(0, 8)} oleh ${user.full_name}`,
    data: { order_id: order.id, amount },
  })

  revalidatePath("/orders")
  revalidatePath("/pos")
  return { success: true }
}

// ============================================================
// AUDIT LOG
// ============================================================

// ============================================================
// SETTINGS: RECEIPT & NOTIFICATIONS
// ============================================================

export async function updateReceiptSettings(input: {
  format: string
  show_logo: boolean
  show_tax: boolean
  show_service_charge: boolean
  show_payment: boolean
  footer: string
}) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("settings.manage")) {
    return { error: "Forbidden" }
  }

  const supabase = await getServerClient()
  const { data: branch } = await supabase
    .from("branches")
    .select("organization_id")
    .eq("id", user.branch_id ?? "")
    .single()
  if (!branch) return { error: "Branch not found" }

  const { error } = await supabase.from("settings").upsert(
    {
      organization_id: branch.organization_id,
      key: "receipt",
      value: input,
    },
    { onConflict: "organization_id,key" }
  )

  if (error) return { error: error.message }
  revalidatePath("/settings/receipt")
  return { success: true }
}

export async function updateNotificationSettings(input: {
  new_order: boolean
  order_ready: boolean
  low_stock: boolean
  reservation: boolean
  payment: boolean
  refund: boolean
  void: boolean
  stock_opname: boolean
  approval: boolean
  system: boolean
}) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("settings.manage")) {
    return { error: "Forbidden" }
  }

  const supabase = await getServerClient()
  const { data: branch } = await supabase
    .from("branches")
    .select("organization_id")
    .eq("id", user.branch_id ?? "")
    .single()
  if (!branch) return { error: "Branch not found" }

  const { error } = await supabase.from("settings").upsert(
    {
      organization_id: branch.organization_id,
      key: "notification_preferences",
      value: input,
    },
    { onConflict: "organization_id,key" }
  )

  if (error) return { error: error.message }
  revalidatePath("/settings/notifications")
  return { success: true }
}

// ============================================================
// EXPENSE CATEGORIES
// ============================================================

export async function createExpenseCategory(name: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("expenses.create")) {
    return { error: "Forbidden" }
  }

  if (!name.trim()) return { error: "Nama kategori wajib diisi" }

  const supabase = await getServerClient()
  const { data: branch } = await supabase
    .from("branches")
    .select("organization_id")
    .eq("id", user.branch_id ?? "")
    .single()
  if (!branch) return { error: "Branch not found" }

  const { error } = await supabase.from("expense_categories").insert({
    name: name.trim(),
    organization_id: branch.organization_id,
  })

  if (error) return { error: error.message }
  revalidatePath("/expenses")
  return { success: true }
}

export async function getAuditLogsList(limit = 100) {
  const user = await getCurrentUser()
  if (!user) return []
  if (!user.is_super_admin && !user.permissions.includes("audit.view")) {
    return []
  }

  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from("audit_logs")
    .select(
      "*, user:profiles!audit_logs_user_id_fkey(full_name, username)"
    )
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) return []
  return data ?? []
}