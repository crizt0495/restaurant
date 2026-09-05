import { getCurrentUser } from "@/lib/helpers"
import { redirect } from "next/navigation"
import { getUsers, getBranches } from "@/lib/queries"
import { UsersClient } from "@/components/settings/users-client"

export const dynamic = "force-dynamic"

const ROLES = [
  "SUPER_ADMIN",
  "OWNER",
  "MANAGER",
  "CASHIER",
  "KITCHEN",
  "WAITER",
  "INVENTORY",
  "ACCOUNTING",
] as const

export default async function UsersSettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  if (!user.is_super_admin && !user.permissions.includes("users.view")) {
    redirect("/dashboard")
  }

  const [users, branches] = await Promise.all([getUsers(), getBranches()])

  return (
    <UsersClient
      users={users}
      branches={branches}
      roles={[...ROLES]}
      canCreate={user.is_super_admin || user.permissions.includes("users.create")}
      canEdit={user.is_super_admin || user.permissions.includes("users.edit")}
    />
  )
}
