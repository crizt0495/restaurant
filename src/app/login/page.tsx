import { Metadata } from "next"
import { LoginForm } from "@/components/login-form"
import { UtensilsCrossed } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export const metadata: Metadata = {
  title: "Masuk - Sistem Manajemen Restoran",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const { redirect: redirectParam } = await searchParams

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="brutal-primary brutal-shadow mb-4 flex h-16 w-16 items-center justify-center rounded-xl">
            <UtensilsCrossed className="h-8 w-8" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Sistem Manajemen Restoran</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Masuk untuk mengelola restoran Anda
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <LoginForm redirect={redirectParam} />
        </div>
      </div>
    </div>
  )
}