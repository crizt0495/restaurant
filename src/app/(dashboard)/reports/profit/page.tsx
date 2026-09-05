import { requirePermission, getServerClient } from "@/lib/helpers"
import { ProfitReport } from "@/components/reports/profit-report"
import { format, subDays } from "date-fns"

export const dynamic = "force-dynamic"

export default async function ProfitReportPage({
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
    .select("*, items:order_items(product_id, quantity, unit_price, discount)")
    .gte("created_at", fromDateTime)
    .lte("created_at", toDateTime)
    .not("status", "in", '("CANCELLED","REFUNDED")')

  const validOrders = orders ?? []
  const revenue = validOrders.reduce((sum, o) => sum + Number(o.total ?? 0), 0)
  const itemsDiscount = validOrders.reduce((sum, o) => sum + Number(o.discount ?? 0), 0)

  const allItems: { product_id: string; quantity: number }[] = []
  for (const o of validOrders) {
    for (const item of (o as typeof o & { items?: { product_id?: string; quantity?: number }[] }).items ?? []) {
      allItems.push({ product_id: item.product_id ?? "", quantity: Number(item.quantity ?? 0) })
    }
  }

  let cogs = 0
  if (allItems.length > 0) {
    const productIds = [...new Set(allItems.map((i) => i.product_id))]
    const { data: products } = await supabase
      .from("products")
      .select("id, cost_price")
      .in("id", productIds)

    const costMap = new Map<string, number>()
    for (const p of products ?? []) {
      costMap.set(p.id, Number(p.cost_price ?? 0))
    }

    for (const item of allItems) {
      cogs += (costMap.get(item.product_id) ?? 0) * item.quantity
    }
  }

  const { data: expenses } = await supabase
    .from("expenses")
    .select("amount")
    .gte("expense_date", from)
    .lte("expense_date", to)

  const operatingExpenses = (expenses ?? []).reduce(
    (sum, e) => sum + Number(e.amount ?? 0),
    0
  )

  const grossProfit = revenue - cogs - itemsDiscount
  const netProfit = grossProfit - operatingExpenses
  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0
  const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0

  return (
    <ProfitReport
      summary={{
        revenue,
        cogs,
        itemsDiscount,
        grossProfit,
        operatingExpenses,
        netProfit,
        grossMargin,
        netMargin,
        dateFrom: from,
        dateTo: to,
      }}
    />
  )
}
