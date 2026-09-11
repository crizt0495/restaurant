-- =====================================================
-- FIX: Allow anonymous users to read public menu data
-- The QR menu (/menu/[branch]/[table]) is customer-facing
-- and requires read access for unauthenticated visitors.
-- =====================================================

-- Branches (public menu lookup by branch code)
drop policy if exists "branch_select_anon" on branches;
create policy "branch_select_anon"
  on branches for select
  to anon
  using (is_active = true);

-- Restaurant tables (public menu shows table name/number)
drop policy if exists "rt_select_anon" on restaurant_tables;
create policy "rt_select_anon"
  on restaurant_tables for select
  to anon
  using (is_active = true);

-- Categories (public menu category list)
drop policy if exists "cat_select_anon" on categories;
create policy "cat_select_anon"
  on categories for select
  to anon
  using (is_active = true);

-- Products (public menu items with prices)
drop policy if exists "prod_select_anon" on products;
create policy "prod_select_anon"
  on products for select
  to anon
  using (is_active = true and deleted_at is null);

-- Organizations shown on the public menu (name/logo only)
drop policy if exists "org_select_anon" on organizations;
create policy "org_select_anon"
  on organizations for select
  to anon
  using (true);