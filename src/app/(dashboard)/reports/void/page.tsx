import { requirePermission, getServerClient } from "@/lib/helpers"
import { format, subDays } from "date-fns"
import { SimpleReport } from "@/components/reports/simple-report"
import { formatCurrency } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function VoidReportPage({
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

  const { data: voids } = await supabase
    .from("orders")
    .select("order_number, created_at, total, void_reason, profiles(full_name)")
    .eq("status", "CANCELLED")
    .gte("cancelled_at", fromDateTime)
    .lte("cancelled_at", toDateTime)
    .order("cancelled_at", { ascending: false })

  const rows = (voids ?? []).map((v: any) => ({
    order_number: v.order_number,
    date: new Date(v.created_at).toISOString().slice(0, 10),
    total: formatCurrency(Number(v.total ?? 0)),
    reason: v.void_reason || "-",
    cancelled_by: v.profiles?.full_name || "-",
  }))

  const total = (voids ?? []).reduce((s: number, v: any) => s + Number(v.total ?? 0), 0)

  return (
    <SimpleReport
      title="Void Report"
      description="Order yang dibatalkan (void) periode"
      dateFrom={from}
      dateTo={to}
      columns={[
        { key: "order_number", label: "Order" },
        { key: "date", label: "Tanggal" },
        { key: "total", label: "Total" },
        { key: "reason", label: "Alasan" },
        { key: "cancelled_by", label: "Oleh" },
      ]}
      rows={rows}
      summary={[{ label: "Total Void", value: formatCurrency(total) }]}
    />
  )
}