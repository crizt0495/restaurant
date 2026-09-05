import { requirePermission } from "@/lib/helpers"
import { getInventoryItems } from "@/lib/queries"
import { InventoryReport } from "@/components/reports/inventory-report"

export const dynamic = "force-dynamic"

export default async function InventoryReportPage() {
  await requirePermission("reports.view")
  const items = await getInventoryItems()

  const enriched = items.map((item) => ({
    ...item,
    stock_value: Number(item.quantity ?? 0) * Number(item.cost_price ?? 0),
    is_low_stock: Number(item.quantity ?? 0) < Number(item.minimum_stock ?? 0),
  }))

  const totalStockValue = enriched.reduce((sum, i) => sum + i.stock_value, 0)

  return (
    <InventoryReport items={enriched} totalStockValue={totalStockValue} />
  )
}
