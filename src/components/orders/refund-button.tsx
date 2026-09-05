"use client"

import * as React from "react"
import { refundOrder } from "@/lib/actions/index"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Undo2 } from "lucide-react"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import { formatCurrency } from "@/lib/utils"

const METHODS = ["CASH", "BANK_TRANSFER", "QRIS", "DEBIT", "CREDIT", "E_WALLET", "OTHER"]

export function RefundButton({ orderId, maxAmount }: { orderId: string; maxAmount: number }) {
  const [open, setOpen] = React.useState(false)
  const [amount, setAmount] = React.useState(String(maxAmount))
  const [reason, setReason] = React.useState("")
  const [method, setMethod] = React.useState("CASH")
  const [loading, setLoading] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    if (open) setAmount(String(maxAmount))
  }, [open, maxAmount])

  const handleRefund = async () => {
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) {
      toast.error("Masukkan jumlah refund yang valid")
      return
    }
    if (amt > maxAmount) {
      toast.error(`Refund tidak boleh melebihi ${formatCurrency(maxAmount)}`)
      return
    }
    if (!reason.trim()) {
      toast.error("Alasan refund wajib diisi")
      return
    }
    setLoading(true)
    const result = await refundOrder(orderId, amt, reason, method)
    setLoading(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Refund berhasil")
    setOpen(false)
    setReason("")
    router.refresh()
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Undo2 className="mr-2 h-4 w-4" /> Refund
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refund Order</DialogTitle>
            <DialogDescription>
              Pembayaran akan dikembalikan sebagian atau seluruhnya kepada pelanggan.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Jumlah Refund (Maks {formatCurrency(maxAmount)})</Label>
              <Input
                type="number"
                min={1}
                max={maxAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Metode Refund</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Alasan Refund</Label>
              <Input
                placeholder="Contoh: Pelanggan berubah pikiran"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={loading} onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" disabled={loading} onClick={handleRefund}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}