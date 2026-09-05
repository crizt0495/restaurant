"use client"

import * as React from "react"
import { updateNotificationSettings } from "@/lib/actions/index"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Loader2, BellRing } from "lucide-react"
import toast from "react-hot-toast"

interface NotificationPrefs {
  new_order: boolean
  order_ready: boolean
  low_stock: boolean
  reservation: boolean
  payment: boolean
  refund: boolean
  void: boolean
  stock_opname: boolean
  approval: boolean
  system: boolean
}

const DEFAULT_PREFS: NotificationPrefs = {
  new_order: true,
  order_ready: true,
  low_stock: true,
  reservation: true,
  payment: true,
  refund: true,
  void: true,
  stock_opname: true,
  approval: true,
  system: true,
}

const ITEMS: { key: keyof NotificationPrefs; label: string; description: string }[] = [
  { key: "new_order", label: "Order Baru", description: "Notifikasi ketika ada order baru" },
  { key: "order_ready", label: "Order Siap", description: "Notifikasi ketika order siap diambil" },
  { key: "low_stock", label: "Stok Menipis", description: "Notifikasi ketika stok di bawah minimum" },
  { key: "reservation", label: "Reservasi", description: "Notifikasi reservasi baru atau status berubah" },
  { key: "payment", label: "Pembayaran", description: "Notifikasi transaksi dan pembayaran" },
  { key: "refund", label: "Refund", description: "Notifikasi ketika refund dilakukan" },
  { key: "void", label: "Void Order", description: "Notifikasi ketika order dibatalkan" },
  { key: "stock_opname", label: "Stock Opname", description: "Notifikasi proses stock opname" },
  { key: "approval", label: "Approval", description: "Notifikasi approval purchase/opname" },
  { key: "system", label: "Sistem", description: "Notifikasi sistem umum" },
]

export function NotificationSettingsClient({ initial }: { initial?: Partial<NotificationPrefs> }) {
  const [prefs, setPrefs] = React.useState<NotificationPrefs>({
    ...DEFAULT_PREFS,
    ...(initial || {}),
  })
  const [saving, setSaving] = React.useState(false)

  const handleSave = async () => {
    setSaving(true)
    const result = await updateNotificationSettings(prefs)
    setSaving(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Preferensi notifikasi disimpan")
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Notification Settings</h2>
        <p className="text-sm text-muted-foreground">Atur notifikasi apa yang ingin diterima</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-4 w-4" /> Jenis Notifikasi
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="grid gap-3 pt-4 sm:grid-cols-2">
          {ITEMS.map((item) => (
            <div key={item.key} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <Switch
                checked={prefs[item.key]}
                onCheckedChange={(v) => setPrefs((prev) => ({ ...prev, [item.key]: v }))}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Simpan
        </Button>
      </div>
    </div>
  )
}