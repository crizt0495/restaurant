"use client"

import * as React from "react"
import { updateOrganization } from "@/lib/actions/index"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import toast from "react-hot-toast"
import { Store, Loader2 } from "lucide-react"

interface Organization {
  id: string
  name: string
  address?: string
  phone?: string
  email?: string
  tax_name?: string
  tax_percentage?: number
  service_charge_percentage?: number
  currency?: string
}

interface RestaurantClientProps {
  organization: Organization | null
}

export function RestaurantClient({ organization }: RestaurantClientProps) {
  const [form, setForm] = React.useState({
    name: organization?.name || "",
    address: organization?.address || "",
    phone: organization?.phone || "",
    email: organization?.email || "",
    tax_name: organization?.tax_name || "",
    tax_percentage: organization?.tax_percentage || 0,
    service_charge_percentage: organization?.service_charge_percentage || 0,
    currency: organization?.currency || "IDR",
  })
  const [saving, setSaving] = React.useState(false)

  const handleSave = async () => {
    setSaving(true)
    const result = await updateOrganization(form)
    setSaving(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Pengaturan restoran disimpan")
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Pengaturan Restoran</h2>
        <p className="text-sm text-muted-foreground">Profil dan pengaturan restoran</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Informasi Restoran
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Nama Restoran</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Telepon</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Mata Uang</Label>
              <Input
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label>Alamat</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pajak & Biaya Layanan</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>Nama Pajak</Label>
              <Input
                value={form.tax_name}
                onChange={(e) => setForm({ ...form, tax_name: e.target.value })}
                placeholder="PPN"
              />
            </div>
            <div className="grid gap-2">
              <Label>Pajak (%)</Label>
              <Input
                type="number"
                value={form.tax_percentage}
                onChange={(e) =>
                  setForm({ ...form, tax_percentage: Number(e.target.value) })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Biaya Layanan (%)</Label>
              <Input
                type="number"
                value={form.service_charge_percentage}
                onChange={(e) =>
                  setForm({
                    ...form,
                    service_charge_percentage: Number(e.target.value),
                  })
                }
              />
            </div>
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
