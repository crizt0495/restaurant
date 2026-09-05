import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const DEMO_USERS: {
  username: string
  full_name: string
  email: string
  password: string
  role: string
}[] = [
  { username: "admin", full_name: "Super Admin", email: "admin@demo.restaurant", password: "admin123!", role: "SUPER_ADMIN" },
  { username: "owner", full_name: "Budi Owner", email: "owner@demo.restaurant", password: "owner123!", role: "OWNER" },
  { username: "manager", full_name: "Siti Manager", email: "manager@demo.restaurant", password: "manager123!", role: "MANAGER" },
  { username: "cashier", full_name: "Andi Cashier", email: "cashier@demo.restaurant", password: "cashier123!", role: "CASHIER" },
  { username: "waiter", full_name: "Rina Waiter", email: "waiter@demo.restaurant", password: "waiter123!", role: "WAITER" },
  { username: "kitchen", full_name: "Joko Kitchen", email: "kitchen@demo.restaurant", password: "kitchen123!", role: "KITCHEN" },
  { username: "inventory", full_name: "Devi Inventory", email: "inventory@demo.restaurant", password: "inventory123!", role: "INVENTORY" },
]

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Seed hanya untuk development" }, { status: 403 })
  }

  const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceUrl || !serviceKey) {
    return NextResponse.json({ error: "Environment variables missing" }, { status: 500 })
  }

  const admin = createClient(serviceUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Get main branch id
  const { data: branch } = await admin
    .from("branches")
    .select("id")
    .ilike("name", "%Main Branch%")
    .single()

  const branchId = branch?.id

  const results = []

  for (const user of DEMO_USERS) {
    let userId: string | undefined
    const isSuper = user.username === "admin"

    if (!isSuper) {
      // Create auth user
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { full_name: user.full_name },
      })

      if (createError) {
        results.push({ username: user.username, status: "error", message: createError.message })
        continue
      }
      userId = created.user.id
    } else {
      // Find existing admin or create
      const { data: existingProfile } = await admin
        .from("profiles")
        .select("user_id")
        .ilike("username", "admin")
        .maybeSingle()

      if (existingProfile) {
        results.push({ username: user.username, status: "skip-exists" })
        continue
      }
      const { data: created, error } = await admin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { full_name: user.full_name },
      })
      if (error) {
        results.push({ username: user.username, status: "error", message: error.message })
        continue
      }
      userId = created.user.id
    }

    const branchToUse = isSuper ? null : branchId

    const { error: profileError } = await admin.from("profiles").upsert({
      user_id: userId,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      branch_id: branchToUse,
      is_active: true,
    })

    if (profileError) {
      results.push({ username: user.username, status: "profile-error", message: profileError.message })
    } else {
      results.push({ username: user.username, status: "created", email: user.email, password: user.password, role: user.role })
    }
  }

  return NextResponse.json({ results })
}