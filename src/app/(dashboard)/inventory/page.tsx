import { getCurrentUser } from "@/lib/helpers"
import { getInventoryItems } from "@/lib/queries"
import { InventoryClient } from "@/components/inventory/inventory-client"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function InventoryPage() {
  const user = await getCurrentUser()
  if (!user || (!user.is_super_admin && !user.permissions.includes("inventory.view"))) {
    redirect("/dashboard")
  }

  const items = await getInventoryItems()

  return (
    <InventoryClient
      items={items}
      canCreate={user.is_super_admin || user.permissions.includes("inventory.create")}
      canEdit={user.is_super_admin || user.permissions.includes("inventory.edit")}
      canDelete={user.is_super_admin || user.permissions.includes("inventory.delete")}
      canAdjust={user.is_super_admin || user.permissions.includes("inventory.adjust")}
    />
  )
}
