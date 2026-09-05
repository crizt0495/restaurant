import { getCurrentUser } from "@/lib/helpers"
import { getStockOpnames, getInventoryItems, getWarehouses } from "@/lib/queries"
import { OpnameClient } from "@/components/inventory/opname-client"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function StockOpnamePage() {
  const user = await getCurrentUser()
  if (!user || (!user.is_super_admin && !user.permissions.includes("inventory.view"))) {
    redirect("/dashboard")
  }

  const [opnames, inventoryItems, warehouses] = await Promise.all([
    getStockOpnames(),
    getInventoryItems(),
    getWarehouses(),
  ])

  return (
    <OpnameClient
      opnames={opnames}
      inventoryItems={inventoryItems}
      warehouses={warehouses}
      canCreate={user.is_super_admin || user.permissions.includes("inventory.adjust")}
    />
  )
}
