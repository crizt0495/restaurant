import { requirePermission } from "@/lib/helpers"
import { OrdersClient } from "@/components/orders/orders-client"
import { getOrders } from "@/lib/queries"

export const dynamic = "force-dynamic"

export default async function OrdersPage() {
  await requirePermission("orders.view")
  const orders = await getOrders()

  return <OrdersClient orders={orders} />
}