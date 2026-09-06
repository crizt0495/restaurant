-- =====================================================
-- Fix: permission gaps for 100% functional roles & permissions
--
-- Missing permission keys that code references but never existed:
--   - inventory.edit   (updateInventoryItem / deleteInventoryItem)
--   - inventory.delete (semantic delete)
--   - suppliers.view   (suppliers page access)
--   - suppliers.create / suppliers.edit / suppliers.delete
-- Missing role grants:
--   - sales.edit for OWNER (refund capability)
--   - employees.create for MANAGER
--   - dashboard/customers/reservations for WAITER & KITCHEN
-- =====================================================

-- 1. Add all missing permission keys
INSERT INTO permissions (id, key, name, description, module) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'inventory.edit', 'Edit Inventory', 'Edit inventory item details', 'Inventory'),
  ('a1000000-0000-0000-0000-000000000002', 'inventory.delete', 'Delete Inventory', 'Delete inventory items', 'Inventory'),
  ('a1000000-0000-0000-0000-000000000003', 'suppliers.view', 'View Suppliers', 'View suppliers', 'Suppliers'),
  ('a1000000-0000-0000-0000-000000000004', 'suppliers.create', 'Create Suppliers', 'Create suppliers', 'Suppliers'),
  ('a1000000-0000-0000-0000-000000000005', 'suppliers.edit', 'Edit Suppliers', 'Edit suppliers', 'Suppliers'),
  ('a1000000-0000-0000-0000-000000000006', 'suppliers.delete', 'Delete Suppliers', 'Delete suppliers', 'Suppliers')
ON CONFLICT (key) DO NOTHING;

-- 2. OWNER: full inventory + suppliers + sales.edit + refund
INSERT INTO role_permissions (role, permission_id)
SELECT 'OWNER', id FROM permissions WHERE key IN
  ('inventory.edit','inventory.delete','sales.edit','sales.create','sales.delete',
   'suppliers.view','suppliers.create','suppliers.edit','suppliers.delete')
ON CONFLICT (role, permission_id) DO NOTHING;

-- 3. MANAGER: inventory edit/delete + suppliers manage + employees.create + sales.view
INSERT INTO role_permissions (role, permission_id)
SELECT 'MANAGER', id FROM permissions WHERE key IN
  ('inventory.edit','inventory.delete','employees.create',
   'suppliers.view','suppliers.create','suppliers.edit','sales.create','sales.edit')
ON CONFLICT (role, permission_id) DO NOTHING;

-- 4. INVENTORY: inventory edit + suppliers view/create
INSERT INTO role_permissions (role, permission_id)
SELECT 'INVENTORY', id FROM permissions WHERE key IN
  ('inventory.edit','suppliers.view','suppliers.create')
ON CONFLICT (role, permission_id) DO NOTHING;

-- 5. WAITER: dashboard + customers + reservations (needed for flawless ordering flow)
INSERT INTO role_permissions (role, permission_id)
SELECT 'WAITER', id FROM permissions WHERE key IN
  ('dashboard.view','customers.view','customers.create','reservations.view','reservations.create')
ON CONFLICT (role, permission_id) DO NOTHING;

-- 6. KITCHEN: dashboard + customers view (needed to browse menu context)
INSERT INTO role_permissions (role, permission_id)
SELECT 'KITCHEN', id FROM permissions WHERE key IN
  ('dashboard.view','customers.view')
ON CONFLICT (role, permission_id) DO NOTHING;

-- 7. CASHIER: purchases receive not needed; ensure dashboard.view present (already seeded)
INSERT INTO role_permissions (role, permission_id)
SELECT 'CASHIER', id FROM permissions WHERE key IN
  ('dashboard.view','orders.view','orders.create','orders.edit',
   'customers.view','customers.create','shifts.view','shifts.open','shifts.close')
ON CONFLICT (role, permission_id) DO NOTHING;