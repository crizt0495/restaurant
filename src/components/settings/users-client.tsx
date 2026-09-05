"use client"

import * as React from "react"
import { createUser, updateUser } from "@/lib/actions/users"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
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
import { Plus, Search, Pencil, Users, Loader2 } from "lucide-react"

interface UserRow {
  id: string
  full_name: string
  username: string
  role: string
  branch_id: string | null
  phone: string | null
  is_active: boolean
  created_at: string
  branches?: { name: string } | null
}

interface Branch {
  id: string
  name: string
}

interface UserForm {
  full_name: string
  username: string
  role: string
  branch_id: string
  phone: string
  is_active: boolean
  password: string
}

const EMPTY_FORM: UserForm = {
  full_name: "",
  username: "",
  role: "CASHIER",
  branch_id: "",
  phone: "",
  is_active: true,
  password: "",
}

const roleVariant: Record<string, "default" | "secondary" | "success" | "warning" | "info" | "neutral" | "destructive"> = {
  SUPER_ADMIN: "destructive",
  OWNER: "warning",
  MANAGER: "info",
  CASHIER: "success",
  KITCHEN: "secondary",
  WAITER: "default",
  INVENTORY: "neutral",
  ACCOUNTING: "info",
}

interface UsersClientProps {
  users: UserRow[]
  branches: Branch[]
  roles: readonly string[]
  canCreate: boolean
  canEdit: boolean
}

export function UsersClient({ users, branches, roles, canCreate, canEdit }: UsersClientProps) {
  const [items, setItems] = React.useState(users)
  const [search, setSearch] = React.useState("")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState<UserForm>(EMPTY_FORM)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    setItems(users)
  }, [users])

  const filtered = items.filter((u) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      u.full_name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    )
  })

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEdit = (u: UserRow) => {
    setEditingId(u.id)
    setForm({
      full_name: u.full_name,
      username: u.username,
      role: u.role,
      branch_id: u.branch_id || "",
      phone: u.phone || "",
      is_active: u.is_active,
      password: "",
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    const result = editingId
      ? await updateUser(editingId, {
          full_name: form.full_name,
          username: form.username,
          role: form.role,
          branch_id: form.branch_id,
          phone: form.phone || null,
          is_active: form.is_active,
        })
      : await createUser({
          full_name: form.full_name,
          username: form.username,
          role: form.role,
          branch_id: form.branch_id,
          phone: form.phone || null,
          is_active: form.is_active,
          password: form.password || undefined,
        })
    setSaving(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(editingId ? "User diperbarui" : "User dibuat")
    setDialogOpen(false)
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Users</h2>
          <p className="text-sm text-muted-foreground">Kelola pengguna sistem</p>
        </div>
        {canCreate && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Tambah User
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari user..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="mx-auto mb-2 h-8 w-8" />
            <p>Belum ada user</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Cabang</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{u.username}</TableCell>
                  <TableCell>
                    <Badge variant={roleVariant[u.role] || "neutral"}>{u.role}</Badge>
                  </TableCell>
                  <TableCell>{u.branches?.name || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={u.is_active ? "success" : "neutral"}>
                      {u.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {canEdit && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(u)}>
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
            <DialogTitle>{editingId ? "Edit User" : "Tambah User"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Full Name</Label>
              <Input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Username</Label>
                <Input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm({ ...form, role: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Cabang</Label>
                <Select
                  value={form.branch_id}
                  onValueChange={(v) => setForm({ ...form, branch_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih cabang" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {!editingId && (
              <div className="grid gap-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Default: password123"
                />
              </div>
            )}
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
