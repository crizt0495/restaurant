"use client"

import * as React from "react"
import {
  createPromotion,
  updatePromotion,
  togglePromotion,
} from "@/lib/actions/index"
import { formatDate, formatCurrency } from "@/lib/utils"
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
import { Switch } from "@/components/ui/switch"
import toast from "react-hot-toast"
import { Plus, Search, Pencil, Loader2, Percent } from "lucide-react"

type PromotionType = "PERCENTAGE" | "FIXED" | "BUY_ONE_GET_ONE" | "BUY_X_GET_Y" | "HAPPY_HOUR"

interface ProductOption {
  id: string
  name: string
}

interface CategoryOption {
  id: string
  name: string
}

interface PromotionRow {
  id: string
  name: string
  type: PromotionType
  value: number
  buy_quantity?: number
  get_quantity?: number
  product_id?: string
  category_id?: string
  start_date?: string
  end_date?: string
  start_time?: string
  end_time?: string
  is_active: boolean
  product?: { name: string }
  category?: { name: string }
}

interface PromotionsClientProps {
  promotions: PromotionRow[]
  products: ProductOption[]
  categories: CategoryOption[]
  canCreate: boolean
  canEdit: boolean
}

const TYPE_LABELS: Record<PromotionType, string> = {
  PERCENTAGE: "Persen",
  FIXED: "Nominal",
  BUY_ONE_GET_ONE: "Beli 1 Gratis 1",
  BUY_X_GET_Y: "Beli X Gratis Y",
  HAPPY_HOUR: "Jam Suka-Suka",
}

const TYPE_VARIANT: Record<PromotionType, "info" | "success" | "warning" | "secondary" | "default"> = {
  PERCENTAGE: "info",
  FIXED: "success",
  BUY_ONE_GET_ONE: "warning",
  BUY_X_GET_Y: "warning",
  HAPPY_HOUR: "secondary",
}

const ALL_TYPES: PromotionType[] = [
  "PERCENTAGE",
  "FIXED",
  "BUY_ONE_GET_ONE",
  "BUY_X_GET_Y",
  "HAPPY_HOUR",
]

interface PromotionForm {
  name: string
  type: PromotionType
  value: number
  buy_quantity: number
  get_quantity: number
  product_id: string
  category_id: string
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  is_active: boolean
}

const EMPTY_FORM: PromotionForm = {
  name: "",
  type: "PERCENTAGE",
  value: 0,
  buy_quantity: 2,
  get_quantity: 1,
  product_id: "",
  category_id: "",
  start_date: "",
  end_date: "",
  start_time: "",
  end_time: "",
  is_active: true,
}

