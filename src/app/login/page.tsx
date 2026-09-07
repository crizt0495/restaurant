import { Metadata } from "next"
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
    <div className="relative flex min-h-screen items-center justify-center p-4 bg-muted/50">
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md relative">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="brutal-primary flex h-20 w-20 items-center justify-center shadow-[6px_6px_0_0_hsl(var(--brutal-ink))]">
              <UtensilsCrossed className="h-9 w-9" strokeWidth={2.5} />
            </div>
            <div className="absolute -top-2 -right-2 brutal-accent px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-[3px_3px_0_0_hsl(var(--brutal-ink))]">
              RMS v2
            </div>
          </div>
          <h1 className="font-display text-4xl font-black uppercase tracking-tighter leading-none">Resto</h1>
          <h1 className="font-display text-4xl font-black uppercase tracking-tighter leading-none -mt-1">Manager</h1>
          <p className="mt-3 text-sm font-bold text-muted-foreground uppercase tracking-wider">
            Sistem Manajemen Restoran
          </p>
        </div>

        <div className="brutal-card">
          <LoginForm redirect={redirectParam} />
        </div>

        <p className="mt-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
          &copy; {new Date().getFullYear()} RMS - Restaurant Management System
        </p>
      </div>

      <div className="absolute bottom-8 left-8 brutal-card p-3 max-w-xs hidden lg:block">
        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">Demo Access</p>
        <p className="text-xs font-bold">Username: <span className="font-mono">admin</span></p>
        <p className="text-xs font-bold">Password: <span className="font-mono">admin123</span></p>
      </div>
    </div>
  )
}
