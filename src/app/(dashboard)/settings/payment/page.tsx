import { getCurrentUser, getServerClient } from "@/lib/helpers"
import { redirect } from "next/navigation"
import { PaymentMethodsClient } from "@/components/settings/payment-client"

export const dynamic = "force-dynamic"

const DEFAULT_METHODS = [
  { key: "CASH", label: "Cash" },
  { key: "BANK_TRANSFER", label: "Bank Transfer" },
  { key: "QRIS", label: "QRIS" },
  { key: "DEBIT", label: "Kartu Debit" },
  { key: "CREDIT", label: "Kartu Kredit" },
  { key: "E_WALLET", label: "E-Wallet" },
]

export default async function PaymentSettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  if (!user.is_super_admin && !user.permissions.includes("settings.manage")) {
    redirect("/dashboard")
  }

  const supabase = await getServerClient()

  const { data: branch } = await supabase
    .from("branches")
    .select("organization_id")
    .eq("id", user.branch_id ?? "")
    .single()

  let enabledMethods: string[] = DEFAULT_METHODS.map((m) => m.key)

  if (branch) {
    const { data: setting } = await supabase
      .from("settings")
      .select("value")
      .eq("organization_id", branch.organization_id)
      .eq("key", "payment_methods")
      .single()

    if (setting?.value && Array.isArray(setting.value)) {
      enabledMethods = setting.value as string[]
    }
  }

  return (
    <PaymentMethodsClient
      methods={DEFAULT_METHODS}
      enabledMethods={enabledMethods}
    />
  )
}
