"use client"

import * as React from "react"
import { formatCurrency } from "@/lib/utils"
import { UtensilsCrossed, Plus, Minus, ShoppingCart, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface MenuProduct {
  id: string
  name: string
  description?: string
  image_url?: string
  selling_price: number
  category_id: string
  is_favorite: boolean
}

interface MenuCategory {
  id: string
  name: string
  icon?: string
}

interface PublicMenuProps {
  branchId: string
  tableId?: string
  branchName: string
  tableName: string
  orgName: string
  categories: MenuCategory[]
  products: MenuProduct[]
}

interface CartLine {
  product: MenuProduct
  qty: number
}

export function PublicMenu({ branchId, tableId, branchName, tableName, orgName, categories, products }: PublicMenuProps) {
  const [activeCat, setActiveCat] = React.useState("")
  const [cart, setCart] = React.useState<CartLine[]>([])
  const [submitting, setSubmitting] = React.useState(false)
  const [placed, setPlaced] = React.useState(false)
  const [orderInfo, setOrderInfo] = React.useState("")

  const filtered = products.filter((p) => !activeCat || p.category_id === activeCat)

  const add = (product: MenuProduct) =>
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id)
      if (existing) {
        return prev.map((c) => (c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c))
      }
      return [...prev, { product, qty: 1 }]
    })

  const remove = (id: string) =>
    setCart((prev) =>
      prev
        .map((c) => (c.product.id === id ? { ...c, qty: c.qty - 1 } : c))
        .filter((c) => c.qty > 0)
    )

  const total = cart.reduce((sum, c) => sum + c.product.selling_price * c.qty, 0)

  const placeOrder = async () => {
    setSubmitting(true)
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId,
          tableId,
          items: cart.map((c) => ({
            product_id: c.product.id,
            product_name: c.product.name,
            quantity: c.qty,
            unit_price: c.product.selling_price,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setOrderInfo(data.error || "Gagal mengirim pesanan")
        return
      }
      setPlaced(true)
      setOrderInfo(`Pesanan ${data.order_number} berhasil dikirim ke dapur`)
      setCart([])
    } catch {
      setOrderInfo("Terjadi kesalahan, silakan coba lagi")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background pb-24">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <UtensilsCrossed className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold">{orgName}</h1>
              <p className="text-xs text-muted-foreground">{branchName}</p>
            </div>
          </div>
          <Badge variant="secondary">Meja {tableName}</Badge>
        </div>
        <div className="flex gap-2 overflow-x-auto px-4 pb-3">
          <Button size="sm" variant={!activeCat ? "default" : "outline"} onClick={() => setActiveCat("")}>
            Semua
          </Button>
          {categories.map((c) => (
            <Button key={c.id} size="sm" variant={activeCat === c.id ? "default" : "outline"} onClick={() => setActiveCat(c.id)}>
              {c.name}
            </Button>
          ))}
        </div>
      </header>

      <main className="space-y-3 p-4">
        {filtered.map((product) => (
          <div key={product.id} className="flex gap-3 rounded-xl border bg-card p-3">
            {product.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image_url} alt={product.name} className="h-20 w-20 rounded-lg object-cover" />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-muted">
                <UtensilsCrossed className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex flex-1 flex-col">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{product.name}</p>
                  {product.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{product.description}</p>
                  )}
                </div>
                {product.is_favorite && <Badge variant="success" className="text-[10px]">Populer</Badge>}
              </div>
              <div className="mt-auto flex items-center justify-between pt-2">
                <span className="text-sm font-bold text-primary">{formatCurrency(product.selling_price)}</span>
                {cart.find((c) => c.product.id === product.id) ? (
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => remove(product.id)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-5 text-center text-sm font-medium">
                      {cart.find((c) => c.product.id === product.id)?.qty}
                    </span>
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => add(product)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" onClick={() => add(product)}>
                    <Plus className="mr-1 h-3 w-3" /> Tambah
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </main>

      {cart.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 border-t bg-background p-4">
          <div className="mx-auto flex max-w-lg items-center justify-between">
            <div>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <ShoppingCart className="h-3 w-3" /> {cart.reduce((s, c) => s + c.qty, 0)} item
              </p>
              <p className="font-bold">{formatCurrency(total)}</p>
            </div>
            <Button size="lg" onClick={placeOrder} disabled={submitting}>
              {submitting ? "Mengirim..." : "Kirim ke Dapur"}
            </Button>
          </div>
        </div>
      )}

      {(placed || orderInfo) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-card p-6 text-center shadow-xl">
            <CheckCircle2 className={`mx-auto mb-3 h-12 w-12 ${placed ? "text-emerald-500" : "text-amber-500"}`} />
            <h2 className="text-lg font-bold">{placed ? "Pesanan Terkirim!" : "Perhatian"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{orderInfo}</p>
            <Button className="mt-4 w-full" onClick={() => { setPlaced(false); setOrderInfo(""); }}>
              Tutup
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}