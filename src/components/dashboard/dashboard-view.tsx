"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Users,
  AlertTriangle,
  Clock,
  XCircle,
  ArrowUpRight,
  Utensils,
  Wallet,
} from "lucide-react"
import type { DashboardData } from "@/lib/helpers"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface DashboardViewProps {
  initialData: DashboardData
}

const statStyles = [
  { chip: "bg-primary/10 text-primary", tag: "Penjualan" },
  { chip: "bg-info/10 text-info", tag: "Pesanan" },
  { chip: "bg-success/10 text-success", tag: "Laba" },
  { chip: "bg-accent/10 text-accent", tag: "Rata-rata" },
  { chip: "bg-secondary/60 text-secondary-foreground", tag: "Pelanggan" },
  { chip: "bg-warning/10 text-warning", tag: "Stok" },
  { chip: "bg-info/10 text-info", tag: "Tertunda" },
  { chip: "bg-destructive/10 text-destructive", tag: "Dibatalkan" },
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
  const maxBusy = Math.max(...data.busyHours.map((x) => Number(x.value)), 1)
  const maxPayment = Math.max(...data.paymentMethods.map((p) => Number(p.amount)), 1)

  return (
    <div className="space-y-6 animate-brutal-slide-up">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
        {stats.map((stat, idx) => {
          const style = statStyles[stat.idx]
          const Icon = stat.icon
          return (
            <Card
              key={stat.title}
              className={cn(
                "card-hover",
                idx > 3 && "max-lg:col-span-1"
              )}
            >
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", style.chip)}>
                    <Icon className="h-4 w-4" strokeWidth={2.25} />
                  </div>
                  {idx === 0 && (
                    <span className="relative flex h-2 w-2">
                      {live && (
                        <>
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                        </>
                      )}
                    </span>
                  )}
                </div>
                <p className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">{stat.title}</p>
                <p className="tabular mt-1 font-display text-lg font-bold leading-none md:text-xl">{stat.value}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* 7-day sales */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base">Penjualan 7 Hari</CardTitle>
            <Badge variant="default">7H</Badge>
          </CardHeader>
          <CardContent>
            {data.salesTrend.length === 0 ? (
              <EmptyState label="Belum ada data penjualan" />
            ) : (
              <div className="flex h-52 items-end gap-2">
                {data.salesTrend.map((d, i) => (
                  <div key={i} className="group flex flex-1 flex-col items-center gap-2">
                    <span className="font-mono text-3xs font-semibold text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      {formatCurrency(d.value)}
                    </span>
                    <div className="relative w-full flex-1 overflow-hidden rounded-t-lg bg-muted/50">
                      <div
                        className="absolute bottom-0 w-full rounded-t-lg bg-gradient-to-t from-primary/70 to-accent/80 transition-all duration-500 group-hover:from-primary group-hover:to-accent"
                        style={{ height: `${(d.value / maxTrend) * 100}%`, minHeight: "6px" }}
                      />
                    </div>
                    <span className="font-mono text-3xs font-semibold text-muted-foreground">{d.label}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base">Aksi Cepat</CardTitle>
            <Badge variant="default">GO</Badge>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <QuickAction href="/pos" label="Buka POS" icon={ShoppingBag} chip="bg-primary text-primary-foreground" />
            <QuickAction href="/orders" label="Pesanan" icon={Clock} chip="bg-info text-info-foreground" />
            <QuickAction href="/kitchen" label="Dapur" icon={Utensils} chip="bg-accent text-accent-foreground" />
            <QuickAction href="/inventory" label="Inventaris" icon={AlertTriangle} chip="bg-warning text-warning-foreground" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Top products */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base">Produk Terlaris</CardTitle>
            <Badge variant="neutral">#1</Badge>
          </CardHeader>
          <CardContent className="pt-0">
            {data.topProducts.length === 0 ? (
              <EmptyState label="Belum ada data" />
            ) : (
              <ul className="space-y-1">
                {data.topProducts.map((p, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50">
                    <span className="flex min-w-0 items-center gap-3">
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold",
                          i === 0
                            ? "bg-gradient-brand text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {i + 1}
                      </span>
                      <span className="truncate text-sm font-medium">{p.name}</span>
                    </span>
                    <span className="tabular shrink-0 font-mono text-xs font-semibold text-muted-foreground">
                      {formatCurrency(p.revenue)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Payment methods */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base">Metode Pembayaran</CardTitle>
            <Badge variant="success">$$</Badge>
          </CardHeader>
          <CardContent className="pt-0">
            {data.paymentMethods.length === 0 ? (
              <EmptyState label="Belum ada data" />
            ) : (
              <ul className="space-y-3">
                {data.paymentMethods.map((p, i) => (
                  <li key={i}>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-sm capitalize">{String(p.method).replace(/_/g, " ")}</span>
                      <span className="tabular font-mono text-sm font-semibold">{formatCurrency(Number(p.amount))}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-brand"
                        style={{ width: `${(Number(p.amount) / maxPayment) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Busy hours */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base">Jam Ramai</CardTitle>
            <Badge variant="warning">⌚</Badge>
          </CardHeader>
          <CardContent className="pt-0">
            {data.busyHours.length === 0 ? (
              <EmptyState label="Belum ada data" />
            ) : (
              <ul className="space-y-2.5">
                {data.busyHours.map((h, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="w-10 shrink-0 font-mono text-xs font-semibold text-muted-foreground">{String(h.label)}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-accent to-primary"
                        style={{ width: `${(Number(h.value) / maxBusy) * 100}%` }}
                      />
                    </div>
                    <span className="tabular w-7 shrink-0 text-right font-mono text-xs font-semibold text-muted-foreground">{String(h.value)}</span>
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
  chip,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  chip: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", chip)}>
        <Icon className="h-5 w-5" strokeWidth={2.25} />
      </div>
      <span className="flex-1 text-sm font-semibold">{label}</span>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
    </Link>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
      <Wallet className="h-8 w-8 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
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