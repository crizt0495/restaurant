"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ShoppingBag, TrendingUp, Users, AlertTriangle, Clock, XCircle } from "lucide-react"
import type { DashboardData } from "@/lib/helpers"

interface DashboardViewProps {
  initialData: DashboardData
}

export function DashboardView({ initialData }: DashboardViewProps) {
  const [data, setData] = React.useState<DashboardData>(initialData)
  const [live, setLive] = React.useState(false)
  const refreshTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = React.useRef(false)

  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

  React.useEffect(() => {
    const supabase = createClient()

    const scheduleRefresh = () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = setTimeout(() => {
        if (pendingRef.current) {
          pendingRef.current = false
          fetchMetrics()
        }
      }, 2000)
    }

    async function fetchMetrics() {
      const { data: result, error } = await supabase.rpc("get_dashboard_metrics")
      if (!error && result) {
        setData(parseRpcResult(result))
        setLive(true)
        setTimeout(() => setLive(false), 2000)
      }
    }

    const channel = supabase
      .channel("db-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        pendingRef.current = true
        scheduleRefresh()
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => {
        pendingRef.current = true
        scheduleRefresh()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    }
  }, [])

  const stats = [
    { title: "Penjualan Hari Ini", value: formatCurrency(data.todaySales), icon: DollarSign, color: "text-emerald-500" },
    { title: "Pesanan Hari Ini", value: String(data.todayOrders), icon: ShoppingBag, color: "text-sky-500" },
    { title: "Laba Hari Ini", value: formatCurrency(data.todayProfit), icon: TrendingUp, color: "text-violet-500" },
    { title: "Rata-rata Nilai Pesanan", value: formatCurrency(data.avgOrderValue), icon: DollarSign, color: "text-amber-500" },
    { title: "Total Pelanggan", value: String(data.totalCustomers), icon: Users, color: "text-blue-500" },
    { title: "Stok Menipis", value: String(data.lowStockItems), icon: AlertTriangle, color: "text-red-500" },
    { title: "Pesanan Tertunda", value: String(data.pendingOrders), icon: Clock, color: "text-orange-500" },
    { title: "Pesanan Dibatalkan", value: String(data.cancelledOrders), icon: XCircle, color: "text-rose-500" },
  ]

  const maxTrend = Math.max(...data.salesTrend.map((d) => d.value), 1)

  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.title}</span>
                {live && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />}
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
              {data.salesTrend.length === 0 ? (
                <p className="py-8 w-full text-center text-sm text-muted-foreground">Belum ada data</p>
              ) : (
                data.salesTrend.map((d, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-primary/80 transition-all"
                      style={{ height: `${(d.value / maxTrend) * 100}%`, minHeight: "4px" }}
                    />
                    <span className="text-[10px] text-muted-foreground">{d.label}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            <QuickAction href="/pos" label="Buka POS" icon={ShoppingBag} />
            <QuickAction href="/orders" label="Lihat Pesanan" icon={Clock} />
            <QuickAction href="/kitchen" label="Tampilan Dapur" icon={TrendingUp} />
            <QuickAction href="/inventory" label="Persediaan" icon={AlertTriangle} />
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
                    <span>{String(p.method).replace(/_/g, " ")}</span>
                    <span className="font-semibold">{formatCurrency(Number(p.amount))}</span>
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
                    <span className="w-12 text-muted-foreground">{String(h.label)}</span>
                    <div className="h-4 flex-1 overflow-hidden rounded bg-muted">
                      <div
                        className="h-full rounded bg-primary/80"
                        style={{
                          width: `${Math.min(100, (Number(h.value) / Math.max(...data.busyHours.map((x) => Number(x.value)), 1)) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs text-muted-foreground">{String(h.value)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
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
  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-accent"
    >
      <Icon className="h-5 w-5 text-primary" />
      <span className="text-sm font-medium">{label}</span>
    </a>
  )
}

function parseRpcResult(data: any): DashboardData {
  const parseTrend = (arr: string[] | null): { label: string; value: number }[] => {
    if (!arr) return []
    return arr.map((s: string) => {
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
