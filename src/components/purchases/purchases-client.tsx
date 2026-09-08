"use client"

import * as React from "react"
import {
  createPurchaseOrder,
  receivePurchaseOrder,
  type CreatePurchaseOrderInput,
} from "@/lib/actions/index"
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import toast from "react-hot-toast"
import Link from "next/link"
import { Plus, Loader2, PackageCheck, Trash2, Eye } from "lucide-react"

interface Supplier {
  id: string
  name: string
  company: string | null
}

interface InventoryItem {
  id: string
  name: string
  sku: string
  unit: string
}

interface POItem {
  id: string
  inventory_item_id: string
  quantity: number
  received_quantity: number
  unit_price: number
  total: number
  inventory_item?: { name: string; sku: string; unit: string } | null
}

interface PurchaseOrder {
  id: string
  po_number: string
  supplier_id: string
  supplier?: { name: string; company: string | null } | null
  order_date: string
  expected_date: string | null
  received_date: string | null
  status: string
  subtotal: number
  discount: number
  tax: number
  total: number
  notes: string | null
  items?: POItem[] | null
}

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

interface PurchaseLine {
  inventory_item_id: string
  quantity: number
  unit_price: number
}

interface PurchasesClientProps {
  purchaseOrders: PurchaseOrder[]
  suppliers: Supplier[]
  inventoryItems: InventoryItem[]
  canCreate: boolean
  canReceive: boolean
}

