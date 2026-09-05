import { requirePermission, getServerClient } from "@/lib/helpers"
import { format, subDays } from "date-fns"
import { SimpleReport } from "@/components/reports/simple-report"
import { formatCurrency } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function ExpenseReportPage({
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

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*, category:expense_categories(name), branch:branches(name)")
    .gte("expense_date", from)
    .lte("expense_date", to)
    .order("expense_date", { ascending: false })

  const rows = (expenses ?? []).map((e: any) => ({
    date: e.expense_date,
    category: e.category?.name || "-",
    description: e.description || "-",
    amount: formatCurrency(Number(e.amount ?? 0)),
    branch: e.branch?.name || "-",
  }))

  const catMap = new Map<string, number>()
  for (const e of expenses ?? []) {
    const name = (e as any).category?.name || "Lainnya"
    catMap.set(name, (catMap.get(name) ?? 0) + Number((e as any).amount ?? 0))
  }

  const total = (expenses ?? []).reduce((s: number, e: any) => s + Number(e.amount ?? 0), 0)

  return (
    <SimpleReport
      title="Expense Report"
      description="Pengeluaran operasional periode"
      dateFrom={from}
      dateTo={to}
      columns={[
        { key: "date", label: "Tanggal" },
        { key: "category", label: "Kategori" },
        { key: "description", label: "Deskripsi" },
        { key: "amount", label: "Jumlah" },
        { key: "branch", label: "Cabang" },
      ]}
      rows={rows}
      summary={[
        { label: "Total Expense", value: formatCurrency(total) },
        ...Array.from(catMap.entries()).map(([k, v]) => ({ label: k, value: formatCurrency(v) })),
      ]}
    />
  )
}