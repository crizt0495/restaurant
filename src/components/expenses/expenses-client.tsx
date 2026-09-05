"use client"

import * as React from "react"
import { createExpense, deleteExpense } from "@/lib/actions/index"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import toast from "react-hot-toast"
import { Plus, Search, Trash2, Loader2, Receipt } from "lucide-react"

interface Branch {
  id: string
  name: string
}

interface Category {
  id: string
  name: string
}

interface Expense {
  id: string
  amount: number
  description: string | null
  expense_date: string
  category_id: string | null
  branch_id: string | null
  category?: { name: string } | null
  branch?: { name: string } | null
}

interface ExpenseForm {
  category_id: string
  amount: number
  description: string
  expense_date: string
  branch_id: string
}

const EMPTY_FORM: ExpenseForm = {
  category_id: "",
  amount: 0,
  description: "",
  expense_date: new Date().toISOString().slice(0, 10),
  branch_id: "",
}

interface ExpensesClientProps {
  expenses: Expense[]
  branches: Branch[]
  categories: Category[]
  canCreate: boolean
}

export function ExpensesClient({ expenses, branches, categories, canCreate }: ExpensesClientProps) {
  const [items, setItems] = React.useState(expenses)
  const [search, setSearch] = React.useState("")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [form, setForm] = React.useState<ExpenseForm>(EMPTY_FORM)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    setItems(expenses)
  }, [expenses])

  const filtered = items.filter((e) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (e.category?.name || "").toLowerCase().includes(q) ||
      (e.description || "").toLowerCase().includes(q) ||
      (e.branch?.name || "").toLowerCase().includes(q)
    )
  })

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    const result = await createExpense(form)
    setSaving(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Pengeluaran dibuat")
    setDialogOpen(false)
    window.location.reload()
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Hapus pengeluaran ini?")) return
    const result = await deleteExpense(id)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Pengeluaran dihapus")
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pengeluaran</h2>
          <p className="text-sm text-muted-foreground">Kelola data pengeluaran</p>
        </div>
        {canCreate && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Pengeluaran
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Cari pengeluaran..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Receipt className="mx-auto mb-2 h-8 w-8" />
            <p>Belum ada pengeluaran</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead>Cabang</TableHead>
                {canCreate && <TableHead className="text-right">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{formatDate(e.expense_date)}</TableCell>
                  <TableCell>{e.category?.name || "-"}</TableCell>
                  <TableCell>{e.description || "-"}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(Number(e.amount))}</TableCell>
                  <TableCell>{e.branch?.name || "-"}</TableCell>
                  {canCreate && (
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(e.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Expense form dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah Pengeluaran</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
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
                <Label>Jumlah</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Tanggal</Label>
                <Input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Cabang</Label>
                <Select value={form.branch_id} onValueChange={(v) => setForm({ ...form, branch_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih cabang" /></SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Deskripsi</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
