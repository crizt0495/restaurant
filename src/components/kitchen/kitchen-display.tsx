"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { updateOrderItemStatus } from "@/lib/actions/index"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, ChefHat, Play, Check, BellRing, MessageSquareWarning } from "lucide-react"
import toast from "react-hot-toast"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface KitchenItem {
  id: string
  product_name: string
  quantity: number
  notes?: string
  status: string
  modifiers?: { modifier_name: string; option_name: string }[]
}

interface KitchenOrder {
  id: string
  order_number: string
  notes?: string
  created_at: string
  order_type: string
  table_number: string
  items: KitchenItem[]
}

const columns = [
  { status: "NEW", label: "Baru", icon: BellRing, tint: "text-info", track: "bg-info/10", bar: "bg-info", chip: "bg-info/10 text-info border-info/20" },
  { status: "PREPARING", label: "Dibuat", icon: Play, tint: "text-warning", track: "bg-warning/10", bar: "bg-warning", chip: "bg-warning/10 text-warning border-warning/20" },
  { status: "READY", label: "Siap", icon: Check, tint: "text-success", track: "bg-success/10", bar: "bg-success", chip: "bg-success/10 text-success border-success/20" },
] as const

export function KitchenDisplay({ orders: initialOrders }: { orders: KitchenOrder[] }) {
  const [orders, setOrders] = React.useState<KitchenOrder[]>(initialOrders)
  const [now, setNow] = React.useState<number>(0)

  React.useEffect(() => {
    setOrders(initialOrders)
  }, [initialOrders])

  React.useEffect(() => {
    setNow(Date.now())
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const refetch = React.useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, order_number, notes, created_at, status, order_type, table:restaurant_tables(number, name), items:order_items(id, product_name, quantity, notes, status, modifiers:order_item_modifiers(modifier_name, option_name))"
      )
      .in("status", ["NEW", "CONFIRMED", "PREPARING", "READY"])
      .order("created_at", { ascending: true })

    if (!error && data) {
      setOrders(
        (data as any[]).map((o) => ({
          id: o.id,
          order_number: o.order_number,
          notes: o.notes,
          created_at: o.created_at,
          order_type: o.order_type,
          table_number: o.table?.name || o.table?.number || "-",
          items: o.items ?? [],
        }))
      )
    }
  }, [])

  const refreshTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = React.useRef(false)

  React.useEffect(() => {
    const supabase = createClient()
    const schedule = () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = setTimeout(() => {
        if (pendingRef.current) {
          pendingRef.current = false
          refetch()
        }
      }, 1000)
    }
    const channel = supabase
      .channel("kds-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          pendingRef.current = true
          schedule()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    }
  }, [refetch])

  const timeAgo = (ts: string) => {
    if (!now) return "--:--"
    const diff = Math.floor((now - new Date(ts).getTime()) / 1000)
    const m = Math.floor(diff / 60)
    const s = diff % 60
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  const isLate = (ts: string) => {
    if (!now) return false
    const diff = (now - new Date(ts).getTime()) / 1000
    return diff > 600 // > 10 minutes
  }

  const handleItemStatus = async (itemId: string, orderId: string) => {
    const order = orders.find((o) => o.id === orderId)
    if (!order) return
    const item = order.items.find((i) => i.id === itemId)
    if (!item) return

    const next =
      item.status === "NEW" ? "PREPARING" : item.status === "PREPARING" ? "READY" : "SERVED"

    const result = await updateOrderItemStatus(itemId, next)
    if (result.error) {
      toast.error(result.error)
      return
    }

    // optimistic update
    setOrders((prev) =>
      prev
        .map((o) =>
          o.id === orderId
            ? {
                ...o,
                items: o.items.map((i) => (i.id === itemId ? { ...i, status: next } : i)),
              }
            : o
        )
        .filter((o) => o.items.some((i) => i.status !== "SERVED" && i.status !== "COMPLETED"))
    )
  }

  return (
    <div className="space-y-4 animate-brutal-slide-up">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight leading-none md:text-3xl">Layar Dapur</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">Pesanan langsung dari kasir</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="tabular font-mono text-sm font-bold">{format(now, "HH:mm:ss")}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {columns.map((col) => {
          const colOrders = orders.filter((o) => o.items.some((i) => i.status === col.status))
          const Icon = col.icon
          return (
            <div
              key={col.status}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
            >
              <div className="relative flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
                <span className={cn("flex items-center gap-2 text-xs font-bold uppercase tracking-wider", col.tint)}>
                  <Icon className="h-4 w-4" strokeWidth={2.5} />
                  {col.label}
                </span>
                <Badge variant="neutral" className={col.chip}>
                  {colOrders.length}
                </Badge>
                <span className={cn("absolute inset-x-0 bottom-0 h-0.5", col.bar)} />
              </div>

              <div className="space-y-3 p-3">
                {colOrders.map((order) => {
                  const orderItems = order.items.filter((i) => i.status === col.status)
                  const late = isLate(order.created_at)
                  return (
                    <div
                      key={order.id}
                      className={cn(
                        "rounded-xl border border-border bg-background/70 p-3 shadow-sm transition-shadow hover:shadow-md",
                        late && "border-destructive/40 ring-1 ring-destructive/30"
                      )}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand text-xs font-bold text-primary-foreground">
                            {order.table_number.slice(0, 2).toUpperCase()}
                          </span>
                          <div>
                            <p className="text-sm font-bold leading-none">{order.table_number}</p>
                            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{order.order_number}</p>
                          </div>
                        </div>
                        <Badge variant={late ? "destructive" : "neutral"} className={cn("tabular font-mono", !late && "bg-muted text-muted-foreground")}>
                          <Clock className="mr-1 h-3 w-3" />
                          {timeAgo(order.created_at)}
                        </Badge>
                      </div>

                      <div>
                        {orderItems.map((item) => (
                          <div key={item.id} className="border-t border-border/60 py-2 first:border-t-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold">
                                <span className="tabular mr-1 font-mono text-xs text-muted-foreground">{item.quantity}x</span>
                                {item.product_name}
                              </p>
                              <Button
                                size="sm"
                                variant={col.status === "NEW" ? "default" : col.status === "PREPARING" ? "secondary" : "outline"}
                                className="h-7 shrink-0 text-xs"
                                onClick={() => handleItemStatus(item.id, order.id)}
                              >
                                {item.status === "NEW" ? (
                                  <>
                                    <Play className="h-3 w-3" /> Mulai
                                  </>
                                ) : item.status === "PREPARING" ? (
                                  <>
                                    <Check className="h-3 w-3" /> Selesai
                                  </>
                                ) : (
                                  <>
                                    <Check className="h-3 w-3" /> Sajikan
                                  </>
                                )}
                              </Button>
                            </div>
                            {item.modifiers && item.modifiers.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {(item.modifiers ?? []).map((m, i) => (
                                  <span key={i} className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                                    {m.option_name}
                                  </span>
                                ))}
                              </div>
                            )}
                            {item.notes && (
                              <p className="mt-1.5 flex items-start gap-1.5 rounded-lg border border-warning/25 bg-warning/10 px-2 py-1 text-xs font-medium text-warning">
                                <MessageSquareWarning className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                {item.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>

                      {order.notes && (
                        <p className="mt-2 flex items-start gap-1.5 rounded-lg border border-warning/25 bg-warning/10 px-2 py-1 text-xs font-medium text-warning">
                          <MessageSquareWarning className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          {order.notes}
                        </p>
                      )}
                    </div>
                  )
                })}
                {colOrders.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-muted-foreground">
                    <ChefHat className="mb-2 h-8 w-8 text-muted-foreground/40" strokeWidth={2} />
                    <p className="text-xs font-medium">{col.label} — kosong</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}