"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export interface SessionUser {
  id: string
  email?: string
}

export interface UserContext {
  user_id: string
  profile_id: string
  username: string
  full_name: string
  role: string
  branch_id: string | null
  organization_id: string | null
  is_super_admin: boolean
  permissions: string[]
}

export async function getServerSession() {
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

  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, branches(organization_id)")
    .eq("user_id", user.id)
    .single()

  if (!profile) {
    return { user, profile: null }
  }

  return { user, profile }
}

export async function requireAuth() {
  const session = await getServerSession()
  if (!session?.user) {
    redirect("/login")
  }
  return session
}

export async function getServerClient() {
  const cookieStore = await cookies()
  return createServerClient(
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
}

export async function getCurrentUser(): Promise<UserContext | null> {
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

  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, branches(organization_id)")
    .eq("user_id", user.id)
    .single()

  if (!profile) return null

  const branchObj = Array.isArray(profile.branches) ? profile.branches[0] : profile.branches
  const organization_id = (branchObj as { organization_id?: string } | undefined)?.organization_id ?? null

  // Get permissions via role_permissions
  let permissions: string[] = []
  if (profile.role === "SUPER_ADMIN") {
    permissions = ["*"]
  } else {
    const { data: rps } = await supabase
      .from("role_permissions")
      .select("permissions(key)")
      .eq("role", profile.role)

    if (rps) {
      permissions = rps
        .map((rp) => (rp as { permissions?: { key?: string } }).permissions?.key)
        .filter((k): k is string => Boolean(k))
    }
  }

  return {
    user_id: user.id,
    profile_id: profile.id,
    username: profile.username,
    full_name: profile.full_name,
    role: profile.role,
    branch_id: profile.branch_id,
    organization_id,
    is_super_admin: profile.role === "SUPER_ADMIN",
    permissions,
  }
}

export async function requirePermission(permission: string) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  if (user.is_super_admin || user.permissions.includes("*") || user.permissions.includes(permission)) {
    return user
  }
  redirect("/dashboard")
}

export async function requireRole(...roles: string[]) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  if (user.is_super_admin || roles.includes(user.role)) {
    return user
  }
  redirect("/dashboard")
}