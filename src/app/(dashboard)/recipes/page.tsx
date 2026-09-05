import { getCurrentUser } from "@/lib/helpers"
import { getRecipes, getProducts, getInventoryItems } from "@/lib/queries"
import { RecipesClient } from "@/components/recipes/recipes-client"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function RecipesPage() {
  const user = await getCurrentUser()
  if (!user || (!user.is_super_admin && !user.permissions.includes("products.view"))) {
    redirect("/dashboard")
  }

  const [recipes, productsData, inventoryItems] = await Promise.all([
    getRecipes(),
    getProducts(),
    getInventoryItems(),
  ])

  return (
    <RecipesClient
      recipes={recipes}
      products={productsData.products}
      inventoryItems={inventoryItems}
      canCreate={user.is_super_admin || user.permissions.includes("products.create")}
      canEdit={user.is_super_admin || user.permissions.includes("products.edit")}
    />
  )
}
