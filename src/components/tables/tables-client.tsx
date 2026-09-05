"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import toast from "react-hot-toast"
import { Users, RefreshCw } from "lucide-react"
import Link from "next/link"

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
  AVAILABLE: { variant: "success", label: "Available" },
  OCCUPIED: { variant: "warning", label: "Occupied" },
  RESERVED: { variant: "info", label: "Reserved" },
  WAITING_PAYMENT: { variant: "warning", label: "Waiting Payment" },
  CLEANING: { variant: "info", label: "Cleaning" },
  OUT_OF_SERVICE: { variant: "destructive", label: "Out of Service" },
}

const STATUS_COLOR: Record<string, string> = {
  AVAILABLE: "border-emerald-300 bg-emerald-50",
  OCCUPIED: "border-amber-300 bg-amber-50",
  RESERVED: "border-sky-300 bg-sky-50",
  WAITING_PAYMENT: "border-orange-300 bg-orange-50",
  CLEANING: "border-blue-300 bg-blue-50",
  OUT_OF_SERVICE: "border-red-300 bg-red-50",
}

export function TablesClient({ tables: initialTables }: { tables: TableItem[] }) {
  const [tables, setTables] = React.useState(initialTables)

  React.useEffect(() => {
    setTables(initialTables)
  }, [initialTables])

  React.useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel("tables-status")
      .on("postgres_changes", { event: "*", schema: "public", table: "restaurant_tables" }, () => {
        window.location.reload()
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tables</h2>
          <p className="text-sm text-muted-foreground">Floor plan dan manajemen meja</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tables.map((table) => {
          const style = STATUS_STYLE[table.status] || STATUS_STYLE.AVAILABLE
          const color = STATUS_COLOR[table.status] || STATUS_COLOR.AVAILABLE
          const activeOrder = table.active_orders?.find(
            (o) => o.status === "NEW" || o.status === "CONFIRMED" || o.status === "PREPARING" || o.status === "READY"
          )
          return (
            <Card key={table.id} className={`border-2 ${color}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-bold">{table.name || table.number}</p>
                    <p className="text-sm text-muted-foreground">
                      {table.area?.name || "No area"} · Cap. {table.capacity}
                    </p>
                  </div>
                  <Badge variant={style.variant}>{style.label}</Badge>
                </div>

                {activeOrder ? (
                  <div className="mt-3 rounded-md bg-muted p-3">
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(activeOrder.created_at)}
                    </p>
                    <p className="text-sm font-medium">
                      Order <Link href={`/orders/${activeOrder.id}`} className="text-primary underline">{activeOrder.order_number}</Link>
                    </p>
                    <p className="mt-1 text-sm font-bold">{formatCurrency(activeOrder.total)}</p>
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => markClear(table.id)}>
                        Bersihkan
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center justify-center py-4 text-muted-foreground">
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