export function PurchasesClient({
  purchaseOrders,
  suppliers,
  inventoryItems,
  canCreate,
  canReceive,
}: PurchasesClientProps) {
  const [list, setList] = React.useState<PurchaseOrder[]>(purchaseOrders)

  const [createOpen, setCreateOpen] = React.useState(false)
  const [supplierId, setSupplierId] = React.useState("")
  const [expectedDate, setExpectedDate] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [lines, setLines] = React.useState<PurchaseLine[]>([])
  const [saving, setSaving] = React.useState(false)

  const [receivePo, setReceivePo] = React.useState<PurchaseOrder | null>(null)
  const [receivedQty, setReceivedQty] = React.useState<Record<string, number>>({})
  const [receiving, setReceiving] = React.useState(false)

  React.useEffect(() => {
    setList(purchaseOrders)
  }, [purchaseOrders])

  const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.unit_price, 0)
  const discount = 0
  const tax = 0
  const total = subtotal - discount + tax

  const openCreate = () => {
    setSupplierId("")
    setExpectedDate("")
    setNotes("")
    setLines([{ inventory_item_id: "", quantity: 1, unit_price: 0 }])
    setCreateOpen(true)
  }

  const updateLine = (index: number, patch: Partial<PurchaseLine>) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)))
  }

  const addLine = () => {
    setLines((prev) => [...prev, { inventory_item_id: "", quantity: 1, unit_price: 0 }])
  }

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCreate = async () => {
    if (!supplierId) {
      toast.error("Pilih supplier")
      return
    }
    const validLines = lines.filter((l) => l.inventory_item_id && l.quantity > 0)
    if (validLines.length === 0) {
      toast.error("Tambahkan minimal satu item")
      return
    }
    setSaving(true)
    const input: CreatePurchaseOrderInput = {
      supplier_id: supplierId,
      expected_date: expectedDate || null,
      notes: notes || null,
      items: validLines,
    }
    const result = await createPurchaseOrder(input)
    setSaving(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Pesanan pembelian dibuat")
    setCreateOpen(false)
    window.location.reload()
  }

  const openReceive = (po: PurchaseOrder) => {
    setReceivePo(po)
    const init: Record<string, number> = {}
    ;(po.items || []).forEach((item) => {
      init[item.inventory_item_id] = Number(item.received_quantity || 0) > 0
        ? Number(item.received_quantity)
        : Number(item.quantity)
    })
    setReceivedQty(init)
  }

  const handleReceive = async () => {
    if (!receivePo) return
    const items = (receivePo.items || [])
      .filter((item) => (receivedQty[item.inventory_item_id] ?? 0) > 0)
      .map((item) => ({
        inventory_item_id: item.inventory_item_id,
        received_quantity: receivedQty[item.inventory_item_id] ?? 0,
        unit_price: Number(item.unit_price),
      }))
    if (items.length === 0) {
      toast.error("Masukkan qty yang diterima")
      return
    }
    setReceiving(true)
    const result = await receivePurchaseOrder(receivePo.id, items)
    setReceiving(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Pesanan pembelian diterima, stok diperbarui")
    setReceivePo(null)
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-3xl font-black uppercase tracking-tighter leading-none">Pesanan Pembelian</h2>
          <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Kelola pesanan pembelian</p>
        </div>
        {canCreate && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Pesanan Pembelian Baru
          </Button>
        )}
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <PackageCheck className="mx-auto mb-2 h-8 w-8" />
            <p>Belum ada pesanan pembelian</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto border-3 border-foreground shadow-[5px_5px_0_0_hsl(var(--foreground))]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomor PO</TableHead>
                <TableHead>Pemasok</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((po) => (
                <TableRow key={po.id}>
                  <TableCell className="font-medium">
                    <Link href={`/purchases/${po.id}`} className="hover:underline">
                      {po.po_number}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {po.supplier?.company || po.supplier?.name || "-"}
                  </TableCell>
                  <TableCell>{formatDate(po.order_date)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(po.status)}>{po.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(Number(po.total))}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link href={`/purchases/${po.id}`}>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </Link>
                      {canReceive && po.status !== "RECEIVED" && po.status !== "CANCELLED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7"
                          onClick={() => openReceive(po)}
                        >
                          <PackageCheck className="mr-1 h-3 w-3" /> Terima
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create PO dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pesanan Pembelian Baru</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Pemasok</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger><SelectValue placeholder="Pilih pemasok" /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.company || s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Tanggal Diharapkan</Label>
                <Input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Item Pembelian</Label>
              <div className="grid gap-2">
                {lines.map((line, index) => (
                  <div key={index} className="grid grid-cols-12 items-center gap-2">
                    <Select
                      value={line.inventory_item_id}
                      onValueChange={(v) => updateLine(index, { inventory_item_id: v })}
                    >
                      <SelectTrigger className="col-span-6">
                        <SelectValue placeholder="Pilih item" />
                      </SelectTrigger>
                      <SelectContent>
                        {inventoryItems.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      className="col-span-2"
                      type="number"
                      placeholder="Jumlah"
                      value={line.quantity}
                      onChange={(e) => updateLine(index, { quantity: Number(e.target.value) })}
                    />
                    <Input
                      className="col-span-3"
                      type="number"
                      placeholder="Harga"
                      value={line.unit_price}
                      onChange={(e) => updateLine(index, { unit_price: Number(e.target.value) })}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="col-span-1 h-7 w-7 text-destructive"
                      onClick={() => removeLine(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={addLine}>
                <Plus className="mr-1 h-3 w-3" /> Tambah Baris
              </Button>
            </div>

            <div className="grid gap-2">
              <Label>Catatan</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="opsional" />
            </div>

            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-sm font-medium">Total</span>
              <span className="text-lg font-bold">{formatCurrency(total)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Batal</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Buat PO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receive PO dialog */}
      <Dialog open={!!receivePo} onOpenChange={(open) => !open && setReceivePo(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Terima: {receivePo?.po_number}</DialogTitle>
          </DialogHeader>
          {receivePo && (
            <div className="grid gap-4">
              <p className="text-sm text-muted-foreground">
                Pemasok: <span className="font-medium text-foreground">{receivePo.supplier?.company || receivePo.supplier?.name || "-"}</span>
              </p>
              <div className="grid gap-2">
                <Label>Jumlah yang diterima</Label>
                {(receivePo.items || []).map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2">
                    <span className="flex-1 text-sm">
                      {item.inventory_item?.name || "Item"}
                      <span className="block text-xs text-muted-foreground">
                        Dipesan: {formatNumber(Number(item.quantity))}
                      </span>
                    </span>
                    <Input
                      className="w-24"
                      type="number"
                      value={receivedQty[item.inventory_item_id] ?? 0}
                      onChange={(e) =>
                        setReceivedQty((prev) => ({
                          ...prev,
                          [item.inventory_item_id]: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceivePo(null)}>Batal</Button>
            <Button onClick={handleReceive} disabled={receiving}>
              {receiving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Terima
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
