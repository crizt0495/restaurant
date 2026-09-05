"use client"

import * as React from "react"
import {
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  adjustStock,
} from "@/lib/actions/index"
import { formatCurrency, formatNumber } from "@/lib/utils"
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
import { Pagination } from "@/components/ui/pagination"
import toast from "react-hot-toast"
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  PackageSearch,
  ArrowDownUp,
} from "lucide-react"

interface InventoryItem {
  id: string
  name: string
  sku: string
  unit: string
  quantity: number
  minimum_stock: number
  maximum_stock: number | null
  cost_price: number
  barcode: string | null
  category: string
  is_active: boolean
}

const CATEGORIES = ["RAW", "PACKAGING", "FINISHED_GOODS"]

const EMPTY_FORM = {
  name: "",
  sku: "",
  unit: "pcs",
  quantity: 0,
  minimum_stock: 0,
  maximum_stock: 0,
  cost_price: 0,
  barcode: "",
  category: "RAW",
}

interface InventoryClientProps {
  items: InventoryItem[]
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canAdjust: boolean
}

function categoryVariant(category: string): "success" | "warning" | "info" | "neutral" {
  switch (category) {
    case "RAW":
      return "warning"
    case "PACKAGING":
      return "info"
    case "FINISHED_GOODS":
      return "success"
    default:
      return "neutral"
  }
}

