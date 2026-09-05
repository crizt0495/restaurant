"use client"

import * as React from "react"
import { createCategory, deleteCategory, updateCategory } from "@/lib/actions/categories"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import toast from "react-hot-toast"
import { Plus, Utensils, Loader2, Trash2, Pencil } from "lucide-react"

interface Category {
  id: string
  name: string
  description?: string
  icon?: string
  is_active: boolean
}

interface CategoriesClientProps {
  categories: Category[]
  productCount: Record<string, number>
}

export function CategoriesClient({ categories, productCount }: CategoriesClientProps) {
  const [items, setItems] = React.useState(categories)
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Category | null>(null)
  const [name, setName] = React.useState("")
  const [described, setDescribed] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => setItems(categories), [categories])

  const openCreate = () => {
    setEditing(null)
    setName("")
    setDescribed("")
    setOpen(true)
  }

  const openEdit = (c: Category) => {
    setEditing(c)
    setName(c.name)
    setDescribed(c.description || "")
    setOpen(true)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Nama kategori wajib")
      return
    }
    setSaving(true)
    let result
    if (editing) {
      result = await updateCategory(editing.id, name, described)
    } else {
      result = await createCategory(name)
    }
    setSaving(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(editing ? "Kategori diperbarui" : "Kategori dibuat")
    setOpen(false)
    window.location.reload()
  }

  const handleDelete = async (id: string, catName: string) => {
    if (!window.confirm(`Hapus kategori ${catName}?`)) return
    const result = await deleteCategory(id)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Kategori dihapus")
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Kategori</h2>
          <p className="text-sm text-muted-foreground">Manajemen kategori produk</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Kategori
        </Button>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Utensils className="mx-auto mb-2 h-8 w-8" />
            <p>Belum ada kategori</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((cat) => (
            <Card key={cat.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{cat.name}</p>
                    <Badge variant={cat.is_active ? "success" : "neutral"}>
                      {cat.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {productCount[cat.id] || 0} produk
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(cat)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => handleDelete(cat.id, cat.name)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Kategori" : "Tambah Kategori"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label>Nama</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Deskripsi</Label>
              <Input value={described} onChange={(e) => setDescribed(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
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