"use client"

import * as React from "react"
import { createStockOpname, approveStockOpname } from "@/lib/actions/index"
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils"
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
import toast from "react-hot-toast"
import { Plus, Loader2, ClipboardCheck, CheckCircle } from "lucide-react"

interface Warehouse {
  id: string
  name: string
}

interface InventoryItem {
  id: string
  name: string
  sku: string
  unit: string
  quantity: number
  cost_price: number
}

interface OpnameItem {
  id: string
  inventory_item_id: string
  system_quantity: number
  physical_quantity: number
  difference: number
  difference_value: number
  reason: string | null
  inventory_item?: { name: string; unit: string } | null
}

interface Opname {
  id: string
  opname_number: string
  warehouse_id: string
  status: string
  notes: string | null
  total_difference_value: number
  created_at: string
  warehouse?: { name: string } | null
  items?: OpnameItem[] | null
}

interface OpnameLine {
  inventory_item_id: string
  physical_quantity: number
  reason: string
}

interface OpnameClientProps {
  opnames: Opname[]
  inventoryItems: InventoryItem[]
  warehouses: Warehouse[]
  canCreate: boolean
}

function opnameStatusVariant(status: string): "success" | "warning" | "info" | "neutral" | "destructive" {
  switch (status) {
    case "APPROVED":
    case "ADJUSTED":
      return "success"
    case "SUBMITTED":
      return "info"
    case "DRAFT":
      return "neutral"
    case "CANCELLED":
      return "destructive"
    default:
      return "warning"
  }
}

export function OpnameClient({
  opnames,
  inventoryItems,
  warehouses,
  canCreate,
}: OpnameClientProps) {
  const [list, setList] = React.useState<Opname[]>(opnames)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [selectedWarehouse, setSelectedWarehouse] = React.useState("")
  const [lines, setLines] = React.useState<OpnameLine[]>([])
  const [saving, setSaving] = React.useState(false)
  const [approvingId, setApprovingId] = React.useState<string | null>(null)

  React.useEffect(() => {
    setList(opnames)
  }, [opnames])

  const openCreate = () => {
    setSelectedWarehouse("")
    setLines([])
    setCreateOpen(true)
  }

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { inventory_item_id: "", physical_quantity: 0, reason: "" },
    ])
  }

  const updateLine = (index: number, patch: Partial<OpnameLine>) => {
    setLines((prev) =>
      prev.map((l, i) => (i === index ? { ...l, ...patch } : l))
    )
  }

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCreate = async () => {
    if (!selectedWarehouse) {
      toast.error("Pilih gudang")
      return
    }
    const validLines = lines.filter((l) => l.inventory_item_id)
    if (validLines.length === 0) {
      toast.error("Tambahkan minimal satu item")
      return
    }
    setSaving(true)
    const result = await createStockOpname(
      selectedWarehouse,
      validLines.map((l) => ({
        inventory_item_id: l.inventory_item_id,
        physical_quantity: l.physical_quantity,
        reason: l.reason || undefined,
      }))
    )
    setSaving(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Opname dibuat")
    setCreateOpen(false)
    window.location.reload()
  }

  const handleApprove = async (id: string) => {
    if (!window.confirm("Approve opname ini? Stok akan disesuaikan.")) return
    setApprovingId(id)
    const result = await approveStockOpname(id)
    setApprovingId(null)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Opname di-approve, stok disesuaikan")
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-3xl font-black uppercase tracking-tighter leading-none">Opname Stok</h2>
          <p className="text-sm text-muted-foreground">
            Selisih stok fisik vs sistem
          </p>
        </div>
        {canCreate && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Buat Opname
          </Button>
        )}
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ClipboardCheck className="mx-auto mb-2 h-8 w-8" />
            <p>Belum ada opname stok</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto border-3 border-foreground shadow-[5px_5px_0_0_hsl(var(--foreground))]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Opname</TableHead>
                <TableHead>Gudang</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Catatan</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-right">Selisih Nilai</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((op) => (
                <TableRow key={op.id}>
                  <TableCell className="font-medium">
                    {op.opname_number}
                  </TableCell>
                  <TableCell>{op.warehouse?.name || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={opnameStatusVariant(op.status)}>
                      {op.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {op.notes || "-"}
                  </TableCell>
                  <TableCell>{formatDate(op.created_at)}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(Number(op.total_difference_value))}
                  </TableCell>
                  <TableCell className="text-right">
                    {canCreate && op.status === "SUBMITTED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7"
                        onClick={() => handleApprove(op.id)}
                        disabled={approvingId === op.id}
                      >
                        {approvingId === op.id ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-1 h-3 w-3" />
                        )}
                        Setujui & Sesuaikan
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create opname dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Buat Opname Stok</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Gudang</Label>
              <Select
                value={selectedWarehouse}
                onValueChange={setSelectedWarehouse}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih gudang" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Item Persediaan</Label>
              <div className="grid gap-2">
                {lines.map((line, index) => {
                  const invItem = inventoryItems.find(
                    (i) => i.id === line.inventory_item_id
                  )
                  return (
                    <div
                      key={index}
                      className="grid grid-cols-12 items-center gap-2"
                    >
                      <Select
                        value={line.inventory_item_id}
                        onValueChange={(v) =>
                          updateLine(index, { inventory_item_id: v })
                        }
                      >
                        <SelectTrigger className="col-span-5">
                          <SelectValue placeholder="Pilih item" />
                        </SelectTrigger>
                        <SelectContent>
                          {inventoryItems.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} ({item.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="col-span-2 text-center text-sm text-muted-foreground">
                        {invItem ? formatNumber(Number(invItem.quantity)) : "-"}
                        <span className="block text-xs">Sistem</span>
                      </div>
                      <Input
                        className="col-span-2"
                        type="number"
                        placeholder="Fisik"
                        value={line.physical_quantity}
                        onChange={(e) =>
                          updateLine(index, {
                            physical_quantity: Number(e.target.value),
                          })
                        }
                      />
                      <Input
                        className="col-span-2"
                        placeholder="Alasan"
                        value={line.reason}
                        onChange={(e) =>
                          updateLine(index, { reason: e.target.value })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="col-span-1 h-7 w-7 text-destructive"
                        onClick={() => removeLine(index)}
                      >
                        ×
                      </Button>
                    </div>
                  )
                })}
              </div>
              <Button variant="outline" size="sm" onClick={addLine}>
                <Plus className="mr-1 h-3 w-3" /> Tambah Item
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Kirim Opname
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
