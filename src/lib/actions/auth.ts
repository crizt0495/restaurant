"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"

const loginSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter"),
  password: z.string().min(6, "Password minimal 6 karakter"),
})

export type LoginResult =
  | { success: true }
  | { success: false; error: string }

export async function signInWithUsername(
  prevState: unknown,
  formData: FormData
): Promise<LoginResult> {
  const rawUsername = formData.get("username") as string
  const password = formData.get("password") as string

  const parsed = loginSchema.safeParse({
    username: rawUsername,
    password,
  })

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Input tidak valid",
    }
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )

  try {
    // Find the auth email by username (server-side only)
    const { data: mappedEmail, error: mapError } = await supabase
      .rpc("get_auth_email_by_username", { p_username: parsed.data.username })
      .single()

    if (mapError || !mappedEmail) {
      return { success: false, error: "Username atau password salah" }
    }

    const email = mappedEmail as string

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: parsed.data.password,
    })

    if (error || !data.user) {
      return { success: false, error: "Username atau password salah" }
    }

    // Check if profile is active
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", data.user.id)
      .single()

    if (!profile || !profile.is_active) {
      await supabase.auth.signOut()
      return { success: false, error: "Akun tidak aktif" }
    }

    const redirectTo = (formData.get("redirect") as string) || "/dashboard"

    // Log audit (also fetch org id via branch)
    let orgId: string | null = null
    if (profile.branch_id) {
      const { data: br } = await supabase
        .from("branches")
        .select("organization_id")
        .eq("id", profile.branch_id)
        .single()
      orgId = br?.organization_id ?? null
    }
    await supabase
      .from("audit_logs")
      .insert({
        organization_id: orgId,
        action: "LOGIN",
        entity: "user",
        user_id: profile.id,
      })

    redirect(redirectTo)
    return { success: true }
  } catch (err: unknown) {
    const error = err as { digest?: string }
    if (error?.digest && error.digest.includes("NEXT_REDIRECT")) {
      redirect("/dashboard")
    }
    return { success: false, error: "Terjadi kesalahan, silakan coba lagi" }
  }
}

export async function signOut() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    await supabase
      .from("audit_logs")
      .insert({
        action: "LOGOUT",
        entity: "user",
      })
  }

  await supabase.auth.signOut()
  redirect("/login")
}