import { getCurrentUser } from "@/lib/helpers"
import { redirect } from "next/navigation"
import { getCashierShifts } from "@/lib/queries"
import { ShiftsClient } from "@/components/shifts/shifts-client"

export const dynamic = "force-dynamic"

export default async function ShiftsPage() {
  const user = await getCurrentUser()
  if (!user || (!user.is_super_admin && !user.permissions.includes("shifts.view"))) {
    redirect("/dashboard")
  }

  const shifts = await getCashierShifts()

  return (
    <ShiftsClient
      shifts={shifts}
      canOpen={user.is_super_admin || user.permissions.includes("shifts.open")}
      canClose={user.is_super_admin || user.permissions.includes("shifts.close")}
    />
  )
}