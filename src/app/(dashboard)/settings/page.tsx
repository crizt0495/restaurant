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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Pengaturan</h2>
        <p className="text-sm text-muted-foreground">Pengaturan sistem</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {settingsLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="transition-colors hover:bg-muted/50 cursor-pointer">
              <CardContent className="flex items-center gap-4 py-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <link.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{link.title}</p>
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
