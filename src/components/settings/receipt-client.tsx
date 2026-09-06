"use client"

import * as React from "react"
import { updateReceiptSettings } from "@/lib/actions/index"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2, Receipt } from "lucide-react"
import toast from "react-hot-toast"

const FORMATS = ["THERMAL_58", "THERMAL_80", "A4"]

export function ReceiptSettingsClient({ initial }: { initial?: any }) {
  const [form, setForm] = React.useState({
    format: initial?.format || "THERMAL_80",
    show_logo: initial?.show_logo ?? true,
    show_tax: initial?.show_tax ?? true,
    show_service_charge: initial?.show_service_charge ?? true,
    show_payment: initial?.show_payment ?? true,
    footer: initial?.footer || "Terima kasih sudah berkunjung!",
  })
  const [saving, setSaving] = React.useState(false)

  const handleSave = async () => {
    setSaving(true)
    const result = await updateReceiptSettings(form)
    setSaving(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Pengaturan struk disimpan")
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Pengaturan Struk</h2>
        <p className="text-sm text-muted-foreground">Konfigurasi tampilan struk</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-4 w-4" /> Format & Tampilan
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="grid gap-4 pt-4">
          <div className="grid gap-2 sm:max-w-xs">
            <Label>Format Struk</Label>
            <Select value={form.format} onValueChange={(v) => setForm({ ...form, format: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMATS.map((f) => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 sm:max-w-md">
            <div className="flex items-center justify-between">
              <Label>Tampilkan Logo</Label>
              <Switch checked={form.show_logo} onCheckedChange={(v) => setForm({ ...form, show_logo: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Tampilkan Pajak</Label>
              <Switch checked={form.show_tax} onCheckedChange={(v) => setForm({ ...form, show_tax: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Tampilkan Service Charge</Label>
              <Switch checked={form.show_service_charge} onCheckedChange={(v) => setForm({ ...form, show_service_charge: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Tampilkan Metode Pembayaran</Label>
              <Switch checked={form.show_payment} onCheckedChange={(v) => setForm({ ...form, show_payment: v })} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Footer Struk</Label>
            <Input
              value={form.footer}
              onChange={(e) => setForm({ ...form, footer: e.target.value })}
              placeholder="Terima kasih sudah berkunjung!"
            />
          </div>
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