-- =====================================================
-- SEED DATA - DEMO RESTAURANT
-- =====================================================

-- Only run in development; for production use a secure setup.

-- Organization
insert into organizations (id, name, legal_name, address, phone, email, tax_name, tax_percentage, tax_inclusive, service_charge_percentage, currency)
values
  ('00000000-0000-0000-0000-000000000001', 'Demo Restaurant', 'PT Demo Restoran Indonesia', 'Jl. Sudirman No. 123, Jakarta', '021-555-1234', 'demo@restaurant.com', 'PPN', 11, false, 5, 'IDR');

-- Branches
insert into branches (id, organization_id, name, code, address, phone, city, is_active)
values
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Main Branch', 'MAIN', 'Jl. Sudirman No. 123, Jakarta', '021-555-1234', 'Jakarta', true),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Branch Selatan', 'SOUTH', 'Jl. Raya Cilandak No. 45, Jakarta Selatan', '021-555-5678', 'Jakarta Selatan', true),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Branch Utara', 'NORTH', 'Jl. Kelapa Gading No. 78, Jakarta Utara', '021-555-9012', 'Jakarta Utara', true);

-- =====================================================
-- PERMISSIONS
-- =====================================================
-- All permissions
insert into permissions (id, key, name, description, module) values
  ('10000000-0000-0000-0000-000000000001', 'dashboard.view', 'View Dashboard', 'View dashboard and analytics', 'Dashboard'),
  ('10000000-0000-0000-0000-000000000002', 'sales.view', 'View Sales', 'View sales data', 'Sales'),
  ('10000000-0000-0000-0000-000000000003', 'sales.create', 'Create Sale', 'Create new sales', 'Sales'),
  ('10000000-0000-0000-0000-000000000004', 'sales.edit', 'Edit Sale', 'Edit sales transactions', 'Sales'),
  ('10000000-0000-0000-0000-000000000005', 'sales.delete', 'Delete Sale', 'Delete sales transactions', 'Sales'),
  ('10000000-0000-0000-0000-000000000006', 'orders.view', 'View Orders', 'View orders', 'Orders'),
  ('10000000-0000-0000-0000-000000000007', 'orders.create', 'Create Orders', 'Create new orders', 'Orders'),
  ('10000000-0000-0000-0000-000000000008', 'orders.edit', 'Edit Orders', 'Edit orders', 'Orders'),
  ('10000000-0000-0000-0000-000000000009', 'orders.cancel', 'Cancel Orders', 'Cancel orders', 'Orders'),
  ('10000000-0000-0000-0000-000000000010', 'products.view', 'View Products', 'View products', 'Products'),
  ('10000000-0000-0000-0000-000000000011', 'products.create', 'Create Products', 'Create products', 'Products'),
  ('10000000-0000-0000-0000-000000000012', 'products.edit', 'Edit Products', 'Edit products', 'Products'),
  ('10000000-0000-0000-0000-000000000013', 'products.delete', 'Delete Products', 'Delete products', 'Products'),
  ('10000000-0000-0000-0000-000000000014', 'inventory.view', 'View Inventory', 'View inventory', 'Inventory'),
  ('10000000-0000-0000-0000-000000000015', 'inventory.create', 'Create Inventory', 'Create inventory items', 'Inventory'),
  ('10000000-0000-0000-0000-000000000016', 'inventory.adjust', 'Adjust Inventory', 'Adjust stock quantities', 'Inventory'),
  ('10000000-0000-0000-0000-000000000017', 'purchases.view', 'View Purchases', 'View purchase orders', 'Purchases'),
  ('10000000-0000-0000-0000-000000000018', 'purchases.create', 'Create Purchases', 'Create purchase orders', 'Purchases'),
  ('10000000-0000-0000-0000-000000000019', 'reports.view', 'View Reports', 'View reports', 'Reports'),
  ('10000000-0000-0000-0000-000000000020', 'reports.export', 'Export Reports', 'Export reports', 'Reports'),
  ('10000000-0000-0000-0000-000000000021', 'users.view', 'View Users', 'View users', 'Users'),
  ('10000000-0000-0000-0000-000000000022', 'users.create', 'Create Users', 'Create users', 'Users'),
  ('10000000-0000-0000-0000-000000000023', 'users.edit', 'Edit Users', 'Edit users', 'Users'),
  ('10000000-0000-0000-0000-000000000024', 'settings.manage', 'Manage Settings', 'Manage system settings', 'Settings'),
  ('10000000-0000-0000-0000-000000000025', 'branches.manage', 'Manage Branches', 'Manage branches', 'Branches'),
  ('10000000-0000-0000-0000-000000000026', 'customers.view', 'View Customers', 'View customers', 'Customers'),
  ('10000000-0000-0000-0000-000000000027', 'customers.create', 'Create Customers', 'Create customers', 'Customers'),
  ('10000000-0000-0000-0000-000000000028', 'customers.edit', 'Edit Customers', 'Edit customers', 'Customers'),
  ('10000000-0000-0000-0000-000000000029', 'expenses.view', 'View Expenses', 'View expenses', 'Expenses'),
  ('10000000-0000-0000-0000-000000000030', 'expenses.create', 'Create Expenses', 'Create expenses', 'Expenses'),
  ('10000000-0000-0000-0000-000000000031', 'employees.view', 'View Employees', 'View employees', 'Employees'),
  ('10000000-0000-0000-0000-000000000032', 'employees.create', 'Create Employees', 'Create employees', 'Employees'),
  ('10000000-0000-0000-0000-000000000033', 'employees.edit', 'Edit Employees', 'Edit employees', 'Employees'),
  ('10000000-0000-0000-0000-000000000034', 'reservations.view', 'View Reservations', 'View reservations', 'Reservations'),
  ('10000000-0000-0000-0000-000000000035', 'reservations.create', 'Create Reservations', 'Create reservations', 'Reservations'),
  ('10000000-0000-0000-0000-000000000036', 'promotions.view', 'View Promotions', 'View promotions', 'Promotions'),
  ('10000000-0000-0000-0000-000000000037', 'promotions.create', 'Create Promotions', 'Create promotions', 'Promotions'),
  ('10000000-0000-0000-0000-000000000038', 'shifts.view', 'View Cashier Shifts', 'View cashier shifts', 'Shifts'),
  ('10000000-0000-0000-0000-000000000039', 'shifts.open', 'Open Shift', 'Open a cashier shift', 'Shifts'),
  ('10000000-0000-0000-0000-000000000040', 'shifts.close', 'Close Shift', 'Close a cashier shift', 'Shifts'),
  ('10000000-0000-0000-0000-000000000041', 'audit.view', 'View Audit Log', 'View audit logs', 'Audit'),
  ('10000000-0000-0000-0000-000000000042', 'purchases.receive', 'Receive Purchases', 'Receive purchase orders', 'Purchases');

