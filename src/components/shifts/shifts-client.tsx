"use client"

import * as React from "react"
import { openCashierShift, closeCashierShift } from "@/lib/actions/index"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"
import { Plus, Lock, AlertCircle, Wallet, Loader2, Clock } from "lucide-react"

interface ShiftRow {
  id: string
  opening_cash: number
  opening_time: string
  closing_time: string | null
  cash_sales: number | null
  cash_refunds: number | null
  expected_cash: number | null
  actual_cash: number | null
  difference: number | null
  status: "OPEN" | "CLOSED"
  notes: string | null
  user?: { full_name: string; username: string } | null
  branch?: { name: string } | null
}

interface ShiftsClientProps {
  shifts: ShiftRow[]
  canOpen: boolean
  canClose: boolean
}

export function ShiftsClient({ shifts: initialShifts, canOpen, canClose }: ShiftsClientProps) {
  const [shifts, setShifts] = React.useState<ShiftRow[]>(initialShifts)
  const [openDialog, setOpenDialog] = React.useState(false)
  const [openCash, setOpenCash] = React.useState("0")
  const [opening, setOpening] = React.useState(false)
  const [closeDialog, setCloseDialog] = React.useState<ShiftRow | null>(null)
  const [actualCash, setActualCash] = React.useState("0")
  const [closeNotes, setCloseNotes] = React.useState("")
  const [closing, setClosing] = React.useState(false)

  React.useEffect(() => {
    setShifts(initialShifts)
  }, [initialShifts])

  React.useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel("shifts-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "cashier_shifts" }, () => {
        window.location.reload()
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleOpen = async () => {
    const amount = parseFloat(openCash)
    if (isNaN(amount) || amount < 0) {
      toast.error("Masukkan jumlah kas awal yang valid")
      return
    }
    setOpening(true)
    const result = await openCashierShift(amount)
    setOpening(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Shift dibuka")
    setOpenDialog(false)
    setOpenCash("0")
    window.location.reload()
  }

  const handleClose = async () => {
    if (!closeDialog) return
    const amount = parseFloat(actualCash)
    if (isNaN(amount) || amount < 0) {
      toast.error("Masukkan jumlah kas aktual yang valid")
      return
    }
    setClosing(true)
    const result = await closeCashierShift(amount, closeNotes || undefined)
    setClosing(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Shift ditutup")
    setCloseDialog(null)
    setActualCash("0")
    setCloseNotes("")
    window.location.reload()
  }

  const openShifts = shifts.filter((s) => s.status === "OPEN")

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cashier Shifts</h2>
          <p className="text-sm text-muted-foreground">Buka dan tutup shift kasir</p>
        </div>
        {canOpen && openShifts.length === 0 && (
          <Button size="sm" onClick={() => setOpenDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Buka Shift
          </Button>
        )}
      </div>

      {openShifts.length > 0 && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-amber-600" />
              Shift Aktif ({openShifts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {openShifts.map((s) => (
              <div key={s.id} className="flex flex-col gap-2 rounded-lg border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{s.user?.full_name || "Kasir"}</p>
                  <p className="text-xs text-muted-foreground">
                    Dibuka: {formatDateTime(s.opening_time)} · Kas awal: {formatCurrency(Number(s.opening_cash))}
                  </p>
                </div>
                {canClose && (
                  <Button size="sm" variant="destructive" onClick={() => setCloseDialog(s)}>
                    <Lock className="mr-1 h-3 w-3" /> Tutup Shift
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Separator />

      {shifts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Wallet className="mx-auto mb-2 h-8 w-8" />
            <p>Belum ada data shift</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kasir</TableHead>
                <TableHead>Cabang</TableHead>
                <TableHead>Dibuka</TableHead>
                <TableHead>Ditutup</TableHead>
                <TableHead className="text-right">Kas Awal</TableHead>
                <TableHead className="text-right">Penjualan Tunai</TableHead>
                <TableHead className="text-right">Expected</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Selisih</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.map((s) => {
                const variance = Number(s.difference ?? 0)
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.user?.full_name || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{s.branch?.name || "-"}</TableCell>
                    <TableCell className="text-xs">{formatDateTime(s.opening_time)}</TableCell>
                    <TableCell className="text-xs">
                      {s.closing_time ? formatDateTime(s.closing_time) : "-"}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(s.opening_cash))}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(s.cash_sales ?? 0))}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(s.expected_cash ?? 0))}</TableCell>
                    <TableCell className="text-right">{s.actual_cash != null ? formatCurrency(Number(s.actual_cash)) : "-"}</TableCell>
                    <TableCell className="text-right">
                      {s.status === "CLOSED" ? (
                        <Badge variant={variance === 0 ? "success" : variance < 0 ? "destructive" : "warning"}>
                          {variance === 0 ? "Match" : variance > 0 ? `+${formatCurrency(variance)}` : formatCurrency(variance)}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.status === "OPEN" ? "warning" : "neutral"}>{s.status}</Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buka Shift Baru</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p>Kas awal adalah jumlah uang fisik di laci kasir pada saat shift dibuka.</p>
            </div>
            <div className="grid gap-2">
              <Label>Kas Awal (Rp)</Label>
              <Input
                type="number"
                min={0}
                value={openCash}
                onChange={(e) => setOpenCash(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>Batal</Button>
            <Button onClick={handleOpen} disabled={opening}>
              {opening ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Buka Shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!closeDialog} onOpenChange={(o) => !o && setCloseDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tutup Shift</DialogTitle>
          </DialogHeader>
          {closeDialog && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                <p>Kasir: <span className="font-medium">{closeDialog.user?.full_name}</span></p>
                <p>Dibuka: {formatDateTime(closeDialog.opening_time)}</p>
                <p>Kas awal: {formatCurrency(Number(closeDialog.opening_cash))}</p>
                <p>Penjualan tunai selama shift: {formatCurrency(Number(closeDialog.cash_sales ?? 0))}</p>
                <Separator className="my-2" />
                <p>Expected cash: <span className="font-bold">{formatCurrency(Number(closeDialog.expected_cash ?? 0))}</span></p>
              </div>
              <div className="grid gap-2">
                <Label>Kas Aktual (hitung uang fisik)</Label>
                <Input
                  type="number"
                  min={0}
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Catatan (opsional)</Label>
                <Input
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="Keterangan shift..."
                />
              </div>
              {parseFloat(actualCash) > 0 && closeDialog.expected_cash != null && (
                <div
                  className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                    parseFloat(actualCash) === Number(closeDialog.expected_cash)
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40"
                      : "bg-amber-50 text-amber-700 dark:bg-amber-950/40"
                  }`}
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    Selisih:{" "}
                    <span className="font-bold">
                      {formatCurrency(parseFloat(actualCash) - Number(closeDialog.expected_cash))}
                    </span>
                  </span>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialog(null)}>Batal</Button>
            <Button onClick={handleClose} disabled={closing}>
              {closing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Tutup Shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
