import Link from "next/link"
import { 
  BarChart3, 
  Wallet, 
  Boxes, 
  Utensils, 
  Users, 
  Percent,
  FileText,
  CreditCard,
  Undo2,
  Trash2,
  Activity,
  ClipboardList,
  Zap,
  ChefHat,
  Clock,
  Building2,
  BookOpen,
  User,
} from "lucide-react"
import { requirePermission } from "@/lib/helpers"

const REPORT_LINKS = [
  { title: "Laporan Penjualan", description: "Penjualan harian, per produk, per kasir", href: "/reports/sales", icon: BarChart3 },
  { title: "Laba Rugi", description: "Pendapatan, harga pokok, laba kotor & bersih", href: "/reports/profit", icon: Wallet },
  { title: "Laporan Inventaris", description: "Stok, valuasi, dan mutasi", href: "/reports/inventory", icon: Boxes },
  { title: "Laporan Produk", description: "Produk terlaris dan kategori", href: "/reports/products", icon: Utensils },
  { title: "Laporan Pelanggan", description: "Performa pelanggan dan loyalitas", href: "/reports/customers", icon: Users },
  { title: "Laporan Kasir", description: "Performa kasir dan shift", href: "/reports/cashier", icon: Percent },
  { title: "Laporan Pembelian", description: "Riwayat pembelian bahan baku", href: "/reports/purchase", icon: FileText },
  { title: "Laporan Pembayaran", description: "Rincian metode pembayaran", href: "/reports/payment", icon: CreditCard },
  { title: "Laporan Pajak", description: "Pajak penjualan periode", href: "/reports/tax", icon: Percent },
  { title: "Laporan Pengembalian", description: "Pesanan yang dikembalikan", href: "/reports/refund", icon: Undo2 },
  { title: "Laporan Pembatalan", description: "Pesanan yang dibatalkan", href: "/reports/void", icon: Trash2 },
  { title: "Laporan Shift", description: "Ringkasan penyelesaian shift kasir", href: "/reports/shift", icon: Clock },
  { title: "Laporan Cabang", description: "Performa penjualan per cabang", href: "/reports/branch", icon: Building2 },
  { title: "Laporan Kategori", description: "Penjualan per kategori produk", href: "/reports/categories", icon: BookOpen },
  { title: "Laporan Diskon", description: "Pesanan yang diberikan diskon", href: "/reports/discount", icon: Percent },
  { title: "Laporan Pelayan", description: "Penjualan per pelayan", href: "/reports/waiter", icon: User },
  { title: "Laporan Dapur", description: "Kinerja dapur dan waktu persiapan", href: "/reports/kitchen", icon: ChefHat },
  { title: "Laporan Mutasi Stok", description: "Gerakan stok bahan baku", href: "/reports/stock-movement", icon: Activity },
  { title: "Laporan Opname Stok", description: "Hasil opname stok", href: "/reports/stock-opname", icon: ClipboardList },
  { title: "Laporan Pengeluaran", description: "Pengeluaran operasional", href: "/reports/expenses", icon: Zap },
  { title: "Laporan Karyawan", description: "Keaktifan dan karyawan", href: "/reports/employees", icon: Users },
]

export default async function ReportsPage() {
  await requirePermission("reports.view")

  return (
    <div className="space-y-6 animate-brutal-slide-up">
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-primary text-primary-foreground px-2 py-0.5 text-[10px] font-black font-mono">21 REPORTS</span>
            <span className="h-[3px] w-16 bg-foreground" />
          </div>
          <h2 className="font-display text-3xl font-black uppercase tracking-tighter">Laporan</h2>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Analisa performa restoran</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORT_LINKS.map((r) => (
          <Link key={r.href} href={r.href} className="group relative border-3 border-foreground bg-card p-5 shadow-[4px_4px_0_0_hsl(var(--foreground))] transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_hsl(var(--primary))]">
            <div className="absolute right-0 top-0 h-10 w-10 bg-foreground text-background flex items-center justify-center font-mono text-xs font-black">
              {String(REPORT_LINKS.indexOf(r) + 1).padStart(2, "0")}
            </div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center border-2 border-foreground bg-primary text-primary-foreground shadow-[2px_2px_0_0_hsl(var(--foreground))]">
                <r.icon className="h-4 w-4" strokeWidth={3} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Laporan</span>
            </div>
            <h3 className="font-display text-lg font-black uppercase tracking-wide">{r.title}</h3>
            <p className="mt-1 text-sm font-bold text-muted-foreground">{r.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}