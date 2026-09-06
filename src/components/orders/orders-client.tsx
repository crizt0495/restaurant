"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { updateOrderStatus, cancelOrder } from "@/lib/actions/index"
import toast from "react-hot-toast"
import { Search, RefreshCw, Eye } from "lucide-react"

const ORDER_STATUS = [
  "NEW", "CONFIRMED", "PREPARING", "READY", "SERVED", "COMPLETED", "CANCELLED", "REFUNDED",
] as const

const STATUS_VARIANT: Record<string, "default" | "info" | "warning" | "success" | "destructive" | "neutral"> = {
  NEW: "info",
  CONFIRMED: "info",
  PREPARING: "warning",
  READY: "warning",
  SERVED: "success",
  COMPLETED: "success",
  CANCELLED: "destructive",
  REFUNDED: "destructive",
}

const STATUS_FLOW = ["NEW", "CONFIRMED", "PREPARING", "READY", "SERVED", "COMPLETED"]
const CANCELLABLE = ["NEW", "CONFIRMED", "PREPARING", "READY", "SERVED"]

interface OrdersClientProps {
  orders: any[]
}

export function OrdersClient({ orders: initialOrders }: OrdersClientProps) {
  const [orders, setOrders] = React.useState(initialOrders)
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("")
  const [confirmAction, setConfirmAction] = React.useState<{ order: any; action: string } | null>(null)

  const refetchTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = React.useRef(false)

  React.useEffect(() => {
    setOrders(initialOrders)
  }, [initialOrders])

  const refetch = React.useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("orders")
      .select("*, table:restaurant_tables(*)")
      .order("created_at", { ascending: false })
    if (data) setOrders(data)
  }, [])

  React.useEffect(() => {
    const supabase = createClient()
    const schedule = () => {
      if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current)
      refetchTimerRef.current = setTimeout(() => {
        if (pendingRef.current) {
          pendingRef.current = false
          refetch()
        }
      }, 1500)
    }
    const channel = supabase
      .channel("orders-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        pendingRef.current = true
        schedule()
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
      if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current)
    }
  }, [refetch])

  const filtered = orders.filter((o) => {
    const matchesSearch =
      !search ||
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      (o.table?.number || "").toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !statusFilter || o.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleAction = async () => {
    if (!confirmAction) return
    const { order, action } = confirmAction
    let result
    if (action === "CANCELLED") {
      result = await cancelOrder(order.id)
    } else {
      result = await updateOrderStatus(order.id, action)
    }
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Status order diperbarui")
      setConfirmAction(null)
      await refetch()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pesanan</h2>
          <p className="text-sm text-muted-foreground">Kelola semua pesanan</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Segarkan
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari nomor pesanan atau meja..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Semua status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Semua status</SelectItem>
            {ORDER_STATUS.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>Belum ada pesanan</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <Card key={order.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{order.order_number}</p>
                    <Badge variant={STATUS_VARIANT[order.status] || "neutral"}>{order.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {order.order_type} {order.table ? `· ${order.table.name || order.table.number}` : ""} · {formatDateTime(order.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-bold">{formatCurrency(order.total)}</p>
                  {STATUS_FLOW.includes(order.status) && STATUS_FLOW.indexOf(order.status) < STATUS_FLOW.length - 1 && (
                    <Select
                      value=""
                      onValueChange={(next) => setConfirmAction({ order, action: next })}
                    >
                      <SelectTrigger className="h-8 w-32 text-xs">
                        <SelectValue placeholder="Ubah status" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_FLOW.slice(STATUS_FLOW.indexOf(order.status) + 1).map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {CANCELLABLE.includes(order.status) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmAction({ order, action: "CANCELLED" })}
                    >
                      Batal
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setConfirmAction(null)} asChild>
                    <a href={`/orders/${order.id}`}>
                      <Eye className="mr-1 h-3 w-3" /> Detail
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Tindakan</DialogTitle>
          </DialogHeader>
          <p className="text-sm">
            Apakah anda yakin mengubah status order <b>{confirmAction?.order?.order_number}</b> menjadi{" "}
            <b>{confirmAction?.action}</b>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>Batal</Button>
            <Button variant={confirmAction?.action === "CANCELLED" ? "destructive" : "default"} onClick={handleAction}>
              Konfirmasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}