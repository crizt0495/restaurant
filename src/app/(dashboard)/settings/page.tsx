import { getCurrentUser } from "@/lib/helpers"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import {
  Users,
  Shield,
  Building2,
  Store,
  CreditCard,
  Receipt as ReceiptIcon,
  BellRing,
} from "lucide-react"

export const dynamic = "force-dynamic"

const settingsLinks = [
  {
    title: "Pengguna",
    description: "Kelola pengguna dan akun",
    href: "/settings/users",
    icon: Users,
  },
  {
    title: "Peran & Izin",
    description: "Kelola peran dan hak akses",
    href: "/settings/roles",
    icon: Shield,
  },
  {
    title: "Cabang",
    description: "Kelola cabang",
    href: "/settings/branches",
    icon: Building2,
  },
  {
    title: "Restoran",
    description: "Profil restoran dan pengaturan umum",
    href: "/settings/restaurant",
    icon: Store,
  },
  {
    title: "Metode Pembayaran",
    description: "Kelola metode pembayaran",
    href: "/settings/payment",
    icon: CreditCard,
  },
  {
    title: "Struk",
    description: "Format dan tampilan struk",
    href: "/settings/receipt",
    icon: ReceiptIcon,
  },
  {
    title: "Notifikasi",
    description: "Preferensi notifikasi sistem",
    href: "/settings/notifications",
    icon: BellRing,
  },
]

export default async function SettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  return (
    <div className="space-y-6 animate-brutal-slide-up">
      <div className="flex items-end justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="bg-primary px-2 py-0.5 text-[10px] font-black font-mono text-primary-foreground">CONFIG</span>
            <span className="h-[3px] w-14 bg-foreground" />
          </div>
          <h2 className="font-display text-3xl font-black uppercase tracking-tighter leading-none">Pengaturan</h2>
          <p className="mt-1.5 text-sm font-bold uppercase tracking-wider text-muted-foreground">Pengaturan sistem</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {settingsLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="transition-all duration-150 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_hsl(var(--primary))] cursor-pointer">
              <CardContent className="flex items-center gap-4 py-6">
                <div className="flex h-10 w-10 items-center justify-center border-2 border-foreground bg-primary text-primary-foreground shadow-[2px_2px_0_0_hsl(var(--foreground))]">
                  <link.icon className="h-5 w-5" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="font-black uppercase tracking-wide">{link.title}</p>
                  <p className="text-sm font-bold text-muted-foreground">
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
