"use client"

import * as React from "react"
import { updateOrganization } from "@/lib/actions/index"
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
import toast from "react-hot-toast"
import { Store, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Currency = "IDR" | "USD" | "MYR" | "SGD"

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: "IDR", label: "IDR - Rupiah" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "MYR", label: "MYR - Malaysian Ringgit" },
  { value: "SGD", label: "SGD - Singapore Dollar" },
]

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
  is_tax_active?: boolean
  is_service_charge_active?: boolean
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
    currency: (organization?.currency as Currency | undefined) || "IDR",
    is_tax_active: Boolean(organization?.is_tax_active),
    is_service_charge_active: Boolean(organization?.is_service_charge_active),
  })
  const [saving, setSaving] = React.useState(false)

  const emailInvalid = form.email !== "" && !EMAIL_RE.test(form.email)

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSetCurrency = (value: string) => setField("currency", value as Currency)

  const handleSave = async () => {
    if (emailInvalid) {
      toast.error("Format email tidak valid")
      return
    }
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
        <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl leading-none">Pengaturan Restoran</h2>
        <p className="mt-1.5 text-sm font-medium text-muted-foreground">Profil dan pengaturan restoran</p>
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
                onChange={(e) => setField("name", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                placeholder="admin@restoran.com"
                aria-invalid={emailInvalid}
                className={cn(emailInvalid && "border-destructive focus:border-destructive")}
                onChange={(e) => setField("email", e.target.value)}
              />
              {emailInvalid && (
                <p className="text-xs font-medium text-destructive">
                  Format email tidak valid
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label>Telepon</Label>
              <Input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="62812xxxxxxx"
                value={form.phone}
                onChange={(e) =>
                  setField("phone", e.target.value.replace(/[^0-9]/g, ""))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Mata Uang</Label>
              <Select value={form.currency} onValueChange={handleSetCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih mata uang" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label>Alamat</Label>
              <Input
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
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
          <div className="grid gap-6">
            <div className="grid gap-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="tax-active" className="font-medium">Aktifkan PPN</Label>
                  <p className="text-xs text-muted-foreground">
                    Jika nonaktif, pajak tidak dihitung di POS
                  </p>
                </div>
                <Switch
                  id="tax-active"
                  checked={form.is_tax_active}
                  onCheckedChange={(checked) => {
                    setForm((prev) => ({
                      ...prev,
                      is_tax_active: checked,
                      tax_percentage: checked ? prev.tax_percentage : 0,
                    }))
                  }}
                />
              </div>
              {form.is_tax_active && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Nama Pajak</Label>
                    <Input
                      value={form.tax_name}
                      onChange={(e) => setField("tax_name", e.target.value)}
                      placeholder="PPN"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Persen Pajak (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={form.tax_percentage}
                      onChange={(e) =>
                        setField("tax_percentage", Number(e.target.value))
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div className="grid gap-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="service-charge-active" className="font-medium">Aktifkan Biaya Layanan</Label>
                  <p className="text-xs text-muted-foreground">
                    Jika nonaktif, biaya layanan tidak dihitung di POS
                  </p>
                </div>
                <Switch
                  id="service-charge-active"
                  checked={form.is_service_charge_active}
                  onCheckedChange={(checked) => {
                    setForm((prev) => ({
                      ...prev,
                      is_service_charge_active: checked,
                      service_charge_percentage: checked
                        ? prev.service_charge_percentage
                        : 0,
                    }))
                  }}
                />
              </div>
              {form.is_service_charge_active && (
                <div className="grid gap-4 sm:max-w-xs">
                  <div className="grid gap-2">
                    <Label>Biaya Layanan (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={form.service_charge_percentage}
                      onChange={(e) =>
                        setField(
                          "service_charge_percentage",
                          Number(e.target.value)
                        )
                      }
                    />
                  </div>
                </div>
              )}
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