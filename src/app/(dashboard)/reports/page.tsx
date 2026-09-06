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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Laporan</h2>
        <p className="text-sm text-muted-foreground">Analisa performa restoran</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORT_LINKS.map((r) => (
          <Link key={r.href} href={r.href} className="group rounded-xl border bg-card p-5 transition-all hover:border-primary hover:shadow-md">
            <div className="mb-3 flex items-center gap-2">
              <r.icon className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Laporan</span>
            </div>
            <h3 className="text-lg font-semibold">{r.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}