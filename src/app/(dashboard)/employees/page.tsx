import { getBranches, getEmployees, getEmployeeShifts } from "@/lib/queries"
import { EmployeesClient } from "@/components/employees/employees-client"
import { getCurrentUser } from "@/lib/helpers"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function EmployeesPage() {
  const user = await getCurrentUser()
  if (!user || (!user.is_super_admin && !user.permissions.includes("employees.view"))) {
    redirect("/dashboard")
  }

  const [employeesData, branches, shifts] = await Promise.all([
    getEmployees(),
    getBranches(),
    getEmployeeShifts(),
  ])

  return (
    <EmployeesClient
      employees={employeesData}
      branches={branches}
      shifts={shifts}
      canCreate={user.is_super_admin || user.permissions.includes("employees.create")}
      canEdit={user.is_super_admin || user.permissions.includes("employees.edit")}
    />
  )
}
