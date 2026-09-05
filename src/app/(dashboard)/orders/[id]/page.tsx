import { requirePermission, getCurrentUser } from "@/lib/helpers"
import { getServerClient } from "@/lib/helpers"
import { notFound } from "next/navigation"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { ArrowLeft, Printer } from "lucide-react"
import { CancelOrderButton } from "@/components/orders/cancel-order-button"
import { RefundButton } from "@/components/orders/refund-button"

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePermission("orders.view")
  const { id } = await params
  const supabase = await getServerClient()

  const { data: order } = await supabase
    .from("orders")
    .select(
      "*, table:restaurant_tables(number, name), customer:customers(name, phone), items:order_items(*, modifiers:order_item_modifiers(modifier_name, option_name, price)), payments(*)"
    )
    .eq("id", id)
    .single()

  if (!order) notFound()

  const canCancel = ["NEW", "CONFIRMED", "PREPARING", "READY"].includes(order.status)
  const user = await getCurrentUser()
  const canRefund =
    Number(order.paid_amount) > 0 &&
    order.status !== "REFUNDED" &&
    (user?.is_super_admin || user?.permissions.includes("sales.edit"))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{order.order_number}</h2>
              <Badge variant={order.status === "COMPLETED" ? "success" : order.status === "CANCELLED" ? "destructive" : "warning"}>
                {order.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDateTime(order.created_at)} · {order.order_type}
              {order.table ? ` · ${order.table.name || order.table.number}` : ""}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/orders/${order.id}/receipt`} className="flex items-center gap-2">
              <Printer className="h-4 w-4" /> Print Receipt
            </Link>
          </Button>
          {canCancel && <CancelOrderButton orderId={order.id} />}
          {canRefund && <RefundButton orderId={order.id} maxAmount={Number(order.paid_amount)} />}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                <div>
                  <p className="text-sm font-medium">
                    {item.quantity}x {item.product_name}
                    {item.variant_name && <span className="text-muted-foreground"> · {item.variant_name}</span>}
                  </p>
                  {item.modifiers?.map((m: any, i: number) => (
                    <p key={i} className="text-xs text-muted-foreground">+ {m.option_name} ({formatCurrency(m.price)})</p>
                  ))}
                  {item.notes && <p className="text-xs text-amber-600">📝 {item.notes}</p>}
                </div>
                <p className="text-sm font-semibold">{formatCurrency(item.total)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ringkasan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service Charge</span>
              <span>{formatCurrency(order.service_charge)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatCurrency(order.tax_amount)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dibayar</span>
              <span>{formatCurrency(order.paid_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kembalian</span>
              <span>{formatCurrency(order.change_amount)}</span>
            </div>
            <Separator />
            {order.payments?.map((p: any) => (
              <div key={p.id} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{p.method}</span>
                <span>{formatCurrency(p.amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}