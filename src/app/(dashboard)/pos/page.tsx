import { getServerClient } from "@/lib/helpers"
import { POS } from "@/components/pos/pos"
import { requirePermission } from "@/lib/helpers"

export default async function POSPage() {
  const user = await requirePermission("orders.create")

  const supabase = await getServerClient()
  const [categoriesRes, productsRes, tablesRes, customersRes, orgRes, settingsRes] = await Promise.all([
    supabase.from("categories").select("id, name, slug").eq("is_active", true).order("name"),
    supabase
      .from("products")
      .select("*, variants:product_variants(*), modifiers:product_modifiers(modifier:modifiers(*, options:modifier_options(*)))")
      .eq("is_active", true)
      .eq("deleted_at", null)
      .order("name"),
    supabase
      .from("restaurant_tables")
      .select("id, number, name, capacity, status")
      .eq("branch_id", user.branch_id ?? "")
      .eq("is_active", true)
      .order("number"),
    supabase
      .from("customers")
      .select("id, name, phone, member_level, points, is_member")
      .eq("deleted_at", null)
      .order("name")
      .limit(200),
    supabase
      .from("branches")
      .select("organization_id")
      .eq("id", user.branch_id ?? "")
      .single(),
    supabase.from("settings").select("key, value").eq("key", "receipt").maybeSingle(),
  ])

  let taxPercentage = 11
  let taxInclusive = false
  let serviceChargePercentage = 5

  if (orgRes.data?.organization_id) {
    const org = await supabase
      .from("organizations")
      .select("tax_percentage, tax_inclusive, service_charge_percentage")
      .eq("id", orgRes.data.organization_id)
      .single()
    if (org.data) {
      taxPercentage = Number(org.data.tax_percentage ?? 11)
      taxInclusive = Boolean(org.data.tax_inclusive)
      serviceChargePercentage = Number(org.data.service_charge_percentage ?? 5)
    }
  }

  return (
    <POS
      user={{
        profile_id: user.profile_id,
        username: user.username,
        full_name: user.full_name,
      }}
      categories={(categoriesRes.data as { id: string; name: string; slug: string }[]) ?? []}
      products={(productsRes.data as any[]) ?? []}
      tables={(tablesRes.data as any[]) ?? []}
      customers={(customersRes.data as any[]) ?? []}
      taxPercentage={taxPercentage}
      taxInclusive={taxInclusive}
      serviceChargePercentage={serviceChargePercentage}
      receiptFormat={settingsRes.data?.value?.format ?? "THERMAL_80"}
    />
  )
}