import { requirePermission, getServerClient } from "@/lib/helpers"
import { format, subDays } from "date-fns"
import { SimpleReport } from "@/components/reports/simple-report"
import { formatCurrency, formatNumber } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function DiscountReportPage({
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
    .select("order_number, created_at, discount, total, profiles(full_name)")
    .gte("created_at", fromDateTime)
    .lte("created_at", toDateTime)
    .gt("discount", 0)
    .order("created_at", { ascending: false })

  const rows = (orders ?? []).map((o: any) => ({
    order_number: o.order_number,
    date: new Date(o.created_at).toISOString().slice(0, 10),
    discount: formatCurrency(Number(o.discount ?? 0)),
    total: formatCurrency(Number(o.total ?? 0)),
    cashier: o.profiles?.full_name || "-",
  }))

  const total = (orders ?? []).reduce((s: number, o: any) => s + Number(o.discount ?? 0), 0)

  return (
    <SimpleReport
      title="Laporan Diskon"
      description="Order yang diberikan diskon"
      dateFrom={from}
      dateTo={to}
      columns={[
        { key: "order_number", label: "Order" },
        { key: "date", label: "Tanggal" },
        { key: "discount", label: "Diskon" },
        { key: "total", label: "Total Setelah" },
        { key: "cashier", label: "Kasir" },
      ]}
      rows={rows}
      summary={[
        { label: "Total Diskon", value: formatCurrency(total) },
        { label: "Jumlah Pesanan", value: formatNumber(orders?.length ?? 0) },
      ]}
    />
  )
}