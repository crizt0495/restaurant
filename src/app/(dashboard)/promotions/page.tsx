import { getCurrentUser } from "@/lib/helpers"
import { getPromotions, getProducts, getCategories } from "@/lib/queries"
import { PromotionsClient } from "@/components/promotions/promotions-client"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function PromotionsPage() {
  const user = await getCurrentUser()
  if (!user || (!user.is_super_admin && !user.permissions.includes("promotions.view"))) {
    redirect("/dashboard")
  }

  const [promotions, productsData, categories] = await Promise.all([
    getPromotions(),
    getProducts(),
    getCategories(),
  ])

  return (
    <PromotionsClient
      promotions={promotions}
      products={productsData.products}
      categories={categories}
      canCreate={user.is_super_admin || user.permissions.includes("promotions.create")}
      canEdit={user.is_super_admin || user.permissions.includes("promotions.create")}
    />
  )
}
