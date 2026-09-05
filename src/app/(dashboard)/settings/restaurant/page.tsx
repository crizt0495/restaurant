import { getCurrentUser } from "@/lib/helpers"
import { redirect } from "next/navigation"
import { getOrganization } from "@/lib/queries"
import { RestaurantClient } from "@/components/settings/restaurant-client"

export const dynamic = "force-dynamic"

export default async function RestaurantSettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  if (!user.is_super_admin && !user.permissions.includes("settings.manage")) {
    redirect("/dashboard")
  }

  const org = await getOrganization()

  return <RestaurantClient organization={org} />
}
