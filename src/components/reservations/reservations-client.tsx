"use client"

import * as React from "react"
import { createReservation, updateReservationStatus } from "@/lib/actions/index"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import toast from "react-hot-toast"
import { Plus, Search, CalendarDays, MoreHorizontal, Loader2 } from "lucide-react"
import type { ReservationStatus } from "@/types"

interface TableOption {
  id: string
  number: string
  capacity?: number
}

interface ReservationRow {
  id: string
  customer_name: string
  customer_phone: string
  reservation_date: string
  reservation_time: string
  guests: number
  table_id?: string
  notes?: string
  status: ReservationStatus
  table?: { number: string }
}

interface ReservationsClientProps {
  reservations: ReservationRow[]
  tables: TableOption[]
  canCreate: boolean
  canEdit: boolean
}

const STATUS_LABELS: Record<ReservationStatus, string> = {
  PENDING: "Menunggu",
  CONFIRMED: "Dikonfirmasi",
  SEATED: "Duduk",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
  NO_SHOW: "Tidak Hadir",
}

const STATUS_VARIANT: Record<ReservationStatus, "warning" | "info" | "success" | "neutral" | "destructive"> = {
  PENDING: "warning",
  CONFIRMED: "info",
  SEATED: "success",
  COMPLETED: "neutral",
  CANCELLED: "destructive",
  NO_SHOW: "destructive",
}

const ALL_STATUSES: ReservationStatus[] = [
  "PENDING",
  "CONFIRMED",
  "SEATED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
]

interface ReservationForm {
  customer_name: string
  customer_phone: string
  reservation_date: string
  reservation_time: string
  guests: number
  table_id: string
  notes: string
}

const EMPTY_FORM: ReservationForm = {
  customer_name: "",
  customer_phone: "",
  reservation_date: "",
  reservation_time: "",
  guests: 2,
  table_id: "",
  notes: "",
}

export function ReservationsClient({
  reservations,
  tables,
  canCreate,
  canEdit,
}: ReservationsClientProps) {
  const [items, setItems] = React.useState(reservations)
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [form, setForm] = React.useState<ReservationForm>(EMPTY_FORM)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    setItems(reservations)
  }, [reservations])

  const filtered = items.filter((r) => {
    const matchesStatus = !statusFilter || r.status === statusFilter
    const matchesSearch =
      !search ||
      r.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      r.customer_phone.includes(search)
    return matchesStatus && matchesSearch
  })

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.customer_name.trim()) {
      toast.error("Nama pelanggan wajib diisi")
      return
    }
    if (!form.reservation_date) {
      toast.error("Tanggal reservasi wajib diisi")
      return
    }
    if (!form.reservation_time) {
      toast.error("Jam reservasi wajib diisi")
      return
    }
    setSaving(true)
    const result = await createReservation({
      customer_name: form.customer_name,
      customer_phone: form.customer_phone,
      reservation_date: form.reservation_date,
      reservation_time: form.reservation_time,
      guests: form.guests,
      table_id: form.table_id || undefined,
      notes: form.notes || undefined,
    })
    setSaving(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Reservasi dibuat")
    setDialogOpen(false)
    window.location.reload()
  }

  const handleStatusChange = async (id: string, status: ReservationStatus) => {
    const result = await updateReservationStatus(id, status)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(`Status diubah ke ${STATUS_LABELS[status]}`)
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-3xl font-black uppercase tracking-tighter leading-none">Reservasi</h2>
          <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Kelola reservasi pelanggan</p>
        </div>
        {canCreate && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Reservasi
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari nama atau telepon..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Semua status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Semua status</SelectItem>
            {ALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CalendarDays className="mx-auto mb-2 h-8 w-8" />
            <p>Belum ada reservasi</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto border-3 border-foreground shadow-[5px_5px_0_0_hsl(var(--foreground))]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Pelanggan</TableHead>
                <TableHead>Telepon</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Jam</TableHead>
                <TableHead className="text-right">Tamu</TableHead>
                <TableHead>Meja</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Catatan</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.customer_name}</TableCell>
                  <TableCell className="text-muted-foreground">{r.customer_phone}</TableCell>
                  <TableCell>{formatDate(r.reservation_date)}</TableCell>
                  <TableCell>{r.reservation_time}</TableCell>
                  <TableCell className="text-right">{r.guests}</TableCell>
                  <TableCell>{r.table?.number || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[r.status]}>
                      {STATUS_LABELS[r.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate text-muted-foreground">
                    {r.notes || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {canEdit && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {ALL_STATUSES.map((s) => (
                            <DropdownMenuItem
                              key={s}
                              onClick={() => handleStatusChange(r.id, s)}
                              disabled={r.status === s}
                            >
                              {STATUS_LABELS[s]}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
            <DialogTitle>Tambah Reservasi</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Nama Pelanggan</Label>
              <Input
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                placeholder="Nama pelanggan"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Telepon</Label>
                <Input
                  value={form.customer_phone}
                  onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                  placeholder="Nomor telepon"
                />
              </div>
              <div className="grid gap-2">
                <Label>Jumlah Tamu</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.guests}
                  onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Tanggal</Label>
                <Input
                  type="date"
                  value={form.reservation_date}
                  onChange={(e) => setForm({ ...form, reservation_date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Jam</Label>
                <Input
                  type="time"
                  value={form.reservation_time}
                  onChange={(e) => setForm({ ...form, reservation_time: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Meja (opsional)</Label>
              <Select
                value={form.table_id}
                onValueChange={(v) => setForm({ ...form, table_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tanpa meja" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      Meja {t.number}
                      {t.capacity ? ` (${t.capacity} orang)` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Catatan (opsional)</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Catatan reservasi..."
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
