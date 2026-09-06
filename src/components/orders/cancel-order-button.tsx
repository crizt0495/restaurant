"use client"

import * as React from "react"
import { cancelOrder } from "@/lib/actions/index"
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
import { Loader2, Ban } from "lucide-react"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [open, setOpen] = React.useState(false)
  const [reason, setReason] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const router = useRouter()

  const handleCancel = async () => {
    setLoading(true)
    const result = await cancelOrder(orderId, reason)
    setLoading(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Pesanan dibatalkan")
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        <Ban className="mr-2 h-4 w-4" /> Batal Pesanan
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batalkan Pesanan</DialogTitle>
            <DialogDescription>
              Pesanan akan dibatalkan dan tidak dapat dipulihkan. Pastikan anda yakin.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Input
              placeholder="Alasan pembatalan (opsional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={loading} onClick={() => setOpen(false)}>
              Tidak Jadi
            </Button>
            <Button variant="destructive" disabled={loading} onClick={handleCancel}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Ya, Batalkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}