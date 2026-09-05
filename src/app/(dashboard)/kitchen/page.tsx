import { requirePermission } from "@/lib/helpers"
import { getServerClient } from "@/lib/helpers"
import { KitchenDisplay } from "@/components/kitchen/kitchen-display"

export default async function KitchenPage() {
  const user = await requirePermission("orders.view")
  const supabase = await getServerClient()

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, order_number, notes, created_at, status, order_type, table:restaurant_tables(number, name), items:order_items(id, product_name, quantity, notes, status, modifiers:order_item_modifiers(modifier_name, option_name))"
    )
    .in("status", ["NEW", "CONFIRMED", "PREPARING", "READY"])
    .eq("branch_id", user.branch_id ?? "")
    .order("created_at", { ascending: true })

  return (
    <KitchenDisplay
      orders={((orders as any[]) ?? []).map((o) => ({
        id: o.id,
        order_number: o.order_number,
        notes: o.notes,
        created_at: o.created_at,
        order_type: o.order_type,
        table_number: o.table?.name || o.table?.number || "-",
        items: o.items ?? [],
      }))}
    />
  )
}