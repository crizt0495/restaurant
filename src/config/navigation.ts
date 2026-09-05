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
    title: "Overview",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "dashboard.view" },
      { title: "POS", href: "/pos", icon: ShoppingCart, permission: "orders.create" },
      { title: "Orders", href: "/orders", icon: ClipboardList, permission: "orders.view" },
      { title: "Tables", href: "/tables", icon: Grid3X3, permission: "orders.view" },
      { title: "Kitchen", href: "/kitchen", icon: ChefHat, permission: "orders.view" },
      { title: "Reservations", href: "/reservations", icon: CalendarDays },
    ],
  },
  {
    title: "Management",
    items: [
      { title: "Products", href: "/products", icon: Utensils, permission: "products.view" },
      { title: "Recipes", href: "/recipes", icon: BookOpen, permission: "products.view" },
      { title: "Inventory", href: "/inventory", icon: Boxes, permission: "inventory.view" },
      { title: "Purchases", href: "/purchases", icon: ShoppingBag, permission: "purchases.view" },
      { title: "Suppliers", href: "/suppliers", icon: Truck },
      { title: "Customers", href: "/customers", icon: Users },
      { title: "Promotions", href: "/promotions", icon: Percent },
      { title: "Employees", href: "/employees", icon: UserRound },
      { title: "Expenses", href: "/expenses", icon: Wallet },
      { title: "Shifts", href: "/shifts", icon: Clock, permission: "shifts.view" },
      { title: "Audit Logs", href: "/audit-logs", icon: FileText, permission: "audit.view" },
    ],
  },
  {
    title: "Reports",
    items: [
      { title: "Reports Hub", href: "/reports", icon: BarChart3, permission: "reports.view" },
      { title: "Sales", href: "/reports/sales", icon: BarChart3, permission: "reports.view" },
      { title: "Profit & Loss", href: "/reports/profit", icon: Wallet, permission: "reports.view" },
      { title: "Purchase", href: "/reports/purchase", icon: ShoppingBag, permission: "reports.view" },
      { title: "Payment", href: "/reports/payment", icon: CreditCard, permission: "reports.view" },
      { title: "Inventory", href: "/reports/inventory", icon: Boxes, permission: "reports.view" },
      { title: "Products", href: "/reports/products", icon: Utensils, permission: "reports.view" },
      { title: "Customers", href: "/reports/customers", icon: Users, permission: "reports.view" },
      { title: "Cashier", href: "/reports/cashier", icon: UserRound, permission: "reports.view" },
      { title: "Shifts", href: "/reports/shift", icon: Clock, permission: "reports.view" },
      { title: "Branches", href: "/reports/branch", icon: Store, permission: "reports.view" },
      { title: "Stock Movement", href: "/reports/stock-movement", icon: Activity, permission: "reports.view" },
      { title: "Stock Opname", href: "/reports/stock-opname", icon: ClipboardList, permission: "reports.view" },
    ],
  },
]

export const bottomNav: NavItem[] = [
  { title: "Home", href: "/dashboard", icon: LayoutDashboard },
  { title: "POS", href: "/pos", icon: ShoppingCart },
  { title: "Orders", href: "/orders", icon: ClipboardList },
  { title: "Kitchen", href: "/kitchen", icon: ChefHat },
  { title: "More", href: "/settings", icon: Settings },
]

export const allNavItems: NavItem[] = dashboardNav.flatMap((s) => s.items)