"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import toast from "react-hot-toast"
import { Users, RefreshCw, UtensilsCrossed, CircleCheck, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface TableItem {
  id: string
  number: string
  name?: string
  capacity: number
  status: string
  area?: { name: string } | null
  active_orders?: any[]
}

const STATUS_STYLE: Record<string, { variant: "success" | "warning" | "info" | "destructive" | "neutral"; label: string }> = {
  AVAILABLE: { variant: "success", label: "Tersedia" },
  OCCUPIED: { variant: "warning", label: "Terisi" },
  RESERVED: { variant: "info", label: "Dipesan" },
  WAITING_PAYMENT: { variant: "warning", label: "Menunggu Pembayaran" },
  CLEANING: { variant: "info", label: "Dibersihkan" },
  OUT_OF_SERVICE: { variant: "destructive", label: "Tidak Beroperasi" },
}

const STATUS_TINT: Record<string, { tile: string; bar: string; border: string }> = {
  AVAILABLE: { tile: "bg-success/10 text-success", bar: "bg-success", border: "hover:border-success/40" },
  OCCUPIED: { tile: "bg-warning/10 text-warning", bar: "bg-warning", border: "hover:border-warning/40" },
  RESERVED: { tile: "bg-info/10 text-info", bar: "bg-info", border: "hover:border-info/40" },
  WAITING_PAYMENT: { tile: "bg-accent/10 text-accent", bar: "bg-accent", border: "hover:border-accent/40" },
  CLEANING: { tile: "bg-info/10 text-info", bar: "bg-info", border: "hover:border-info/40" },
  OUT_OF_SERVICE: { tile: "bg-destructive/10 text-destructive", bar: "bg-destructive", border: "hover:border-destructive/40" },
}

export function TablesClient({ tables: initialTables }: { tables: TableItem[] }) {
  const [tables, setTables] = React.useState(initialTables)
  const refreshTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = React.useRef(false)

  React.useEffect(() => {
    setTables(initialTables)
  }, [initialTables])

  const refetch = React.useCallback(async () => {
    const { data } = await createClient()
      .from("restaurant_tables")
      .select("*, area:table_areas(*), active_orders:orders(*)")
      .order("number")
    if (data) setTables(data)
  }, [])

  React.useEffect(() => {
    const supabase = createClient()
    const schedule = () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = setTimeout(() => {
        if (pendingRef.current) {
          pendingRef.current = false
          refetch()
        }
      }, 1500)
    }
    const channel = supabase
      .channel("tables-status")
      .on("postgres_changes", { event: "*", schema: "public", table: "restaurant_tables" }, () => {
        pendingRef.current = true
        schedule()
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        pendingRef.current = true
        schedule()
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    }
  }, [refetch])

  const markClear = async (tableId: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("restaurant_tables")
      .update({ status: "AVAILABLE" })
      .eq("id", tableId)
    if (error) toast.error(error.message)
    else toast.success("Meja tersedia kembali")
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight leading-none md:text-3xl">Meja</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">Denah lantai dan manajemen meja</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Segarkan
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tables.map((table) => {
          const style = STATUS_STYLE[table.status] || STATUS_STYLE.AVAILABLE
          const tint = STATUS_TINT[table.status] || STATUS_TINT.AVAILABLE
          const activeOrder = table.active_orders?.find(
            (o) => o.status === "NEW" || o.status === "CONFIRMED" || o.status === "PREPARING" || o.status === "READY"
          )
          return (
            <Card key={table.id} className={cn("card-hover relative overflow-hidden", tint.border)}>
              <span className={cn("absolute inset-x-0 top-0 h-1", tint.bar)} />
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", tint.tile)}>
                      <UtensilsCrossed className="h-5 w-5" strokeWidth={2.25} />
                    </div>
                    <div>
                      <p className="font-display text-lg font-bold leading-none">{table.name || table.number}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {table.area?.name || "Tanpa area"} · Kap. {table.capacity}
                      </p>
                    </div>
                  </div>
                  <Badge variant={style.variant}>{style.label}</Badge>
                </div>

                {activeOrder ? (
                  <div className="mt-3 rounded-xl border border-border bg-background/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">{formatDateTime(activeOrder.created_at)}</p>
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <p className="mt-1 text-sm font-medium">
                      Pesanan{" "}
                      <Link href={`/orders/${activeOrder.id}`} className="font-semibold text-primary underline-offset-2 hover:underline">
                        {activeOrder.order_number}
                      </Link>
                    </p>
                    <p className="tabular mt-1 font-mono text-base font-bold">{formatCurrency(activeOrder.total)}</p>
                    <Button size="sm" variant="outline" className="mt-2 h-7 text-xs" onClick={() => markClear(table.id)}>
                      <CircleCheck className="mr-1.5 h-3.5 w-3.5 text-success" /> Bersihkan Meja
                    </Button>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center justify-center rounded-xl border border-dashed border-border py-4 text-muted-foreground">
                    <Users className="mr-2 h-4 w-4" />
                    <span className="text-sm">Kosong</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}