export type Role =
  | "SUPER_ADMIN"
  | "OWNER"
  | "MANAGER"
  | "CASHIER"
  | "KITCHEN"
  | "WAITER"
  | "INVENTORY"
  | "ACCOUNTING"

export type OrderStatus =
  | "NEW"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "SERVED"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED"

export type OrderType = "DINE_IN" | "TAKE_AWAY" | "DELIVERY" | "PICK_UP"

export type OrderPaymentStatus = "UNPAID" | "PARTIAL" | "PAID" | "REFUNDED"

export type PaymentMethod =
  | "CASH"
  | "BANK_TRANSFER"
  | "QRIS"
  | "DEBIT"
  | "CREDIT"
  | "E_WALLET"
  | "OTHER"

export type TableStatus =
  | "AVAILABLE"
  | "OCCUPIED"
  | "RESERVED"
  | "WAITING_PAYMENT"
  | "CLEANING"
  | "OUT_OF_SERVICE"

export type StockMovementType =
  | "STOCK_IN"
  | "STOCK_OUT"
  | "ADJUSTMENT"
  | "TRANSFER"
  | "WASTE"
  | "PURCHASE"
  | "SALE_CONSUMPTION"

export type POStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "RECEIVED"
  | "PARTIAL"
  | "CANCELLED"

export type StockOpnameStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "ADJUSTED" | "CANCELLED"

export type MemberLevel = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM"

export type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SEATED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"

export type ShiftStatus = "OPEN" | "CLOSED"

export interface Organization {
  id: string
  name: string
  legal_name?: string
  logo_url?: string
  address?: string
  phone?: string
  email?: string
  tax_name?: string
  tax_percentage?: number
  tax_inclusive?: boolean
  service_charge_percentage?: number
  currency?: string
  created_at: string
  updated_at: string
}

