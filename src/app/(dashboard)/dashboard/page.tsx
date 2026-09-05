import { getCurrentUser } from "@/lib/helpers"
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  return <DashboardContent />
}