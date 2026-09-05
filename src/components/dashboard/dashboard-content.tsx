"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { DollarSign, ShoppingBag, Wallet, TrendingUp, Users, AlertTriangle, Clock, XCircle } from "lucide-react"

interface DashboardData {
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

const EMPTY: DashboardData = {
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

export function DashboardContent() {
  const [data, setData] = React.useState<DashboardData>(EMPTY)

  React.useEffect(() => {
    const supabase = createClient()

    async function load() {
      try {
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)
        const isoStart = startOfDay.toISOString()

        const todayOrdersRes = await supabase
          .from("orders")
          .select("total, status, items:order_items(quantity, product_id)")
          .gte("created_at", isoStart)

        const customers = await supabase.from("customers").select("id", { count: "exact", head: true })

        const lowStock = await supabase
          .from("inventory_items")
          .select("id")
          .lt("quantity", "minimum_stock")

        let todaySales = 0
        let todayCOGS = 0
        let todayOrdersCount = 0
        let pending = 0
        let cancelled = 0
        const productQtyMap = new Map<string, number>()
        todayOrdersRes.data?.forEach((o: any) => {
          if (o.status === "CANCELLED" || o.status === "REFUNDED") {
            cancelled++
            return
          }
          todaySales += Number(o.total)
          todayOrdersCount++
          if (o.status === "NEW" || o.status === "CONFIRMED" || o.status === "PREPARING") {
            pending++
          }
          for (const item of o.items ?? []) {
            const pid = item.product_id
            const qty = Number(item.quantity || 0)
            if (pid) {
              productQtyMap.set(pid, (productQtyMap.get(pid) ?? 0) + qty)
            }
          }
        })

        if (productQtyMap.size > 0) {
          const { data: products } = await supabase
            .from("products")
            .select("id, cost_price")
            .in("id", Array.from(productQtyMap.keys()))
          for (const p of products ?? []) {
            const qty = productQtyMap.get(p.id) ?? 0
            todayCOGS += Number(p.cost_price ?? 0) * qty
          }
        }

        // Last 7 days sales trend
        const trend: { label: string; value: number }[] = []
        const now = new Date()
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now)
          d.setHours(0, 0, 0, 0)
          d.setDate(d.getDate() - i)
          const end = new Date(d)
          end.setDate(end.getDate() + 1)
          const res = await supabase
            .from("orders")
            .select("total, status")
            .gte("created_at", d.toISOString())
            .lt("created_at", end.toISOString())
          let s = 0
          res.data?.forEach((o) => {
            if (o.status !== "CANCELLED" && o.status !== "REFUNDED") s += Number(o.total)
          })
          trend.push({
            label: d.toLocaleDateString("id-ID", { weekday: "short" }),
            value: s,
          })
        }

        // Top products today
        const productQty = new Map<string, { name: string; qty: number; revenue: number }>()
        if (productQtyMap.size > 0) {
          const { data: productNames } = await supabase
            .from("products")
            .select("id, name, selling_price")
            .in("id", Array.from(productQtyMap.keys()))
          const nameMap = new Map((productNames ?? []).map((p) => [p.id, p]))
          for (const [pid, qty] of Array.from(productQtyMap.entries())) {
            const p = nameMap.get(pid)
            productQty.set(pid, {
              name: p?.name || "Unknown",
              qty,
              revenue: (p ? Number(p.selling_price) : 0) * qty,
            })
          }
        }
        const topProducts = Array.from(productQty.values())
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)

        // Payment methods today
        const { data: todayPayments } = await supabase
          .from("payments")
          .select("method, amount")
          .gte("payment_date", isoStart)
          .eq("status", "SUCCESS")
        const payMap = new Map<string, number>()
        for (const p of todayPayments ?? []) {
          const m = (p as { method: string }).method
          payMap.set(m, (payMap.get(m) ?? 0) + Number((p as { amount: number }).amount))
        }
        const paymentMethods = Array.from(payMap.entries()).map(([method, amount]) => ({ method, amount }))

        // Today's orders by hour
        const hourCount = new Array(24).fill(0)
        for (const o of todayOrdersRes.data ?? []) {
          if (o.status === "CANCELLED" || o.status === "REFUNDED") continue
          const h = new Date((o as any).created_at).getHours()
          hourCount[h] += 1
        }
        const busyHours = hourCount.map((v, h) => ({ label: `${h}:00`, value: v })).filter((b) => b.value > 0)

        setData({
          todaySales,
          todayOrders: todayOrdersCount,
          todayProfit: todaySales - todayCOGS,
          avgOrderValue: todayOrdersCount ? todaySales / todayOrdersCount : 0,
          totalCustomers: customers.count ?? 0,
          lowStockItems: lowStock.data?.length ?? 0,
          pendingOrders: pending,
          cancelledOrders: cancelled,
          salesTrend: trend,
          topProducts,
          paymentMethods,
          busyHours,
        })
      } catch {
        setData(EMPTY)
      }
    }

