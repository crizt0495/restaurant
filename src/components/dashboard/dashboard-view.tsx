"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ShoppingBag, TrendingUp, Users, AlertTriangle, Clock, XCircle, ArrowUpRight } from "lucide-react"
import type { DashboardData } from "@/lib/helpers"
import Link from "next/link"

interface DashboardViewProps {
  initialData: DashboardData
}

const statStyles = [
  { color: "bg-success", icon: "text-success-foreground", tag: "EDGE" },
  { color: "bg-info", icon: "text-info-foreground", tag: "FLOW" },
  { color: "bg-primary", icon: "text-primary-foreground", tag: "GROW" },
  { color: "bg-warning", icon: "text-warning-foreground", tag: "MEAN" },
  { color: "bg-secondary", icon: "text-secondary-foreground", tag: "PEOPLE" },
  { color: "bg-accent", icon: "text-accent-foreground", tag: "STOCK" },
  { color: "bg-accent", icon: "text-accent-foreground", tag: "WAIT" },
  { color: "bg-destructive", icon: "text-destructive-foreground", tag: "VOID" },
]

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
    { title: "Penjualan Hari Ini", value: formatCurrency(data.todaySales), icon: DollarSign, idx: 0 },
    { title: "Pesanan Hari Ini", value: String(data.todayOrders), icon: ShoppingBag, idx: 1 },
    { title: "Laba Hari Ini", value: formatCurrency(data.todayProfit), icon: TrendingUp, idx: 2 },
    { title: "Rata-rata Pesanan", value: formatCurrency(data.avgOrderValue), icon: DollarSign, idx: 3 },
    { title: "Total Pelanggan", value: String(data.totalCustomers), icon: Users, idx: 4 },
    { title: "Stok Menipis", value: String(data.lowStockItems), icon: AlertTriangle, idx: 5 },
    { title: "Tertunda", value: String(data.pendingOrders), icon: Clock, idx: 6 },
    { title: "Dibatalkan", value: String(data.cancelledOrders), icon: XCircle, idx: 7 },
  ]

  const maxTrend = Math.max(...data.salesTrend.map((d) => d.value), 1)

  return (
    <div className="space-y-6 animate-brutal-slide-up">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((stat) => {
          const style = statStyles[stat.idx]
          return (
            <Card key={stat.title} className="hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_0_hsl(var(--foreground))]">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`flex h-9 w-9 items-center justify-center border-2 border-foreground shadow-[2px_2px_0_0_hsl(var(--foreground))] ${style.color}`}>
                    <stat.icon className={`h-4 w-4 ${style.icon}`} strokeWidth={3} />
                  </div>
                  <span className="ml-auto px-1.5 py-0.5 bg-foreground text-background text-[8px] font-black font-mono">
                    {style.tag}
                  </span>
                  {live && <span className="h-2 w-2 bg-success animate-pulse" />}
                </div>
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{stat.title}</p>
                <p className="font-display mt-1 text-xl font-black leading-none">{stat.value}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="bg-foreground text-background">
            <CardTitle className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground px-2 py-1 text-xs font-black">7H</span>
              <span>Penjualan 7 Hari</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-end gap-2">
              {data.salesTrend.length === 0 ? (
                <p className="py-8 w-full text-center text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Belum ada data
                </p>
              ) : (
                data.salesTrend.map((d, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full bg-primary border-2 border-foreground transition-all hover:bg-accent cursor-pointer"
                      style={{ height: `${(d.value / maxTrend) * 100}%`, minHeight: "4px" }}
                    />
                    <span className="text-[10px] font-mono font-black">{d.label}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-foreground text-background">
            <CardTitle className="flex items-center gap-2">
              <span className="bg-accent text-accent-foreground px-2 py-1 text-xs font-black">GO</span>
              <span>Aksi Cepat</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <QuickAction href="/pos" label="Buka POS" icon={ShoppingBag} color="bg-primary text-primary-foreground" />
            <QuickAction href="/orders" label="Pesanan" icon={Clock} color="bg-info text-info-foreground" />
            <QuickAction href="/kitchen" label="Dapur" icon={TrendingUp} color="bg-accent text-accent-foreground" />
            <QuickAction href="/inventory" label="Inventaris" icon={AlertTriangle} color="bg-warning text-warning-foreground" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="bg-foreground text-background">
            <CardTitle className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground px-2 py-1 text-xs font-black">#1</span>
              Produk Terlaris
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topProducts.length === 0 ? (
              <p className="py-8 text-center text-xs font-black uppercase tracking-widest text-muted-foreground">Belum ada data</p>
            ) : (
              <ul className="space-y-2">
                {data.topProducts.map((p, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 text-sm border-b-2 border-foreground last:border-0 pb-2">
                    <span className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center bg-foreground text-background text-[10px] font-black">
                        {i + 1}
                      </span>
                      <span className="font-black uppercase truncate">{p.name}</span>
                    </span>
                    <span className="font-mono text-xs font-black text-muted-foreground whitespace-nowrap bg-muted px-1.5 py-0.5 border-2 border-foreground">{formatCurrency(p.revenue)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-foreground text-background">
            <CardTitle className="flex items-center gap-2">
              <span className="bg-success text-success-foreground px-2 py-1 text-xs font-black">$$</span>
              Metode Pembayaran
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.paymentMethods.length === 0 ? (
              <p className="py-8 text-center text-xs font-black uppercase tracking-widest text-muted-foreground">Belum ada data</p>
            ) : (
              <ul className="space-y-2">
                {data.paymentMethods.map((p, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 border-b-2 border-foreground last:border-0 pb-2">
                    <span className="text-xs font-black uppercase tracking-wider">{String(p.method).replace(/_/g, " ")}</span>
                    <span className="font-mono text-sm font-black bg-success text-success-foreground px-2 py-0.5 border-2 border-foreground shadow-[2px_2px_0_0_hsl(var(--foreground))]">{formatCurrency(Number(p.amount))}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-foreground text-background">
            <CardTitle className="flex items-center gap-2">
              <span className="bg-warning text-warning-foreground px-2 py-1 text-xs font-black">⌚</span>
              Jam Ramai
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.busyHours.length === 0 ? (
              <p className="py-8 text-center text-xs font-black uppercase tracking-widest text-muted-foreground">Belum ada data</p>
            ) : (
              <ul className="space-y-2">
                {data.busyHours.map((h, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-12 text-xs font-mono font-black text-muted-foreground">{String(h.label)}</span>
                    <div className="h-5 flex-1 overflow-hidden border-2 border-foreground bg-muted shadow-[2px_2px_0_0_hsl(var(--foreground))]">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${Math.min(100, (Number(h.value) / Math.max(...data.busyHours.map((x) => Number(x.value)), 1)) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="w-8 text-right text-[10px] font-mono font-black text-muted-foreground">{String(h.value)}</span>
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
  color,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  color: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 border-3 border-foreground bg-card p-4 shadow-[4px_4px_0_0_hsl(var(--foreground))] transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_hsl(var(--foreground))] hover:bg-foreground hover:text-background"
    >
      <div className={`flex h-10 w-10 items-center justify-center border-2 border-foreground shadow-[2px_2px_0_0_hsl(var(--foreground))] ${color}`}>
        <Icon className="h-5 w-5" strokeWidth={3} />
      </div>
      <span className="text-sm font-black uppercase tracking-wide">{label}</span>
      <ArrowUpRight className="h-4 w-4 ml-auto opacity-50 group-hover:opacity-100 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={3} />
    </Link>
  )
}

function parseRpcResult(data: Record<string, unknown>): DashboardData {
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
    salesTrend: parseTrend(data.salesTrend as string[] | null),
    topProducts: ((data.topProducts as { name: string; revenue: number }[]) ?? []).map((p) => ({ ...p, qty: 0 })),
    paymentMethods: (data.paymentMethods as { method: string; amount: number }[]) ?? [],
    busyHours: (data.busyHours as { label: string; value: number }[]) ?? [],
  }
}
