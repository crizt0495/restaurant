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
  { title: "Sales Report", description: "Penjualan harian, per produk, per cashier", href: "/reports/sales", icon: BarChart3 },
  { title: "Profit & Loss", description: "Revenue, COGS, gross & net profit", href: "/reports/profit", icon: Wallet },
  { title: "Inventory Report", description: "Stock, valuasi, movement", href: "/reports/inventory", icon: Boxes },
  { title: "Product Report", description: "Produk terlaris dan kategoris", href: "/reports/products", icon: Utensils },
  { title: "Customer Report", description: "Customer performans dan loyalty", href: "/reports/customers", icon: Users },
  { title: "Cashier Report", description: "Performa kasir dan shift", href: "/reports/cashier", icon: Percent },
  { title: "Purchase Report", description: "Riwayat pembelian bahan baku", href: "/reports/purchase", icon: FileText },
  { title: "Payment Report", description: "Rincian metode pembayaran", href: "/reports/payment", icon: CreditCard },
  { title: "Tax Report", description: "Pajak penjualan periode", href: "/reports/tax", icon: Percent },
  { title: "Refund Report", description: "Order yang direfund", href: "/reports/refund", icon: Undo2 },
  { title: "Void Report", description: "Order yang dibatalkan", href: "/reports/void", icon: Trash2 },
  { title: "Shift Report", description: "Ringkasan penyelesaian shift kasir", href: "/reports/shift", icon: Clock },
  { title: "Branch Report", description: "Performa penjualan per cabang", href: "/reports/branch", icon: Building2 },
  { title: "Category Report", description: "Penjualan per kategori produk", href: "/reports/categories", icon: BookOpen },
  { title: "Discount Report", description: "Order yang diberikan diskon", href: "/reports/discount", icon: Percent },
  { title: "Waiter Report", description: "Penjualan per waiter", href: "/reports/waiter", icon: User },
  { title: "Kitchen Report", description: "Kinerja dapur dan waktu persiapan", href: "/reports/kitchen", icon: ChefHat },
  { title: "Stock Movement Report", description: "Gerakan stok bahan baku", href: "/reports/stock-movement", icon: Activity },
  { title: "Stock Opname Report", description: "Hasil opname stok", href: "/reports/stock-opname", icon: ClipboardList },
  { title: "Expense Report", description: "Pengeluaran operasional", href: "/reports/expenses", icon: Zap },
  { title: "Employee Report", description: "Keaktifan dan karyawan", href: "/reports/employees", icon: Users },
]

export default async function ReportsPage() {
  await requirePermission("reports.view")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Reports</h2>
        <p className="text-sm text-muted-foreground">Analisa performa restoran</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORT_LINKS.map((r) => (
          <Link key={r.href} href={r.href} className="group rounded-xl border bg-card p-5 transition-all hover:border-primary hover:shadow-md">
            <div className="mb-3 flex items-center gap-2">
              <r.icon className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Report</span>
            </div>
            <h3 className="text-lg font-semibold">{r.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}