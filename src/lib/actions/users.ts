"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/helpers"
import { createAdminClient } from "@/lib/supabase/admin"
import { getServerClient } from "@/lib/helpers"
import { z } from "zod"
import { SYSTEM_PERMISSIONS } from "@/types"

const roleValues = Object.keys(SYSTEM_PERMISSIONS) as [string, ...string[]]

const userInputSchema = z.object({
  full_name: z.string().min(1),
  username: z.string().min(1),
  role: z.enum(roleValues),
  branch_id: z.string().min(1),
  phone: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
  password: z.string().min(6),
})

export async function createUser(input: z.infer<typeof userInputSchema>) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("users.create")) {
    return { error: "Forbidden" }
  }

  const parsed = userInputSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Invalid input" }

  const data = parsed.data
  const admin = createAdminClient()

  try {
    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email: `${data.username}@restaurant.local`,
      password: data.password,
      email_confirm: true,
    })

    if (authError || !authUser?.user) {
      return { error: authError?.message || "Failed to create auth user" }
    }

    const supabase = await getServerClient()
    const { error: profileError } = await supabase.from("profiles").insert({
      user_id: authUser.user.id,
      full_name: data.full_name,
      username: data.username,
      role: data.role,
      branch_id: data.branch_id,
      phone: data.phone || null,
      is_active: data.is_active,
    })

    if (profileError) {
      await admin.auth.admin.deleteUser(authUser.user.id).catch(() => {})
      return { error: profileError.message }
    }

    revalidatePath("/settings/users")
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create user"
    return { error: message }
  }
}

export async function updateUser(
  id: string,
  input: Omit<z.infer<typeof userInputSchema>, "password">
) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (!user.is_super_admin && !user.permissions.includes("users.edit")) {
    return { error: "Forbidden" }
  }

  const schema = userInputSchema.omit({ password: true })
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Invalid input" }

  const data = parsed.data
  const supabase = await getServerClient()
  const admin = createAdminClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("id", id)
    .single()

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: data.full_name,
      username: data.username,
      role: data.role,
      branch_id: data.branch_id,
      phone: data.phone || null,
      is_active: data.is_active,
    })
    .eq("id", id)

  if (error) return { error: error.message }

  if (profile?.user_id) {
    await admin
      .auth.admin.updateUserById(profile.user_id, { email: `${data.username}@restaurant.local` })
      .catch(() => {})
  }

  revalidatePath("/settings/users")
  return { success: true }
}
