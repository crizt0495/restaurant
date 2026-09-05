import { requirePermission } from "@/lib/helpers"
import { TablesClient } from "@/components/tables/tables-client"
import { getTables } from "@/lib/queries"

export const dynamic = "force-dynamic"

export default async function TablesPage() {
  await requirePermission("orders.view")
  const tables = await getTables()

  return <TablesClient tables={tables} />
}