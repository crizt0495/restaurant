import { requirePermission, getServerClient } from "@/lib/helpers"
import { format, subDays } from "date-fns"
import { SimpleReport } from "@/components/reports/simple-report"
import { formatCurrency, formatNumber } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function PurchaseReportPage({
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

  const { data: pos } = await supabase
    .from("purchase_orders")
    .select("*, supplier:suppliers(name, company)")
    .gte("order_date", from)
    .lte("order_date", to)
    .order("order_date", { ascending: false })

  const rows = (pos ?? []).map((p: any) => ({
    po_number: p.po_number,
    date: p.order_date,
    supplier: p.supplier?.company || p.supplier?.name || "-",
    status: p.status,
    total: formatCurrency(Number(p.total ?? 0)),
  }))

  const totalPurchase = (pos ?? []).reduce((s, p: any) => s + Number(p.total ?? 0), 0)
  const received = (pos ?? []).filter((p: any) => p.status === "RECEIVED").length

  return (
    <SimpleReport
      title="Purchase Report"
      description="Ringkasan purchase order periode"
      dateFrom={from}
      dateTo={to}
      columns={[
        { key: "po_number", label: "PO Number" },
        { key: "date", label: "Tanggal" },
        { key: "supplier", label: "Supplier" },
        { key: "status", label: "Status" },
        { key: "total", label: "Total" },
      ]}
      rows={rows}
      summary={[
        { label: "Total Pembelian", value: formatCurrency(totalPurchase) },
        { label: "Jumlah PO", value: String(pos?.length ?? 0) },
        { label: "PO Diterima", value: formatNumber(received) },
      ]}
    />
  )
}