export interface Branch {
  id: string
  organization_id: string
  name: string
  code: string
  address?: string
  phone?: string
  city?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  user_id: string
  username: string
  full_name: string
  phone?: string
  avatar_url?: string
  role: Role
  branch_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface Permission {
  id: string
  key: string
  name: string
  description?: string
  module: string
}

export interface RolePermission {
  id: string
  role: Role
  permission_id: string
}

export interface Category {
  id: string
  organization_id: string
  name: string
  slug: string
  description?: string
  icon?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  organization_id: string
  category_id: string
  name: string
  sku: string
  barcode?: string
  description?: string
  image_url?: string
  purchase_price: number
  selling_price: number
  cost_price: number
  tax_percentage: number
  unit: string
  stock_tracking: boolean
  minimum_stock: number
  is_active: boolean
  is_favorite: boolean
  has_variants: boolean
  created_at: string
  updated_at: string
  category?: Category
  variants?: ProductVariant[]
  modifiers?: any[]
}

export interface ProductVariant {
  id: string
  product_id: string
  name: string
  price: number
  cost_price: number
  sku?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ModifierOption {
  id: string
  modifier_id: string
  name: string
  price: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Modifier {
  id: string
  organization_id: string
  name: string
  required: boolean
  min: number
  max: number
  is_active: boolean
  options: ModifierOption[]
  created_at: string
  updated_at: string
}

export interface RestaurantTable {
  id: string
  branch_id: string
  number: string
  name?: string
  capacity: number
  area_id?: string
  status: TableStatus
  pos_x?: number
  pos_y?: number
  width?: number
  height?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TableArea {
  id: string
  branch_id: string
  name: string
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  organization_id: string
  branch_id: string
  order_number: string
  status: OrderStatus
  order_type: OrderType
  table_id?: string
  customer_id?: string
  cashier_id?: string
  waiter_id?: string
  subtotal: number
  discount: number
  discount_id?: string
  tax_amount: number
  service_charge: number
  total: number
  paid_amount: number
  change_amount: number
  payment_status: OrderPaymentStatus
  notes?: string
  prepared_by?: string
  completed_by?: string
  void_reason?: string
  created_at: string
  updated_at: string
  items?: OrderItem[]
  payments?: Payment[]
  table?: RestaurantTable
  customer?: Customer
  cashier?: Profile
  waiter?: Profile
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  variant_id?: string
  variant_name?: string
  quantity: number
  unit_price: number
  discount: number
  tax_percentage: number
  tax_amount: number
  subtotal: number
  total: number
  notes?: string
  status: OrderStatus
  modifiers?: OrderItemModifier[]
  created_at: string
}

export interface OrderItemModifier {
  id: string
  order_item_id: string
  modifier_option_id: string
  modifier_name: string
  option_name: string
  price: number
}

export interface Payment {
  id: string
  order_id: string
  amount: number
  method: PaymentMethod
  status: "SUCCESS" | "PENDING" | "FAILED" | "REFUNDED"
  reference?: string
  paid_by?: string
  payment_date: string
  created_at: string
}

export interface Customer {
  id: string
  organization_id: string
  name: string
  phone?: string
  email?: string
  address?: string
  birthday?: string
  notes?: string
  is_member: boolean
  member_level: MemberLevel
  points: number
  total_spent: number
  created_at: string
  updated_at: string
}

export interface Recipe {
  id: string
  product_id: string
  name: string
  description?: string
  items?: RecipeItem[]
  created_at: string
  updated_at: string
}

export interface RecipeItem {
  id: string
  recipe_id: string
  inventory_item_id: string
  quantity: number
  unit: string
  inventory_item?: InventoryItem
}

export interface InventoryItem {
  id: string
  organization_id: string
  warehouse_id?: string
  name: string
  sku: string
  unit: string
  quantity: number
  minimum_stock: number
  maximum_stock?: number
  cost_price: number
  barcode?: string
  is_active: boolean
  category: "RAW" | "PACKAGING" | "FINISHED_GOODS"
  created_at: string
  updated_at: string
}

export interface Warehouse {
  id: string
  branch_id: string
  name: string
  code: string
  address?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface StockMovement {
  id: string
  organization_id: string
  branch_id: string
  inventory_item_id: string
  warehouse_id?: string
  movement_type: StockMovementType
  quantity: number
  before_quantity: number
  after_quantity: number
  reference: string
  reference_id?: string
  cost_price: number
  notes?: string
  created_by?: string
  created_at: string
}

export interface StockOpname {
  id: string
  organization_id: string
  branch_id: string
  warehouse_id: string
  opname_number: string
  status: StockOpnameStatus
  notes?: string
  created_by?: string
  approved_by?: string
  created_at: string
  updated_at: string
  items?: StockOpnameItem[]
}

export interface StockOpnameItem {
  id: string
  stock_opname_id: string
  inventory_item_id: string
  system_quantity: number
  physical_quantity: number
  difference: number
  difference_value: number
  reason?: string
  inventory_item?: InventoryItem
}

export interface Supplier {
  id: string
  organization_id: string
  name: string
  company?: string
  phone?: string
  email?: string
  address?: string
  npwp?: string
  payment_terms?: string
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PurchaseOrder {
  id: string
  organization_id: string
  branch_id: string
  supplier_id: string
  po_number: string
  status: POStatus
  order_date: string
  expected_date?: string
  received_date?: string
  subtotal: number
  discount: number
  tax: number
  total: number
  notes?: string
  created_by?: string
  approved_by?: string
  created_at: string
  updated_at: string
  supplier?: Supplier
  items?: PurchaseOrderItem[]
}

export interface PurchaseOrderItem {
  id: string
  purchase_order_id: string
  inventory_item_id: string
  quantity: number
  received_quantity: number
  unit_price: number
  discount: number
  tax_percentage: number
  total: number
  inventory_item?: InventoryItem
}

export interface ExpenseCategory {
  id: string
  organization_id: string
  name: string
  icon?: string
  created_at: string
}

export interface Expense {
  id: string
  organization_id: string
  branch_id: string
  category_id: string
  amount: number
  description?: string
  expense_date: string
  created_by?: string
  created_at: string
  category?: ExpenseCategory
}

export interface Employee {
  id: string
  organization_id: string
  branch_id?: string
  name: string
  employee_id: string
  phone?: string
  position: string
  status: "ACTIVE" | "INACTIVE"
  created_at: string
  updated_at: string
}

export interface Attendance {
  id: string
  employee_id: string
  date: string
  clock_in?: string
  clock_out?: string
  shift_id?: string
  overtime_minutes?: number
  notes?: string
  created_at: string
}

export interface CashierShift {
  id: string
  organization_id: string
  branch_id: string
  user_id: string
  opening_cash: number
  opening_time: string
  closing_time?: string
  cash_sales?: number
  cash_refunds?: number
  expected_cash?: number
  actual_cash?: number
  difference?: number
  status: ShiftStatus
  notes?: string
  created_at: string
  updated_at: string
}

export interface Promotion {
  id: string
  organization_id: string
  name: string
  type: "PERCENTAGE" | "FIXED" | "BUY_ONE_GET_ONE" | "BUY_X_GET_Y" | "HAPPY_HOUR"
  value: number
  buy_quantity?: number
  get_quantity?: number
  product_id?: string
  category_id?: string
  member_level?: MemberLevel
  start_date?: string
  end_date?: string
  start_time?: string
  end_time?: string
  is_active: boolean
  created_at: string
  updated_at: string
  product?: Product
  category?: Category
}

export interface Voucher {
  id: string
  organization_id: string
  code: string
  type: "PERCENTAGE" | "FIXED"
  value: number
  min_purchase?: number
  max_discount?: number
  valid_from?: string
  valid_until?: string
  usage_limit?: number
  used_count: number
  is_active: boolean
  created_at: string
}

export interface Reservation {
  id: string
  organization_id: string
  branch_id: string
  customer_name: string
  customer_phone: string
  reservation_date: string
  reservation_time: string
  guests: number
  table_id?: string
  notes?: string
  status: ReservationStatus
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  organization_id: string
  user_id?: string
  type: string
  title: string
  message: string
  data?: any
  is_read: boolean
  created_at: string
}

export interface AuditLog {
  id: string
  organization_id: string
  user_id?: string
  action: string
  entity: string
  entity_id?: string
  old_data?: any
  new_data?: any
  ip?: string
  user_agent?: string
  created_at: string
}

export interface Setting {
  id: string
  organization_id?: string
  key: string
  value: any
  updated_at: string
}

export interface SystemPermissions {
  [role: string]: string[]
}

export const SYSTEM_PERMISSIONS: SystemPermissions = {
  SUPER_ADMIN: ["*"],
  OWNER: [
    "dashboard.view", "sales.view", "orders.view", "orders.create", "orders.edit", "orders.cancel",
    "products.view", "products.create", "products.edit", "products.delete",
    "inventory.view", "inventory.create", "inventory.adjust",
    "purchases.view", "purchases.create",
    "reports.view", "reports.export",
    "users.view", "users.create", "users.edit",
    "settings.manage", "branches.manage",
    "customers.view", "customers.create", "customers.edit",
    "expenses.view", "expenses.create",
    "employees.view", "employees.create", "employees.edit",
  ],
  MANAGER: [
    "dashboard.view", "sales.view", "orders.view", "orders.create", "orders.edit", "orders.cancel",
    "products.view", "products.create", "products.edit",
    "inventory.view", "inventory.create", "inventory.adjust",
    "purchases.view", "purchases.create",
    "reports.view", "reports.export",
    "customers.view", "customers.create", "customers.edit",
    "expenses.view", "expenses.create",
    "employees.view",
  ],
  CASHIER: [
    "dashboard.view", "sales.view",
    "orders.create", "orders.create", "orders.edit",
    "customers.create", "customers.view",
  ],
  KITCHEN: ["orders.view", "orders.edit"],
  WAITER: ["orders.create", "orders.edit", "orders.view"],
  INVENTORY: [
    "inventory.view", "inventory.create", "inventory.adjust",
    "purchases.view", "purchases.create",
  ],
  ACCOUNTING: ["reports.view", "reports.export", "expenses.view"],
}

export const PERMISSION_MATRIX: { key: string; name: string; module: string; description: string }[] = [
  { key: "dashboard.view", name: "View Dashboard", module: "Dashboard", description: "View dashboard and analytics" },
  { key: "sales.view", name: "View Sales", module: "Sales", description: "View sales data" },
  { key: "sales.create", name: "Create Sale", module: "Sales", description: "Create new sales" },
  { key: "sales.edit", name: "Edit Sale", module: "Sales", description: "Edit sales transactions" },
  { key: "sales.delete", name: "Delete Sale", module: "Sales", description: "Delete sales transactions" },
  { key: "orders.view", name: "View Orders", module: "Orders", description: "View orders" },
  { key: "orders.create", name: "Create Orders", module: "Orders", description: "Create new orders" },
  { key: "orders.edit", name: "Edit Orders", module: "Orders", description: "Edit orders" },
  { key: "orders.cancel", name: "Cancel Orders", module: "Orders", description: "Cancel orders" },
  { key: "products.view", name: "View Products", module: "Products", description: "View products" },
  { key: "products.create", name: "Create Products", module: "Products", description: "Create products" },
  { key: "products.edit", name: "Edit Products", module: "Products", description: "Edit products" },
  { key: "products.delete", name: "Delete Products", module: "Products", description: "Delete products" },
  { key: "inventory.view", name: "View Inventory", module: "Inventory", description: "View inventory" },
  { key: "inventory.create", name: "Create Inventory", module: "Inventory", description: "Create inventory items" },
  { key: "inventory.adjust", name: "Adjust Inventory", module: "Inventory", description: "Adjust stock quantities" },
  { key: "purchases.view", name: "View Purchases", module: "Purchases", description: "View purchase orders" },
  { key: "purchases.create", name: "Create Purchases", module: "Purchases", description: "Create purchase orders" },
  { key: "reports.view", name: "View Reports", module: "Reports", description: "View reports" },
  { key: "reports.export", name: "Export Reports", module: "Reports", description: "Export reports" },
  { key: "users.view", name: "View Users", module: "Users", description: "View users" },
  { key: "users.create", name: "Create Users", module: "Users", description: "Create users" },
  { key: "users.edit", name: "Edit Users", module: "Users", description: "Edit users" },
  { key: "settings.manage", name: "Manage Settings", module: "Settings", description: "Manage system settings" },
  { key: "branches.manage", name: "Manage Branches", module: "Branches", description: "Manage branches" },
  { key: "customers.view", name: "View Customers", module: "Customers", description: "View customers" },
  { key: "customers.create", name: "Create Customers", module: "Customers", description: "Create customers" },
  { key: "customers.edit", name: "Edit Customers", module: "Customers", description: "Edit customers" },
  { key: "expenses.view", name: "View Expenses", module: "Expenses", description: "View expenses" },
  { key: "expenses.create", name: "Create Expenses", module: "Expenses", description: "Create expenses" },
  { key: "employees.view", name: "View Employees", module: "Employees", description: "View employees" },
  { key: "employees.create", name: "Create Employees", module: "Employees", description: "Create employees" },
  { key: "employees.edit", name: "Edit Employees", module: "Employees", description: "Edit employees" },
  { key: "reservations.view", name: "View Reservations", module: "Reservations", description: "View reservations" },
  { key: "reservations.create", name: "Create Reservations", module: "Reservations", description: "Create reservations" },
  { key: "promotions.view", name: "View Promotions", module: "Promotions", description: "View promotions" },
  { key: "promotions.create", name: "Create Promotions", module: "Promotions", description: "Create promotions" },
  { key: "shifts.view", name: "View Shifts", module: "Shifts", description: "View cashier shifts" },
  { key: "shifts.open", name: "Open Shift", module: "Shifts", description: "Open a cashier shift" },
  { key: "shifts.close", name: "Close Shift", module: "Shifts", description: "Close a cashier shift" },
  { key: "audit.view", name: "View Audit Log", module: "Audit", description: "View audit logs" },
  { key: "purchases.receive", name: "Receive Purchases", module: "Purchases", description: "Receive purchase orders" },
]