export function InventoryClient({ items, canCreate, canEdit, canDelete, canAdjust }: InventoryClientProps) {
  const [list, setList] = React.useState<InventoryItem[]>(items)
  const [search, setSearch] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState("")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState(EMPTY_FORM)
  const [saving, setSaving] = React.useState(false)

  const [adjustItem, setAdjustItem] = React.useState<InventoryItem | null>(null)
  const [adjustValue, setAdjustValue] = React.useState("")
  const [adjustNotes, setAdjustNotes] = React.useState("")
  const [adjustType, setAdjustType] = React.useState<"STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT" | "TRANSFER" | "WASTE">("ADJUSTMENT")
  const [adjusting, setAdjusting] = React.useState(false)

  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const PAGE_SIZE = 20

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 250)
    return () => clearTimeout(t)
  }, [search])

  React.useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, categoryFilter])

  React.useEffect(() => {
    setList(items)
  }, [items])

  const filtered = list.filter((i) => {
    const matchesCat = !categoryFilter || i.category === categoryFilter
    const matchesSearch =
      !debouncedSearch ||
      i.name.toLowerCase().includes(debouncedSearch) ||
      (i.sku || "").toLowerCase().includes(debouncedSearch)
    return matchesCat && matchesSearch
  })

  const paginated = React.useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, currentPage])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEdit = (i: InventoryItem) => {
    setEditingId(i.id)
    setForm({
      name: i.name,
      sku: i.sku,
      unit: i.unit || "pcs",
      quantity: Number(i.quantity),
      minimum_stock: Number(i.minimum_stock),
      maximum_stock: i.maximum_stock != null ? Number(i.maximum_stock) : 0,
      cost_price: Number(i.cost_price),
      barcode: i.barcode || "",
      category: i.category || "RAW",
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.sku.trim()) {
      toast.error("Nama dan SKU wajib diisi")
      return
    }
    setSaving(true)
    const payload = {
      ...form,
      maximum_stock: form.maximum_stock > 0 ? form.maximum_stock : null,
      barcode: form.barcode || null,
    }
    const result = editingId
      ? await updateInventoryItem(editingId, payload)
      : await createInventoryItem(payload)
    setSaving(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(editingId ? "Item diperbarui" : "Item dibuat")
    setDialogOpen(false)
    window.location.reload()
  }

  const handleDelete = async (i: InventoryItem) => {
    if (!window.confirm(`Hapus item ${i.name}?`)) return
    const result = await deleteInventoryItem(i.id)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Item dihapus")
    window.location.reload()
  }

  const handleAdjust = async () => {
    if (!adjustItem) return
    const value = parseFloat(adjustValue)
    if (isNaN(value) || value === 0) {
      toast.error("Masukkan angka penyesuaian (positif/negatif)")
      return
    }
    setAdjusting(true)
    const result = await adjustStock(adjustItem.id, value, adjustNotes || undefined, adjustType)
    setAdjusting(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Stok disesuaikan")
    setAdjustItem(null)
    setAdjustValue("")
    setAdjustNotes("")
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Inventory</h2>
          <p className="text-sm text-muted-foreground">Kelola stok bahan baku dan barang</p>
        </div>
        {canCreate && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Item
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari item..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Semua kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Semua kategori</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <PackageSearch className="mx-auto mb-2 h-8 w-8" />
            <p>Belum ada item inventory</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Min Stock</TableHead>
                  <TableHead className="text-right">Harga Pokok</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((i) => {
                  const isLow = Number(i.quantity) <= Number(i.minimum_stock)
                  return (
                    <TableRow key={i.id}>
                      <TableCell className="font-medium">{i.name}</TableCell>
                      <TableCell className="text-muted-foreground">{i.sku}</TableCell>
                      <TableCell>{i.unit}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatNumber(Number(i.quantity))}
                        {isLow && <span className="ml-1 text-xs text-destructive">(low)</span>}
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(Number(i.minimum_stock))}</TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(i.cost_price))}</TableCell>
                      <TableCell>
                        <Badge variant={categoryVariant(i.category)}>{i.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={i.is_active ? "success" : "neutral"}>
                          {i.is_active ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {canAdjust && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                setAdjustItem(i)
                                setAdjustValue("")
                                setAdjustNotes("")
                              }}
                            >
                              <ArrowDownUp className="h-3 w-3" />
                            </Button>
                          )}
                          {canEdit && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(i)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => handleDelete(i)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          <Pagination
            totalItems={filtered.length}
            itemsPerPage={PAGE_SIZE}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* Item form dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Item" : "Tambah Item"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Nama Item</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>SKU</Label>
                <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Barcode</Label>
                <Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Unit</Label>
                <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Cost Price</Label>
                <Input
                  type="number"
                  value={form.cost_price}
                  onChange={(e) => setForm({ ...form, cost_price: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Minimum Stock</Label>
                <Input
                  type="number"
                  value={form.minimum_stock}
                  onChange={(e) => setForm({ ...form, minimum_stock: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Maximum Stock</Label>
                <Input
                  type="number"
                  value={form.maximum_stock}
                  onChange={(e) => setForm({ ...form, maximum_stock: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock adjustment dialog */}
      <Dialog open={!!adjustItem} onOpenChange={(open) => !open && setAdjustItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stok: {adjustItem?.name}</DialogTitle>
          </DialogHeader>
          {adjustItem && (
            <div className="grid gap-4">
              <p className="text-sm text-muted-foreground">
                Qty saat ini: <span className="font-semibold text-foreground">{formatNumber(Number(adjustItem.quantity))}</span> {adjustItem.unit}
              </p>
              <div className="grid gap-2">
                <Label>Tipe Penyesuaian</Label>
                <Select value={adjustType} onValueChange={(v) => setAdjustType(v as typeof adjustType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADJUSTMENT">Adjustment (Umum)</SelectItem>
                    <SelectItem value="STOCK_IN">Stock In</SelectItem>
                    <SelectItem value="STOCK_OUT">Stock Out</SelectItem>
                    <SelectItem value="WASTE">Waste / Rusak</SelectItem>
                    <SelectItem value="TRANSFER">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Jumlah (positif/tambah, negatif/kurang)</Label>
                <Input
                  type="number"
                  placeholder="Contoh: 10 atau -5"
                  value={adjustValue}
                  onChange={(e) => setAdjustValue(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Keterangan</Label>
                <Input
                  placeholder="Opsional"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustItem(null)}>Batal</Button>
            <Button onClick={handleAdjust} disabled={adjusting}>
              {adjusting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Terapkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
