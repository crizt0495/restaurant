"use client"

import * as React from "react"
import { createOrder, createCustomer, type CreateOrderInput } from "@/lib/actions/index"
import { formatCurrency } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Utensils,
  Banknote,
  Smartphone,
  CreditCard,
  Landmark,
  UserPlus,
  X,
  ReceiptText,
} from "lucide-react"
import toast from "react-hot-toast"
import { cn } from "@/lib/utils"

interface CartItem {
  product_id: string
  product_name: string
  variant_id?: string | null
  variant_name?: string | null
  quantity: number
  unit_price: number
  discount: number
  tax_percentage: number
  notes?: string
  modifiers?: { name: string; option_name: string; price: number }[]
}

interface PaymentSplit {
  method: string
  amount: number
}

interface POSProps {
  user: { profile_id: string; username: string; full_name: string }
  categories: { id: string; name: string; slug: string }[]
  products: any[]
  tables: any[]
  customers: any[]
  taxPercentage?: number
  taxInclusive?: boolean
  serviceChargePercentage?: number
  receiptFormat?: string
}

const ORDER_TYPES = ["DINE_IN", "TAKE_AWAY", "DELIVERY", "PICK_UP"] as const
const PAYMENT_METHODS = [
  { key: "CASH", label: "Tunai", icon: Banknote },
  { key: "BANK_TRANSFER", label: "Transfer", icon: Landmark },
  { key: "QRIS", label: "QRIS", icon: Smartphone },
  { key: "DEBIT", label: "Debit", icon: CreditCard },
  { key: "CREDIT", label: "Kartu Kredit", icon: CreditCard },
  { key: "E_WALLET", label: "E-Wallet", icon: Smartphone },
  { key: "OTHER", label: "Lainnya", icon: Utensils },
]

