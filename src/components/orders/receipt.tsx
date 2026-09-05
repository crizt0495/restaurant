import { formatCurrency, formatDateTime } from "@/lib/utils"

interface ReceiptProps {
  restaurantName: string
  restaurantAddress?: string
  restaurantPhone?: string
  order: any
}

export function Receipt({ restaurantName, restaurantAddress, restaurantPhone, order }: ReceiptProps) {
  return (
    <div className="receipt-print mx-auto w-full max-w-[300px] bg-white p-4 text-black">
      <div className="text-center">
        <p className="text-lg font-bold">{restaurantName}</p>
        {restaurantAddress && <p className="text-xs">{restaurantAddress}</p>}
        {restaurantPhone && <p className="text-xs">{restaurantPhone}</p>}
      </div>

      <div className="mt-2 border-t border-dashed pt-2 text-xs">
        <p>Bill: {order.order_number}</p>
        <p>{formatDateTime(order.created_at)}</p>
        <p>Type: {order.order_type.replace("_", " ")}</p>
        {order.table?.name && <p>Table: {order.table.name}</p>}
        {order.customer?.name && <p>Customer: {order.customer.name}</p>}
        {order.cashier?.full_name && <p>Cashier: {order.cashier.full_name}</p>}
      </div>

      <div className="mt-2 border-t border-dashed">
        <div className="flex justify-between py-1 text-xs font-medium">
          <span>Item</span>
          <span>Amount</span>
        </div>
        {order.items?.map((item: any) => (
          <div key={item.id} className="py-1 text-xs">
            <p className="font-medium">
              {item.quantity}x {item.product_name}
              {item.variant_name && <span> · {item.variant_name}</span>}
            </p>
            {item.modifiers?.map((m: any) => (
              <p key={m.id} className="pl-2">+ {m.option_name}</p>
            ))}
            {item.notes && <p className="pl-2">Note: {item.notes}</p>}
            <div className="flex justify-end font-semibold">
              <span>{formatCurrency(item.total)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 border-t border-dashed text-xs">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatCurrency(order.subtotal)}</span>
        </div>
        {Number(order.discount) > 0 && (
          <div className="flex justify-between">
            <span>Discount</span>
            <span>-{formatCurrency(order.discount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Service</span>
          <span>{formatCurrency(order.service_charge)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax</span>
          <span>{formatCurrency(order.tax_amount)}</span>
        </div>
        <div className="flex justify-between text-sm font-bold">
          <span>Total</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
        <div className="flex justify-between">
          <span>Paid</span>
          <span>{formatCurrency(order.paid_amount)}</span>
        </div>
        {Number(order.change_amount) > 0 && (
          <div className="flex justify-between">
            <span>Change</span>
            <span>{formatCurrency(order.change_amount)}</span>
          </div>
        )}
        {order.payments?.map((p: any) => (
          <div key={p.id} className="flex justify-between">
            <span>{p.method.replace("_", " ")}</span>
            <span>{formatCurrency(p.amount)}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 border-t border-dashed text-center text-xs">
        <p>Thank you, see you soon!</p>
      </div>
    </div>
  )
}