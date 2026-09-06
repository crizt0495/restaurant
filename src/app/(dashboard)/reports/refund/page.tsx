import { requirePermission, getServerClient } from "@/lib/helpers"
import { format, subDays } from "date-fns"
import { SimpleReport } from "@/components/reports/simple-report"
import { formatCurrency } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function RefundReportPage({
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

  const { data: refunds } = await supabase
    .from("refunds")
    .select("*, orders(order_number), profiles(full_name)")
    .gte("created_at", fromDateTime)
    .lte("created_at", toDateTime)
    .order("created_at", { ascending: false })

  const rows = (refunds ?? []).map((r: any) => ({
    date: new Date(r.created_at).toISOString().slice(0, 10),
    order_number: r.orders?.order_number || "-",
    amount: formatCurrency(Number(r.amount ?? 0)),
    method: r.refund_method || "-",
    reason: r.reason || "-",
    refunded_by: r.profiles?.full_name || "-",
  }))

  const total = (refunds ?? []).reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0)

  return (
    <SimpleReport
      title="Laporan Pengembalian"
      description="Rincian pengembalian periode"
      dateFrom={from}
      dateTo={to}
      columns={[
        { key: "date", label: "Tanggal" },
        { key: "order_number", label: "Pesanan" },
        { key: "amount", label: "Jumlah" },
        { key: "method", label: "Metode" },
        { key: "reason", label: "Alasan" },
        { key: "refunded_by", label: "Oleh" },
      ]}
      rows={rows}
      summary={[{ label: "Total Pengembalian", value: formatCurrency(total) }]}
    />
  )
}