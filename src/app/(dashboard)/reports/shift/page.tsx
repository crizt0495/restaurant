import { requirePermission } from "@/lib/helpers"
import { getServerClient } from "@/lib/helpers"
import { format, subDays } from "date-fns"
import { SimpleReport } from "@/components/reports/simple-report"
import { formatCurrency } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function ShiftReportPage({
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

  const { data: shifts } = await supabase
    .from("cashier_shifts")
    .select("*, user:profiles!cashier_shifts_user_id_fkey(full_name, username), branch:branches(name)")
    .gte("opening_time", `${from}T00:00:00`)
    .lte("opening_time", `${to}T23:59:59`)
    .eq("status", "CLOSED")
    .order("opening_time", { ascending: false })

  const rows = (shifts ?? []).map((s: any) => ({
    cashier: s.user?.full_name || "-",
    branch: s.branch?.name || "-",
    opening: formatCurrency(Number(s.opening_cash)),
    cash_sales: formatCurrency(Number(s.cash_sales ?? 0)),
    expected: formatCurrency(Number(s.expected_cash ?? 0)),
    actual: s.actual_cash != null ? formatCurrency(Number(s.actual_cash)) : "-",
    difference: s.difference != null
      ? `${Number(s.difference) >= 0 ? "+" : ""}${formatCurrency(Number(s.difference))}`
      : "-",
    status: Number(s.difference ?? 0) === 0 ? "Match" : Number(s.difference) > 0 ? "OVER" : "SHORT",
  }))

  const matched = (shifts ?? []).filter((s: any) => Number(s.difference ?? 0) === 0).length
  const short = (shifts ?? []).filter((s: any) => Number(s.difference ?? 0) < 0).length
  const over = (shifts ?? []).filter((s: any) => Number(s.difference ?? 0) > 0).length
  const totalShort = (shifts ?? []).filter((s: any) => Number(s.difference ?? 0) < 0).reduce((s, sh: any) => s + Math.abs(Number(sh.difference ?? 0)), 0)
  const totalOver = (shifts ?? []).filter((s: any) => Number(s.difference ?? 0) > 0).reduce((s, sh: any) => s + Number(sh.difference ?? 0), 0)

  return (
    <SimpleReport
      title="Shift Report"
      description="Ringkasan penyelesaian shift kasir"
      dateFrom={from}
      dateTo={to}
      columns={[
        { key: "cashier", label: "Kasir" },
        { key: "branch", label: "Cabang" },
        { key: "opening", label: "Kas Awal" },
        { key: "cash_sales", label: "Penjualan Tunai" },
        { key: "expected", label: "Expected" },
        { key: "actual", label: "Actual" },
        { key: "difference", label: "Selisih" },
        { key: "status", label: "Status" },
      ]}
      rows={rows}
      summary={[
        { label: "Total Shift", value: String(shifts?.length ?? 0) },
        { label: "Match", value: String(matched) },
        { label: "Short", value: `${String(short)} (${formatCurrency(totalShort)})` },
        { label: "Over", value: `${String(over)} (${formatCurrency(totalOver)})` },
      ]}
    />
  )
}