import { requirePermission, getServerClient } from "@/lib/helpers"
import { format, subDays } from "date-fns"
import { SimpleReport } from "@/components/reports/simple-report"
import { formatCurrency } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function WaiterReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  await requirePermission("reports.view")
  const params = await searchParams
  const supabase = await getServerClient()

  const now = new Date()
  const to = params.to || format(now, "yyyy-MM-dd")
  const from = params.from || format(subDays(now, 30), "yyyy-MM-dd")

  const fromDateTime = `${from}T00:00:00.000Z`
  const toDateTime = `${to}T23:59:59.999Z`

  const { data: orders } = await supabase
    .from("orders")
    .select("total, status, created_at, waiter:profiles!orders_waiter_id_fkey(full_name, username)")
    .not("waiter_id", "is", null)
    .gte("created_at", fromDateTime)
    .lte("created_at", toDateTime)
    .not("status", "in", '("CANCELLED","REFUNDED")')

  const waiterMap = new Map<string, { name: string; orders: number; revenue: number }>()
  for (const o of orders ?? []) {
    const name = (o as any).waiter?.full_name || "Unknown"
    const existing = waiterMap.get(name) ?? { name, orders: 0, revenue: 0 }
    existing.orders += 1
    existing.revenue += Number((o as any).total ?? 0)
    waiterMap.set(name, existing)
  }

  const sorted = Array.from(waiterMap.values()).sort((a, b) => b.revenue - a.revenue)

  const rows = sorted.map((w) => ({
    waiter: w.name,
    orders: String(w.orders),
    revenue: formatCurrency(w.revenue),
    avg_order: formatCurrency(w.orders > 0 ? w.revenue / w.orders : 0),
  }))

  const total = sorted.reduce((s, w) => s + w.revenue, 0)

  return (
    <SimpleReport
      title="Waiter Sales Report"
      description="Performa waiter per periode"
      dateFrom={from}
      dateTo={to}
      columns={[
        { key: "waiter", label: "Waiter" },
        { key: "orders", label: "Total Orders" },
        { key: "revenue", label: "Revenue" },
        { key: "avg_order", label: "Avg Order" },
      ]}
      rows={rows}
      summary={[{ label: "Total Revenue", value: formatCurrency(total) }]}
    />
  )
}