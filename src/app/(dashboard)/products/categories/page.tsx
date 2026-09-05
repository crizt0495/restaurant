import { getCurrentUser } from "@/lib/helpers"
import { getServerClient } from "@/lib/helpers"
import { redirect } from "next/navigation"
import { CategoriesClient } from "@/components/products/categories-client"
import { getCategories } from "@/lib/queries"

export const dynamic = "force-dynamic"

export default async function CategoriesPage() {
  const user = await getCurrentUser()
  if (!user || (!user.is_super_admin && !user.permissions.includes("products.view"))) {
    redirect("/dashboard")
  }

  const categories = await getCategories()
  const supabase = await getServerClient()
  const { data: counts } = await supabase
    .from("products")
    .select("category_id", { count: "exact", head: false })
    .eq("deleted_at", null)

  const productCount = (counts ?? []).reduce<Record<string, number>>((acc, p) => {
    const cat = (p as { category_id: string }).category_id
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {})

  return <CategoriesClient categories={categories} productCount={productCount} />
}