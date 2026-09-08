"use client"

import * as React from "react"
import { updatePaymentMethods } from "@/lib/actions/index"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import toast from "react-hot-toast"
import { CreditCard, Loader2 } from "lucide-react"

interface PaymentMethod {
  key: string
  label: string
}

interface PaymentMethodsClientProps {
  methods: PaymentMethod[]
  enabledMethods: string[]
}

export function PaymentMethodsClient({
  methods,
  enabledMethods: initial,
}: PaymentMethodsClientProps) {
  const [enabled, setEnabled] = React.useState<Set<string>>(new Set(initial))
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    setEnabled(new Set(initial))
  }, [initial])

  const toggle = (key: string) => {
    setEnabled((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    const result = await updatePaymentMethods(Array.from(enabled))
    setSaving(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Metode pembayaran disimpan")
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-3xl font-black uppercase tracking-tighter leading-none">Metode Pembayaran</h2>
        <p className="text-sm text-muted-foreground">
          Aktifkan atau nonaktifkan metode pembayaran
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Metode Pembayaran
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {methods.map((m) => (
              <label
                key={m.key}
                className="flex items-center gap-3 border-2 border-foreground bg-card px-4 py-3 text-sm cursor-pointer shadow-[3px_3px_0_0_hsl(var(--foreground))] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_0_hsl(var(--foreground))] transition-all duration-150"
              >
                <Checkbox
                  checked={enabled.has(m.key)}
                  onCheckedChange={() => toggle(m.key)}
                />
                <span className="font-medium">{m.label}</span>
                <span className="ml-auto text-xs text-muted-foreground">{m.key}</span>
              </label>
            ))}
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
