import { requirePermission, getServerClient } from "@/lib/helpers"
import { format, subDays } from "date-fns"
import { SimpleReport } from "@/components/reports/simple-report"
import { formatCurrency } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function CashierReportPage({
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
    .select("total, status, created_at, cashier_id, profiles!orders_cashier_id_fkey(full_name, username)")
    .not("cashier_id", "is", null)
    .gte("created_at", fromDateTime)
    .lte("created_at", toDateTime)
    .not("status", "in", '("CANCELLED","REFUNDED")')

  const cashierMap = new Map<string, { name: string; orders: number; revenue: number }>()
  for (const o of orders ?? []) {
    const prof = (o as any).profiles
    const name = prof?.full_name || "Unknown"
    const existing = cashierMap.get(name) ?? { name, orders: 0, revenue: 0 }
    existing.orders += 1
    existing.revenue += Number((o as any).total ?? 0)
    cashierMap.set(name, existing)
  }

  const sorted = Array.from(cashierMap.values()).sort((a, b) => b.revenue - a.revenue)

  const rows = sorted.map((c) => ({
    cashier: c.name,
    orders: String(c.orders),
    revenue: formatCurrency(c.revenue),
    avg_order: formatCurrency(c.orders > 0 ? c.revenue / c.orders : 0),
  }))

  const total = sorted.reduce((s, c) => s + c.revenue, 0)

  return (
    <SimpleReport
      title="Cashier Report"
      description="Performa kasir per periode"
      dateFrom={from}
      dateTo={to}
      columns={[
        { key: "cashier", label: "Cashier" },
        { key: "orders", label: "Total Orders" },
        { key: "revenue", label: "Revenue" },
        { key: "avg_order", label: "Avg Order" },
      ]}
      rows={rows}
      summary={[{ label: "Total Revenue", value: formatCurrency(total) }]}
    />
  )
}