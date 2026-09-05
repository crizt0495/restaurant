import { getCurrentUser } from "@/lib/helpers"
import { getPurchaseOrders, getSuppliers, getInventoryItems } from "@/lib/queries"
import { PurchasesClient } from "@/components/purchases/purchases-client"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function PurchasesPage() {
  const user = await getCurrentUser()
  if (!user || (!user.is_super_admin && !user.permissions.includes("purchases.view"))) {
    redirect("/dashboard")
  }

  const [purchaseOrders, suppliers, inventoryItems] = await Promise.all([
    getPurchaseOrders(),
    getSuppliers(),
    getInventoryItems(),
  ])

  return (
    <PurchasesClient
      purchaseOrders={purchaseOrders}
      suppliers={suppliers}
      inventoryItems={inventoryItems}
      canCreate={user.is_super_admin || user.permissions.includes("purchases.create")}
      canReceive={user.is_super_admin || user.permissions.includes("purchases.receive")}
    />
  )
}
