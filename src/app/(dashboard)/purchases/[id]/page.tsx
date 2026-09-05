import { requirePermission } from "@/lib/helpers"
import { getServerClient } from "@/lib/helpers"
import { notFound } from "next/navigation"
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"

function statusVariant(status: string): "success" | "warning" | "info" | "neutral" | "destructive" {
  switch (status) {
    case "RECEIVED":
      return "success"
    case "PARTIAL":
      return "warning"
    case "PENDING":
      return "info"
    case "APPROVED":
      return "info"
    case "DRAFT":
      return "neutral"
    case "CANCELLED":
      return "destructive"
    default:
      return "neutral"
  }
}

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePermission("purchases.view")
  const { id } = await params
  const supabase = await getServerClient()

  const { data: po } = await supabase
    .from("purchase_orders")
    .select(
      "*, supplier:suppliers(name, company, phone, email, address), branch:branches(name), items:purchase_order_items(*, inventory_item:inventory_items(name, sku, unit))"
    )
    .eq("id", id)
    .single()

  if (!po) notFound()

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/purchases">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{po.po_number}</h2>
              <Badge variant={statusVariant(po.status)}>{po.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDate(po.order_date)}
              {po.expected_date
                ? ` · Estimasi: ${formatDate(po.expected_date)}`
                : ""}
              {po.received_date
                ? ` · Diterima: ${formatDate(po.received_date)}`
                : ""}
            </p>
          </div>
        </div>
        {po.status === "PENDING" && (
          <Badge variant="info">Menunggu Penerimaan</Badge>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Item Pembelian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Item</th>
                    <th className="pb-2 font-medium">SKU</th>
                    <th className="pb-2 font-medium text-right">Qty</th>
                    <th className="pb-2 font-medium text-right">Harga</th>
                    <th className="pb-2 font-medium text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(po.items || []).map((item: Record<string, unknown> & { id: string }) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-2 font-medium">
                        {(item.inventory_item as { name?: string } | null)?.name || "-"}
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {(item.inventory_item as { sku?: string } | null)?.sku || "-"}
                      </td>
                      <td className="py-2 text-right">
                        {formatNumber(Number(item.quantity))}
                        {Number(item.received_quantity) > 0 && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            (diterima: {formatNumber(Number(item.received_quantity))})
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-right">
                        {formatCurrency(Number(item.unit_price))}
                      </td>
                      <td className="py-2 text-right font-semibold">
                        {formatCurrency(Number(item.total))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ringkasan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Supplier</p>
              <p className="text-sm font-medium">
                {(po.supplier as { company?: string; name?: string } | null)?.company ||
                  (po.supplier as { name?: string } | null)?.name ||
                  "-"}
              </p>
              {(po.supplier as { phone?: string } | null)?.phone && (
                <p className="text-xs text-muted-foreground">
                  {(po.supplier as { phone: string }).phone}
                </p>
              )}
            </div>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground">Cabang</p>
              <p className="text-sm font-medium">
                {(po.branch as { name?: string } | null)?.name || "-"}
              </p>
            </div>
            {po.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground">Catatan</p>
                  <p className="text-sm">{po.notes}</p>
                </div>
              </>
            )}
            <Separator />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(Number(po.subtotal))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Diskon</span>
                <span>{formatCurrency(Number(po.discount))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pajak</span>
                <span>{formatCurrency(Number(po.tax))}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span>{formatCurrency(Number(po.total))}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
