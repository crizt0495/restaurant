-- =====================================================
-- FIX P0: RLS infinite recursion on profiles
--
-- Root cause: every RLS policy used the subquery:
--   select role from profiles where user_id = auth.uid()
-- which, when the target table is "profiles" (or any table whose
-- policy re-reads profiles), causes Postgres to recursively evaluate
-- the profiles policy for each row -> "infinite recursion detected".
--
-- Fix: define SECURITY DEFINER helper functions that read the calling
-- user's role / branch / organization WITHOUT triggering RLS, and rewrite
-- all policies to use them. Because they are SECURITY DEFINER + STABLE,
-- they run with the table owner's bypass and are not subject to RLS,
-- eliminating the recursion.
-- =====================================================

-- ---------- helper: current user's role ----------
create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where user_id = auth.uid() limit 1
$$;

-- ---------- rewrite PROFILES policy (the recursive one) ----------
drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_own"
  on profiles for select
  using (
    user_id = auth.uid()
    or public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER')
    or branch_id = public.current_branch_id()
  );

drop policy if exists "profiles_insert_admin" on profiles;
create policy "profiles_insert_admin"
  on profiles for insert
  with check (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER'));

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own"
  on profiles for update
  using (
    user_id = auth.uid()
    or public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER')
  );

-- ---------- rewrite ALL other policies that subquery profiles ----------
-- organizations
drop policy if exists "org_select_own" on organizations;
create policy "org_select_own"
  on organizations for select
  using (
    id = (select b.organization_id from branches b where b.id = public.current_branch_id())
    or public.current_role() = 'SUPER_ADMIN'
  );
drop policy if exists "org_insert_admin" on organizations;
create policy "org_insert_admin"
  on organizations for insert
  with check (public.current_role() in ('SUPER_ADMIN','OWNER'));
drop policy if exists "org_update_admin" on organizations;
create policy "org_update_admin"
  on organizations for update
  using (public.current_role() in ('SUPER_ADMIN','OWNER'));

-- branches
drop policy if exists "branch_select_access" on branches;
create policy "branch_select_access"
  on branches for select
  using (
    public.current_role() = 'SUPER_ADMIN'
    or public.current_branch_id() = id
  );
drop policy if exists "branch_insert_admin" on branches;
create policy "branch_insert_admin"
  on branches for insert
  with check (public.current_role() in ('SUPER_ADMIN','OWNER'));
drop policy if exists "branch_update_admin" on branches;
create policy "branch_update_admin"
  on branches for update
  using (public.current_role() in ('SUPER_ADMIN','OWNER'));

-- categories
drop policy if exists "cat_select_org" on categories;
create policy "cat_select_org"
  on categories for select
  using (
    organization_id = (select b.organization_id from branches b where b.id = public.current_branch_id())
    or public.current_role() = 'SUPER_ADMIN'
  );
drop policy if exists "cat_insert_admin" on categories;
create policy "cat_insert_admin"
  on categories for insert
  with check (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER'));
drop policy if exists "cat_update_admin" on categories;
create policy "cat_update_admin"
  on categories for update
  using (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER'));

-- products
drop policy if exists "prod_select_org" on products;
create policy "prod_select_org"
  on products for select
  using (
    organization_id = (select b.organization_id from branches b where b.id = public.current_branch_id())
    or public.current_role() = 'SUPER_ADMIN'
  );
drop policy if exists "prod_insert_admin" on products;
create policy "prod_insert_admin"
  on products for insert
  with check (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER'));
drop policy if exists "prod_update_admin" on products;
create policy "prod_update_admin"
  on products for update
  using (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER'));
drop policy if exists "prod_delete_admin" on products;
create policy "prod_delete_admin"
  on products for delete
  using (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER'));

-- product_variants
drop policy if exists "pv_select_own" on product_variants;
create policy "pv_select_own"
  on product_variants for select
  using (
    product_id in (select p.id from products p where p.organization_id = (select b.organization_id from branches b where b.id = public.current_branch_id()))
    or public.current_role() = 'SUPER_ADMIN'
  );
drop policy if exists "pv_insert_admin" on product_variants;
create policy "pv_insert_admin"
  on product_variants for insert
  with check (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER'));
drop policy if exists "pv_update_admin" on product_variants;
create policy "pv_update_admin"
  on product_variants for update
  using (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER'));
drop policy if exists "pv_delete_admin" on product_variants;
create policy "pv_delete_admin"
  on product_variants for delete
  using (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER'));

-- modifiers
drop policy if exists "mod_select_org" on modifiers;
create policy "mod_select_org"
  on modifiers for select
  using (
    organization_id = (select b.organization_id from branches b where b.id = public.current_branch_id())
    or public.current_role() = 'SUPER_ADMIN'
  );
drop policy if exists "mod_insert_admin" on modifiers;
create policy "mod_insert_admin"
  on modifiers for insert
  with check (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER'));
drop policy if exists "mod_update_admin" on modifiers;
create policy "mod_update_admin"
  on modifiers for update
  using (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER'));

-- modifier_options
drop policy if exists "mo_select_own" on modifier_options;
create policy "mo_select_own"
  on modifier_options for select
  using (
    modifier_id in (select m.id from modifiers m where m.organization_id = (select b.organization_id from branches b where b.id = public.current_branch_id()))
    or public.current_role() = 'SUPER_ADMIN'
  );
drop policy if exists "mo_insert_admin" on modifier_options;
create policy "mo_insert_admin"
  on modifier_options for insert
  with check (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER'));
drop policy if exists "mo_update_admin" on modifier_options;
create policy "mo_update_admin"
  on modifier_options for update
  using (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER'));

-- product_modifiers
drop policy if exists "pm_select_own" on product_modifiers;
create policy "pm_select_own"
  on product_modifiers for select
  using (
    product_id in (select p.id from products p where p.organization_id = (select b.organization_id from branches b where b.id = public.current_branch_id()))
    or public.current_role() = 'SUPER_ADMIN'
  );
drop policy if exists "pm_insert_admin" on product_modifiers;
create policy "pm_insert_admin"
  on product_modifiers for insert
  with check (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER'));

-- customers
drop policy if exists "cust_select_org" on customers;
create policy "cust_select_org"
  on customers for select
  using (
    organization_id = (select b.organization_id from branches b where b.id = public.current_branch_id())
    or public.current_role() = 'SUPER_ADMIN'
  );
drop policy if exists "cust_insert_org" on customers;
create policy "cust_insert_org"
  on customers for insert
  with check (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER','CASHIER','WAITER'));
drop policy if exists "cust_update_org" on customers;
create policy "cust_update_org"
  on customers for update
  using (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER','CASHIER'));

-- orders
drop policy if exists "ord_select_branch" on orders;
create policy "ord_select_branch"
  on orders for select
  using (
    branch_id = public.current_branch_id()
    or public.current_role() in ('SUPER_ADMIN','OWNER')
  );
drop policy if exists "ord_insert_staff" on orders;
create policy "ord_insert_staff"
  on orders for insert
  with check (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER','CASHIER','WAITER'));
drop policy if exists "ord_update_staff" on orders;
create policy "ord_update_staff"
  on orders for update
  using (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER','CASHIER','WAITER','KITCHEN'))
  with check (true);
drop policy if exists "ord_delete_owner" on orders;
create policy "ord_delete_owner"
  on orders for delete
  using (public.current_role() in ('SUPER_ADMIN','OWNER'));

-- order_items
drop policy if exists "oi_select_own" on order_items;
create policy "oi_select_own"
  on order_items for select
  using (
    order_id in (select o.id from orders o where o.branch_id = public.current_branch_id())
    or public.current_role() in ('SUPER_ADMIN','OWNER')
  );
drop policy if exists "oi_insert_staff" on order_items;
create policy "oi_insert_staff"
  on order_items for insert
  with check (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER','CASHIER','WAITER'));
drop policy if exists "oi_update_staff" on order_items;
create policy "oi_update_staff"
  on order_items for update
  using (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER','CASHIER','WAITER','KITCHEN'));

-- order_item_modifiers
drop policy if exists "oim_select_own" on order_item_modifiers;
create policy "oim_select_own"
  on order_item_modifiers for select
  using (
    order_item_id in (select oi.id from order_items oi join orders o on oi.order_id = o.id where o.branch_id = public.current_branch_id())
    or public.current_role() in ('SUPER_ADMIN','OWNER')
  );
drop policy if exists "oim_insert_staff" on order_item_modifiers;
create policy "oim_insert_staff"
  on order_item_modifiers for insert
  with check (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER','CASHIER','WAITER'));

-- payments
drop policy if exists "pay_select_own" on payments;
create policy "pay_select_own"
  on payments for select
  using (
    order_id in (select o.id from orders o where o.branch_id = public.current_branch_id())
    or public.current_role() in ('SUPER_ADMIN','OWNER')
  );
drop policy if exists "pay_insert_staff" on payments;
create policy "pay_insert_staff"
  on payments for insert
  with check (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER','CASHIER'));
drop policy if exists "pay_update_owner" on payments;
create policy "pay_update_owner"
  on payments for update
  using (public.current_role() in ('SUPER_ADMIN','OWNER'));

-- payment_items
drop policy if exists "pi_select_own" on payment_items;
create policy "pi_select_own"
  on payment_items for select
  using (
    order_id in (select o.id from orders o where o.branch_id = public.current_branch_id())
    or public.current_role() in ('SUPER_ADMIN','OWNER')
  );

-- refunds
drop policy if exists "ref_select_own" on refunds;
create policy "ref_select_own"
  on refunds for select
  using (
    branch_id = public.current_branch_id()
    or public.current_role() in ('SUPER_ADMIN','OWNER')
  );
drop policy if exists "ref_insert_staff" on refunds;
create policy "ref_insert_staff"
  on refunds for insert
  with check (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER','CASHIER'));

-- warehouses
drop policy if exists "war_select_branch" on warehouses;
create policy "war_select_branch"
  on warehouses for select
  using (
    branch_id = public.current_branch_id()
    or public.current_role() in ('SUPER_ADMIN','OWNER')
  );
drop policy if exists "war_insert_admin" on warehouses;
create policy "war_insert_admin"
  on warehouses for insert
  with check (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER','INVENTORY'));
drop policy if exists "war_update_admin" on warehouses;
create policy "war_update_admin"
  on warehouses for update
  using (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER','INVENTORY'));

-- inventory_items
drop policy if exists "inv_select_org" on inventory_items;
create policy "inv_select_org"
  on inventory_items for select
  using (
    organization_id = (select b.organization_id from branches b where b.id = public.current_branch_id())
    or public.current_role() = 'SUPER_ADMIN'
  );
drop policy if exists "inv_insert_admin" on inventory_items;
create policy "inv_insert_admin"
  on inventory_items for insert
  with check (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER','INVENTORY'));
drop policy if exists "inv_update_admin" on inventory_items;
create policy "inv_update_admin"
  on inventory_items for update
  using (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER','INVENTORY'));
drop policy if exists "inv_delete_admin" on inventory_items;
create policy "inv_delete_admin"
  on inventory_items for delete
  using (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER','INVENTORY'));

-- stock_movements
drop policy if exists "sm_select_branch" on stock_movements;
create policy "sm_select_branch"
  on stock_movements for select
  using (
    branch_id = public.current_branch_id()
    or public.current_role() in ('SUPER_ADMIN','OWNER')
  );
drop policy if exists "sm_insert_task" on stock_movements;
create policy "sm_insert_task"
  on stock_movements for insert
  with check (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER','CASHIER','INVENTORY','KITCHEN'));

-- stock_opnames
drop policy if exists "so_select_branch" on stock_opnames;
create policy "so_select_branch"
  on stock_opnames for select
  using (
    branch_id = public.current_branch_id()
    or public.current_role() in ('SUPER_ADMIN','OWNER')
  );
drop policy if exists "so_insert_task" on stock_opnames;
create policy "so_insert_task"
  on stock_opnames for insert
  with check (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER','INVENTORY'));
drop policy if exists "so_update_task" on stock_opnames;
create policy "so_update_task"
  on stock_opnames for update
  using (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER','INVENTORY'));

-- stock_opname_items
drop policy if exists "soi_select_own" on stock_opname_items;
create policy "soi_select_own"
  on stock_opname_items for select
  using (
    stock_opname_id in (select so.id from stock_opnames so where so.branch_id = public.current_branch_id())
    or public.current_role() in ('SUPER_ADMIN','OWNER')
  );
drop policy if exists "soi_insert_task" on stock_opname_items;
create policy "soi_insert_task"
  on stock_opname_items for insert
  with check (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER','INVENTORY'));

-- suppliers
drop policy if exists "sup_select_org" on suppliers;
create policy "sup_select_org"
  on suppliers for select
  using (
    organization_id = (select b.organization_id from branches b where b.id = public.current_branch_id())
    or public.current_role() = 'SUPER_ADMIN'
  );
drop policy if exists "sup_insert_admin" on suppliers;
create policy "sup_insert_admin"
  on suppliers for insert
  with check (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER','INVENTORY'));
drop policy if exists "sup_update_admin" on suppliers;
create policy "sup_update_admin"
  on suppliers for update
  using (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER','INVENTORY'));
drop policy if exists "sup_delete_admin" on suppliers;
create policy "sup_delete_admin"
  on suppliers for delete
  using (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER'));

-- purchase_orders
drop policy if exists "po_select_branch" on purchase_orders;
create policy "po_select_branch"
  on purchase_orders for select
  using (
    branch_id = public.current_branch_id()
    or public.current_role() in ('SUPER_ADMIN','OWNER')
  );
drop policy if exists "po_insert_admin" on purchase_orders;
create policy "po_insert_admin"
  on purchase_orders for insert
  with check (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER','INVENTORY'));
drop policy if exists "po_update_admin" on purchase_orders;
create policy "po_update_admin"
  on purchase_orders for update
  using (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER','INVENTORY'));
drop policy if exists "po_delete_owner" on purchase_orders;
create policy "po_delete_owner"
  on purchase_orders for delete
  using (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER'));

-- purchase_order_items
drop policy if exists "poi_select_own" on purchase_order_items;
create policy "poi_select_own"
  on purchase_order_items for select
  using (
    purchase_order_id in (select po.id from purchase_orders po where po.branch_id = public.current_branch_id())
    or public.current_role() in ('SUPER_ADMIN','OWNER')
  );
drop policy if exists "poi_insert_admin" on purchase_order_items;
create policy "poi_insert_admin"
  on purchase_order_items for insert
  with check (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER','INVENTORY'));

-- customer_points
drop policy if exists "cp_select_org" on customer_points;
create policy "cp_select_org"
  on customer_points for select
  using (
    customer_id in (select c.id from customers c where c.organization_id = (select b.organization_id from branches b where b.id = public.current_branch_id()))
    or public.current_role() = 'SUPER_ADMIN'
  );

-- customer_rewards
drop policy if exists "cr_select_org" on customer_rewards;
create policy "cr_select_org"
  on customer_rewards for select
  using (
    customer_id in (select c.id from customers c where c.organization_id = (select b.organization_id from branches b where b.id = public.current_branch_id()))
    or public.current_role() = 'SUPER_ADMIN'
  );

-- promotions
drop policy if exists "promo_select_org" on promotions;
create policy "promo_select_org"
  on promotions for select
  using (
    organization_id = (select b.organization_id from branches b where b.id = public.current_branch_id())
    or public.current_role() = 'SUPER_ADMIN'
  );
drop policy if exists "promo_insert_admin" on promotions;
create policy "promo_insert_admin"
  on promotions for insert
  with check (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER'));
drop policy if exists "promo_update_admin" on promotions;
create policy "promo_update_admin"
  on promotions for update
  using (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER'));

-- reservations
drop policy if exists "res_select_branch" on reservations;
create policy "res_select_branch"
  on reservations for select
  using (
    branch_id = public.current_branch_id()
    or public.current_role() in ('SUPER_ADMIN','OWNER')
  );
drop policy if exists "res_insert_staff" on reservations;
create policy "res_insert_staff"
  on reservations for insert
  with check (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER','WAITER','CASHIER'));
drop policy if exists "res_update_staff" on reservations;
create policy "res_update_staff"
  on reservations for update
  using (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER','WAITER','CASHIER'));

-- expenses
drop policy if exists "exp_select_branch" on expenses;
create policy "exp_select_branch"
  on expenses for select
  using (
    branch_id = public.current_branch_id()
    or public.current_role() in ('SUPER_ADMIN','OWNER')
  );
drop policy if exists "exp_insert_admin" on expenses;
create policy "exp_insert_admin"
  on expenses for insert
  with check (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER','ACCOUNTING'));
drop policy if exists "exp_update_owner" on expenses;
create policy "exp_update_owner"
  on expenses for update
  using (public.current_role() in ('SUPER_ADMIN','OWNER'));

-- employees
drop policy if exists "emp_select_branch" on employees;
create policy "emp_select_branch"
  on employees for select
  using (
    branch_id = public.current_branch_id()
    or public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER')
  );
drop policy if exists "emp_insert_admin" on employees;
create policy "emp_insert_admin"
  on employees for insert
  with check (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER'));
drop policy if exists "emp_update_admin" on employees;
create policy "emp_update_admin"
  on employees for update
  using (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER'));

-- cashier_shifts
drop policy if exists "cs_select_branch" on cashier_shifts;
create policy "cs_select_branch"
  on cashier_shifts for select
  using (
    branch_id = public.current_branch_id()
    or public.current_role() in ('SUPER_ADMIN','OWNER')
  );
drop policy if exists "cs_insert_staff" on cashier_shifts;
create policy "cs_insert_staff"
  on cashier_shifts for insert
  with check (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER','CASHIER'));
drop policy if exists "cs_update_staff" on cashier_shifts;
create policy "cs_update_staff"
  on cashier_shifts for update
  using (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER','CASHIER'));

-- notifications
drop policy if exists "notif_select_own" on notifications;
create policy "notif_select_own"
  on notifications for select
  using (
    user_id = (select id from profiles where user_id = auth.uid())
    or user_id is null
  );
drop policy if exists "notif_insert_system" on notifications;
create policy "notif_insert_system"
  on notifications for insert
  with check (true);
drop policy if exists "notif_update_own" on notifications;
create policy "notif_update_own"
  on notifications for update
  using (user_id = (select id from profiles where user_id = auth.uid()));

-- audit_logs
drop policy if exists "audit_select_owner" on audit_logs;
create policy "audit_select_owner"
  on audit_logs for select
  using (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER','ACCOUNTING'));
drop policy if exists "audit_insert_system" on audit_logs;
create policy "audit_insert_system"
  on audit_logs for insert
  with check (true);

-- settings
drop policy if exists "set_select_org" on settings;
create policy "set_select_org"
  on settings for select
  using (
    organization_id = (select b.organization_id from branches b where b.id = public.current_branch_id())
    or public.current_role() = 'SUPER_ADMIN'
    or organization_id is null
  );
drop policy if exists "set_insert_admin" on settings;
create policy "set_insert_admin"
  on settings for insert
  with check (public.current_role() in ('SUPER_ADMIN','OWNER'));
drop policy if exists "set_update_admin" on settings;
create policy "set_update_admin"
  on settings for update
  using (public.current_role() in ('SUPER_ADMIN','OWNER'));

-- permissions (read for any authenticated user)
drop policy if exists "perm_select_all" on permissions;
create policy "perm_select_all"
  on permissions for select
  using (auth.uid() is not null);
drop policy if exists "rp_select_all" on role_permissions;
create policy "rp_select_all"
  on role_permissions for select
  using (auth.uid() is not null);
drop policy if exists "perm_insert_owner" on permissions;
create policy "perm_insert_owner"
  on permissions for insert
  with check (public.current_role() in ('SUPER_ADMIN','OWNER'));
drop policy if exists "rp_insert_owner" on role_permissions;
create policy "rp_insert_owner"
  on role_permissions for insert
  with check (public.current_role() in ('SUPER_ADMIN','OWNER'));
drop policy if exists "rp_delete_owner" on role_permissions;
create policy "rp_delete_owner"
  on role_permissions for delete
  using (public.current_role() in ('SUPER_ADMIN','OWNER'));

-- recipe_items (created in migration 3, replace its RLS too)
drop policy if exists "ri_select_org" on recipe_items;
create policy "ri_select_org"
  on recipe_items for select
  using (
    recipe_id in (select r.id from recipes r join products p on p.id = r.product_id where p.organization_id = (select b.organization_id from branches b where b.id = public.current_branch_id()))
    or public.current_role() = 'SUPER_ADMIN'
  );
drop policy if exists "ri_insert_admin" on recipe_items;
create policy "ri_insert_admin"
  on recipe_items for insert
  with check (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER'));
drop policy if exists "ri_update_admin" on recipe_items;
create policy "ri_update_admin"
  on recipe_items for update
  using (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER'));
drop policy if exists "ri_delete_admin" on recipe_items;
create policy "ri_delete_admin"
  on recipe_items for delete
  using (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER'));