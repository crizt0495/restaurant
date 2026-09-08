"use client"

import * as React from "react"
import { createProduct, updateProduct, deleteProduct, createCategory } from "@/lib/actions/index"
import { formatCurrency, getInitials } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
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
import { Switch } from "@/components/ui/switch"
import { Pagination } from "@/components/ui/pagination"
import toast from "react-hot-toast"
import { Plus, Search, Pencil, Trash2, Star, Loader2, Utensils } from "lucide-react"

interface Category {
  id: string
  name: string
}

interface ProductForm {
  name: string
  category_id: string
  sku: string
  barcode: string
  description: string
  selling_price: number
  purchase_price: number
  cost_price: number
  tax_percentage: number
  unit: string
  stock_tracking: boolean
  minimum_stock: number
  is_active: boolean
  is_favorite: boolean
}

const EMPTY_FORM: ProductForm = {
  name: "",
  category_id: "",
  sku: "",
  barcode: "",
  description: "",
  selling_price: 0,
  purchase_price: 0,
  cost_price: 0,
  tax_percentage: 11,
  unit: "pcs",
  stock_tracking: true,
  minimum_stock: 0,
  is_active: true,
  is_favorite: false,
}

interface ProductsClientProps {
  products: any[]
  categories: Category[]
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
}

export function ProductsClient({ products, categories, canCreate, canEdit, canDelete }: ProductsClientProps) {
  const [items, setItems] = React.useState(products)
  const [search, setSearch] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState("")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState<ProductForm>(EMPTY_FORM)
  const [saving, setSaving] = React.useState(false)
  const [categoryDialog, setCategoryDialog] = React.useState(false)
  const [newCategory, setNewCategory] = React.useState("")

  React.useEffect(() => {
    setItems(products)
  }, [products])

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

  const filtered = items.filter((p) => {
    const matchesCat = !categoryFilter || p.category_id === categoryFilter
    const matchesSearch =
      !debouncedSearch ||
      p.name.toLowerCase().includes(debouncedSearch) ||
      (p.sku || "").toLowerCase().includes(debouncedSearch)
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

  const openEdit = (p: any) => {
    setEditingId(p.id)
    setForm({
      name: p.name,
      category_id: p.category_id || "",
      sku: p.sku,
      barcode: p.barcode || "",
      description: p.description || "",
      selling_price: Number(p.selling_price),
      purchase_price: Number(p.purchase_price),
      cost_price: Number(p.cost_price),
      tax_percentage: Number(p.tax_percentage),
      unit: p.unit || "pcs",
      stock_tracking: p.stock_tracking,
      minimum_stock: Number(p.minimum_stock),
      is_active: p.is_active,
      is_favorite: p.is_favorite,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    const result = editingId
      ? await updateProduct(editingId, form)
      : await createProduct(form)
    setSaving(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(editingId ? "Produk diperbarui" : "Produk dibuat")
    setDialogOpen(false)
    window.location.reload()
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Hapus produk ${name}?`)) return
    const result = await deleteProduct(id)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Produk dihapus")
    window.location.reload()
  }

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return
    const result = await createCategory(newCategory)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Kategori dibuat")
    setNewCategory("")
    setCategoryDialog(false)
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-3xl font-black uppercase tracking-tighter leading-none">Produk</h2>
          <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Kelola menu produk</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setCategoryDialog(true)}>
            Kategori
          </Button>
          {canCreate && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Tambah Produk
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Cari produk..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Semua kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Semua kategori</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Utensils className="mx-auto mb-2 h-8 w-8" />
            <p>Belum ada produk</p>
          </CardContent>
        </Card>
      ) : (
        <>
        <div className="overflow-x-auto border-3 border-foreground shadow-[5px_5px_0_0_hsl(var(--foreground))]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Harga Jual</TableHead>
                <TableHead className="text-right">Harga Pokok</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {p.is_favorite && <Star className="h-3 w-3 fill-warning text-warning" />}
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.sku}</TableCell>
                  <TableCell>{p.categories?.name || "-"}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(p.selling_price)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(p.cost_price)}</TableCell>
                  <TableCell>
                    <Badge variant={p.is_active ? "success" : "neutral"}>{p.is_active ? "Aktif" : "Nonaktif"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {canEdit && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(p.id, p.name)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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

      {/* Product form dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Produk" : "Tambah Produk"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Nama Produk</Label>
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
                <Label>Kategori</Label>
                <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Unit</Label>
                <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-2">
                <Label>Harga Jual</Label>
                <Input type="number" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: Number(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label>Harga Beli</Label>
                <Input type="number" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: Number(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label>Harga Pokok</Label>
                <Input type="number" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Deskripsi</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Stock tracking</Label>
              <Switch checked={form.stock_tracking} onCheckedChange={(v) => setForm({ ...form, stock_tracking: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Favorit (tampil di POS)</Label>
              <Switch checked={form.is_favorite} onCheckedChange={(v) => setForm({ ...form, is_favorite: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Aktif</Label>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
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

      {/* Category dialog */}
      <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah Kategori</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <Input placeholder="Nama kategori" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
            <div className="grid gap-1.5">
              {categories.map((c) => (
                <div key={c.id} className="flex items-center justify-between border-2 border-foreground bg-card px-3 py-2 text-sm shadow-[2px_2px_0_0_hsl(var(--foreground))]">
                  <span>{c.name}</span>
                  <Badge variant="secondary">{getInitials(c.name)}</Badge>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialog(false)}>Tutup</Button>
            <Button onClick={handleAddCategory}>Tambah Kategori</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}