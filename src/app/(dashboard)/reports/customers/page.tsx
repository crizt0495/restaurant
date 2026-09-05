import { requirePermission } from "@/lib/helpers"
import { getCustomers } from "@/lib/queries"
import { CustomersReport } from "@/components/reports/customers-report"

export const dynamic = "force-dynamic"

export default async function CustomersReportPage() {
  await requirePermission("reports.view")
  const customers = await getCustomers()

  const enriched = customers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone ?? "",
    member_level: c.member_level ?? "NONE",
    points: Number(c.points ?? 0),
    total_spent: Number(c.total_spent ?? 0),
    is_member: Boolean(c.is_member),
  }))

  const sorted = [...enriched].sort((a, b) => b.total_spent - a.total_spent)
  const totalSpent = sorted.reduce((sum, c) => sum + c.total_spent, 0)
  const memberCount = sorted.filter((c) => c.is_member).length

  return (
    <CustomersReport
      customers={sorted}
      totalSpent={totalSpent}
      memberCount={memberCount}
    />
  )
}
