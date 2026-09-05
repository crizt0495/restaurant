import { requirePermission, getServerClient } from "@/lib/helpers"
import { format, subDays } from "date-fns"
import { SimpleReport } from "@/components/reports/simple-report"
import { formatCurrency, formatNumber } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function StockOpnameReportPage({
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

  const { data: opnames } = await supabase
    .from("stock_opnames")
    .select("*, warehouse:warehouses(name), branch:branches(name)")
    .gte("created_at", fromDateTime)
    .lte("created_at", toDateTime)
    .order("created_at", { ascending: false })

  const rows = (opnames ?? []).map((o: any) => ({
    opname_number: o.opname_number,
    date: new Date(o.created_at).toISOString().slice(0, 10),
    warehouse: o.warehouse?.name || "-",
    branch: o.branch?.name || "-",
    status: o.status,
    total_diff: formatCurrency(Number(o.total_difference_value ?? 0)),
  }))

  const totalDiff = (opnames ?? []).reduce((s, o: any) => s + Number(o.total_difference_value ?? 0), 0)
  const adjusted = (opnames ?? []).filter((o: any) => o.status === "APPROVED").length

  return (
    <SimpleReport
      title="Stock Opname Report"
      description="Hasil stock opname periode"
      dateFrom={from}
      dateTo={to}
      columns={[
        { key: "opname_number", label: "No. Opname" },
        { key: "date", label: "Tanggal" },
        { key: "warehouse", label: "Gudang" },
        { key: "branch", label: "Cabang" },
        { key: "status", label: "Status" },
        { key: "total_diff", label: "Nilai Selisih" },
      ]}
      rows={rows}
      summary={[
        { label: "Total Opname", value: formatNumber(opnames?.length ?? 0) },
        { label: "Approved", value: formatNumber(adjusted) },
        { label: "Total Selisih", value: formatCurrency(totalDiff) },
      ]}
    />
  )
}