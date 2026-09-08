"use client"

import * as React from "react"
import { updateBranch } from "@/lib/actions/index"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import toast from "react-hot-toast"
import { Pencil, Building2, Loader2 } from "lucide-react"

interface Branch {
  id: string
  name: string
  code: string
  is_active: boolean
  address?: string
  phone?: string
  city?: string
}

interface BranchesClientProps {
  branches: Branch[]
  canEdit: boolean
}

export function BranchesClient({ branches, canEdit }: BranchesClientProps) {
  const [items, setItems] = React.useState(branches)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingBranch, setEditingBranch] = React.useState<Branch | null>(null)
  const [name, setName] = React.useState("")
  const [isActive, setIsActive] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    setItems(branches)
  }, [branches])

  const openEdit = (b: Branch) => {
    setEditingBranch(b)
    setName(b.name)
    setIsActive(b.is_active)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!editingBranch) return
    setSaving(true)
    const result = await updateBranch(editingBranch.id, { name, is_active: isActive })
    setSaving(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Cabang diperbarui")
    setDialogOpen(false)
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-3xl font-black uppercase tracking-tighter leading-none">Cabang</h2>
        <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Kelola cabang restoran</p>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Building2 className="mx-auto mb-2 h-8 w-8" />
            <p>Belum ada cabang</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((b) => (
            <Card key={b.id}>
              <CardContent className="flex items-start justify-between py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{b.name}</span>
                    <Badge variant={b.is_active ? "success" : "neutral"}>
                      {b.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Kode: {b.code}
                  </p>
                  {b.city && (
                    <p className="text-sm text-muted-foreground">{b.city}</p>
                  )}
                </div>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openEdit(b)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Cabang</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Nama Cabang</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Aktif</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
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
