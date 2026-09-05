-- =====================================================
-- RESTAURANT MANAGEMENT SYSTEM - FULL DATABASE SCHEMA
-- =====================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "moddatetime";

-- =====================================================
-- ORGANIZATIONS
-- =====================================================
create table if not exists organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  legal_name text,
  logo_url text,
  address text,
  phone text,
  email text,
  tax_name text default 'PPN',
  tax_percentage numeric(10,2) default 0,
  tax_inclusive boolean default false,
  service_charge_percentage numeric(10,2) default 0,
  currency text default 'IDR',
  receipt_format text default 'THERMAL_80',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================================================
-- BRANCHES
-- =====================================================
create table if not exists branches (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  code text not null,
  address text,
  phone text,
  city text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (organization_id, code)
);

create index if not exists idx_branches_org on branches(organization_id);
create index if not exists idx_branches_code on branches(code);

-- =====================================================
-- PROFILES
-- =====================================================
create table if not exists profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text not null,
  phone text,
  avatar_url text,
  role text not null default 'WAITER',
  branch_id uuid references branches(id) on delete set null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  constraint profiles_role_check check (role in ('SUPER_ADMIN','OWNER','MANAGER','CASHIER','KITCHEN','WAITER','INVENTORY','ACCOUNTING'))
);

create index if not exists idx_profiles_user on profiles(user_id);
create index if not exists idx_profiles_username on profiles(username);
create index if not exists idx_profiles_branch on profiles(branch_id);
create index if not exists idx_profiles_role on profiles(role);

-- =====================================================
-- PERMISSIONS
-- =====================================================
create table if not exists permissions (
  id uuid primary key default uuid_generate_v4(),
  key text unique not null,
  name text not null,
  description text,
  module text not null,
  created_at timestamptz default now()
);

create table if not exists role_permissions (
  id uuid primary key default uuid_generate_v4(),
  role text not null,
  permission_id uuid not null references permissions(id) on delete cascade,
  created_at timestamptz default now(),
  unique (role, permission_id)
);

create index if not exists idx_rp_role on role_permissions(role);
create index if not exists idx_rp_permission on role_permissions(permission_id);

-- =====================================================
-- CATEGORIES
-- =====================================================
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  icon text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (organization_id, slug)
);

create index if not exists idx_categories_org on categories(organization_id);

-- =====================================================
-- PRODUCTS
-- =====================================================
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  name text not null,
  sku text not null,
  barcode text,
  description text,
  image_url text,
  purchase_price numeric(14,2) default 0,
  selling_price numeric(14,2) default 0,
  cost_price numeric(14,2) default 0,
  tax_percentage numeric(10,2) default 0,
  unit text default 'pcs',
  stock_tracking boolean default true,
  minimum_stock numeric(14,2) default 0,
  is_active boolean default true,
  is_favorite boolean default false,
  has_variants boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  unique (organization_id, sku)
);

create index if not exists idx_products_org on products(organization_id);
create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_sku on products(sku);
create index if not exists idx_products_barcode on products(barcode);
create index if not exists idx_products_active on products(is_active);

