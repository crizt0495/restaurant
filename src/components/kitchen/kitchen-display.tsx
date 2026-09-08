"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { updateOrderItemStatus } from "@/lib/actions/index"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, ChefHat } from "lucide-react"
import toast from "react-hot-toast"
import { format } from "date-fns"

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
  { status: "NEW", label: "BARU", color: "bg-info text-info-foreground border-info" },
  { status: "PREPARING", label: "DIBUAT", color: "bg-warning text-warning-foreground border-warning" },
  { status: "READY", label: "SIAP", color: "bg-success text-success-foreground border-success" },
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl font-black uppercase tracking-tighter leading-none">Tampilan Dapur</h2>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Pesanan langsung dari kasir</p>
        </div>
        <div className="border-3 border-foreground shadow-[4px_4px_0_0_hsl(var(--accent))] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-150 flex items-center gap-2 bg-foreground text-background px-4 py-2 text-sm font-black">
          <Clock className="h-4 w-4" strokeWidth={3} />
          {format(now, "HH:mm:ss")}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {columns.map((col) => (
          <div key={col.status} className={`brutal-card ${col.color}`}>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider">{col.label}</span>
            </div>
            <div className="space-y-3">
              {orders
                .filter((o) => o.items.some((i) => i.status === col.status))
                .map((order) => {
                  const orderItems = order.items.filter((i) => i.status === col.status)
                  return (
                    <div
                      key={order.id}
                      className={`brutal-sm bg-background p-3 ${isLate(order.created_at) ? "ring-2 ring-destructive" : ""}`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-display text-base font-black">{order.table_number}</span>
                        <Badge variant={isLate(order.created_at) ? "destructive" : "secondary"}>
                          {timeAgo(order.created_at)}
                        </Badge>
                      </div>
                      <div>
                        {orderItems.map((item) => (
                          <div key={item.id} className="border-t-2 border-border py-1.5 first:border-t-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-bold">{item.quantity}x {item.product_name}</p>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="brutal-tag h-7 shrink-0 font-black"
                                onClick={() => handleItemStatus(item.id, order.id)}
                              >
                                {item.status === "NEW" ? "MULAI" : item.status === "PREPARING" ? "SELESAI" : "SAJIKAN"}
                              </Button>
                            </div>
                            {item.modifiers && item.modifiers.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {(item.modifiers ?? []).map((m, i) => (
                                  <span key={i} className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 border-2 border-border">
                                    {m.option_name}
                                  </span>
                                ))}
                              </div>
                            )}
                            {item.notes && (
                              <p className="mt-1 text-xs font-bold text-warning bg-warning/10 px-2 py-1 border-2 border-warning">
                                📝 {item.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                      {order.notes && (
                        <p className="mt-2 text-xs font-bold text-warning bg-warning/10 px-2 py-1 border-2 border-warning">📝 {order.notes}</p>
                      )}
                    </div>
                  )
                })}
              {orders.filter((o) => o.items.some((i) => i.status === col.status)).length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <ChefHat className="mb-2 h-10 w-10" strokeWidth={2} />
                  <p className="text-xs font-bold uppercase tracking-wider">Tidak ada pesanan</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}