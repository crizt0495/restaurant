import { requirePermission } from "@/lib/helpers"
import { getServerClient } from "@/lib/helpers"
import { notFound } from "next/navigation"
import { getOrganization } from "@/lib/queries"
import { Receipt } from "@/components/orders/receipt"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function OrderReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePermission("orders.view")
  const { id } = await params
  const org = await getOrganization()
  const supabase = await getServerClient()

  const { data: order } = await supabase
    .from("orders")
    .select(
      "*, table:restaurant_tables(number, name), customer:customers(name, phone), cashier:profiles(full_name), items:order_items(*, modifiers:order_item_modifiers(id, option_name, price)), payments(*)"
    )
    .eq("id", id)
    .single()

  if (!order) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Receipt</h2>
          <p className="text-sm text-muted-foreground">{order.order_number}</p>
        </div>
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Print
        </Button>
      </div>
      <Receipt
        restaurantName={org?.name || "Restaurant"}
        restaurantAddress={org?.address}
        restaurantPhone={org?.phone}
        order={order}
      />
    </div>
  )
}