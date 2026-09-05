import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { PublicMenu } from "@/components/menu/public-menu"

export default async function PublicMenuPage({
  params,
}: {
  params: Promise<{ branch: string; table: string }>
}) {
  const { branch: branchCode, table: tableNumber } = await params
  const supabase = await createClient()

  const { data: branch } = await supabase
    .from("branches")
    .select("*")
    .ilike("code", branchCode)
    .single()

  if (!branch) notFound()

  const { data: table } = await supabase
    .from("restaurant_tables")
    .select("*")
    .eq("branch_id", branch.id)
    .ilike("number", tableNumber)
    .single()

  const [categoriesRes, productsRes, orgRes] = await Promise.all([
    supabase.from("categories").select("id, name, icon").eq("is_active", true).order("name"),
    supabase
      .from("products")
      .select("id, name, description, image_url, selling_price, category_id, is_favorite")
      .eq("is_active", true)
      .eq("deleted_at", null)
      .order("name"),
    supabase.from("organizations").select("name, logo_url, address, phone").eq("id", branch.organization_id).single(),
  ])

  return (
    <PublicMenu
      branchId={branch.id}
      tableId={table?.id}
      branchName={branch.name}
      tableName={table?.name || table?.number || tableNumber}
      orgName={orgRes.data?.name || "Restaurant"}
      categories={(categoriesRes.data as any[]) ?? []}
      products={(productsRes.data as any[]) ?? []}
    />
  )
}