export function POS({ user, categories, products, tables, customers: initialCustomers, taxPercentage = 11, taxInclusive = false, serviceChargePercentage = 5 }: POSProps) {
  const [customers] = React.useState<any[]>(initialCustomers)
  const [activeCategory, setActiveCategory] = React.useState<string>("")
  const [search, setSearch] = React.useState("")
  const [cart, setCart] = React.useState<CartItem[]>([])
  const [orderType, setOrderType] = React.useState<(typeof ORDER_TYPES)[number]>("DINE_IN")
  const [selectedTable, setSelectedTable] = React.useState("")
  const [customerId, setCustomerId] = React.useState("")
  const [selectedProduct, setSelectedProduct] = React.useState<any>(null)
  const [selectedVariant, setSelectedVariant] = React.useState<any>(null)
  const [selectedModifiers, setSelectedModifiers] = React.useState<any[]>([])
  const [notes, setNotes] = React.useState("")
  const [quantity, setQuantity] = React.useState(1)
  const [showPayment, setShowPayment] = React.useState(false)
  const [payments, setPayments] = React.useState<PaymentSplit[]>([{ method: "CASH", amount: 0 }])
  const [processing, setProcessing] = React.useState(false)
  const [error, setError] = React.useState("")
  const [discountType, setDiscountType] = React.useState<"none" | "nominal" | "percent">("none")
  const [discountValue, setDiscountValue] = React.useState(0)
  const taxPercent = taxPercentage
  const serviceChargePercent = serviceChargePercentage
  const taxInclusiveMode = taxInclusive
  const [newCustomerOpen, setNewCustomerOpen] = React.useState(false)
  const [newCustomerName, setNewCustomerName] = React.useState("")
  const [newCustomerPhone, setNewCustomerPhone] = React.useState("")
  const [newCustomerSaving, setNewCustomerSaving] = React.useState(false)

  const filteredProducts = products.filter((p) => {
    const matchesCategory = !activeCategory || p.category_id === activeCategory
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode || "").toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const subtotal = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
  const itemDiscount = cart.reduce((sum, item) => sum + item.discount, 0)

  let globalDiscount = 0
  if (discountType === "nominal") globalDiscount = Math.min(discountValue, Math.max(0, subtotal - itemDiscount))
  else if (discountType === "percent")
    globalDiscount = (Math.max(0, subtotal - itemDiscount) * Math.min(discountValue, 100)) / 100

  const baseForService = Math.max(0, subtotal - itemDiscount - globalDiscount)
  const serviceCharge = (baseForService * serviceChargePercent) / 100
  let taxAmount: number
  let total: number
  if (taxInclusiveMode) {
    total = Math.max(0, baseForService + serviceCharge)
    taxAmount = baseForService - baseForService / (1 + taxPercent / 100)
  } else {
    const taxExcl = (baseForService + serviceCharge) * (taxPercent / 100)
    taxAmount = taxExcl
    total = Math.max(0, baseForService + serviceCharge + taxExcl)
  }

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)

  const addToCart = (product: any) => {
    setSelectedProduct(product)
    setSelectedVariant(null)
    setSelectedModifiers([])
    setNotes("")
    setQuantity(1)
    setError("")
  }

  const confirmAddToCart = () => {
    if (!selectedProduct) return
    const unitPrice = selectedVariant ? selectedVariant.price : selectedProduct.selling_price
    const taxPerc = Number(selectedProduct.tax_percentage || 0)

    const existing = cart.find((c) => {
      const variantMatch = c.variant_id === (selectedVariant?.id ?? null)
      return c.product_id === selectedProduct.id && variantMatch
    })

    setCart((prev) => {
      if (existing) {
        return prev.map((c) =>
          c.product_id === existing.product_id && c.variant_id === existing.variant_id
            ? { ...c, quantity: c.quantity + quantity }
            : c
        )
      }
      return [
        ...prev,
        {
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          variant_id: selectedVariant?.id ?? null,
          variant_name: selectedVariant?.name ?? null,
          quantity,
          unit_price: unitPrice,
          discount: 0,
          tax_percentage: taxPerc,
          notes: notes || undefined,
          modifiers: selectedModifiers.map((m) => ({
            name: m.modifier_name || m.modifier?.name,
            option_name: m.option_name || m.name,
            price: m.price || 0,
          })),
        },
      ]
    })

    setSelectedProduct(null)
    setSelectedVariant(null)
    setSelectedModifiers([])
    setNotes("")
    setQuantity(1)
  }

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index))
  }

  const changeQty = (index: number, delta: number) => {
    setCart((prev) =>
      prev.map((c, i) =>
        i === index ? { ...c, quantity: Math.max(1, c.quantity + delta) } : c
      )
    )
  }

  const setItemDiscount = (index: number, value: number) => {
    setCart((prev) =>
      prev.map((c, i) => {
        if (i !== index) return c
        const maxDisc = c.unit_price * c.quantity
        return { ...c, discount: Math.max(0, Math.min(value, maxDisc)) }
      })
    )
  }

  const addPaymentLine = () => {
    if (payments.length >= 5) return
    setPayments((prev) => [...prev, { method: "CASH", amount: 0 }])
  }

  const removePaymentLine = (index: number) => {
    if (payments.length <= 1) return
    setPayments((prev) => prev.filter((_, i) => i !== index))
  }

  const openPaymentDialog = () => {
    setPayments([{ method: "CASH", amount: Number(total.toFixed(0)) }])
    setError("")
    setShowPayment(true)
  }

  const handlePayment = async () => {
    if (cart.length === 0) {
      setError("Keranjang kosong")
      return
    }

    const validPayments = payments.map((p) => ({
      method: p.method,
      amount: Number(p.amount),
    }))

    const paymentSum = validPayments.reduce((s, p) => s + p.amount, 0)

    const hasCash = validPayments.some((p) => p.method === "CASH")
    if (hasCash && paymentSum < Math.ceil(total)) {
      setError("Total pembayaran kurang dari total tagihan")
      return
    }
    if (validPayments.some((p) => p.amount <= 0)) {
      setError("Setiap metode pembayaran harus lebih dari 0")
      return
    }
    if (paymentSum < Math.ceil(total)) {
      setError("Total pembayaran kurang dari total tagihan")
      return
    }

    setProcessing(true)
    setError("")

    const input: CreateOrderInput = {
      order_type: orderType,
      table_id: orderType === "DINE_IN" ? selectedTable || null : null,
      customer_id: customerId || null,
      notes: undefined,
      items: cart,
      discount: itemDiscount + globalDiscount,
      service_charge_percentage: serviceChargePercent,
      tax_percentage: taxPercent,
      payments: validPayments,
      total,
      subtotal,
      tax_amount: taxAmount,
      service_charge: serviceCharge,
      paid_amount: paymentSum,
      change_amount: hasCash ? paymentSum - total : 0,
      cashier_id: user.profile_id,
    }

    const result = await createOrder(input)
    setProcessing(false)

    if (result.error) {
      setError(result.error)
      return
    }

    toast.success(`Order ${result.order_number} berhasil dibuat`)
    setCart([])
    setSelectedTable("")
    setCustomerId("")
    setDiscountType("none")
    setDiscountValue(0)
    setShowPayment(false)
  }

  const handleQuickAddCustomer = async () => {
    if (!newCustomerName.trim()) {
      toast.error("Nama pelanggan wajib diisi")
      return
    }
    setNewCustomerSaving(true)
    const result = await createCustomer({
      name: newCustomerName.trim(),
      phone: newCustomerPhone || null,
      is_member: false,
      member_level: "BRONZE",
    })
    setNewCustomerSaving(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Pelanggan dibuat")
    setNewCustomerOpen(false)
    setNewCustomerName("")
    setNewCustomerPhone("")
    window.location.reload()
  }

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedProduct(null)
        setShowPayment(false)
        return
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === "F2") {
        e.preventDefault()
        setSelectedProduct(null)
        const searchInput = document.getElementById("pos-search") as HTMLInputElement | null
        searchInput?.focus()
      } else if (e.key === "F4") {
        e.preventDefault()
        if (selectedProduct) confirmAddToCart()
      } else if (e.key === "F8") {
        e.preventDefault()
        openPaymentDialog()
      } else if (e.key === "Enter") {
        if (showPayment && !processing) handlePayment()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct, showPayment, processing, cart, payments, total, discountType, discountValue])

  return (
    <div className="flex flex-col gap-4 lg:h-[calc(100vh-8rem)] lg:flex-row">
      {/* LEFT: categories */}
      <div className="flex shrink-0 gap-2 overflow-x-auto pb-1 lg:w-44 lg:flex-col lg:overflow-visible">
        <CategoryButton label="Semua" active={!activeCategory} onClick={() => setActiveCategory("")} />
        {categories.map((cat) => (
          <CategoryButton
            key={cat.id}
            label={cat.name}
            active={activeCategory === cat.id}
            onClick={() => setActiveCategory(cat.id)}
          />
        ))}
      </div>

      {/* CENTER: products */}
      <div className="flex flex-1 flex-col gap-3 overflow-hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="pos-search"
            placeholder="Cari produk, SKU, atau barcode... (F2)"
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <ScrollArea className="flex-1">
          {filteredProducts.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
              <Utensils className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm">Produk tidak ditemukan</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card text-left shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md active:translate-y-0"
                >
                  <div className="relative mb-2 flex h-24 items-center justify-center bg-muted/60">
                    {product.image_url ? (
                      <Image fill src={product.image_url} alt={product.name} sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw" className="object-cover" />
                    ) : (
                      <Utensils className="h-7 w-7 text-muted-foreground/50" strokeWidth={2} />
                    )}
                    {product.is_favorite && (
                      <Badge variant="success" className="absolute right-1.5 top-1.5 text-4xs">
                        FAVORIT
                      </Badge>
                    )}
                  </div>
                  <div className="px-2.5 pb-2.5">
                    <p className="line-clamp-1 text-13 font-semibold">{product.name}</p>
                    <p className="tabular mt-1 font-mono text-sm font-bold text-primary">
                      {formatCurrency(product.selling_price)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* RIGHT: cart */}
      <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-lg lg:w-[22rem]">
        <div className="border-b border-border p-3">
          <div className="mb-2 flex flex-wrap gap-1 rounded-xl bg-muted p-1">
            {ORDER_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setOrderType(type)}
                className={cn(
                  "flex-1 rounded-lg px-2 py-1.5 text-2xs font-semibold uppercase tracking-wide transition-all",
                  orderType === type
                    ? "bg-card text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {type.replace("_", " ")}
              </button>
            ))}
          </div>

          {orderType === "DINE_IN" && (
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Pilih meja" />
              </SelectTrigger>
              <SelectContent>
                {tables.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name || t.number} (Cap.{t.capacity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="mt-2 flex gap-1.5">
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Pilih pelanggan" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} {c.is_member ? `(${c.member_level})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => setNewCustomerOpen(true)} aria-label="Tambah customer baru">
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
              <ShoppingCart className="mb-1 h-10 w-10 text-muted-foreground/40" />
              <p className="text-xs font-medium">Keranjang kosong</p>
            </div>
          ) : (
            <div className="space-y-2 p-3">
              {cart.map((item, i) => (
                <div key={i} className="animate-brutal-pop rounded-xl border border-border bg-background/60 p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-13 font-semibold">{item.product_name}</p>
                    <Button size="icon-sm" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => removeFromCart(i)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  {item.variant_name && <p className="text-2xs text-muted-foreground">{item.variant_name}</p>}
                  <div className="mt-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Button size="icon-sm" variant="outline" className="h-7 w-7" onClick={() => changeQty(i, -1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="tabular w-6 text-center text-xs font-semibold">{item.quantity}</span>
                      <Button size="icon-sm" variant="outline" className="h-7 w-7" onClick={() => changeQty(i, 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="tabular font-mono text-13 font-bold">{formatCurrency(item.unit_price * item.quantity)}</p>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="text-2xs text-muted-foreground">Diskon</span>
                    <Input
                      type="number"
                      min={0}
                      className="h-6 w-20 px-1.5 text-xs"
                      value={item.discount}
                      onChange={(e) => setItemDiscount(i, Number(e.target.value))}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="border-t border-border p-3">
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">Diskon</span>
              <div className="flex items-center gap-1">
                <Select value={discountType} onValueChange={(v) => setDiscountType(v as typeof discountType)}>
                  <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tanpa</SelectItem>
                    <SelectItem value="nominal">Rp</SelectItem>
                    <SelectItem value="percent">%</SelectItem>
                  </SelectContent>
                </Select>
                {discountType !== "none" && (
                  <Input
                    type="number"
                    min={0}
                    className="h-7 w-16 px-1.5 text-xs"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                  />
                )}
              </div>
            </div>
            <Row label="Subtotal" value={formatCurrency(subtotal)} />
            {itemDiscount > 0 && <Row label="Diskon Item" value={`-${formatCurrency(itemDiscount)}`} muted />}
            {globalDiscount > 0 && <Row label="Diskon Global" value={`-${formatCurrency(globalDiscount)}`} muted />}
            <Row label={`Biaya Layanan ${serviceChargePercent}%`} value={formatCurrency(serviceCharge)} />
            <Row label={`Pajak ${taxPercent}%`} value={formatCurrency(taxAmount)} />
            <div className="mt-1 flex items-center justify-between border-t border-border pt-2">
              <span className="text-sm font-bold">TOTAL</span>
              <span className="tabular font-mono text-lg font-bold text-primary">{formatCurrency(total)}</span>
            </div>
          </div>

          {error && (
            <p className="mt-2 rounded-lg border border-destructive/25 bg-destructive/10 px-2.5 py-1.5 text-xs font-medium text-destructive">{error}</p>
          )}

          <Button
            className="mt-3 h-12 w-full bg-gradient-brand text-base font-bold shadow-lg hover:shadow-xl"
            size="lg"
            onClick={openPaymentDialog}
            disabled={cart.length === 0}
          >
            <ReceiptText className="mr-1 h-4 w-4" /> Bayar · {formatCurrency(total)}
          </Button>
          <p className="mt-2 text-center font-mono text-3xs font-medium text-muted-foreground">
            F2 CARI · F4 TAMBAH · F8 BAYAR · ESC TUTUP
          </p>
        </div>
      </div>

      {/* Product quick-add dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={(o) => !o && setSelectedProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedProduct?.variants?.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Varian</p>
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.variants.map((v: any) => (
                    <Button
                      key={v.id}
                      size="sm"
                      variant={selectedVariant?.id === v.id ? "default" : "outline"}
                      onClick={() => setSelectedVariant(v)}
                    >
                      {v.name} · {formatCurrency(v.price)}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {selectedProduct?.modifiers?.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Modifier</p>
                {selectedProduct.modifiers.map((pm: any) => {
                  const mod = pm.modifier
                  return (
                    <div key={mod?.id} className="mb-2">
                      <p className="mb-1 text-2xs font-medium text-muted-foreground">{mod?.name}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {mod?.options?.map((opt: any) => {
                          const modName = mod.name
                          const optName = opt.name
                          return (
                            <Button
                              key={opt.id}
                              size="sm"
                              variant={
                                selectedModifiers.some(
                                  (m) => m.option_name === optName || m.id === opt.id
                                )
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() => {
                                const isSelected = selectedModifiers.some(
                                  (m) => m.option_name === optName || m.id === opt.id
                                )
                                if (isSelected) {
                                  setSelectedModifiers((prev) =>
                                    prev.filter((m) => !(m.option_name === optName || m.id === opt.id))
                                  )
                                } else {
                                  setSelectedModifiers((prev) => [
                                    ...prev,
                                    { id: opt.id, modifier_name: modName, option_name: optName, price: opt.price },
                                  ])
                                }
                              }}
                            >
                              {opt.name}
                              {opt.price > 0 && ` +${formatCurrency(opt.price)}`}
                            </Button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-3 py-2.5">
              <p className="text-sm font-medium">Qty</p>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="outline" aria-label="Kurangi jumlah" className="h-8 w-8" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="tabular w-10 text-center text-base font-bold">{quantity}</span>
                <Button size="icon" variant="outline" aria-label="Tambah jumlah" className="h-8 w-8" onClick={() => setQuantity((q) => q + 1)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Catatan</p>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan untuk dapur..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedProduct(null)}>
              Batal
            </Button>
            <Button onClick={confirmAddToCart}>
              <ShoppingCart className="mr-1 h-4 w-4" /> Tambah
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment dialog */}
      <Dialog open={showPayment} onOpenChange={(o) => {
        if (!processing) setShowPayment(o)
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pembayaran</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/15 to-accent/10 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Tagihan</p>
              <p className="tabular mt-1 font-mono text-3xl font-bold text-primary">{formatCurrency(total)}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Metode Pembayaran (Split)</p>
                <Button variant="outline" size="sm" onClick={addPaymentLine}>
                  <Plus className="mr-1 h-3 w-3" /> Tambah
                </Button>
              </div>
              {payments.map((p, i) => {
                return (
                  <div key={i} className="flex items-center gap-2">
                    <Select
                      value={p.method}
                      onValueChange={(v) =>
                        setPayments((prev) => prev.map((x, j) => (j === i ? { ...x, method: v } : x)))
                      }
                    >
                      <SelectTrigger className="w-[45%] h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((m) => (
                          <SelectItem key={m.key} value={m.key}>
                            <span className="flex items-center gap-1.5">
                              <m.icon className="h-3.5 w-3.5 text-muted-foreground" /> {m.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min={0}
                      className="h-9 flex-1 text-xs"
                      value={p.amount}
                      onChange={(e) =>
                        setPayments((prev) =>
                          prev.map((x, j) => (j === i ? { ...x, amount: Number(e.target.value) } : x))
                        )
                      }
                    />
                    {payments.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => removePaymentLine(i)} aria-label="Hapus metode">
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                )
              })}
              <div className="mt-2 flex justify-between border-t border-border pt-2">
                <span className="text-xs text-muted-foreground">Total Dibayar</span>
                <span className="tabular font-mono text-sm font-bold">{formatCurrency(totalPaid)}</span>
              </div>
              {payments.some((p) => p.method === "CASH") && totalPaid >= total && (
                <div className="rounded-xl border border-success/25 bg-success/10 p-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Banknote className="h-4 w-4 text-success" />
                    <p className="text-xs font-medium uppercase tracking-wider text-success">Kembalian</p>
                  </div>
                  <p className="tabular mt-0.5 font-mono text-lg font-bold text-success">{formatCurrency(totalPaid - total)}</p>
                </div>
              )}
            </div>
          </div>
          {error && <p className="rounded-lg border border-destructive/25 bg-destructive/10 px-2.5 py-1.5 text-xs font-medium text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="outline" disabled={processing} onClick={() => setShowPayment(false)}>
              Batal
            </Button>
            <Button onClick={handlePayment} disabled={processing}>
              {processing ? "Memproses..." : "Konfirmasi Pembayaran"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick add customer dialog */}
      <Dialog open={newCustomerOpen} onOpenChange={setNewCustomerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Pelanggan Cepat</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Nama</span>
              <Input value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} placeholder="Nama pelanggan" />
            </div>
            <div className="grid gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Telepon</span>
              <Input value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} placeholder="opsional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewCustomerOpen(false)}>Batal</Button>
            <Button onClick={handleQuickAddCustomer} disabled={newCustomerSaving}>
              {newCustomerSaving ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CategoryButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-all duration-150",
        active
          ? "border-primary/30 bg-primary/10 text-primary shadow-sm"
          : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
      )}
    >
      {label}
    </button>
  )
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("tabular font-mono text-xs font-semibold", muted ? "text-muted-foreground" : "text-foreground")}>
        {value}
      </span>
    </div>
  )
}