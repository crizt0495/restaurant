"use client"

import * as React from "react"
import { createCustomer, updateCustomer, redeemPoints } from "@/lib/actions/index"
import { formatCurrency } from "@/lib/utils"
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
import toast from "react-hot-toast"
import { Plus, Search, Pencil, Gift, Loader2, Users } from "lucide-react"

interface CustomerForm {
  name: string
  phone: string
  email: string
  address: string
  birthday: string
  notes: string
  is_member: boolean
  member_level: string
}

const EMPTY_FORM: CustomerForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  birthday: "",
  notes: "",
  is_member: false,
  member_level: "BRONZE",
}

interface CustomersClientProps {
  customers: any[]
  canCreate: boolean
  canEdit: boolean
}

export function CustomersClient({ customers, canCreate, canEdit }: CustomersClientProps) {
  const [items, setItems] = React.useState(customers)
  const [search, setSearch] = React.useState("")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState<CustomerForm>(EMPTY_FORM)
  const [saving, setSaving] = React.useState(false)
  const [rewardDialog, setRewardDialog] = React.useState(false)
  const [rewardCustomer, setRewardCustomer] = React.useState<any>(null)
  const [redeemAmount, setRedeemAmount] = React.useState(0)
  const [redeeming, setRedeeming] = React.useState(false)

  React.useEffect(() => {
    setItems(customers)
  }, [customers])

  const filtered = items.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (c.name || "").toLowerCase().includes(q) ||
      (c.phone || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q)
    )
  })

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEdit = (c: any) => {
    setEditingId(c.id)
    setForm({
      name: c.name || "",
      phone: c.phone || "",
      email: c.email || "",
      address: c.address || "",
      birthday: c.birthday ? c.birthday.slice(0, 10) : "",
      notes: c.notes || "",
      is_member: c.is_member,
      member_level: c.member_level || "BRONZE",
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    const result = editingId
      ? await updateCustomer(editingId, form)
      : await createCustomer(form)
    setSaving(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(editingId ? "Customer diperbarui" : "Customer dibuat")
    setDialogOpen(false)
    window.location.reload()
  }

  const openReward = (c: any) => {
    setRewardCustomer(c)
    setRedeemAmount(0)
    setRewardDialog(true)
  }

  const handleRedeem = async () => {
    if (!rewardCustomer) return
    if (redeemAmount <= 0) {
      toast.error("Jumlah poin harus lebih dari 0")
      return
    }
    if (redeemAmount > Number(rewardCustomer.points)) {
      toast.error("Poin tidak mencukupi")
      return
    }
    setRedeeming(true)
    const result = await redeemPoints(rewardCustomer.id, redeemAmount)
    setRedeeming(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Poin berhasil diredeem")
    setRewardDialog(false)
    window.location.reload()
  }

  const levelVariant = (level: string) => {
    switch (level) {
      case "PLATINUM":
        return "info"
      case "GOLD":
        return "warning"
      case "SILVER":
        return "secondary"
      default:
        return "neutral"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Customers</h2>
          <p className="text-sm text-muted-foreground">Kelola data customer &amp; loyalty</p>
        </div>
        {canCreate && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Customer
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari nama, telepon, email..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="mx-auto mb-2 h-8 w-8" />
            <p>Belum ada customer</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Telepon</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Member Level</TableHead>
                <TableHead className="text-right">Poin</TableHead>
                <TableHead className="text-right">Total Belanja</TableHead>
                <TableHead>Member</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.phone || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.email || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={levelVariant(c.member_level) as any}>
                      {c.member_level || "BRONZE"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{Number(c.points || 0).toLocaleString("id-ID")}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(Number(c.total_spent || 0))}</TableCell>
                  <TableCell>
                    <Badge variant={c.is_member ? "success" : "neutral"}>
                      {c.is_member ? "Ya" : "Tidak"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {canEdit && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                      )}
                      {c.is_member && Number(c.points) > 0 && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openReward(c)}>
                          <Gift className="h-3 w-3" />
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

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Customer" : "Tambah Customer"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Nama</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Telepon</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Alamat</Label>
              <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Tanggal Lahir</Label>
              <Input type="date" value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Catatan</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Member</Label>
              <Switch
                checked={form.is_member}
                onCheckedChange={(v) => setForm({ ...form, is_member: v })}
              />
            </div>
            {form.is_member && (
              <div className="grid gap-2">
                <Label>Member Level</Label>
                <Select
                  value={form.member_level}
                  onValueChange={(v) => setForm({ ...form, member_level: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRONZE">BRONZE</SelectItem>
                    <SelectItem value="SILVER">SILVER</SelectItem>
                    <SelectItem value="GOLD">GOLD</SelectItem>
                    <SelectItem value="PLATINUM">PLATINUM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
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

      {/* Reward / Redeem dialog */}
      <Dialog open={rewardDialog} onOpenChange={setRewardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redeem Poin</DialogTitle>
          </DialogHeader>
          {rewardCustomer && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">Poin tersedia</p>
                <p className="text-2xl font-bold">{Number(rewardCustomer.points || 0).toLocaleString("id-ID")}</p>
                <p className="text-sm text-muted-foreground mt-1">{rewardCustomer.name}</p>
              </div>
              <div className="grid gap-2">
                <Label>Jumlah Poin yang Diredeem</Label>
                <Input
                  type="number"
                  min={1}
                  max={Number(rewardCustomer.points || 0)}
                  value={redeemAmount || ""}
                  onChange={(e) => setRedeemAmount(Number(e.target.value))}
                  placeholder="Masukkan jumlah poin"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Setelah redeem, poin akan dikurangi dari saldo customer.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRewardDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleRedeem} disabled={redeeming}>
              {redeeming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Redeem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
