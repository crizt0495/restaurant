"use client"

import * as React from "react"
import { payOrder } from "@/lib/actions/index"
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
import { Loader2, Banknote } from "lucide-react"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import { formatCurrency } from "@/lib/utils"

const METHODS = ["CASH", "BANK_TRANSFER", "QRIS", "DEBIT", "CREDIT", "E_WALLET", "OTHER"]

export function PayOrderButton({ orderId, remaining }: { orderId: string; remaining: number }) {
  const [open, setOpen] = React.useState(false)
  const [amount, setAmount] = React.useState(String(remaining))
  const [method, setMethod] = React.useState("CASH")
  const [loading, setLoading] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    if (open) setAmount(String(remaining))
  }, [open, remaining])

  const handlePay = async () => {
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) {
      toast.error("Masukkan jumlah pembayaran yang valid")
      return
    }
    setLoading(true)
    const result = await payOrder({ orderId, payments: [{ method, amount: amt }] })
    setLoading(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Pembayaran diterima")
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Banknote className="mr-2 h-4 w-4" /> Terima Pembayaran
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terima Pembayaran</DialogTitle>
            <DialogDescription>
              Sisa tagihan {formatCurrency(remaining)}. Pembayaran akan tercatat pada pesanan ini.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Jumlah Pembayaran</Label>
              <Input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Metode Pembayaran</Label>
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
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={loading} onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button disabled={loading} onClick={handlePay}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Bayar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}