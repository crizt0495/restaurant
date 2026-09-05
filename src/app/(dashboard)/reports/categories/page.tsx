import { requirePermission, getServerClient } from "@/lib/helpers"
import { format, subDays } from "date-fns"
import { SimpleReport } from "@/components/reports/simple-report"
import { formatCurrency, formatNumber } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function CategoryReportPage({
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

  const { data: orderItems } = await supabase
    .from("order_items")
    .select("product_id, product_name, quantity, total, products!inner(category:categories(name)), orders!inner(status, created_at)")
    .gte("orders.created_at", fromDateTime)
    .lte("orders.created_at", toDateTime)
    .not("orders.status", "in", '("CANCELLED","REFUNDED")')

  const catMap = new Map<string, { category: string; qty: number; revenue: number }>()
  for (const oi of orderItems ?? []) {
    const catName = (oi as any).products?.category?.name || "Uncategorized"
    const existing = catMap.get(catName) ?? { category: catName, qty: 0, revenue: 0 }
    existing.qty += Number((oi as any).quantity ?? 0)
    existing.revenue += Number((oi as any).total ?? 0)
    catMap.set(catName, existing)
  }

  const sorted = Array.from(catMap.values()).sort((a, b) => b.revenue - a.revenue)

  const rows = sorted.map((c) => ({
    category: c.category,
    qty: formatNumber(c.qty),
    revenue: formatCurrency(c.revenue),
    avg_price: formatCurrency(c.qty > 0 ? c.revenue / c.qty : 0),
  }))

  const total = sorted.reduce((s, c) => s + c.revenue, 0)

  return (
    <SimpleReport
      title="Category Sales Report"
      description="Penjualan per kategori produk"
      dateFrom={from}
      dateTo={to}
      columns={[
        { key: "category", label: "Kategori" },
        { key: "qty", label: "Qty Terjual" },
        { key: "revenue", label: "Revenue" },
        { key: "avg_price", label: "Avg Price" },
      ]}
      rows={rows}
      summary={[{ label: "Total Revenue", value: formatCurrency(total) }]}
    />
  )
}