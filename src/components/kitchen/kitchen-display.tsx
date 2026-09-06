"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { updateOrderItemStatus } from "@/lib/actions/index"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, ChefHat } from "lucide-react"
import toast from "react-hot-toast"

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

  async function refetch() {
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
  }

  React.useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel("kds-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          refetch()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
     
  }, [])

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

  // Columns: NEW, PREPARING, READY
  const columns = [
    { status: "NEW", label: "Baru", color: "bg-sky-50" },
    { status: "PREPARING", label: "Dibuat", color: "bg-amber-50" },
    { status: "READY", label: "Siap", color: "bg-emerald-50" },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
        <h2 className="text-2xl font-bold">Tampilan Dapur</h2>
        <p className="text-sm text-muted-foreground">Pesanan langsung dari kasir</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          {new Date(now).toLocaleTimeString("id-ID")}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {columns.map((col) => (
          <div key={col.status} className={`rounded-xl border p-3 ${col.color}`}>
            <h3 className="mb-3 text-sm font-semibold">{col.label}</h3>
            <div className="space-y-3">
              {orders
                .filter((o) => o.items.some((i) => i.status === col.status))
                .map((order) => {
                  const orderItems = order.items.filter((i) => i.status === col.status)
                  return (
                    <div
                      key={order.id}
                      className={`rounded-lg border bg-background p-3 shadow-sm ${isLate(order.created_at) ? "ring-2 ring-red-400" : ""}`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-bold">{order.table_number}</span>
                        <Badge variant={isLate(order.created_at) ? "destructive" : "secondary"}>
                          {timeAgo(order.created_at)}
                        </Badge>
                      </div>
                      <div>
                        {orderItems.map((item) => (
                          <div key={item.id} className="border-t py-1.5 first:border-t-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium">
                                {item.quantity}x {item.product_name}
                              </p>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 shrink-0"
                                onClick={() => handleItemStatus(item.id, order.id)}
                              >
                                {item.status === "NEW" ? "Mulai" : item.status === "PREPARING" ? "Selesai" : "Sajikan"}
                              </Button>
                            </div>
                            {item.modifiers && item.modifiers.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {(item.modifiers ?? []).map((m, i) => (
                                  <span key={i} className="text-[10px] text-muted-foreground">
                                    {m.option_name}
                                  </span>
                                ))}
                              </div>
                            )}
                            {item.notes && (
                              <p className="mt-1 text-xs text-amber-600">📝 {item.notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                      {order.notes && (
                        <p className="mt-2 text-xs text-amber-600">📝 {order.notes}</p>
                      )}
                    </div>
                  )
                })}
              {orders.filter((o) => o.items.some((i) => i.status === col.status)).length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <ChefHat className="mb-2 h-8 w-8" />
                  <p className="text-sm">Tidak ada pesanan</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}