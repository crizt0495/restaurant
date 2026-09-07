"use client"

import * as React from "react"
import { useFormStatus } from "react-dom"
import { useActionState } from "react"
import { signInWithUsername } from "@/lib/actions/auth"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Loader2, Lock, User, ArrowRight } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function LoginForm({ redirect }: { redirect?: string }) {
  const [showPassword, setShowPassword] = React.useState(false)
  const [state, formAction] = useActionState(signInWithUsername, undefined)

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="redirect" value={redirect ?? ""} />

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center border-2 border-foreground bg-foreground text-background">
            <User className="h-4 w-4" strokeWidth={3} />
          </div>
          <Input
            id="username"
            name="username"
            placeholder="Masukkan username"
            autoComplete="username"
            className="pl-12 h-12 text-sm"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Kata Sandi</Label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center border-2 border-foreground bg-foreground text-background">
            <Lock className="h-4 w-4" strokeWidth={3} />
          </div>
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Masukkan kata sandi"
            autoComplete="current-password"
            className="pl-12 pr-12 h-12 text-sm"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center border-2 border-border hover:border-foreground transition-colors"
            aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={3} /> : <Eye className="h-4 w-4" strokeWidth={3} />}
          </button>
        </div>
      </div>

      {state && !state.success && (
        <Alert variant="destructive" className="border-3 border-destructive">
          <AlertDescription className="font-bold">{state.error}</AlertDescription>
        </Alert>
      )}

      <SubmitButton />
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full h-12 text-sm uppercase tracking-wider font-black" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={3} />
          <span>Memproses...</span>
        </>
      ) : (
        <>
          <span>Masuk</span>
          <ArrowRight className="h-4 w-4" strokeWidth={3} />
        </>
      )}
    </Button>
  )
}
