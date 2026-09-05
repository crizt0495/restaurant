import { requirePermission, getServerClient } from "@/lib/helpers"
import { ProductsReport } from "@/components/reports/products-report"
import { format, subDays } from "date-fns"

export const dynamic = "force-dynamic"

export default async function ProductsReportPage({
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
    .select("product_id, product_name, quantity, unit_price, total, orders!inner(status, created_at)")
    .gte("orders.created_at", fromDateTime)
    .lte("orders.created_at", toDateTime)
    .not("orders.status", "in", '("CANCELLED","REFUNDED")')

  const productMap = new Map<
    string,
    { product_id: string; product_name: string; qty_sold: number; revenue: number; unit: string }
  >()

  for (const oi of orderItems ?? []) {
    const pid = (oi as { product_id?: string }).product_id ?? ""
    const existing = productMap.get(pid) ?? {
      product_id: pid,
      product_name: (oi as { product_name?: string }).product_name ?? "",
      qty_sold: 0,
      revenue: 0,
      unit: "pcs",
    }
    existing.qty_sold += Number((oi as { quantity?: number }).quantity ?? 0)
    existing.revenue += Number((oi as { total?: number }).total ?? 0)
    productMap.set(pid, existing)
  }

  const products = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue)

  return (
    <ProductsReport products={products} dateFrom={from} dateTo={to} />
  )
}