    load()

    // Realtime subscription to orders
    const channel = supabase
      .channel("dashboard-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        load()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const stats = [
    { title: "Today's Sales", value: formatCurrency(data.todaySales), icon: DollarSign, color: "text-emerald-500" },
    { title: "Today's Orders", value: String(data.todayOrders), icon: ShoppingBag, color: "text-sky-500" },
    { title: "Today's Profit", value: formatCurrency(data.todayProfit), icon: TrendingUp, color: "text-violet-500" },
    { title: "Avg Order Value", value: formatCurrency(data.avgOrderValue), icon: Wallet, color: "text-amber-500" },
    { title: "Total Customers", value: String(data.totalCustomers), icon: Users, color: "text-blue-500" },
    { title: "Low Stock Items", value: String(data.lowStockItems), icon: AlertTriangle, color: "text-red-500" },
    { title: "Pending Orders", value: String(data.pendingOrders), icon: Clock, color: "text-orange-500" },
    { title: "Cancelled Orders", value: String(data.cancelledOrders), icon: XCircle, color: "text-rose-500" },
  ]

  const maxTrend = Math.max(...data.salesTrend.map((d) => d.value), 1)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-sm text-muted-foreground">Ringkasan performa hari ini</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.title}</span>
              </div>
              <p className="mt-2 text-lg font-bold md:text-xl">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">7 Hari Penjualan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-end gap-2">
              {data.salesTrend.map((d, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-primary/80 transition-all"
                    style={{ height: `${(d.value / maxTrend) * 100}%`, minHeight: "4px" }}
                  />
                  <span className="text-[10px] text-muted-foreground">{d.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            <QuickAction href="/pos" label="Buka POS" icon={ShoppingBag} />
            <QuickAction href="/orders" label="Lihat Order" icon={Wallet} />
            <QuickAction href="/kitchen" label="Kitchen Display" icon={Clock} />
            <QuickAction href="/inventory" label="Inventory" icon={AlertTriangle} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Produk Terlaris (Hari Ini)</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topProducts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Belum ada penjualan</p>
            ) : (
              <ul className="space-y-2">
                {data.topProducts.map((p, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      <span className="truncate">{p.name}</span>
                    </span>
                    <span className="text-muted-foreground">{formatCurrency(p.revenue)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Metode Pembayaran (Hari Ini)</CardTitle>
          </CardHeader>
          <CardContent>
            {data.paymentMethods.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Belum ada pembayaran</p>
            ) : (
              <ul className="space-y-2">
                {data.paymentMethods.map((p, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 text-sm">
                    <span>{p.method.replace(/_/g, " ")}</span>
                    <span className="font-semibold">{formatCurrency(p.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Jam Paling Ramai</CardTitle>
          </CardHeader>
          <CardContent>
            {data.busyHours.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Belum ada data</p>
            ) : (
              <ul className="space-y-1.5">
                {data.busyHours.map((h, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-12 text-muted-foreground">{h.label}</span>
                    <div className="h-4 flex-1 overflow-hidden rounded bg-muted">
                      <div
                        className="h-full rounded bg-primary/80"
                        style={{ width: `${Math.min(100, (h.value / Math.max(...data.busyHours.map((x) => x.value))) * 100)}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs text-muted-foreground">{h.value}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function QuickAction({
  href,
  label,
  icon: Icon,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}) {
  const router = { push: (h: string) => { window.location.href = h } }
  return (
    <button
      onClick={() => router.push(href)}
      className="flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-accent"
    >
      <Icon className="h-5 w-5 text-primary" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  )
}