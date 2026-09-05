"use server"

import { getServerClient, getCurrentUser } from "@/lib/helpers"

export async function getOrganization() {
  const supabase = await getServerClient()
  const user = await getCurrentUser()
  if (!user) return null

  const { data: branch } = await supabase
    .from("branches")
    .select("organization_id")
    .eq("id", user.branch_id ?? "")
    .single()

  if (!branch) return null

  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", branch.organization_id)
    .single()

  if (error) return null
  return data
}

export async function getBranches() {
  const supabase = await getServerClient()
  const user = await getCurrentUser()
  if (!user) return []

  if (user.is_super_admin) {
    const { data } = await supabase.from("branches").select("*").order("name")
    return data ?? []
  }

  const { data } = await supabase
    .from("branches")
    .select("*")
    .eq("id", user.branch_id ?? "")
    .order("name")
  return data ?? []
}

export async function getCategories() {
  const supabase = await getServerClient()
  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("name")

  if (error) return []
  return data ?? []
}

export async function getProducts(params?: {
  search?: string
  category_id?: string
  is_active?: boolean
}) {
  const supabase = await getServerClient()
  const user = await getCurrentUser()
  if (!user) return { products: [], total: 0 }

  let query = supabase
    .from("products")
    .select("*, categories(name), product_variants(*)", { count: "exact" })
    .eq("deleted_at", null)
    .order("created_at", { ascending: false })

  if (params?.search) {
    query = query.or(`name.ilike.%${params.search}%,sku.ilike.%${params.search}%`)
  }
  if (params?.category_id) {
    query = query.eq("category_id", params.category_id)
  }
  if (params?.is_active !== undefined) {
    query = query.eq("is_active", params.is_active)
  }

  const { data, count, error } = await query
  if (error) return { products: [], total: 0 }
  return { products: data ?? [], total: count ?? 0 }
}

export async function getOrders(params?: {
  status?: string
  limit?: number
}) {
  const supabase = await getServerClient()
  const user = await getCurrentUser()
  if (!user) return []

  let query = supabase
    .from("orders")
    .select("*, table:restaurant_tables(*)")
    .order("created_at", { ascending: false })

  if (params?.status) {
    query = query.eq("status", params.status)
  }
  if (params?.limit) {
    query = query.limit(params.limit)
  }

  const { data, error } = await query
  if (error) return []
  return data ?? []
}

export async function getOrder(id: string) {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from("orders")
    .select(
      "*, table:restaurant_tables(*), items:order_items(*, modifiers:order_item_modifiers(*)), payments(*)"
    )
    .eq("id", id)
    .single()

  if (error) return null
  return data
}

export async function getTables() {
  const supabase = await getServerClient()
  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("restaurant_tables")
    .select("*, area:table_areas(*), active_orders:orders(*)")
    .eq("branch_id", user.branch_id ?? "")
    .order("number")

  if (error) return []
  return data ?? []
}

export async function getKitchenOrders() {
  const supabase = await getServerClient()
  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("orders")
    .select(
      "*, table:restaurant_tables(number, name), items:order_items(*, modifiers:order_item_modifiers(*))"
    )
    .in("status", ["NEW", "CONFIRMED", "PREPARING", "READY"])
    .eq("branch_id", user.branch_id ?? "")
    .order("created_at", { ascending: true })

  if (error) return []
  return data ?? []
}

export async function getInventoryItems(params?: { search?: string; category?: string }) {
  const supabase = await getServerClient()
  const user = await getCurrentUser()
  if (!user) return []

  let query = supabase
    .from("inventory_items")
    .select("*")
    .eq("deleted_at", null)
    .order("name")

  if (params?.search) {
    query = query.or(`name.ilike.%${params.search}%,sku.ilike.%${params.search}%`)
  }
  if (params?.category) {
    query = query.eq("category", params.category)
  }

  const { data, error } = await query
  if (error) return []
  return data ?? []
}

export async function getSuppliers() {
  const supabase = await getServerClient()
  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("deleted_at", null)
    .order("name")
  if (error) return []
  return data ?? []
}

