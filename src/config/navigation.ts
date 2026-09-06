import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  Grid3X3,
  ChefHat,
  Boxes,
  ShoppingBag,
  Truck,
  Users,
  Percent,
  UserRound,
  Wallet,
  BarChart3,
  Settings,
  Utensils,
  CalendarDays,
  BookOpen,
  Clock,
  FileText,
  CreditCard,
  Store,
  Activity,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  permission?: string
  badge?: string
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const dashboardNav: NavSection[] = [
  {
    title: "Ringkasan",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "dashboard.view" },
      { title: "POS", href: "/pos", icon: ShoppingCart, permission: "orders.create" },
      { title: "Pesanan", href: "/orders", icon: ClipboardList, permission: "orders.view" },
      { title: "Meja", href: "/tables", icon: Grid3X3, permission: "orders.view" },
      { title: "Dapur", href: "/kitchen", icon: ChefHat, permission: "orders.view" },
      { title: "Reservasi", href: "/reservations", icon: CalendarDays },
    ],
  },
  {
    title: "Manajemen",
    items: [
      { title: "Produk", href: "/products", icon: Utensils, permission: "products.view" },
      { title: "Resep", href: "/recipes", icon: BookOpen, permission: "products.view" },
      { title: "Inventaris", href: "/inventory", icon: Boxes, permission: "inventory.view" },
      { title: "Pembelian", href: "/purchases", icon: ShoppingBag, permission: "purchases.view" },
      { title: "Pemasok", href: "/suppliers", icon: Truck },
      { title: "Pelanggan", href: "/customers", icon: Users },
      { title: "Promosi", href: "/promotions", icon: Percent },
      { title: "Karyawan", href: "/employees", icon: UserRound },
      { title: "Pengeluaran", href: "/expenses", icon: Wallet },
      { title: "Shift", href: "/shifts", icon: Clock, permission: "shifts.view" },
      { title: "Log Audit", href: "/audit-logs", icon: FileText, permission: "audit.view" },
    ],
  },
  {
    title: "Laporan",
    items: [
      { title: "Pusat Laporan", href: "/reports", icon: BarChart3, permission: "reports.view" },
      { title: "Penjualan", href: "/reports/sales", icon: BarChart3, permission: "reports.view" },
      { title: "Laba Rugi", href: "/reports/profit", icon: Wallet, permission: "reports.view" },
      { title: "Pembelian", href: "/reports/purchase", icon: ShoppingBag, permission: "reports.view" },
      { title: "Pembayaran", href: "/reports/payment", icon: CreditCard, permission: "reports.view" },
      { title: "Inventaris", href: "/reports/inventory", icon: Boxes, permission: "reports.view" },
      { title: "Produk", href: "/reports/products", icon: Utensils, permission: "reports.view" },
      { title: "Pelanggan", href: "/reports/customers", icon: Users, permission: "reports.view" },
      { title: "Kasir", href: "/reports/cashier", icon: UserRound, permission: "reports.view" },
      { title: "Shift", href: "/reports/shift", icon: Clock, permission: "reports.view" },
      { title: "Cabang", href: "/reports/branch", icon: Store, permission: "reports.view" },
      { title: "Mutasi Stok", href: "/reports/stock-movement", icon: Activity, permission: "reports.view" },
      { title: "Opname Stok", href: "/reports/stock-opname", icon: ClipboardList, permission: "reports.view" },
    ],
  },
]

export const bottomNav: NavItem[] = [
  { title: "Beranda", href: "/dashboard", icon: LayoutDashboard },
  { title: "POS", href: "/pos", icon: ShoppingCart },
  { title: "Pesanan", href: "/orders", icon: ClipboardList },
  { title: "Dapur", href: "/kitchen", icon: ChefHat },
  { title: "Lainnya", href: "/settings", icon: Settings },
]

export const allNavItems: NavItem[] = dashboardNav.flatMap((s) => s.items)