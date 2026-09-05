import { getCurrentUser } from "@/lib/helpers"
import { redirect } from "next/navigation"
import { getServerClient } from "@/lib/helpers"
import { NotificationSettingsClient } from "@/components/settings/notification-settings-client"

export const dynamic = "force-dynamic"

export default async function NotificationSettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  if (!user.is_super_admin && !user.permissions.includes("settings.manage")) {
    redirect("/dashboard")
  }

  const supabase = await getServerClient()
  const { data: settings } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "notification_preferences")
    .maybeSingle()

  return <NotificationSettingsClient initial={settings?.value} />
}