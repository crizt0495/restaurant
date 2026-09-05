import { getCurrentUser } from "@/lib/helpers"
import { redirect } from "next/navigation"
import { getBranches } from "@/lib/queries"
import { BranchesClient } from "@/components/settings/branches-client"

export const dynamic = "force-dynamic"

export default async function BranchesSettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  if (!user.is_super_admin && !user.permissions.includes("branches.manage")) {
    redirect("/dashboard")
  }

  const branches = await getBranches()

  return <BranchesClient branches={branches} canEdit={user.is_super_admin || user.permissions.includes("branches.manage")} />
}
