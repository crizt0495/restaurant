import { requirePermission, getServerClient } from "@/lib/helpers"
import { format, subDays } from "date-fns"
import { SimpleReport } from "@/components/reports/simple-report"
import { formatCurrency } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function TaxReportPage({
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
    .select("order_number, created_at, tax_amount, total")
    .gte("created_at", fromDateTime)
    .lte("created_at", toDateTime)
    .not("status", "in", '("CANCELLED","REFUNDED")')

  const rows = (orders ?? []).map((o: any) => ({
    order_number: o.order_number,
    date: new Date(o.created_at).toISOString().slice(0, 10),
    tax_amount: formatCurrency(Number(o.tax_amount ?? 0)),
    total: formatCurrency(Number(o.total ?? 0)),
  }))

  const totalTax = (orders ?? []).reduce((s: number, o: any) => s + Number(o.tax_amount ?? 0), 0)
  const totalSales = (orders ?? []).reduce((s: number, o: any) => s + Number(o.total ?? 0), 0)

  return (
    <SimpleReport
      title="Tax Report"
      description="Pajak yang dikenakan pada penjualan periode"
      dateFrom={from}
      dateTo={to}
      columns={[
        { key: "order_number", label: "Order" },
        { key: "date", label: "Tanggal" },
        { key: "tax_amount", label: "Pajak" },
        { key: "total", label: "Total" },
      ]}
      rows={rows}
      summary={[
        { label: "Total Pajak", value: formatCurrency(totalTax) },
        { label: "Total Penjualan", value: formatCurrency(totalSales) },
      ]}
    />
  )
}