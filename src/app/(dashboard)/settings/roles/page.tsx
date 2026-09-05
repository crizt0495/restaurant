import { getCurrentUser } from "@/lib/helpers"
import { redirect } from "next/navigation"
import { getServerClient } from "@/lib/helpers"
import { RolesClient } from "@/components/settings/roles-client"
import { Role } from "@/types"

export const dynamic = "force-dynamic"

const ROLES: Role[] = [
  "OWNER",
  "MANAGER",
  "CASHIER",
  "KITCHEN",
  "WAITER",
  "INVENTORY",
  "ACCOUNTING",
]

export default async function RolesSettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  if (!user.is_super_admin) redirect("/dashboard")

  const supabase = await getServerClient()

  const [{ data: permissions }, { data: rolePermissions }] = await Promise.all([
    supabase.from("permissions").select("*").order("module"),
    supabase.from("role_permissions").select("*, permissions(id, key, name, module)"),
  ])

  return (
    <RolesClient
      roles={ROLES}
      permissions={permissions ?? []}
      rolePermissions={rolePermissions ?? []}
    />
  )
}