export async function getCustomers(params?: { search?: string }) {
  const supabase = await getServerClient()
  const user = await getCurrentUser()
  if (!user) return []

  let query = supabase
    .from("customers")
    .select("*")
    .eq("deleted_at", null)
    .order("created_at", { ascending: false })

  if (params?.search) {
    query = query.or(`name.ilike.%${params.search}%,phone.ilike.%${params.search}%`)
  }

  const { data, error } = await query
  if (error) return []
  return data ?? []
}

export async function getPurchaseOrders() {
  const supabase = await getServerClient()
  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("purchase_orders")
    .select("*, supplier:suppliers(name, company), branch:branches(name), items:purchase_order_items(*, inventory_item:inventory_items(name, sku, unit))")
    .order("created_at", { ascending: false })

  if (error) return []
  return data ?? []
}

export async function getExpenses() {
  const supabase = await getServerClient()
  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("expenses")
    .select("*, category:expense_categories(name)")
    .order("expense_date", { ascending: false })

  if (error) return []
  return data ?? []
}

export async function getEmployees() {
  const supabase = await getServerClient()
  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("employees")
    .select("*, branch:branches(name)")
    .order("name")

  if (error) return []
  return data ?? []
}

export async function getPromotions() {
  const supabase = await getServerClient()
  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("promotions")
    .select("*, product:products(name), category:categories(name)")
    .order("created_at", { ascending: false })

  if (error) return []
  return data ?? []
}

export async function getUsers() {
  const supabase = await getServerClient()
  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("profiles")
    .select("*, branch:branches(name)")
    .eq("deleted_at", null)
    .order("created_at", { ascending: false })

  if (error) return []
  return data ?? []
}

export async function getNotifications() {
  const supabase = await getServerClient()
  const user = await getCurrentUser()
  if (!user) return { notifications: [], unread: 0 }

  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("*")
    .or(`user_id.is.null,user_id.eq.${user.profile_id}`)
    .order("created_at", { ascending: false })
    .limit(50)

  const { count: unreadCount, error: unreadError } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .or(`user_id.is.null,user_id.eq.${user.profile_id}`)
    .eq("is_read", false)

  if (error || unreadError) return { notifications: [], unread: 0 }
  return {
    notifications: notifications ?? [],
    unread: unreadCount ?? 0,
  }
}

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await getServerClient()
  const user = await getCurrentUser()
  if (!user) return 0

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .or(`user_id.is.null,user_id.eq.${user.profile_id}`)
    .eq("is_read", false)

  return count ?? 0
}

export async function getAuditLogs() {
  const supabase = await getServerClient()
  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("audit_logs")
    .select("*, profiles!audit_logs_user_id_fkey(full_name)")
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) return []
  return data ?? []
}

export async function getCashierShifts() {
  const supabase = await getServerClient()
  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("cashier_shifts")
    .select("*, user:profiles!cashier_shifts_user_id_fkey(full_name, username), branch:branches(name)")
    .order("opening_time", { ascending: false })

  if (error) return []
  return data ?? []
}

export async function getReservations() {
  const supabase = await getServerClient()
  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("reservations")
    .select("*, table:restaurant_tables(number)")
    .order("reservation_date", { ascending: false })

  if (error) return []
  return data ?? []
}

export async function getStockOpnames() {
  const supabase = await getServerClient()
  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("stock_opnames")
    .select("*, warehouse:warehouses(name)")
    .order("created_at", { ascending: false })

  if (error) return []
  return data ?? []
}

export async function getWarehouses() {
  const supabase = await getServerClient()
  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("warehouses")
    .select("*")
    .eq("branch_id", user.branch_id ?? "")
    .order("name")

  if (error) return []
  return data ?? []
}

export async function getRecipes() {
  const supabase = await getServerClient()
  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("recipes")
    .select("*, product:products(name), items:recipe_items(*, inventory_item:inventory_items(name, unit))")
    .order("created_at", { ascending: false })

  if (error) return []
  return data ?? []
}

export async function getExpenseCategories() {
  const supabase = await getServerClient()
  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("expense_categories")
    .select("*")
    .order("name")

  if (error) return []
  return data ?? []
}

export async function getEmployeeShifts() {
  const supabase = await getServerClient()
  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("employee_shifts")
    .select("*, employee:employees(name, employee_id)")
    .order("shift_date", { ascending: false })

  if (error) return []
  return data ?? []
}