-- =====================================================
-- ROLE PERMISSIONS
-- =====================================================
-- SUPER_ADMIN has all (represented below)
insert into role_permissions (role, permission_id)
select 'SUPER_ADMIN', id from permissions;

-- OWNER
insert into role_permissions (role, permission_id)
select 'OWNER', id from permissions
where key in ('dashboard.view','sales.view','orders.view','orders.create','orders.edit','orders.cancel',
  'products.view','products.create','products.edit','products.delete',
  'inventory.view','inventory.create','inventory.adjust',
  'purchases.view','purchases.create','purchases.receive',
  'reports.view','reports.export',
  'users.view','users.create','users.edit',
  'settings.manage','branches.manage',
  'customers.view','customers.create','customers.edit',
  'expenses.view','expenses.create',
  'employees.view','employees.create','employees.edit',
  'reservations.view','reservations.create',
  'promotions.view','promotions.create',
  'shifts.view','shifts.open','shifts.close','audit.view');

-- MANAGER
insert into role_permissions (role, permission_id)
select 'MANAGER', id from permissions
where key in ('dashboard.view','sales.view','orders.view','orders.create','orders.edit','orders.cancel',
  'products.view','products.create','products.edit',
  'inventory.view','inventory.create','inventory.adjust',
  'purchases.view','purchases.create','purchases.receive',
  'reports.view','reports.export',
  'customers.view','customers.create','customers.edit',
  'expenses.view','expenses.create',
  'employees.view','reservations.view','reservations.create',
  'shifts.view','shifts.open','shifts.close');

-- CASHIER
insert into role_permissions (role, permission_id)
select 'CASHIER', id from permissions
where key in ('dashboard.view','sales.view',
  'orders.view','orders.create','orders.edit',
  'customers.view','customers.create',
  'shifts.view','shifts.open','shifts.close');

-- KITCHEN
insert into role_permissions (role, permission_id)
select 'KITCHEN', id from permissions
where key in ('orders.view','orders.edit');

-- WAITER
insert into role_permissions (role, permission_id)
select 'WAITER', id from permissions
where key in ('orders.view','orders.create','orders.edit');

