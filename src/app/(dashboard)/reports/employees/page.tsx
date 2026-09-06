import { requirePermission, getServerClient } from "@/lib/helpers"
import { format, subDays } from "date-fns"
import { SimpleReport } from "@/components/reports/simple-report"

export const dynamic = "force-dynamic"

export default async function EmployeeReportPage({
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

  const { data: employees } = await supabase
    .from("employees")
    .select("*, branch:branches(name)")
    .order("name")

  const { data: shiftsAll } = await supabase
    .from("employee_shifts")
    .select("employee_id, shift_date")
    .gte("shift_date", from)
    .lte("shift_date", to)

  const shiftCount = new Map<string, number>()
  for (const s of shiftsAll ?? []) {
    const eid = (s as any).employee_id
    shiftCount.set(eid, (shiftCount.get(eid) ?? 0) + 1)
  }

  const rows = (employees ?? []).map((e: any) => ({
    employee_id: e.employee_id,
    name: e.name,
    phone: e.phone || "-",
    position: e.position || "-",
    branch: e.branch?.name || "-",
    status: e.status,
    shifts: String(shiftCount.get(e.id) ?? 0),
  }))

  return (
    <SimpleReport
      title="Laporan Karyawan"
      description="Data karyawan dan keaktifan"
      dateFrom={from}
      dateTo={to}
      columns={[
        { key: "employee_id", label: "ID Karyawan" },
        { key: "name", label: "Nama" },
        { key: "phone", label: "Telepon" },
        { key: "position", label: "Posisi" },
        { key: "branch", label: "Cabang" },
        { key: "status", label: "Status" },
        { key: "shifts", label: "Jumlah Shift" },
      ]}
      rows={rows}
      summary={[
        { label: "Total Karyawan", value: String(employees?.length ?? 0) },
        { label: "Aktif", value: String((employees ?? []).filter((e: any) => e.status === "ACTIVE").length) },
      ]}
    />
  )
}