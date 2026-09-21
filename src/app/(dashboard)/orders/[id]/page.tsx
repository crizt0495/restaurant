import { requirePermission, getCurrentUser, getServerClient } from "@/lib/helpers"
import { notFound } from "next/navigation"
import { formatCurrency, formatDateTime, translateStatus } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, Printer, ReceiptText, Banknote } from "lucide-react"
import { CancelOrderButton } from "@/components/orders/cancel-order-button"
import { RefundButton } from "@/components/orders/refund-button"
import { PayOrderButton } from "@/components/orders/pay-order-button"

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
  const remaining = Number(order.total) - Number(order.paid_amount)
  const canPay =
    ["UNPAID", "PARTIAL"].includes(order.payment_status) &&
    !["CANCELLED", "REFUNDED"].includes(order.status) &&
    remaining > 0

  const statusVariant =
    order.status === "COMPLETED"
      ? "success"
      : order.status === "CANCELLED" || order.status === "REFUNDED"
        ? "destructive"
        : "warning"

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" aria-label="Kembali ke pesanan" asChild className="text-muted-foreground hover:text-foreground">
            <Link href="/orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-2xl font-bold tracking-tight leading-none">{order.order_number}</h2>
              <Badge variant={statusVariant}>{translateStatus(order.status)}</Badge>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {formatDateTime(order.created_at)} · {order.order_type === "DINE_IN" ? "Makan di Tempat" : order.order_type === "TAKE_AWAY" ? "Bawa Pulang" : order.order_type === "DELIVERY" ? "Antar" : order.order_type === "PICK_UP" ? "Ambil" : order.order_type}
              {order.table ? ` · Meja ${order.table.name || order.table.number}` : ""}
              {order.customer ? ` · ${order.customer.name}` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/orders/${order.id}/receipt`} className="flex items-center gap-2">
              <Printer className="h-4 w-4" /> Cetak Struk
            </Link>
          </Button>
          {canCancel && <CancelOrderButton orderId={order.id} />}
          {canPay && <PayOrderButton orderId={order.id} remaining={remaining} />}
          {canRefund && <RefundButton orderId={order.id} maxAmount={Number(order.paid_amount)} />}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between border-b border-border bg-muted/40 py-3.5">
            <CardTitle className="text-base">Item</CardTitle>
            <Badge variant="neutral" className="bg-muted text-muted-foreground">
              {order.items?.length ?? 0} item
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2 p-5">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/60 px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    <span className="tabular mr-1 font-mono text-xs text-muted-foreground">{item.quantity}x</span>
                    {item.product_name}
                    {item.variant_name && <span className="text-muted-foreground"> · {item.variant_name}</span>}
                  </p>
                  {item.modifiers?.map((m: any, i: number) => (
                    <p key={i} className="mt-0.5 text-xs text-muted-foreground">
                      + {m.option_name} <span className="tabular font-mono">{formatCurrency(m.price)}</span>
                    </p>
                  ))}
                  {item.notes && (
                    <p className="mt-1 rounded-md bg-warning/10 px-1.5 py-0.5 text-xs font-medium text-warning">📝 {item.notes}</p>
                  )}
                </div>
                <p className="tabular shrink-0 font-mono text-sm font-semibold">{formatCurrency(item.total)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border bg-muted/40 py-3.5">
            <CardTitle className="text-base">Ringkasan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 p-5">
            <SummaryRow label="Subtotal" value={formatCurrency(order.subtotal)} />
            <SummaryRow label="Biaya Layanan" value={formatCurrency(order.service_charge)} />
            <SummaryRow label="Pajak" value={formatCurrency(order.tax_amount)} />
            <div className="my-1 h-px bg-border" />
            <div className="flex items-center justify-between rounded-xl bg-primary/5 px-3 py-2.5">
              <span className="flex items-center gap-1.5 text-sm font-bold">
                <ReceiptText className="h-4 w-4 text-primary" /> Total
              </span>
              <span className="tabular font-mono text-lg font-bold text-primary">{formatCurrency(order.total)}</span>
            </div>
            <SummaryRow label="Dibayar" value={formatCurrency(order.paid_amount)} />
            <SummaryRow label="Kembalian" value={formatCurrency(order.change_amount)} />
            <div className="my-1 h-px bg-border" />
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Banknote className="h-3.5 w-3.5" /> Pembayaran
            </div>
            {order.payments?.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-2.5 py-1.5">
                <span className="text-xs font-medium capitalize">{String(p.method).replace(/_/g, " ")}</span>
                <span className="tabular font-mono text-xs font-semibold">{formatCurrency(p.amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular font-mono font-semibold">{value}</span>
    </div>
  )
}