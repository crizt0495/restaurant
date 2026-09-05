import { getCurrentUser } from "@/lib/helpers"
import { getSuppliers } from "@/lib/queries"
import { SuppliersClient } from "@/components/suppliers/suppliers-client"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function SuppliersPage() {
  const user = await getCurrentUser()
  if (!user || (!user.is_super_admin && !user.permissions.includes("suppliers.view"))) {
    redirect("/dashboard")
  }

  const suppliers = await getSuppliers()

  return (
    <SuppliersClient
      suppliers={suppliers}
      canCreate={user.is_super_admin || user.permissions.includes("suppliers.create")}
      canEdit={user.is_super_admin || user.permissions.includes("suppliers.edit")}
      canDelete={user.is_super_admin || user.permissions.includes("suppliers.delete")}
    />
  )
}
