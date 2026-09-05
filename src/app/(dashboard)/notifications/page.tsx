import { getCurrentUser } from "@/lib/helpers"
import { redirect } from "next/navigation"
import { getNotifications } from "@/lib/queries"
import { NotificationsClient } from "@/components/notifications/notifications-client"

export const dynamic = "force-dynamic"

export default async function NotificationsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const data = await getNotifications()

  return (
    <NotificationsClient
      notifications={data.notifications}
      unread={data.unread}
    />
  )
}
