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
    <div className="relative flex min-h-screen items-center justify-center p-4 bg-background brutal-dots">
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      {/* Decorative accent blocks */}
      <div className="absolute left-6 top-10 hidden lg:block">
        <div className="h-16 w-16 bg-primary border-3 border-foreground shadow-[8px_8px_0_0_hsl(var(--foreground))] animate-float" />
      </div>
      <div className="absolute right-10 bottom-16 hidden lg:block">
        <div className="h-20 w-20 bg-accent border-3 border-foreground shadow-[10px_10px_0_0_hsl(var(--foreground))] animate-float" style={{ animationDelay: "1s" }} />
      </div>
      <div className="absolute left-24 bottom-24 hidden lg:block">
        <div className="h-12 w-12 bg-brutal-yellow border-3 border-foreground shadow-[6px_6px_0_0_hsl(var(--foreground))] animate-float" style={{ animationDelay: "0.5s" }} />
      </div>

      <div className="w-full max-w-md relative">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="brutal-primary flex h-20 w-20 items-center justify-center shadow-[6px_6px_0_0_hsl(var(--foreground))] relative z-10">
              <UtensilsCrossed className="h-9 w-9" strokeWidth={2.5} />
            </div>
            <div className="absolute inset-0 translate-x-2 translate-y-2 border-3 border-foreground bg-primary/30" />
            <div className="absolute -top-2 -right-2 brutal-accent px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-[3px_3px_0_0_hsl(var(--foreground))] z-20 animate-brutal-bounce">
              RMS v2
            </div>
          </div>
          <h1 className="font-display text-4xl font-black uppercase tracking-tighter leading-none">Resto</h1>
          <h1 className="font-display text-4xl font-black uppercase tracking-tighter leading-none -mt-1">Manager</h1>
          <p className="mt-3 text-sm font-black text-muted-foreground uppercase tracking-widest">
            Sistem Manajemen Restoran
          </p>
        </div>

        <div className="relative">
          <div className="absolute -inset-1 border-3 border-foreground bg-primary/20 translate-x-2 translate-y-2" />
          <div className="relative brutal-card bg-card">
            <LoginForm redirect={redirectParam} />
          </div>
        </div>

        <p className="mt-4 text-center text-xs font-black text-muted-foreground uppercase tracking-wider">
          &copy; {new Date().getFullYear()} RMS - Restaurant Management System
        </p>
      </div>

      <div className="absolute bottom-8 left-8 brutal-card p-3 max-w-xs hidden lg:block">
        <div className="flex items-center gap-2 mb-1">
          <span className="h-2 w-2 bg-success animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Demo Access</p>
        </div>
        <p className="text-xs font-bold">Username: <span className="font-mono font-black bg-foreground text-background px-1">admin</span></p>
        <p className="text-xs font-bold">Password: <span className="font-mono font-black bg-foreground text-background px-1">admin123</span></p>
      </div>
    </div>
  )
}
