"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { cache } from "react"

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

export const getCurrentUser = cache(async (): Promise<UserContext | null> => {
  const supabase = await getServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) return null

  const { data, error } = await supabase.rpc("get_my_context")
  if (error || !data) return null

  return {
    user_id: session.user.id,
    profile_id: data.id,
    username: data.username ?? "",
    full_name: data.full_name ?? "",
    role: data.role ?? "",
    branch_id: data.branch_id ?? null,
    organization_id: data.organization_id ?? null,
    is_super_admin: Boolean(data.is_super_admin),
    permissions: Array.isArray(data.permissions) ? data.permissions : [],
  }
})

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

export interface DashboardData {
  todaySales: number
  todayOrders: number
  todayProfit: number
  avgOrderValue: number
  totalCustomers: number
  lowStockItems: number
  pendingOrders: number
  cancelledOrders: number
  salesTrend: { label: string; value: number }[]
  topProducts: { name: string; qty: number; revenue: number }[]
  paymentMethods: { method: string; amount: number }[]
  busyHours: { label: string; value: number }[]
}

export async function getDashboardMetrics(): Promise<DashboardData> {
  const supabase = await getServerClient()
  const { data, error } = await supabase.rpc("get_dashboard_metrics")
  if (error || !data) {
    return {
      todaySales: 0,
      todayOrders: 0,
      todayProfit: 0,
      avgOrderValue: 0,
      totalCustomers: 0,
      lowStockItems: 0,
      pendingOrders: 0,
      cancelledOrders: 0,
      salesTrend: [],
      topProducts: [],
      paymentMethods: [],
      busyHours: [],
    }
  }

  const parseTrend = (arr: string[] | null): { label: string; value: number }[] => {
    if (!arr) return []
    return arr.map((s) => {
      const idx = s.lastIndexOf("|")
      return {
        label: s.slice(0, idx),
        value: idx >= 0 ? parseFloat(s.slice(idx + 1)) : 0,
      }
    })
  }

  return {
    todaySales: Number(data.todaySales ?? 0),
    todayOrders: Number(data.todayOrders ?? 0),
    todayProfit: Number(data.todayProfit ?? 0),
    avgOrderValue: Number(data.avgOrderValue ?? 0),
    totalCustomers: Number(data.totalCustomers ?? 0),
    lowStockItems: Number(data.lowStockItems ?? 0),
    pendingOrders: Number(data.pendingOrders ?? 0),
    cancelledOrders: Number(data.cancelledOrders ?? 0),
    salesTrend: parseTrend(data.salesTrend),
    topProducts: data.topProducts ?? [],
    paymentMethods: data.paymentMethods ?? [],
    busyHours: data.busyHours ?? [],
  }
}