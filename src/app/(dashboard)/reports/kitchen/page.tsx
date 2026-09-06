import { requirePermission, getServerClient } from "@/lib/helpers"
import { format, subDays } from "date-fns"
import { SimpleReport } from "@/components/reports/simple-report"
import { formatDate } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function KitchenReportPage({
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
    .select("order_number, created_at, updated_at, status, table:restaurant_tables(name, number)")
    .gte("created_at", fromDateTime)
    .lte("created_at", toDateTime)
    .in("status", ["PREPARING", "READY", "SERVED", "COMPLETED"])

  let totalPrepSeconds = 0
  let prepCount = 0
  const rows = []

  for (const o of orders ?? []) {
    const created = new Date((o as any).created_at).getTime()
    const updated = new Date((o as any).updated_at).getTime()
    const prepSeconds = Math.max(0, Math.floor((updated - created) / 1000))
    totalPrepSeconds += prepSeconds
    prepCount += 1

    const tableName = (o as any).table?.name || (o as any).table?.number || "-"
    const minutes = Math.floor(prepSeconds / 60)
    const secs = prepSeconds % 60

    rows.push({
      order_number: (o as any).order_number,
      date: formatDate((o as any).created_at),
      table: tableName,
      status: (o as any).status,
      prep_time: `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`,
    })
  }

  const avgPrep = prepCount > 0 ? Math.floor(totalPrepSeconds / prepCount) : 0
  const avgMinutes = Math.floor(avgPrep / 60)
  const avgSecs = avgPrep % 60

  return (
    <SimpleReport
      title="Laporan Kinerja Dapur"
      description="Waktu persiapan pesanan di dapur"
      dateFrom={from}
      dateTo={to}
      columns={[
        { key: "order_number", label: "Pesanan" },
        { key: "date", label: "Tanggal" },
        { key: "table", label: "Meja" },
        { key: "status", label: "Status" },
        { key: "prep_time", label: "Waktu Persiapan" },
      ]}
      rows={rows}
      summary={[
        { label: "Total Pesanan", value: String(orders?.length ?? 0) },
        { label: "Rata-rata Persiapan", value: `${avgMinutes}m ${avgSecs}s` },
      ]}
    />
  )
}