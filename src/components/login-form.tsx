"use client"

import * as React from "react"
import { useFormStatus } from "react-dom"
import { useActionState } from "react"
import { signInWithUsername } from "@/lib/actions/auth"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Loader2, Lock, User } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"

export function LoginForm({ redirect }: { redirect?: string }) {
  const [showPassword, setShowPassword] = React.useState(false)
  const [state, formAction] = useActionState(signInWithUsername, undefined)

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirect" value={redirect ?? ""} />
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="username"
            name="username"
            placeholder="Masukkan username"
            autoComplete="username"
            className="pl-9"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Kata Sandi</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Masukkan kata sandi"
            autoComplete="current-password"
            className="px-9"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {state && !state.success && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center space-x-2">
        <Checkbox id="remember" name="remember" />
        <Label htmlFor="remember" className="text-sm text-muted-foreground">
        Ingat sesi
        </Label>
      </div>

      <SubmitButton />
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> Masuk...
        </>
      ) : (
        "Masuk"
      )}
    </Button>
  )
}