import { getCurrentUser } from "@/lib/helpers"
import { redirect } from "next/navigation"
import { getServerClient } from "@/lib/helpers"
import { ReceiptSettingsClient } from "@/components/settings/receipt-client"

export const dynamic = "force-dynamic"

export default async function ReceiptSettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  if (!user.is_super_admin && !user.permissions.includes("settings.manage")) {
    redirect("/dashboard")
  }

  const supabase = await getServerClient()
  const { data: receipt } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "receipt")
    .maybeSingle()

  return <ReceiptSettingsClient initial={receipt?.value} />
}