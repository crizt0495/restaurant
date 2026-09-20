import type { Metadata } from "next"
import { LoginForm } from "@/components/login-form"
import { UtensilsCrossed } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export const metadata: Metadata = {
  title: "Masuk - RMS",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const { redirect: redirectParam } = await searchParams

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4 brutal-dots">
      {/* Glow dekoratif */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[80px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-64 w-64 rounded-full bg-accent/10 blur-[70px]" />

      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-brand text-primary-foreground shadow-2xl">
              <UtensilsCrossed className="h-9 w-9" strokeWidth={2.25} />
            </div>
            <div className="absolute -inset-2 rounded-3xl bg-gradient-brand opacity-20 blur-lg -z-10" />
            <span className="absolute -right-3 -top-3 rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-foreground shadow-lg animate-float">
              RMS v2
            </span>
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight leading-none">
            Resto<span className="text-primary">RMS</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Sistem Manajemen Restoran
          </p>
        </div>

        <div className="glass-strong rounded-2xl border border-border p-6 shadow-2xl sm:p-8">
          <LoginForm redirect={redirectParam} />
        </div>

        <div className="mt-4 flex items-center justify-center gap-3 rounded-xl border border-border/70 bg-card/60 px-4 py-3">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          <p className="text-xs text-muted-foreground">
            Demo · <span className="font-mono font-semibold text-foreground">admin</span> /{" "}
            <span className="font-mono font-semibold text-foreground">admin123!</span>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} RMS — Restaurant Management System
        </p>
      </div>
    </main>
  )
}