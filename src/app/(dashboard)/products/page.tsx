import { getCategories, getProducts } from "@/lib/queries"
import { ProductsClient } from "@/components/products/products-client"
import { getCurrentUser } from "@/lib/helpers"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function ProductsPage() {
  const user = await getCurrentUser()
  if (!user || (!user.is_super_admin && !user.permissions.includes("products.view"))) {
    redirect("/dashboard")
  }

  const [productsData, categories] = await Promise.all([getProducts(), getCategories()])

  return (
    <ProductsClient
      products={productsData.products}
      categories={categories}
      canCreate={user.is_super_admin || user.permissions.includes("products.create")}
      canEdit={user.is_super_admin || user.permissions.includes("products.edit")}
      canDelete={user.is_super_admin || user.permissions.includes("products.delete")}
    />
  )
}