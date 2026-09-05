import { requirePermission } from "@/lib/helpers"
import { getServerClient } from "@/lib/helpers"
import { SalesReport } from "@/components/reports/sales-report"
import { format, subDays } from "date-fns"

export const dynamic = "force-dynamic"

export default async function SalesReportPage({
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
    .select("*, payments(*), items:order_items(*)")
    .gte("created_at", fromDateTime)
    .lte("created_at", toDateTime)
    .not("status", "in", '("CANCELLED","REFUNDED")')

  const validOrders = orders ?? []

  const totalSales = validOrders.reduce((sum, o) => sum + Number(o.total ?? 0), 0)
  const orderCount = validOrders.length
  const totalItems = validOrders.reduce(
    (sum, o) =>
      sum +
      ((o as typeof o & { items?: { quantity?: number }[] }).items ?? []).reduce(
        (s: number, i: { quantity?: number }) => s + Number(i.quantity ?? 0),
        0
      ),
    0
  )
  const avgOrder = orderCount > 0 ? totalSales / orderCount : 0

  const dayMap = new Map<
    string,
    { date: string; orders: number; revenue: number }
  >()
  const paymentMap = new Map<string, number>()

  for (const o of validOrders) {
    const dateKey = new Date(o.created_at).toISOString().slice(0, 10)
    const existing = dayMap.get(dateKey) ?? {
      date: dateKey,
      orders: 0,
      revenue: 0,
    }
    existing.orders += 1
    existing.revenue += Number(o.total ?? 0)
    dayMap.set(dateKey, existing)

    for (const p of o.payments ?? []) {
      const method = (p as { method?: string }).method ?? "UNKNOWN"
      paymentMap.set(method, (paymentMap.get(method) ?? 0) + Number((p as { amount?: number }).amount ?? 0))
    }
  }

  const dailySales = Array.from(dayMap.values()).sort((a, b) =>
    b.date.localeCompare(a.date)
  )
  const paymentBreakdown = Array.from(paymentMap.entries()).map(
    ([method, amount]) => ({ method, amount })
  )

  return (
    <SalesReport
      summary={{
        totalSales,
        orderCount,
        totalItems,
        avgOrder,
        dateFrom: from,
        dateTo: to,
      }}
      dailySales={dailySales}
      paymentBreakdown={paymentBreakdown}
    />
  )
}
