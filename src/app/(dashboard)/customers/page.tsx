import { getCurrentUser } from "@/lib/helpers"
import { redirect } from "next/navigation"
import { getCustomers } from "@/lib/queries"
import { CustomersClient } from "@/components/customers/customers-client"

export const dynamic = "force-dynamic"

export default async function CustomersPage() {
  const user = await getCurrentUser()
  if (!user || (!user.is_super_admin && !user.permissions.includes("customers.view"))) {
    redirect("/dashboard")
  }

  const customers = await getCustomers()

  return (
    <CustomersClient
      customers={customers}
      canCreate={user.is_super_admin || user.permissions.includes("customers.create")}
      canEdit={user.is_super_admin || user.permissions.includes("customers.edit")}
    />
  )
}