export function PromotionsClient({
  promotions,
  products,
  categories,
  canCreate,
  canEdit,
}: PromotionsClientProps) {
  const [items, setItems] = React.useState(promotions)
  const [search, setSearch] = React.useState("")
  const [typeFilter, setTypeFilter] = React.useState("")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState<PromotionForm>(EMPTY_FORM)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    setItems(promotions)
  }, [promotions])

  const filtered = items.filter((p) => {
    const matchesType = !typeFilter || p.type === typeFilter
    const matchesSearch =
      !search || p.name.toLowerCase().includes(search.toLowerCase())
    return matchesType && matchesSearch
  })

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEdit = (p: PromotionRow) => {
    setEditingId(p.id)
    setForm({
      name: p.name,
      type: p.type,
      value: Number(p.value),
      buy_quantity: Number(p.buy_quantity) || 2,
      get_quantity: Number(p.get_quantity) || 1,
      product_id: p.product_id || "",
      category_id: p.category_id || "",
      start_date: p.start_date || "",
      end_date: p.end_date || "",
      start_time: p.start_time || "",
      end_time: p.end_time || "",
      is_active: p.is_active,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Nama promosi wajib diisi")
      return
    }
    setSaving(true)
    const payload = {
      name: form.name,
      type: form.type,
      value: form.value,
      buy_quantity: form.buy_quantity,
      get_quantity: form.get_quantity,
      product_id: form.product_id || undefined,
      category_id: form.category_id || undefined,
      start_date: form.start_date || undefined,
      end_date: form.end_date || undefined,
      start_time: form.start_time || undefined,
      end_time: form.end_time || undefined,
      is_active: form.is_active,
    }
    const result = editingId
      ? await updatePromotion(editingId, payload)
      : await createPromotion(payload)
    setSaving(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(editingId ? "Promosi diperbarui" : "Promosi dibuat")
    setDialogOpen(false)
    window.location.reload()
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    const result = await togglePromotion(id, isActive)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(isActive ? "Promosi diaktifkan" : "Promosi dinonaktifkan")
    window.location.reload()
  }

  const formatValue = (p: PromotionRow) => {
    if (p.type === "PERCENTAGE") return `${p.value}%`
    if (p.type === "FIXED") return formatCurrency(p.value)
    if (p.type === "BUY_ONE_GET_ONE") return "Gratis 1"
    if (p.type === "BUY_X_GET_Y") return `Beli ${p.buy_quantity || "?"} Gratis ${p.get_quantity || "?"}`
    if (p.type === "HAPPY_HOUR") return `${p.value}%`
    return String(p.value)
  }

  const showValueField = form.type === "PERCENTAGE" || form.type === "FIXED" || form.type === "HAPPY_HOUR"
  const showBuyGet = form.type === "BUY_X_GET_Y" || form.type === "BUY_ONE_GET_ONE"

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Promosi</h2>
          <p className="text-sm text-muted-foreground">Kelola promosi dan diskon</p>
        </div>
        {canCreate && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Promosi
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari promosi..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Semua tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Semua tipe</SelectItem>
            {ALL_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Percent className="mx-auto mb-2 h-8 w-8" />
            <p>Belum ada promosi</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead className="text-right">Nilai</TableHead>
                <TableHead>Produk / Kategori</TableHead>
                <TableHead>Tanggal Mulai</TableHead>
                <TableHead>Tanggal Selesai</TableHead>
                <TableHead>Aktif</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>
                    <Badge variant={TYPE_VARIANT[p.type]}>{TYPE_LABELS[p.type]}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{formatValue(p)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.product?.name || p.category?.name || "-"}
                  </TableCell>
                  <TableCell>{p.start_date ? formatDate(p.start_date) : "-"}</TableCell>
                  <TableCell>{p.end_date ? formatDate(p.end_date) : "-"}</TableCell>
                  <TableCell>
                    <Switch
                      checked={p.is_active}
                      onCheckedChange={(v) => handleToggle(p.id, v)}
                      disabled={!canEdit}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEdit(p)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Promosi" : "Tambah Promosi"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Nama Promosi</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nama promosi"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Tipe</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v as PromotionType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {showValueField && (
                <div className="grid gap-2">
                  <Label>{form.type === "PERCENTAGE" || form.type === "HAPPY_HOUR" ? "Persen (%)" : "Nominal (Rp)"}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                  />
                </div>
              )}
              {showBuyGet && (
                <>
                  <div className="grid gap-2">
                    <Label>Jumlah Beli</Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.buy_quantity}
                      onChange={(e) => setForm({ ...form, buy_quantity: Number(e.target.value) })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Jumlah Gratis</Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.get_quantity}
                      onChange={(e) => setForm({ ...form, get_quantity: Number(e.target.value) })}
                    />
                  </div>
                </>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Produk (opsional)</Label>
                <Select
                  value={form.product_id}
                  onValueChange={(v) => setForm({ ...form, product_id: v, category_id: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Semua produk" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Kategori (opsional)</Label>
                <Select
                  value={form.category_id}
                  onValueChange={(v) => setForm({ ...form, category_id: v, product_id: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Semua kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Tanggal Mulai</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Tanggal Selesai</Label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Jam Mulai</Label>
                <Input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Jam Selesai</Label>
                <Input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Aktif</Label>
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
