import { getCurrentUser } from "@/lib/helpers"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Users,
  Shield,
  Building2,
  Store,
  CreditCard,
  Receipt as ReceiptIcon,
  BellRing,
  type LucideIcon,
} from "lucide-react"

export const dynamic = "force-dynamic"

interface SettingsLink {
  title: string
  description: string
  href: string
  icon: LucideIcon
  permission?: string
  superAdminOnly?: boolean
}

const settingsLinks: SettingsLink[] = [
  {
    title: "Pengguna",
    description: "Kelola pengguna dan akun",
    href: "/settings/users",
    icon: Users,
    permission: "users.view",
  },
  {
    title: "Peran & Izin",
    description: "Kelola peran dan hak akses",
    href: "/settings/roles",
    icon: Shield,
    superAdminOnly: true,
  },
  {
    title: "Cabang",
    description: "Kelola cabang",
    href: "/settings/branches",
    icon: Building2,
    permission: "branches.manage",
  },
  {
    title: "Restoran",
    description: "Profil restoran dan pengaturan umum",
    href: "/settings/restaurant",
    icon: Store,
    permission: "settings.manage",
  },
  {
    title: "Metode Pembayaran",
    description: "Kelola metode pembayaran",
    href: "/settings/payment",
    icon: CreditCard,
    permission: "settings.manage",
  },
  {
    title: "Struk",
    description: "Format dan tampilan struk",
    href: "/settings/receipt",
    icon: ReceiptIcon,
    permission: "settings.manage",
  },
  {
    title: "Notifikasi",
    description: "Preferensi notifikasi sistem",
    href: "/settings/notifications",
    icon: BellRing,
    permission: "settings.manage",
  },
]

export default async function SettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const visibleLinks = settingsLinks.filter((link) => {
    if (link.superAdminOnly) return user.is_super_admin
    if (!link.permission) return true
    return user.is_super_admin || user.permissions.includes("*") || user.permissions.includes(link.permission)
  })

  return (
    <div className="space-y-6 animate-brutal-slide-up">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant="default" className="mb-2 gap-1.5 font-mono">CONFIG</Badge>
          <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl leading-none">Pengaturan</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">Pengaturan sistem</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleLinks.map((link) => (
          <Link key={link.href} href={link.href} className="group">
            <Card className="h-full cursor-pointer transition-all duration-150 group-hover:-translate-y-0.5 group-hover:border-primary/30 group-hover:shadow-md">
              <CardContent className="flex items-center gap-4 py-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground shadow-md transition-transform duration-150 group-hover:scale-105">
                  <link.icon className="h-5 w-5" strokeWidth={2.25} />
                </div>
                <div>
                  <p className="font-semibold tracking-tight">{link.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {link.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
