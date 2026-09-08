"use client"

import * as React from "react"
import { createEmployee, updateEmployee, createEmployeeShift } from "@/lib/actions/index"
import { formatDate } from "@/lib/utils"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import toast from "react-hot-toast"
import { Plus, Search, Pencil, Loader2, Users } from "lucide-react"

interface Branch {
  id: string
  name: string
}

interface Employee {
  id: string
  name: string
  employee_id: string
  phone: string | null
  position: string | null
  branch_id: string | null
  status: string
  branch?: { name: string } | null
}

interface EmployeeShift {
  id: string
  employee_id: string
  shift_date: string
  start_time: string | null
  end_time: string | null
  notes: string | null
  employee?: { name: string; employee_id: string } | null
}

interface EmployeeForm {
  name: string
  employee_id: string
  phone: string
  position: string
  branch_id: string
  status: "ACTIVE" | "INACTIVE"
}

const EMPTY_FORM: EmployeeForm = {
  name: "",
  employee_id: "",
  phone: "",
  position: "",
  branch_id: "",
  status: "ACTIVE",
}

interface ShiftForm {
  employee_id: string
  shift_date: string
  start_time: string
  end_time: string
  notes: string
}

const EMPTY_SHIFT_FORM: ShiftForm = {
  employee_id: "",
  shift_date: "",
  start_time: "",
  end_time: "",
  notes: "",
}

interface EmployeesClientProps {
  employees: Employee[]
  branches: Branch[]
  shifts: EmployeeShift[]
  canCreate: boolean
  canEdit: boolean
}

export function EmployeesClient({ employees, branches, shifts, canCreate, canEdit }: EmployeesClientProps) {
  const [items, setItems] = React.useState(employees)
  const [shiftItems, setShiftItems] = React.useState(shifts)
  const [search, setSearch] = React.useState("")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState<EmployeeForm>(EMPTY_FORM)
  const [saving, setSaving] = React.useState(false)
  const [shiftDialogOpen, setShiftDialogOpen] = React.useState(false)
  const [shiftForm, setShiftForm] = React.useState<ShiftForm>(EMPTY_SHIFT_FORM)
  const [savingShift, setSavingShift] = React.useState(false)

  React.useEffect(() => {
    setItems(employees)
  }, [employees])

  React.useEffect(() => {
    setShiftItems(shifts)
  }, [shifts])

  const filtered = items.filter((e) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      e.name.toLowerCase().includes(q) ||
      e.employee_id.toLowerCase().includes(q) ||
      (e.phone || "").toLowerCase().includes(q) ||
      (e.position || "").toLowerCase().includes(q)
    )
  })

  const filteredShifts = shiftItems.filter((s) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.employee?.name.toLowerCase().includes(q) ||
      s.employee?.employee_id.toLowerCase().includes(q)
    )
  })

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEdit = (e: Employee) => {
    setEditingId(e.id)
    setForm({
      name: e.name,
      employee_id: e.employee_id,
      phone: e.phone || "",
      position: e.position || "",
      branch_id: e.branch_id || "",
      status: e.status as "ACTIVE" | "INACTIVE",
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    const result = editingId
      ? await updateEmployee(editingId, form)
      : await createEmployee(form)
    setSaving(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(editingId ? "Karyawan diperbarui" : "Karyawan dibuat")
    setDialogOpen(false)
    window.location.reload()
  }

  const openShiftDialog = (employeeId?: string) => {
    setShiftForm({ ...EMPTY_SHIFT_FORM, employee_id: employeeId || "" })
    setShiftDialogOpen(true)
  }

  const handleSaveShift = async () => {
    setSavingShift(true)
    const result = await createEmployeeShift(shiftForm)
    setSavingShift(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Shift dibuat")
    setShiftDialogOpen(false)
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-3xl font-black uppercase tracking-tighter leading-none">Karyawan</h2>
          <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Kelola data karyawan dan shift</p>
        </div>
        <div className="flex gap-2">
          {canCreate && (
            <>
              <Button variant="outline" size="sm" onClick={() => openShiftDialog()}>
                <Plus className="mr-2 h-4 w-4" /> Shift
              </Button>
              <Button size="sm" onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" /> Tambah Karyawan
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Cari karyawan..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Tabs defaultValue="employees">
        <TabsList>
          <TabsTrigger value="employees">Karyawan</TabsTrigger>
          <TabsTrigger value="shifts">Shift</TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Users className="mx-auto mb-2 h-8 w-8" />
                <p>Belum ada karyawan</p>
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto border-3 border-foreground shadow-[5px_5px_0_0_hsl(var(--foreground))]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>ID Karyawan</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead>Jabatan</TableHead>
                    <TableHead>Cabang</TableHead>
                    <TableHead>Status</TableHead>
                    {canEdit && <TableHead className="text-right">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.name}</TableCell>
                      <TableCell className="text-muted-foreground">{e.employee_id}</TableCell>
                      <TableCell>{e.phone || "-"}</TableCell>
                      <TableCell>{e.position || "-"}</TableCell>
                      <TableCell>{e.branch?.name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={e.status === "ACTIVE" ? "success" : "neutral"}>
                          {e.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(e)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="shifts">
          {filteredShifts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Users className="mx-auto mb-2 h-8 w-8" />
                <p>Belum ada shift</p>
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto border-3 border-foreground shadow-[5px_5px_0_0_hsl(var(--foreground))]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Karyawan</TableHead>
                    <TableHead>ID Karyawan</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Mulai</TableHead>
                    <TableHead>Selesai</TableHead>
                    <TableHead>Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShifts.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.employee?.name || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{s.employee?.employee_id || "-"}</TableCell>
                      <TableCell>{formatDate(s.shift_date)}</TableCell>
                      <TableCell>{s.start_time || "-"}</TableCell>
                      <TableCell>{s.end_time || "-"}</TableCell>
                      <TableCell>{s.notes || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Employee form dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Karyawan" : "Tambah Karyawan"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Nama</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>ID Karyawan</Label>
                <Input value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Telepon</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Jabatan</Label>
              <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
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
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "ACTIVE" | "INACTIVE" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Aktif</SelectItem>
                    <SelectItem value="INACTIVE">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
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

      {/* Shift form dialog */}
      <Dialog open={shiftDialogOpen} onOpenChange={setShiftDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah Shift</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Karyawan</Label>
              <Select value={shiftForm.employee_id} onValueChange={(v) => setShiftForm({ ...shiftForm, employee_id: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih karyawan" /></SelectTrigger>
                <SelectContent>
                  {items.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Tanggal</Label>
              <Input type="date" value={shiftForm.shift_date} onChange={(e) => setShiftForm({ ...shiftForm, shift_date: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Jam Mulai</Label>
                <Input type="time" value={shiftForm.start_time} onChange={(e) => setShiftForm({ ...shiftForm, start_time: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Jam Selesai</Label>
                <Input type="time" value={shiftForm.end_time} onChange={(e) => setShiftForm({ ...shiftForm, end_time: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Catatan</Label>
              <Textarea value={shiftForm.notes} onChange={(e) => setShiftForm({ ...shiftForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShiftDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSaveShift} disabled={savingShift}>
              {savingShift ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