-- INVENTORY
insert into role_permissions (role, permission_id)
select 'INVENTORY', id from permissions
where key in ('inventory.view','inventory.create','inventory.adjust',
  'purchases.view','purchases.create');

-- ACCOUNTING
insert into role_permissions (role, permission_id)
select 'ACCOUNTING', id from permissions
where key in ('reports.view','reports.export','expenses.view','audit.view');

-- =====================================================
-- CATEGORIES
-- =====================================================
insert into categories (id, organization_id, name, slug, description, icon, is_active) values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Food', 'food', 'Makanan utama', 'Utensils', true),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Beverage', 'beverage', 'Minuman', 'CupSoda', true),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Coffee', 'coffee', 'Kopi dan espresso', 'Coffee', true),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Dessert', 'dessert', 'Makanan penutup', 'CakeSlice', true),
  ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Snack', 'snack', 'Camilan ringan', 'Cookie', true);

-- =====================================================
-- PRODUCTS
-- =====================================================
insert into products (id, organization_id, category_id, name, sku, barcode, description, selling_price, purchase_price, cost_price, tax_percentage, unit, stock_tracking, minimum_stock, is_active, is_favorite, has_variants) values
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Nasi Goreng', 'FD-001', '899123400001', 'Nasi goreng dengan telur, ayam, dan bumbu rempah', 25000, 12000, 10000, 11, 'porsi', true, 10, true, true, false),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Mie Goreng', 'FD-002', '899123400002', 'Mie goreng spesial dengan sayuran dan telur', 23000, 10000, 8000, 11, 'porsi', true, 10, true, true, false),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Ayam Geprek', 'FD-003', '899123400003', 'Ayam goreng digeprek dengan sambal level pedas', 20000, 9000, 7500, 11, 'porsi', true, 15, true, true, false),
  ('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Ayam Bakar', 'FD-004', '899123400004', 'Ayam bakar bumbu kecap', 22000, 10000, 8500, 11, 'porsi', true, 10, true, true, false),
  ('30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Soto Ayam', 'FD-005', '899123400005', 'Soto ayam kuah kuning dengan tauge dan kerupuk', 18000, 8000, 6500, 11, 'porsi', true, 10, true, false, false),
  ('30000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Bakso', 'FD-006', '899123400006', 'Bakso sapi dengan kuah kaldu', 20000, 9000, 7000, 11, 'porsi', true, 10, true, false, false),
  ('30000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Es Teh', 'BV-001', '899123400007', 'Es teh manis segar', 5000, 1500, 1000, 11, 'gelas', true, 20, true, true, false),
  ('30000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Teh Hangat', 'BV-002', '899123400008', 'Teh hangat manis', 4000, 1200, 800, 11, 'gelas', true, 20, true, false, false),
  ('30000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Es Jeruk', 'BV-003', '899123400009', 'Es jeruk peras segar', 8000, 2500, 2000, 11, 'gelas', true, 20, true, true, false),
  ('30000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'Kopi Hitam', 'CF-001', '899123400010', 'Kopi hitam klasik', 15000, 3000, 2500, 11, 'cup', true, 30, true, true, false),
  ('30000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'Cappuccino', 'CF-002', '899123400011', 'Cappuccino dengan foam susu', 20000, 5000, 4000, 11, 'cup', true, 20, true, true, false),
  ('30000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'Latte', 'CF-003', '899123400012', 'Espresso dengan susu steamed', 22000, 6000, 5000, 11, 'cup', true, 20, true, true, false),
  ('30000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'Pisang Goreng', 'DS-001', '899123400013', 'Pisang goreng crispy dengan madu', 12000, 4000, 3500, 11, 'porsi', true, 15, true, false, false),
  ('30000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'Pudding', 'DS-002', '899123400014', 'Pudding vanilla dengan saus karamel', 10000, 3000, 2500, 11, 'cup', true, 15, true, false, false),
  ('30000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'Ice Cream', 'DS-003', '899123400015', 'Ice cream vanilla/chocolate', 15000, 5000, 4000, 11, 'scoop', true, 20, true, false, false);

-- =====================================================
-- PRODUCT VARIANTS (Es Kopi)
-- =====================================================
insert into product_variants (id, product_id, name, price, cost_price, sku) values
  ('31000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000010', 'Small', 15000, 2500, 'CF-001-S'),
  ('31000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000010', 'Medium', 20000, 3500, 'CF-001-M'),
  ('31000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000010', 'Large', 25000, 5000, 'CF-001-L');

-- =====================================================
-- MODIFIERS
-- =====================================================
insert into modifiers (id, organization_id, name, required, min, max, is_active) values
  ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Extra Topping', false, 0, 3, true),
  ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Sugar Level', false, 0, 1, true),
  ('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Ice Level', false, 0, 1, true);

insert into modifier_options (id, modifier_id, name, price, is_active) values
  ('41000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'Extra Cheese', 5000, true),
  ('41000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'Extra Chicken', 7000, true),
  ('41000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', 'Extra Egg', 3000, true),
  ('41000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000002', 'Less Sugar', 0, true),
  ('41000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000002', 'Normal Sugar', 0, true),
  ('41000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000003', 'No Ice', 0, true),
  ('41000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000003', 'Less Ice', 0, true),
  ('41000000-0000-0000-0000-000000000008', '40000000-0000-0000-0000-000000000003', 'Normal Ice', 0, true);

-- Product - modifiers mapping
insert into product_modifiers (product_id, modifier_id) values
  ('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000011', '40000000-0000-0000-0000-000000000002'),
  ('30000000-0000-0000-0000-000000000011', '40000000-0000-0000-0000-000000000003'),
  ('30000000-0000-0000-0000-000000000012', '40000000-0000-0000-0000-000000000002'),
  ('30000000-0000-0000-0000-000000000012', '40000000-0000-0000-0000-000000000003');

-- =====================================================
-- INVENTORY ITEMS
-- =====================================================
insert into inventory_items (id, organization_id, name, sku, unit, quantity, minimum_stock, maximum_stock, cost_price, barcode, category, is_active) values
  ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Beras', 'INV-001', 'kg', 100, 20, 200, 12000, '899100000001', 'RAW', true),
  ('50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Gula', 'INV-002', 'kg', 50, 10, 100, 15000, '899100000002', 'RAW', true),
  ('50000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Kopi', 'INV-003', 'kg', 30, 10, 80, 80000, '899100000003', 'RAW', true),
  ('50000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Susu', 'INV-004', 'liter', 20, 5, 50, 20000, '899100000004', 'RAW', true),
  ('50000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Ayam', 'INV-005', 'kg', 40, 10, 100, 30000, '899100000005', 'RAW', true),
  ('50000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Telur', 'INV-006', 'pcs', 200, 50, 500, 2500, '899100000006', 'RAW', true),
  ('50000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Minyak', 'INV-007', 'liter', 30, 10, 80, 20000, '899100000007', 'RAW', true),
  ('50000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Tepung', 'INV-008', 'kg', 40, 10, 100, 10000, '899100000008', 'RAW', true),
  ('50000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'Teh', 'INV-009', 'kg', 15, 5, 40, 50000, '899100000009', 'RAW', true),
  ('50000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Jeruk', 'INV-010', 'kg', 20, 5, 50, 15000, '899100000010', 'RAW', true),
  ('50000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Nasi Goreng Box', 'INV-011', 'pcs', 500, 100, 1000, 1500, '899100000011', 'PACKAGING', true),
  ('50000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Cup', 'INV-012', 'pcs', 500, 100, 1000, 1000, '899100000012', 'PACKAGING', true);

-- =====================================================
-- RECIPES
-- =====================================================
insert into recipes (id, product_id, name, description) values
  ('60000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Nasi Goreng Recipe', 'Resep nasi goreng standar'),
  ('60000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000007', 'Es Teh Recipe', 'Resep es teh');

insert into recipe_items (id, recipe_id, inventory_item_id, quantity, unit) values
  ('61000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 0.2, 'kg'),
  ('61000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000006', 1, 'pcs'),
  ('61000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000005', 0.05, 'kg'),
  ('61000000-0000-0000-0000-000000000004', '60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000007', 0.01, 'liter'),
  ('61000000-0000-0000-0000-000000000005', '60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000008', 0.01, 'kg'),
  ('61000000-0000-0000-0000-000000000006', '60000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000009', 0.005, 'kg'),
  ('61000000-0000-0000-0000-000000000007', '60000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000002', 0.01, 'kg');

-- =====================================================
-- WAREHOUSES
-- =====================================================
insert into warehouses (id, branch_id, name, code, address, is_active) values
  ('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Main Warehouse', 'MW', 'Jl. Sudirman No. 123', true),
  ('70000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'South Warehouse', 'SW', 'Jl. Raya Cilandak No. 45', true),
  ('70000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'North Warehouse', 'NW', 'Jl. Kelapa Gading No. 78', true);

-- =====================================================
-- TABLES
-- =====================================================
insert into table_areas (id, branch_id, name) values
  ('80000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Indoor'),
  ('80000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Outdoor');

insert into restaurant_tables (id, branch_id, number, name, capacity, area_id, status, pos_x, pos_y, width, height, is_active) values
  ('81000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'T01', 'Table 1', 2, '80000000-0000-0000-0000-000000000001', 'AVAILABLE', 10, 10, 80, 60, true),
  ('81000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'T02', 'Table 2', 2, '80000000-0000-0000-0000-000000000001', 'AVAILABLE', 100, 10, 80, 60, true),
  ('81000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'T03', 'Table 3', 4, '80000000-0000-0000-0000-000000000001', 'AVAILABLE', 190, 10, 100, 80, true),
  ('81000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'T04', 'Table 4', 4, '80000000-0000-0000-0000-000000000001', 'AVAILABLE', 300, 10, 100, 80, true),
  ('81000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', 'T05', 'Table 5', 6, '80000000-0000-0000-0000-000000000002', 'AVAILABLE', 10, 120, 120, 90, true),
  ('81000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', 'T06', 'Table 6', 6, '80000000-0000-0000-0000-000000000002', 'AVAILABLE', 160, 120, 120, 90, true),
  ('81000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000002', 'T07', 'Table 7', 8, '80000000-0000-0000-0000-000000000002', 'AVAILABLE', 310, 120, 140, 100, true),
  ('81000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000002', 'T08', 'Table 8', 8, '80000000-0000-0000-0000-000000000002', 'AVAILABLE', 480, 120, 140, 100, true);

-- =====================================================
-- SUPPLIERS
-- =====================================================
insert into suppliers (id, organization_id, name, company, phone, email, address, npwp, payment_terms, notes) values
  ('90000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Budi', 'PT Sumber Pangan', '0812-3456-7890', 'budi@sumberpangan.co.id', 'Jl. Raya Bogor No. 55', '01.234.567.8-901.000', 'Net 30', 'Supplier beras dan bahan pokok'),
  ('90000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Sari', 'CV Segar Abadi', '0813-9876-5432', 'sari@segarabadi.co.id', 'Jl. Kemang Timur No. 20', '02.345.678.9-012.000', 'Net 14', 'Supplier sayur dan buah');

-- =====================================================
-- EXPENSE CATEGORIES
-- =====================================================
insert into expense_categories (id, organization_id, name, icon) values
  ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Electricity', 'Zap'),
  ('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Water', 'Droplets'),
  ('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Rent', 'Home'),
  ('a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Salary', 'Wallet'),
  ('a0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Gas', 'Flame'),
  ('a0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Transportation', 'Truck'),
  ('a0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Maintenance', 'Wrench'),
  ('a0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Marketing', 'Megaphone'),
  ('a0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'Other', 'MoreHorizontal');

-- =====================================================
-- SETTINGS
-- =====================================================
insert into settings (id, organization_id, key, value) values
  ('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'restaurant', '{"name":"Demo Restaurant","logo_url":null,"address":"Jl. Sudirman No. 123, Jakarta","phone":"021-555-1234","email":"demo@restaurant.com","currency":"IDR","tax_name":"PPN","tax_percentage":11,"tax_inclusive":false,"service_charge_percentage":5}'::jsonb),
  ('b0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'receipt', '{"format":"THERMAL_80","show_logo":true,"show_tax":true,"show_service_charge":true,"show_payment":true,"footer":"Terima kasih sudah berkunjung!"}'::jsonb),
  ('b0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'payment_methods', '{"methods":["CASH","BANK_TRANSFER","QRIS","DEBIT","CREDIT","E_WALLET","OTHER"]}'::jsonb),
  ('b0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'loyalty', '{"points_per_currency":10000,"points_for_one":1,"bronze_min":0,"silver_min":1000,"gold_min":5000,"platinum_min":10000,"reward_points":100,"reward_value":10000}'::jsonb),
  ('b0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'keyboard_shortcuts', '{"search":"F2","customer":"F4","payment":"F8","close":"Escape","confirm":"Enter"}'::jsonb);

-- =====================================================
-- USERS (development demo credentials)
-- NOTE: passwords below are for DEVELOPMENT ONLY.
-- emails must match auth.users; create auth users programmatically.
-- =====================================================
-- The seed expects that special auth users are created via the API route /api/seed
-- The profile rows are inserted after users exist.

-- For the service role seed script we handle auth.users + profiles together.
-- Placeholder comment: actual user seeding is done by /api/seed route handler.