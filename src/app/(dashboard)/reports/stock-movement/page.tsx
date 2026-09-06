import { requirePermission, getServerClient } from "@/lib/helpers"
import { format, subDays } from "date-fns"
import { SimpleReport } from "@/components/reports/simple-report"
import { formatNumber } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function StockMovementReportPage({
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

  const { data: movements } = await supabase
    .from("stock_movements")
    .select("*, inventory_items(name, sku, unit), branch:branches(name), profiles(full_name)")
    .gte("created_at", fromDateTime)
    .lte("created_at", toDateTime)
    .order("created_at", { ascending: false })

  const rows = (movements ?? []).map((m: any) => ({
    date: new Date(m.created_at).toISOString().slice(0, 10),
    item: m.inventory_items?.name || "-",
    sku: m.inventory_items?.sku || "-",
    type: m.movement_type,
    quantity: formatNumber(Number(m.quantity ?? 0)),
    before: formatNumber(Number(m.before_quantity ?? 0)),
    after: formatNumber(Number(m.after_quantity ?? 0)),
    branch: m.branch?.name || "-",
    by: m.profiles?.full_name || "-",
  }))

  const grouped: Record<string, number> = {}
  for (const m of movements ?? []) {
    const t = (m as any).movement_type || "OTHER"
    grouped[t] = (grouped[t] || 0) + Number((m as any).quantity ?? 0)
  }

  return (
    <SimpleReport
      title="Laporan Mutasi Stok"
      description="Gerakan stok bahan baku"
      dateFrom={from}
      dateTo={to}
      columns={[
        { key: "date", label: "Tanggal" },
        { key: "item", label: "Item" },
        { key: "sku", label: "SKU" },
        { key: "type", label: "Tipe" },
        { key: "quantity", label: "Jumlah" },
        { key: "before", label: "Sebelum" },
        { key: "after", label: "Sesudah" },
        { key: "branch", label: "Cabang" },
        { key: "by", label: "Oleh" },
      ]}
      rows={rows}
      summary={Object.entries(grouped).map(([k, v]) => ({
        label: k,
        value: formatNumber(v),
      }))}
    />
  )
}