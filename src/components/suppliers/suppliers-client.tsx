"use client"

import * as React from "react"
import { createSupplier, updateSupplier, deleteSupplier } from "@/lib/actions/index"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import toast from "react-hot-toast"
import { Plus, Search, Pencil, Trash2, Loader2, Building2 } from "lucide-react"

interface Supplier {
  id: string
  name: string
  company: string | null
  phone: string | null
  email: string | null
  address: string | null
  npwp: string | null
  payment_terms: string | null
  notes: string | null
  is_active: boolean
}

const EMPTY_FORM = {
  name: "",
  company: "",
  phone: "",
  email: "",
  address: "",
  npwp: "",
  payment_terms: "",
  notes: "",
}

interface SuppliersClientProps {
  suppliers: Supplier[]
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
}

export function SuppliersClient({ suppliers, canCreate, canEdit, canDelete }: SuppliersClientProps) {
  const [list, setList] = React.useState<Supplier[]>(suppliers)
  const [search, setSearch] = React.useState("")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState(EMPTY_FORM)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    setList(suppliers)
  }, [suppliers])

  const filtered = list.filter((s) => {
    if (!search) return true
    return (
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.company || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.phone || "").toLowerCase().includes(search.toLowerCase())
    )
  })

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEdit = (s: Supplier) => {
    setEditingId(s.id)
    setForm({
      name: s.name,
      company: s.company || "",
      phone: s.phone || "",
      email: s.email || "",
      address: s.address || "",
      npwp: s.npwp || "",
      payment_terms: s.payment_terms || "",
      notes: s.notes || "",
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Nama wajib diisi")
      return
    }
    setSaving(true)
    const payload = {
      ...form,
      company: form.company || null,
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
      npwp: form.npwp || null,
      payment_terms: form.payment_terms || null,
      notes: form.notes || null,
    }
    const result = editingId
      ? await updateSupplier(editingId, payload)
      : await createSupplier(payload)
    setSaving(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(editingId ? "Supplier diperbarui" : "Supplier dibuat")
    setDialogOpen(false)
    window.location.reload()
  }

  const handleDelete = async (s: Supplier) => {
    if (!window.confirm(`Hapus supplier ${s.name}?`)) return
    const result = await deleteSupplier(s.id)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Supplier dihapus")
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-3xl font-black uppercase tracking-tighter leading-none">Pemasok</h2>
          <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Kelola pemasok</p>
        </div>
        {canCreate && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Pemasok
          </Button>
        )}
      </div>

      <div className="relative flex-1 sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari pemasok..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Building2 className="mx-auto mb-2 h-8 w-8" />
            <p>Belum ada pemasok</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto border-3 border-foreground shadow-[5px_5px_0_0_hsl(var(--foreground))]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Perusahaan</TableHead>
                <TableHead>Telepon</TableHead>
                <TableHead>Term Pembayaran</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">{s.company || "-"}</TableCell>
                  <TableCell>{s.phone || "-"}</TableCell>
                  <TableCell>{s.payment_terms || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={s.is_active ? "success" : "neutral"}>
                      {s.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {canEdit && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleDelete(s)}
                        >
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
      )}

      {/* Supplier form dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Pemasok" : "Tambah Pemasok"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Nama</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Perusahaan</Label>
                <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Telepon</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>NPWP</Label>
                <Input value={form.npwp} onChange={(e) => setForm({ ...form, npwp: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Term Pembayaran</Label>
                <Input
                  value={form.payment_terms}
                  onChange={(e) => setForm({ ...form, payment_terms: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Alamat</Label>
              <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Catatan</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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
    </div>
  )
}
