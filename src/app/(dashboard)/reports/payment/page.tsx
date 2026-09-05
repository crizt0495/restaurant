import { requirePermission, getServerClient } from "@/lib/helpers"
import { format, subDays } from "date-fns"
import { SimpleReport } from "@/components/reports/simple-report"
import { formatCurrency } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function PaymentReportPage({
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

  const { data: payments } = await supabase
    .from("payments")
    .select("*, orders(status)")
    .gte("payment_date", fromDateTime)
    .lte("payment_date", toDateTime)
    .order("payment_date", { ascending: false })

  const rows = (payments ?? []).map((p: any) => ({
    date: new Date(p.payment_date).toISOString().slice(0, 10),
    method: p.method,
    amount: formatCurrency(Number(p.amount ?? 0)),
    status: p.status,
  }))

  const total = (payments ?? []).reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0)

  const methodMap = new Map<string, number>()
  for (const p of payments ?? []) {
    const m = (p as { method?: string }).method ?? "UNKNOWN"
    methodMap.set(m, (methodMap.get(m) ?? 0) + Number((p as { amount?: number }).amount ?? 0))
  }

  return (
    <SimpleReport
      title="Payment Report"
      description="Rincian pembayaran per metode"
      dateFrom={from}
      dateTo={to}
      columns={[
        { key: "date", label: "Tanggal" },
        { key: "method", label: "Metode" },
        { key: "amount", label: "Jumlah" },
        { key: "status", label: "Status" },
      ]}
      rows={rows}
      summary={[
        { label: "Total Pembayaran", value: formatCurrency(total) },
        ...Array.from(methodMap.entries()).map(([m, v]) => ({ label: m, value: formatCurrency(v) })),
      ]}
    />
  )
}