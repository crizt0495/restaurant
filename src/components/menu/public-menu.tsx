"use client"

import * as React from "react"
import Image from "next/image"
import { formatCurrency } from "@/lib/utils"
import { UtensilsCrossed, Plus, Minus, ShoppingCart, CheckCircle2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface MenuProduct {
  id: string
  name: string
  description?: string
  image_url?: string
  selling_price: number
  category_id: string
  is_favorite: boolean
  tax_percentage: number
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
  serviceChargePercentage?: number
  taxInclusive?: boolean
}

interface CartLine {
  product: MenuProduct
  qty: number
}

export function PublicMenu({ branchId, tableId, branchName, tableName, orgName, categories, products, serviceChargePercentage = 0, taxInclusive = false }: PublicMenuProps) {
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

  const lineSubtotal = (c: CartLine) => c.product.selling_price * c.qty
  const lineTax = (c: CartLine) => {
    const subt = lineSubtotal(c)
    const perc = Number(c.product.tax_percentage ?? 0)
    return taxInclusive ? subt - subt / (1 + perc / 100) : (subt * perc) / 100
  }
  const subtotal = cart.reduce((s, c) => s + lineSubtotal(c), 0)
  const taxAmount = cart.reduce((s, c) => s + lineTax(c), 0)
  const serviceCharge = (subtotal * serviceChargePercentage) / 100
  const total = subtotal + taxAmount + serviceCharge
  const totalItems = cart.reduce((s, c) => s + c.qty, 0)

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
            quantity: c.qty,
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
    <div className="mx-auto min-h-screen max-w-lg bg-background pb-28">
      <header className="glass sticky top-0 z-10 border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground shadow-md">
              <UtensilsCrossed className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight leading-none">{orgName}</h1>
              <p className="mt-0.5 text-xs text-muted-foreground">{branchName}</p>
            </div>
          </div>
          <Badge variant="secondary" className="gap-1.5 py-1">
            <UtensilsCrossed className="h-3 w-3" /> Meja {tableName}
          </Badge>
        </div>
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none]">
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
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-center text-muted-foreground">
            <UtensilsCrossed className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm">Menu kosong</p>
          </div>
        ) : (
          filtered.map((product) => {
            const inCart = cart.find((c) => c.product.id === product.id)
            return (
              <div
                key={product.id}
                className="flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm transition-all duration-150 hover:border-primary/30 hover:shadow-md"
              >
                {product.image_url ? (
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                    <Image fill src={product.image_url} alt={product.name} sizes="80px" className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <UtensilsCrossed className="h-7 w-7 text-muted-foreground/50" strokeWidth={2} />
                  </div>
                )}
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold tracking-tight">{product.name}</p>
                      {product.description && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{product.description}</p>
                      )}
                    </div>
                    {product.is_favorite && (
                      <Badge variant="success" className="shrink-0 text-3xs">Populer</Badge>
                    )}
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="tabular font-mono text-sm font-bold text-primary">{formatCurrency(product.selling_price)}</span>
                    {inCart ? (
                      <div className="flex items-center gap-2 rounded-lg border border-border bg-background/60 p-0.5">
                        <Button size="icon" variant="ghost" aria-label="Kurangi jumlah" className="h-7 w-7 text-primary hover:bg-primary/10" onClick={() => remove(product.id)}>
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="tabular w-5 text-center text-sm font-bold">{inCart.qty}</span>
                        <Button size="icon" variant="ghost" aria-label="Tambah jumlah" className="h-7 w-7 text-primary hover:bg-primary/10" onClick={() => add(product)}>
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" onClick={() => add(product)}>
                        <Plus className="mr-1 h-3.5 w-3.5" /> Tambah
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </main>

      {cart.length > 0 && (
        <div className="glass-strong fixed inset-x-0 bottom-0 z-20 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <ShoppingCart className="h-3.5 w-3.5" /> {totalItems} item
              </p>
              <p className="tabular mt-0.5 font-mono text-lg font-bold">{formatCurrency(total)}</p>
              {(taxAmount > 0 || serviceCharge > 0) && (
                <p className="mt-0.5 max-w-[10rem] text-2xs leading-tight text-muted-foreground">
                  Subtotal {formatCurrency(subtotal)}
                  {taxAmount > 0 && ` · Pajak ${formatCurrency(taxAmount)}`}
                  {serviceCharge > 0 && ` · Layanan ${formatCurrency(serviceCharge)}`}
                </p>
              )}
            </div>
            <Button size="lg" className="bg-gradient-brand shadow-lg hover:shadow-xl" onClick={placeOrder} disabled={submitting}>
              {submitting ? "Mengirim..." : "Kirim ke Dapur"}
            </Button>
          </div>
        </div>
      )}

      <Dialog
        open={placed || !!orderInfo}
        onOpenChange={(o) => {
          if (!o) {
            setPlaced(false)
            setOrderInfo("")
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <div className="flex flex-col items-center text-center">
            <div className={cn("mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full", placed ? "bg-success/10" : "bg-warning/10")}>
              {placed ? (
                <CheckCircle2 className="h-7 w-7 text-success" strokeWidth={2.25} />
              ) : (
                <AlertTriangle className="h-7 w-7 text-warning" strokeWidth={2.25} />
              )}
            </div>
            <DialogTitle className="text-lg font-bold tracking-tight">{placed ? "Pesanan Terkirim!" : "Perhatian"}</DialogTitle>
            <p className="mt-2 text-sm text-muted-foreground">{orderInfo}</p>
            <Button
              className="mt-5 w-full"
              onClick={() => {
                setPlaced(false)
                setOrderInfo("")
              }}
            >
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}