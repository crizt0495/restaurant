import { getBranches, getExpenses, getExpenseCategories } from "@/lib/queries"
import { ExpensesClient } from "@/components/expenses/expenses-client"
import { getCurrentUser } from "@/lib/helpers"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function ExpensesPage() {
  const user = await getCurrentUser()
  if (!user || (!user.is_super_admin && !user.permissions.includes("expenses.view"))) {
    redirect("/dashboard")
  }

  const [expenses, branches, categories] = await Promise.all([
    getExpenses(),
    getBranches(),
    getExpenseCategories(),
  ])

  return (
    <ExpensesClient
      expenses={expenses}
      branches={branches}
      categories={categories}
      canCreate={user.is_super_admin || user.permissions.includes("expenses.create")}
    />
  )
}
