import { requirePermission, getServerClient } from "@/lib/helpers"
import { format, subDays } from "date-fns"
import { SimpleReport } from "@/components/reports/simple-report"
import { formatCurrency } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function BranchReportPage({
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
    .select("total, status, created_at, branch:branches(name)")
    .gte("created_at", fromDateTime)
    .lte("created_at", toDateTime)
    .not("status", "in", '("CANCELLED","REFUNDED")')

  const branchMap = new Map<string, { name: string; orders: number; revenue: number }>()
  for (const o of orders ?? []) {
    const branchName = (o as any).branch?.name || "Unknown"
    const existing = branchMap.get(branchName) ?? { name: branchName, orders: 0, revenue: 0 }
    existing.orders += 1
    existing.revenue += Number((o as any).total ?? 0)
    branchMap.set(branchName, existing)
  }

  const sortedBranches = Array.from(branchMap.values()).sort((a, b) => b.revenue - a.revenue)

  const rows = sortedBranches.map((b) => ({
    branch: b.name,
    orders: String(b.orders),
    revenue: formatCurrency(b.revenue),
    avg_order: formatCurrency(b.orders > 0 ? b.revenue / b.orders : 0),
  }))

  const totalRevenue = sortedBranches.reduce((s, b) => s + b.revenue, 0)

  return (
    <SimpleReport
      title="Branch Sales Report"
      description="Performa penjualan per cabang"
      dateFrom={from}
      dateTo={to}
      columns={[
        { key: "branch", label: "Cabang" },
        { key: "orders", label: "Total Orders" },
        { key: "revenue", label: "Revenue" },
        { key: "avg_order", label: "Avg Order" },
      ]}
      rows={rows}
      summary={[{ label: "Total Revenue", value: formatCurrency(totalRevenue) }]}
    />
  )
}