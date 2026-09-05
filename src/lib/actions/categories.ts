"use server"

import { revalidatePath } from "next/cache"
import { getServerClient, getCurrentUser } from "@/lib/helpers"

export async function createCategory(name: string, description?: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  const supabase = await getServerClient()

  const { data: orgRow } = await supabase
    .from("branches")
    .select("organization_id")
    .eq("id", user.branch_id ?? "")
    .single()

  const slug = name.toLowerCase().replace(/[^\w ]+/g, "").replace(/ +/g, "-")

  const { error } = await supabase.from("categories").insert({
    name,
    slug,
    description,
    organization_id: orgRow?.organization_id,
  })

  if (error) return { error: error.message }
  revalidatePath("/products/categories")
  return { success: true }
}

export async function updateCategory(id: string, name: string, description?: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("products.edit")) {
    return { error: "Forbidden" }
  }
  const supabase = await getServerClient()

  const slug = name.toLowerCase().replace(/[^\w ]+/g, "").replace(/ +/g, "-")
  const { error } = await supabase
    .from("categories")
    .update({ name, slug, description })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/products/categories")
  return { success: true }
}

export async function deleteCategory(id: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("products.delete")) {
    return { error: "Forbidden" }
  }
  const supabase = await getServerClient()
  const { error } = await supabase
    .from("categories")
    .update({ is_active: false })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/products/categories")
  return { success: true }
}