-- =====================================================
-- PRODUCT VARIANTS
-- =====================================================
create table if not exists product_variants (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  price numeric(14,2) not null,
  cost_price numeric(14,2) default 0,
  sku text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_pv_product on product_variants(product_id);

-- =====================================================
-- MODIFIERS
-- =====================================================
create table if not exists modifiers (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  required boolean default false,
  min int default 0,
  max int default 1,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_modifiers_org on modifiers(organization_id);

create table if not exists modifier_options (
  id uuid primary key default uuid_generate_v4(),
  modifier_id uuid not null references modifiers(id) on delete cascade,
  name text not null,
  price numeric(14,2) default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_mo_modifier on modifier_options(modifier_id);

create table if not exists product_modifiers (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  modifier_id uuid not null references modifiers(id) on delete cascade,
  created_at timestamptz default now(),
  unique (product_id, modifier_id)
);

create index if not exists idx_pm_product on product_modifiers(product_id);

-- =====================================================
-- TABLE AREAS & TABLES
-- =====================================================
create table if not exists table_areas (
  id uuid primary key default uuid_generate_v4(),
  branch_id uuid not null references branches(id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_ta_branch on table_areas(branch_id);

create table if not exists restaurant_tables (
  id uuid primary key default uuid_generate_v4(),
  branch_id uuid not null references branches(id) on delete cascade,
  number text not null,
  name text,
  capacity int default 2,
  area_id uuid references table_areas(id) on delete set null,
  status text not null default 'AVAILABLE',
  pos_x numeric(10,2),
  pos_y numeric(10,2),
  width numeric(10,2),
  height numeric(10,2),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (branch_id, number),
  constraint tables_status_check check (status in ('AVAILABLE','OCCUPIED','RESERVED','WAITING_PAYMENT','CLEANING','OUT_OF_SERVICE'))
);

create index if not exists idx_rt_branch on restaurant_tables(branch_id);
create index if not exists idx_rt_status on restaurant_tables(status);

-- =====================================================
-- CUSTOMERS
-- =====================================================
create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  address text,
  birthday date,
  notes text,
  is_member boolean default false,
  member_level text default 'BRONZE',
  points numeric(14,2) default 0,
  total_spent numeric(14,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  constraint customers_level_check check (member_level in ('BRONZE','SILVER','GOLD','PLATINUM'))
);

create index if not exists idx_customers_org on customers(organization_id);
create index if not exists idx_customers_phone on customers(phone);
create index if not exists idx_customers_member on customers(is_member);

-- =====================================================
-- ORDERS
-- =====================================================
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  order_number text unique not null,
  status text not null default 'NEW',
  order_type text not null default 'DINE_IN',
  table_id uuid references restaurant_tables(id) on delete set null,
  customer_id uuid references customers(id) on delete set null,
  cashier_id uuid references profiles(id) on delete set null,
  waiter_id uuid references profiles(id) on delete set null,
  subtotal numeric(14,2) default 0,
  discount numeric(14,2) default 0,
  discount_id uuid,
  tax_amount numeric(14,2) default 0,
  service_charge numeric(14,2) default 0,
  total numeric(14,2) default 0,
  paid_amount numeric(14,2) default 0,
  change_amount numeric(14,2) default 0,
  payment_status text not null default 'UNPAID',
  notes text,
  void_reason text,
  cancelled_by uuid,
  cancelled_at timestamptz,
  completed_by uuid,
  completed_at timestamptz,
  source text default 'POS',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint orders_status_check check (status in ('NEW','CONFIRMED','PREPARING','READY','SERVED','COMPLETED','CANCELLED','REFUNDED')),
  constraint orders_type_check check (order_type in ('DINE_IN','TAKE_AWAY','DELIVERY','PICK_UP')),
  constraint orders_payment_check check (payment_status in ('UNPAID','PARTIAL','PAID','REFUNDED'))
);

create index if not exists idx_orders_org on orders(organization_id);
create index if not exists idx_orders_branch on orders(branch_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_created on orders(created_at desc);
create index if not exists idx_orders_number on orders(order_number);
create index if not exists idx_orders_table on orders(table_id);

-- =====================================================
-- ORDER ITEMS
-- =====================================================
create table if not exists order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  variant_id uuid,
  variant_name text,
  quantity numeric(14,2) not null default 1,
  unit_price numeric(14,2) not null,
  discount numeric(14,2) default 0,
  tax_percentage numeric(10,2) default 0,
  tax_amount numeric(14,2) default 0,
  subtotal numeric(14,2) not null,
  total numeric(14,2) not null,
  notes text,
  status text not null default 'NEW',
  created_at timestamptz default now(),
  constraint oi_status_check check (status in ('NEW','CONFIRMED','PREPARING','READY','SERVED','COMPLETED','CANCELLED','REFUNDED'))
);

create index if not exists idx_oi_order on order_items(order_id);
create index if not exists idx_oi_product on order_items(product_id);

create table if not exists order_item_modifiers (
  id uuid primary key default uuid_generate_v4(),
  order_item_id uuid not null references order_items(id) on delete cascade,
  modifier_option_id uuid,
  modifier_name text not null,
  option_name text not null,
  price numeric(14,2) default 0,
  created_at timestamptz default now()
);

create index if not exists idx_oim_item on order_item_modifiers(order_item_id);

-- =====================================================
-- PAYMENTS
-- =====================================================
create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  amount numeric(14,2) not null,
  method text not null,
  status text not null default 'SUCCESS',
  reference text,
  paid_by text,
  payment_date timestamptz default now(),
  created_at timestamptz default now(),
  created_by uuid references profiles(id) on delete set null,
  constraint payments_method_check check (method in ('CASH','BANK_TRANSFER','QRIS','DEBIT','CREDIT','E_WALLET','OTHER')),
  constraint payments_status_check check (status in ('SUCCESS','PENDING','FAILED','REFUNDED'))
);

create index if not exists idx_pay_order on payments(order_id);
create index if not exists idx_pay_date on payments(payment_date desc);

create table if not exists payment_items (
  id uuid primary key default uuid_generate_v4(),
  payment_id uuid not null references payments(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  amount numeric(14,2) not null,
  method text not null,
  created_at timestamptz default now()
);

create index if not exists idx_pi_payment on payment_items(payment_id);

-- =====================================================
-- REFUNDS
-- =====================================================
create table if not exists refunds (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  amount numeric(14,2) not null,
  reason text,
  refund_method text,
  refunded_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists idx_refunds_order on refunds(order_id);

-- =====================================================
-- RECIPES
-- =====================================================
create table if not exists recipes (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_recipes_product on recipes(product_id);

create table if not exists recipe_items (
  id uuid primary key default uuid_generate_v4(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  inventory_item_id uuid not null references inventory_items(id) on delete cascade,
  quantity numeric(14,2) not null default 1,
  unit text,
  created_at timestamptz default now()
);

create index if not exists idx_ri_recipe on recipe_items(recipe_id);
create index if not exists idx_ri_inv on recipe_items(inventory_item_id);

-- =====================================================
-- WAREHOUSES & INVENTORY
-- =====================================================
create table if not exists warehouses (
  id uuid primary key default uuid_generate_v4(),
  branch_id uuid not null references branches(id) on delete cascade,
  name text not null,
  code text not null,
  address text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (branch_id, code)
);

create index if not exists idx_war_branch on warehouses(branch_id);

create table if not exists inventory_items (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  sku text not null,
  unit text default 'pcs',
  quantity numeric(14,2) default 0,
  minimum_stock numeric(14,2) default 0,
  maximum_stock numeric(14,2),
  cost_price numeric(14,2) default 0,
  barcode text,
  category text default 'RAW',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  unique (organization_id, sku)
);

create index if not exists idx_inv_org on inventory_items(organization_id);
create index if not exists idx_inv_sku on inventory_items(sku);

create table if not exists inventory_item_warehouses (
  id uuid primary key default uuid_generate_v4(),
  inventory_item_id uuid not null references inventory_items(id) on delete cascade,
  warehouse_id uuid not null references warehouses(id) on delete cascade,
  quantity numeric(14,2) default 0,
  batch_code text,
  expiry_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (inventory_item_id, warehouse_id, batch_code)
);

create index if not exists idx_iw_item on inventory_item_warehouses(inventory_item_id);
create index if not exists idx_iw_warehouse on inventory_item_warehouses(warehouse_id);

create table if not exists stock_movements (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  inventory_item_id uuid not null references inventory_items(id) on delete cascade,
  warehouse_id uuid references warehouses(id) on delete set null,
  movement_type text not null,
  quantity numeric(14,2) not null,
  before_quantity numeric(14,2) default 0,
  after_quantity numeric(14,2) default 0,
  reference text,
  reference_id uuid,
  cost_price numeric(14,2) default 0,
  notes text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  constraint sm_type_check check (movement_type in ('STOCK_IN','STOCK_OUT','ADJUSTMENT','TRANSFER','WASTE','PURCHASE','SALE_CONSUMPTION'))
);

create index if not exists idx_sm_item on stock_movements(inventory_item_id);
create index if not exists idx_sm_branch on stock_movements(branch_id);
create index if not exists idx_sm_date on stock_movements(created_at desc);

-- =====================================================
-- STOCK OPNAME
-- =====================================================
create table if not exists stock_opnames (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  warehouse_id uuid references warehouses(id) on delete set null,
  opname_number text unique not null,
  status text not null default 'DRAFT',
  notes text,
  created_by uuid references profiles(id) on delete set null,
  approved_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint sop_status_check check (status in ('DRAFT','SUBMITTED','APPROVED','ADJUSTED','CANCELLED'))
);

create index if not exists idx_so_branch on stock_opnames(branch_id);

create table if not exists stock_opname_items (
  id uuid primary key default uuid_generate_v4(),
  stock_opname_id uuid not null references stock_opnames(id) on delete cascade,
  inventory_item_id uuid not null references inventory_items(id) on delete cascade,
  system_quantity numeric(14,2) default 0,
  physical_quantity numeric(14,2) default 0,
  difference numeric(14,2) default 0,
  difference_value numeric(14,2) default 0,
  reason text,
  created_at timestamptz default now()
);

create index if not exists idx_soi_opname on stock_opname_items(stock_opname_id);

-- =====================================================
-- SUPPLIERS & PURCHASES
-- =====================================================
create table if not exists suppliers (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  company text,
  phone text,
  email text,
  address text,
  npwp text,
  payment_terms text,
  notes text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create index if not exists idx_sup_org on suppliers(organization_id);

create table if not exists purchase_orders (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  supplier_id uuid not null references suppliers(id) on delete cascade,
  po_number text unique not null,
  status text not null default 'DRAFT',
  order_date date default current_date,
  expected_date date,
  received_date date,
  subtotal numeric(14,2) default 0,
  discount numeric(14,2) default 0,
  tax numeric(14,2) default 0,
  total numeric(14,2) default 0,
  notes text,
  created_by uuid references profiles(id) on delete set null,
  approved_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint po_status_check check (status in ('DRAFT','PENDING','APPROVED','RECEIVED','PARTIAL','CANCELLED'))
);

create index if not exists idx_po_branch on purchase_orders(branch_id);
create index if not exists idx_po_supplier on purchase_orders(supplier_id);

create table if not exists purchase_order_items (
  id uuid primary key default uuid_generate_v4(),
  purchase_order_id uuid not null references purchase_orders(id) on delete cascade,
  inventory_item_id uuid not null references inventory_items(id) on delete cascade,
  quantity numeric(14,2) not null,
  received_quantity numeric(14,2) default 0,
  unit_price numeric(14,2) not null,
  discount numeric(14,2) default 0,
  tax_percentage numeric(10,2) default 0,
  total numeric(14,2) default 0,
  created_at timestamptz default now()
);

create index if not exists idx_poi_po on purchase_order_items(purchase_order_id);

create table if not exists goods_receipts (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  purchase_order_id uuid references purchase_orders(id) on delete cascade,
  warehouse_id uuid references warehouses(id) on delete set null,
  receipt_number text unique not null,
  received_date date default current_date,
  notes text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists idx_gr_po on goods_receipts(purchase_order_id);

create table if not exists goods_receipt_items (
  id uuid primary key default uuid_generate_v4(),
  goods_receipt_id uuid not null references goods_receipts(id) on delete cascade,
  inventory_item_id uuid not null references inventory_items(id) on delete cascade,
  quantity numeric(14,2) not null,
  unit_price numeric(14,2) not null,
  created_at timestamptz default now()
);

create index if not exists idx_gri_gr on goods_receipt_items(goods_receipt_id);

-- =====================================================
-- EXPENSES
-- =====================================================
create table if not exists expense_categories (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  icon text,
  created_at timestamptz default now()
);

create index if not exists idx_ec_org on expense_categories(organization_id);

create table if not exists expenses (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid references branches(id) on delete cascade,
  category_id uuid references expense_categories(id) on delete cascade,
  amount numeric(14,2) not null,
  description text,
  expense_date date default current_date,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists idx_exp_branch on expenses(branch_id);
create index if not exists idx_exp_date on expenses(expense_date desc);

-- =====================================================
-- EMPLOYEES
-- =====================================================
create table if not exists employees (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  name text not null,
  employee_id text unique not null,
  phone text,
  position text,
  status text default 'ACTIVE',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_emp_branch on employees(branch_id);

create table if not exists employee_shifts (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid not null references employees(id) on delete cascade,
  shift_date date not null,
  start_time time,
  end_time time,
  notes text,
  created_at timestamptz default now()
);

create index if not exists idx_es_employee on employee_shifts(employee_id);

-- =====================================================
-- ATTENDANCE
-- =====================================================
create table if not exists attendance (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid not null references employees(id) on delete cascade,
  date date not null,
  clock_in time,
  clock_out time,
  shift_id uuid references employee_shifts(id) on delete set null,
  overtime_minutes int default 0,
  notes text,
  created_at timestamptz default now(),
  unique (employee_id, date)
);

create index if not exists idx_att_employee on attendance(employee_id);

-- =====================================================
-- CASHIER SHIFTS
-- =====================================================
create table if not exists cashier_shifts (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  opening_cash numeric(14,2) default 0,
  opening_time timestamptz default now(),
  closing_time timestamptz,
  cash_sales numeric(14,2) default 0,
  cash_refunds numeric(14,2) default 0,
  expected_cash numeric(14,2) default 0,
  actual_cash numeric(14,2) default 0,
  difference numeric(14,2) default 0,
  status text default 'OPEN',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint cs_status_check check (status in ('OPEN','CLOSED'))
);

create index if not exists idx_cs_branch on cashier_shifts(branch_id);
create index if not exists idx_cs_user on cashier_shifts(user_id);

-- =====================================================
-- PROMOTIONS & VOUCHERS
-- =====================================================
create table if not exists promotions (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  type text not null,
  value numeric(14,2) default 0,
  buy_quantity int,
  get_quantity int,
  product_id uuid references products(id) on delete cascade,
  category_id uuid references categories(id) on delete cascade,
  member_level text,
  start_date date,
  end_date date,
  start_time time,
  end_time time,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint promo_type_check check (type in ('PERCENTAGE','FIXED','BUY_ONE_GET_ONE','BUY_X_GET_Y','HAPPY_HOUR'))
);

create index if not exists idx_promo_org on promotions(organization_id);
create index if not exists idx_promo_active on promotions(is_active);

create table if not exists vouchers (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  code text not null,
  type text not null,
  value numeric(14,2) not null,
  min_purchase numeric(14,2),
  max_discount numeric(14,2),
  valid_from date,
  valid_until date,
  usage_limit int,
  used_count int default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  unique (code)
);

create index if not exists idx_vouchers_org on vouchers(organization_id);

-- =====================================================
-- LOYALTY
-- =====================================================
create table if not exists customer_points (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references customers(id) on delete cascade,
  points numeric(14,2) not null,
  type text not null,
  reference text,
  reference_id uuid,
  description text,
  created_at timestamptz default now(),
  constraint cp_type_check check (type in ('EARN','REDEEM','EXPIRE','ADJUST'))
);

create index if not exists idx_cp_customer on customer_points(customer_id);

create table if not exists customer_rewards (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references customers(id) on delete cascade,
  reward_name text not null,
  points_cost numeric(14,2) not null,
  value numeric(14,2) not null,
  status text default 'ACTIVE',
  created_at timestamptz default now()
);

create index if not exists idx_cr_customer on customer_rewards(customer_id);

-- =====================================================
-- RESERVATIONS
-- =====================================================
create table if not exists reservations (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  customer_name text not null,
  customer_phone text not null,
  reservation_date date not null,
  reservation_time time not null,
  guests int not null default 1,
  table_id uuid references restaurant_tables(id) on delete set null,
  notes text,
  status text not null default 'PENDING',
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint rs_status_check check (status in ('PENDING','CONFIRMED','SEATED','COMPLETED','CANCELLED','NO_SHOW'))
);

create index if not exists idx_rs_branch on reservations(branch_id);
create index if not exists idx_rs_date on reservations(reservation_date);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text,
  data jsonb,
  is_read boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_notif_user on notifications(user_id);
create index if not exists idx_notif_read on notifications(is_read);
create index if not exists idx_notif_org on notifications(organization_id);

-- =====================================================
-- AUDIT LOGS
-- =====================================================
create table if not exists audit_logs (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  old_data jsonb,
  new_data jsonb,
  ip text,
  user_agent text,
  created_at timestamptz default now()
);

create index if not exists idx_audit_org on audit_logs(organization_id);
create index if not exists idx_audit_user on audit_logs(user_id);
create index if not exists idx_audit_entity on audit_logs(entity);
create index if not exists idx_audit_date on audit_logs(created_at desc);

-- =====================================================
-- SETTINGS
-- =====================================================
create table if not exists settings (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade,
  key text not null,
  value jsonb,
  updated_at timestamptz default now(),
  unique (organization_id, key)
);

create index if not exists idx_settings_org on settings(organization_id);

-- =====================================================
-- TRIGGERS - UPDATED_AT
-- =====================================================
create trigger organizations_updated_at before update on organizations for each row execute procedure moddatetime(updated_at);
create trigger branches_updated_at before update on branches for each row execute procedure moddatetime(updated_at);
create trigger profiles_updated_at before update on profiles for each row execute procedure moddatetime(updated_at);
create trigger categories_updated_at before update on categories for each row execute procedure moddatetime(updated_at);
create trigger products_updated_at before update on products for each row execute procedure moddatetime(updated_at);
create trigger product_variants_updated_at before update on product_variants for each row execute procedure moddatetime(updated_at);
create trigger modifiers_updated_at before update on modifiers for each row execute procedure moddatetime(updated_at);
create trigger modifier_options_updated_at before update on modifier_options for each row execute procedure moddatetime(updated_at);
create trigger table_areas_updated_at before update on table_areas for each row execute procedure moddatetime(updated_at);
create trigger restaurant_tables_updated_at before update on restaurant_tables for each row execute procedure moddatetime(updated_at);
create trigger customers_updated_at before update on customers for each row execute procedure moddatetime(updated_at);
create trigger orders_updated_at before update on orders for each row execute procedure moddatetime(updated_at);
create trigger recipes_updated_at before update on recipes for each row execute procedure moddatetime(updated_at);
create trigger warehouses_updated_at before update on warehouses for each row execute procedure moddatetime(updated_at);
create trigger inventory_items_updated_at before update on inventory_items for each row execute procedure moddatetime(updated_at);
create trigger inventory_item_warehouses_updated_at before update on inventory_item_warehouses for each row execute procedure moddatetime(updated_at);
create trigger stock_opnames_updated_at before update on stock_opnames for each row execute procedure moddatetime(updated_at);
create trigger suppliers_updated_at before update on suppliers for each row execute procedure moddatetime(updated_at);
create trigger purchase_orders_updated_at before update on purchase_orders for each row execute procedure moddatetime(updated_at);
create trigger employees_updated_at before update on employees for each row execute procedure moddatetime(updated_at);
create trigger promotions_updated_at before update on promotions for each row execute procedure moddatetime(updated_at);
create trigger cashier_shifts_updated_at before update on cashier_shifts for each row execute procedure moddatetime(updated_at);
create trigger reservations_updated_at before update on reservations for each row execute procedure moddatetime(updated_at);
create trigger settings_updated_at before update on settings for each row execute procedure moddatetime(updated_at);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
alter table organizations enable row level security;
alter table branches enable row level security;
alter table profiles enable row level security;
alter table permissions enable row level security;
alter table role_permissions enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table modifiers enable row level security;
alter table modifier_options enable row level security;
alter table product_modifiers enable row level security;
alter table table_areas enable row level security;
alter table restaurant_tables enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_item_modifiers enable row level security;
alter table payments enable row level security;
alter table payment_items enable row level security;
alter table refunds enable row level security;
alter table recipes enable row level security;
alter table recipe_items enable row level security;
alter table warehouses enable row level security;
alter table inventory_items enable row level security;
alter table inventory_item_warehouses enable row level security;
alter table stock_movements enable row level security;
alter table stock_opnames enable row level security;
alter table stock_opname_items enable row level security;
alter table suppliers enable row level security;
alter table purchase_orders enable row level security;
alter table purchase_order_items enable row level security;
alter table goods_receipts enable row level security;
alter table goods_receipt_items enable row level security;
alter table expense_categories enable row level security;
alter table expenses enable row level security;
alter table employees enable row level security;
alter table employee_shifts enable row level security;
alter table attendance enable row level security;
alter table cashier_shifts enable row level security;
alter table promotions enable row level security;
alter table vouchers enable row level security;
alter table customer_points enable row level security;
alter table customer_rewards enable row level security;
alter table reservations enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;
alter table settings enable row level security;

-- =====================================================
-- FUNCTIONS & HELPER QUERIES
-- =====================================================

-- Current user's organization id (via auth, SECURITY DEFINER)
create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.organization_id::uuid
  from (
    select pr.branch_id from profiles pr where pr.user_id = auth.uid()
    limit 1
  ) p
$$;

-- Current user's profile
create or replace function public.current_profile()
returns profiles
language sql
stable
security definer
set search_path = public
as $$
  select * from profiles where user_id = auth.uid()
$$;

-- Current user's branch id
create or replace function public.current_branch_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select branch_id from profiles where user_id = auth.uid() limit 1
$$;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- ORGANIZATIONS: users see only own org, super admin all
create policy "org_select_own"
  on organizations for select
  using (
    id = (select b.organization_id from branches b where b.id = (select branch_id from profiles where user_id = auth.uid()))
    or (select role from profiles where user_id = auth.uid()) = 'SUPER_ADMIN'
  );

create policy "org_insert_admin"
  on organizations for insert
  with check ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER'));

create policy "org_update_admin"
  on organizations for update
  using ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER'));

-- BRANCHES
create policy "branch_select_access"
  on branches for select
  using (
    (select role from profiles where user_id = auth.uid()) = 'SUPER_ADMIN'
    or (select branch_id from profiles where user_id = auth.uid()) = id
  );

create policy "branch_insert_admin"
  on branches for insert
  with check ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER'));

create policy "branch_update_admin"
  on branches for update
  using ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER'));

-- PROFILES
create policy "profiles_select_own"
  on profiles for select
  using (
    user_id = auth.uid()
    or (select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER')
    or branch_id = (select branch_id from profiles where user_id = auth.uid())
  );

create policy "profiles_insert_admin"
  on profiles for insert
  with check ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER'));

create policy "profiles_update_own"
  on profiles for update
  using (
    user_id = auth.uid()
    or (select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER')
  );

-- categories
drop policy if exists "cat_select_org" on categories;
create policy "cat_select_org"
  on categories for select
  using (
    organization_id = (select b.organization_id from branches b where b.id = (select branch_id from profiles where user_id = auth.uid()))
    or (select role from profiles where user_id = auth.uid()) = 'SUPER_ADMIN'
  );

create policy "cat_insert_admin"
  on categories for insert
  with check ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER'));

create policy "cat_update_admin"
  on categories for update
  using ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER'));

-- products
drop policy if exists "prod_select_org" on products;
create policy "prod_select_org"
  on products for select
  using (
    organization_id = (select b.organization_id from branches b where b.id = (select branch_id from profiles where user_id = auth.uid()))
    or (select role from profiles where user_id = auth.uid()) = 'SUPER_ADMIN'
  );

create policy "prod_insert_admin"
  on products for insert
  with check ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER'));

create policy "prod_update_admin"
  on products for update
  using ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER'));

create policy "prod_delete_admin"
  on products for delete
  using ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER'));

-- product_variants
create policy "pv_select_own"
  on product_variants for select
  using (
    product_id in (select p.id from products p where p.organization_id = (select b.organization_id from branches b where b.id = (select branch_id from profiles where user_id = auth.uid())))
    or (select role from profiles where user_id = auth.uid()) = 'SUPER_ADMIN'
  );

create policy "pv_insert_admin"
  on product_variants for insert
  with check ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER'));

create policy "pv_update_admin"
  on product_variants for update
  using ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER'));

create policy "pv_delete_admin"
  on product_variants for delete
  using ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER'));

-- modifiers
create policy "mod_select_org"
  on modifiers for select
  using (
    organization_id = (select b.organization_id from branches b where b.id = (select branch_id from profiles where user_id = auth.uid()))
    or (select role from profiles where user_id = auth.uid()) = 'SUPER_ADMIN'
  );

create policy "mod_insert_admin"
  on modifiers for insert
  with check ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER'));

create policy "mod_update_admin"
  on modifiers for update
  using ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER'));

-- modifier_options
create policy "mo_select_own"
  on modifier_options for select
  using (
    modifier_id in (select m.id from modifiers m where m.organization_id = (select b.organization_id from branches b where b.id = (select branch_id from profiles where user_id = auth.uid())))
    or (select role from profiles where user_id = auth.uid()) = 'SUPER_ADMIN'
  );

create policy "mo_insert_admin"
  on modifier_options for insert
  with check ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER'));

create policy "mo_update_admin"
  on modifier_options for update
  using ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER'));

-- product_modifiers
create policy "pm_select_own"
  on product_modifiers for select
  using (
    product_id in (select p.id from products p where p.organization_id = (select b.organization_id from branches b where b.id = (select branch_id from profiles where user_id = auth.uid())))
    or (select role from profiles where user_id = auth.uid()) = 'SUPER_ADMIN'
  );

create policy "pm_insert_admin"
  on product_modifiers for insert
  with check ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER'));

-- table_areas
create policy "ta_select_branch"
  on table_areas for select
  using (
    branch_id = (select branch_id from profiles where user_id = auth.uid())
    or (select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER')
  );

create policy "ta_insert_admin"
  on table_areas for insert
  with check ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER'));

create policy "ta_update_admin"
  on table_areas for update
  using ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER'));

-- restaurant_tables
create policy "rt_select_branch"
  on restaurant_tables for select
  using (
    branch_id = (select branch_id from profiles where user_id = auth.uid())
    or (select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER')
  );

create policy "rt_insert_admin"
  on restaurant_tables for insert
  with check ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER'));

create policy "rt_update_admin"
  on restaurant_tables for update
  using ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER'));

-- customers
create policy "cust_select_org"
  on customers for select
  using (
    organization_id = (select b.organization_id from branches b where b.id = (select branch_id from profiles where user_id = auth.uid()))
    or (select role from profiles where user_id = auth.uid()) = 'SUPER_ADMIN'
  );

create policy "cust_insert_org"
  on customers for insert
  with check (
    (select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER','CASHIER','WAITER')
  );

create policy "cust_update_org"
  on customers for update
  using (
    (select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER','CASHIER')
  );

-- orders: branch-only + super admin
drop policy if exists "ord_select_branch" on orders;
create policy "ord_select_branch"
  on orders for select
  using (
    branch_id = (select branch_id from profiles where user_id = auth.uid())
    or (select role from profiles where user_id = auth.uid()) = 'SUPER_ADMIN'
    or (select role from profiles where user_id = auth.uid()) = 'OWNER'
  );

create policy "ord_insert_staff"
  on orders for insert
  with check (
    (select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER','CASHIER','WAITER')
  );

create policy "ord_update_staff"
  on orders for update
  using ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER','CASHIER','WAITER','KITCHEN'))
  with check (true);

create policy "ord_delete_owner"
  on orders for delete
  using ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER'));

-- order_items
create policy "oi_select_own"
  on order_items for select
  using (
    order_id in (select o.id from orders o where o.branch_id = (select branch_id from profiles where user_id = auth.uid()))
    or (select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER')
  );

create policy "oi_insert_staff"
  on order_items for insert
  with check ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER','CASHIER','WAITER'));

create policy "oi_update_staff"
  on order_items for update
  using ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER','CASHIER','WAITER','KITCHEN'));

-- order_item_modifiers
create policy "oim_select_own"
  on order_item_modifiers for select
  using (
    order_item_id in (select oi.id from order_items oi join orders o on oi.order_id = o.id where o.branch_id = (select branch_id from profiles where user_id = auth.uid()))
    or (select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER')
  );

create policy "oim_insert_staff"
  on order_item_modifiers for insert
  with check ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER','CASHIER','WAITER'));

-- payments
create policy "pay_select_own"
  on payments for select
  using (
    order_id in (select o.id from orders o where o.branch_id = (select branch_id from profiles where user_id = auth.uid()))
    or (select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER')
  );

create policy "pay_insert_staff"
  on payments for insert
  with check ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER','CASHIER'));

create policy "pay_update_owner"
  on payments for update
  using ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER'));

-- payment_items
create policy "pi_select_own"
  on payment_items for select
  using (
    order_id in (select o.id from orders o where o.branch_id = (select branch_id from profiles where user_id = auth.uid()))
    or (select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER')
  );

-- refunds
create policy "ref_select_own"
  on refunds for select
  using (
    branch_id = (select branch_id from profiles where user_id = auth.uid())
    or (select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER')
  );

create policy "ref_insert_staff"
  on refunds for insert
  with check ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER','CASHIER'));

-- warehouses
create policy "war_select_branch"
  on warehouses for select
  using (
    branch_id = (select branch_id from profiles where user_id = auth.uid())
    or (select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER')
  );

create policy "war_insert_admin"
  on warehouses for insert
  with check ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER','INVENTORY'));

create policy "war_update_admin"
  on warehouses for update
  using ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER','INVENTORY'));

-- inventory_items
create policy "inv_select_org"
  on inventory_items for select
  using (
    organization_id = (select b.organization_id from branches b where b.id = (select branch_id from profiles where user_id = auth.uid()))
    or (select role from profiles where user_id = auth.uid()) = 'SUPER_ADMIN'
  );

create policy "inv_insert_admin"
  on inventory_items for insert
  with check ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER','INVENTORY'));

create policy "inv_update_admin"
  on inventory_items for update
  using ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER','INVENTORY'));

create policy "inv_delete_admin"
  on inventory_items for delete
  using ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER','INVENTORY'));

-- stock_movements
create policy "sm_select_branch"
  on stock_movements for select
  using (
    branch_id = (select branch_id from profiles where user_id = auth.uid())
    or (select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER')
  );

create policy "sm_insert_task"
  on stock_movements for insert
  with check ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER','CASHIER','INVENTORY','KITCHEN'));

-- stock_opnames
create policy "so_select_branch"
  on stock_opnames for select
  using (
    branch_id = (select branch_id from profiles where user_id = auth.uid())
    or (select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER')
  );

create policy "so_insert_task"
  on stock_opnames for insert
  with check ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER','INVENTORY'));

create policy "so_update_task"
  on stock_opnames for update
  using ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER','INVENTORY'));

-- stock_opname_items
create policy "soi_select_own"
  on stock_opname_items for select
  using (
    stock_opname_id in (select so.id from stock_opnames so where so.branch_id = (select branch_id from profiles where user_id = auth.uid()))
    or (select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER')
  );

create policy "soi_insert_task"
  on stock_opname_items for insert
  with check ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER','INVENTORY'));

-- suppliers
create policy "sup_select_org"
  on suppliers for select
  using (
    organization_id = (select b.organization_id from branches b where b.id = (select branch_id from profiles where user_id = auth.uid()))
    or (select role from profiles where user_id = auth.uid()) = 'SUPER_ADMIN'
  );

create policy "sup_insert_admin"
  on suppliers for insert
  with check ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER','INVENTORY'));

create policy "sup_update_admin"
  on suppliers for update
  using ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER','INVENTORY'));

create policy "sup_delete_admin"
  on suppliers for delete
  using ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER'));

-- purchase_orders
create policy "po_select_branch"
  on purchase_orders for select
  using (
    branch_id = (select branch_id from profiles where user_id = auth.uid())
    or (select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER')
  );

create policy "po_insert_admin"
  on purchase_orders for insert
  with check ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER','INVENTORY'));

create policy "po_update_admin"
  on purchase_orders for update
  using ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER','INVENTORY'));

create policy "po_delete_owner"
  on purchase_orders for delete
  using ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER'));

-- purchase_order_items
create policy "poi_select_own"
  on purchase_order_items for select
  using (
    purchase_order_id in (select po.id from purchase_orders po where po.branch_id = (select branch_id from profiles where user_id = auth.uid()))
    or (select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER')
  );

create policy "poi_insert_admin"
  on purchase_order_items for insert
  with check ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER','INVENTORY'));

-- rewards, customer_points
create policy "cp_select_org"
  on customer_points for select
  using (
    customer_id in (select c.id from customers c where c.organization_id = (select b.organization_id from branches b where b.id = (select branch_id from profiles where user_id = auth.uid())))
    or (select role from profiles where user_id = auth.uid()) = 'SUPER_ADMIN'
  );

create policy "cr_select_org"
  on customer_rewards for select
  using (
    customer_id in (select c.id from customers c where c.organization_id = (select b.organization_id from branches b where b.id = (select branch_id from profiles where user_id = auth.uid())))
    or (select role from profiles where user_id = auth.uid()) = 'SUPER_ADMIN'
  );

-- promotions
create policy "promo_select_org"
  on promotions for select
  using (
    organization_id = (select b.organization_id from branches b where b.id = (select branch_id from profiles where user_id = auth.uid()))
    or (select role from profiles where user_id = auth.uid()) = 'SUPER_ADMIN'
  );

create policy "promo_insert_admin"
  on promotions for insert
  with check ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER'));

create policy "promo_update_admin"
  on promotions for update
  using ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER'));

-- reservations
create policy "res_select_branch"
  on reservations for select
  using (
    branch_id = (select branch_id from profiles where user_id = auth.uid())
    or (select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER')
  );

create policy "res_insert_staff"
  on reservations for insert
  with check ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER','WAITER','CASHIER'));

create policy "res_update_staff"
  on reservations for update
  using ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER','WAITER','CASHIER'));

-- expenses
create policy "exp_select_branch"
  on expenses for select
  using (
    branch_id = (select branch_id from profiles where user_id = auth.uid())
    or (select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER')
  );

create policy "exp_insert_admin"
  on expenses for insert
  with check ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER','ACCOUNTING'));

create policy "exp_update_owner"
  on expenses for update
  using ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER'));

-- employees
create policy "emp_select_branch"
  on employees for select
  using (
    branch_id = (select branch_id from profiles where user_id = auth.uid())
    or (select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER')
  );

create policy "emp_insert_admin"
  on employees for insert
  with check ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER'));

create policy "emp_update_admin"
  on employees for update
  using ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER'));

-- cashier_shifts
create policy "cs_select_branch"
  on cashier_shifts for select
  using (
    branch_id = (select branch_id from profiles where user_id = auth.uid())
    or (select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER')
  );

create policy "cs_insert_staff"
  on cashier_shifts for insert
  with check ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER','CASHIER'));

create policy "cs_update_staff"
  on cashier_shifts for update
  using ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER','CASHIER'));

-- notifications
create policy "notif_select_own"
  on notifications for select
  using (
    user_id = (select id from profiles where user_id = auth.uid())
    or user_id is null
  );

create policy "notif_insert_system"
  on notifications for insert
  with check (true);

create policy "notif_update_own"
  on notifications for update
  using (user_id = (select id from profiles where user_id = auth.uid()));

-- audit_logs: read only for owner/admin, no user delete (except super admin for cleanup)
create policy "audit_select_owner"
  on audit_logs for select
  using (
    (select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER','MANAGER','ACCOUNTING')
  );

create policy "audit_insert_system"
  on audit_logs for insert
  with check (true);

-- settings
create policy "set_select_org"
  on settings for select
  using (
    organization_id = (select b.organization_id from branches b where b.id = (select branch_id from profiles where user_id = auth.uid()))
    or (select role from profiles where user_id = auth.uid()) = 'SUPER_ADMIN'
    or organization_id is null
  );

create policy "set_insert_admin"
  on settings for insert
  with check ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER'));

create policy "set_update_admin"
  on settings for update
  using ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER'));

-- permissions (readable by all logged in; writable by owner)
create policy "perm_select_all"
  on permissions for select
  using (auth.uid() is not null);

create policy "rp_select_all"
  on role_permissions for select
  using (auth.uid() is not null);

create policy "perm_insert_owner"
  on permissions for insert
  with check ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER'));

create policy "rp_insert_owner"
  on role_permissions for insert
  with check ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER'));

create policy "rp_delete_owner"
  on role_permissions for delete
  using ((select role from profiles where user_id = auth.uid()) in ('SUPER_ADMIN','OWNER'));

-- =====================================================
-- FUNCTION: LOGIN WITH USERNAME (matches username to auth email)
-- =====================================================
create or replace function public.get_auth_email_by_username(p_username text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.email
  from auth.users u
  join profiles p on p.user_id = u.id
  where p.username = p_username and p.is_active = true and p.deleted_at is null
$$;

-- =====================================================
-- FUNCTION: CREATE NOTIFICATION
-- =====================================================
create or replace function public.create_notification(
  p_org uuid,
  p_user uuid,
  p_type text,
  p_title text,
  p_message text default null,
  p_data jsonb default null
)
returns uuid
language sql
security definer
set search_path = public
as $$
  insert into notifications(organization_id, user_id, type, title, message, data)
  values (p_org, p_user, p_type, p_title, p_message, p_data)
  returning id
$$;

-- =====================================================
-- FUNCTION: LOG AUDIT ACTION
-- =====================================================
create or replace function public.log_audit(
  p_org uuid,
  p_action text,
  p_entity text,
  p_entity_id text default null,
  p_old_data jsonb default null,
  p_new_data jsonb default null
)
returns uuid
language sql
security definer
set search_path = public
as $$
  insert into audit_logs(organization_id, user_id, action, entity, entity_id, old_data, new_data, ip, user_agent)
  values (
    p_org,
    (select id from profiles where user_id = auth.uid()),
    p_action,
    p_entity,
    p_entity_id,
    p_old_data,
    p_new_data,
    current_setting('request.headers', true) is null and null or null,
    null
  )
  returning id
$$;

-- =====================================================
-- FUNCTION: HANDLE NEW USER PROFILE
-- =====================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  return new;
end;
$$;

-- =====================================================
-- UPDATED_AT TRIGGERS NULL (moddatetime extension may not exist)
-- Add alternative handler
-- =====================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply set_updated_at instead of moddatetime where available
do $$
begin
  -- Remove moddatetime triggers if any missing
end $$;

-- =====================================================
-- REALTIME
-- =====================================================
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table order_items;
alter publication supabase_realtime add table restaurant_tables;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table cashier_shifts;

grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant all on all functions in schema public to anon, authenticated;