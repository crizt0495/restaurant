-- =====================================================
-- SECURITY HARDENING — Round 2 (from deep audit)
--
-- H1 : profiles_update_own had no WITH CHECK -> any user
--      could escalate their own role to SUPER_ADMIN.
-- H2 : profiles_insert_admin let MANAGER create SUPER_ADMIN.
-- H3 : orders update policy was `with check (true)` and
--      granted KITCHEN full update rights on every column.
-- H4 : write policies for order_items / order_item_modifiers /
--      payments / stock_movements were tenant-blind (role only).
-- H5 : pay_order_atomic accepted orders outside the caller's
--      branch/organization (cross-branch payment).
-- H6 : create_order_atomic trusted client financial values and
--      allowed negative / empty quantities on order_items.
-- H7 : get_auth_email_by_username implicitly executable via the
--      blanket `grant all on all functions` (email enumeration).
--
-- Strategy: additive guards (triggers) + policy rewrites + a
-- column-level revoke on the pricing columns. No server action
-- legitimately updates subtotal/discount/tax/service/total on
-- existing orders (those changes only happen inside SECURITY
-- DEFINER RPCs), so the revoke cannot break the app.
-- =====================================================

-- ---------------------------------------------------------
-- H1: block self role escalation on profiles
-- ---------------------------------------------------------
drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own"
  on profiles for update
  using (
    user_id = auth.uid()
    or public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER')
  )
  with check (
    public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER')
    or (user_id = auth.uid() and role = public.current_role())
  );

-- ---------------------------------------------------------
-- H2: only OWNER / SUPER_ADMIN may create SUPER_ADMIN
-- ---------------------------------------------------------
drop policy if exists "profiles_insert_admin" on profiles;
create policy "profiles_insert_admin"
  on profiles for insert
  with check (
    public.current_role() in ('SUPER_ADMIN','OWNER')
    or (public.current_role() = 'MANAGER' and role <> 'SUPER_ADMIN')
  );

-- ---------------------------------------------------------
-- H3: orders update — drop `with check (true)`, remove KITCHEN
--     (kitchen only manages order_items today), staff can change
--     operational fields but not the pricing columns.
-- ---------------------------------------------------------
drop policy if exists "ord_update_staff" on orders;
create policy "ord_update_staff"
  on orders for update
  using (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER','CASHIER','WAITER'))
  with check (public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER','CASHIER','WAITER'));

revoke update (subtotal, discount, tax_amount, service_charge, total) on public.orders from anon, authenticated;

-- ---------------------------------------------------------
-- H4: tenant-scope the write policies that reference other rows
-- ---------------------------------------------------------
drop policy if exists "oi_insert_staff" on order_items;
create policy "oi_insert_staff"
  on order_items for insert
  with check (
    public.current_role() in ('SUPER_ADMIN','OWNER')
    or (
      public.current_role() in ('MANAGER','CASHIER','WAITER')
      and order_id in (select o.id from orders o where o.branch_id = public.current_branch_id())
    )
  );

drop policy if exists "oim_insert_staff" on order_item_modifiers;
create policy "oim_insert_staff"
  on order_item_modifiers for insert
  with check (
    public.current_role() in ('SUPER_ADMIN','OWNER')
    or (
      public.current_role() in ('MANAGER','CASHIER','WAITER')
      and order_item_id in (
        select oi.id from order_items oi join orders o on o.id = oi.order_id
        where o.branch_id = public.current_branch_id()
      )
    )
  );

drop policy if exists "pay_insert_staff" on payments;
create policy "pay_insert_staff"
  on payments for insert
  with check (
    public.current_role() in ('SUPER_ADMIN','OWNER')
    or (
      public.current_role() in ('MANAGER','CASHIER')
      and order_id in (select o.id from orders o where o.branch_id = public.current_branch_id())
    )
  );

drop policy if exists "sm_insert_task" on stock_movements;
create policy "sm_insert_task"
  on stock_movements for insert
  with check (
    public.current_role() in ('SUPER_ADMIN','OWNER')
    or (
      public.current_role() in ('MANAGER','CASHIER','INVENTORY','KITCHEN')
      and branch_id = public.current_branch_id()
    )
  );

-- Notifications / audit may only be written for the caller's own
-- rows (SECURITY DEFINER helpers used by the app bypass RLS).
drop policy if exists "notif_insert_system" on notifications;
create policy "notif_insert_system"
  on notifications for insert
  with check (
    public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER')
    or user_id = (select id from profiles where user_id = auth.uid())
    or user_id is null
  );

drop policy if exists "audit_insert_system" on audit_logs;
create policy "audit_insert_system"
  on audit_logs for insert
  with check (
    public.current_role() in ('SUPER_ADMIN','OWNER','MANAGER','ACCOUNTING')
    or user_id = (select id from profiles where user_id = auth.uid())
  );

-- ---------------------------------------------------------
-- H5: staff may only modify orders of their own branch.
--     This also closes pay_order_atomic's cross-branch gap,
--     because that SECURITY DEFINER RPC performs a normal
--     UPDATE on the locked order row, which fires this trigger
--     with the CALLER's auth.uid().
-- ---------------------------------------------------------
create or replace function public.orders_tenant_write_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_branch uuid;
  v_branch_org uuid;
  v_order_org uuid;
begin
  if auth.uid() is null then
    return new;
  end if;

  select pr.role, pr.branch_id into v_role, v_branch
  from profiles pr
  where pr.user_id = auth.uid()
    and pr.is_active = true
    and pr.deleted_at is null
  limit 1;

  if v_role is null then
    raise exception 'Akun tidak valid' using errcode = 'P0001';
  end if;

  if v_role not in ('SUPER_ADMIN','OWNER') then
    select organization_id into v_branch_org from branches where id = v_branch;
    select organization_id into v_order_org from branches where id = old.branch_id;
    if old.branch_id is not null
       and (old.branch_id <> v_branch or v_order_org is distinct from v_branch_org) then
      raise exception 'Forbidden: order di luar cabang Anda' using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_orders_tenant_write_guard on public.orders;
create trigger trg_orders_tenant_write_guard
  before update on public.orders
  for each row execute function public.orders_tenant_write_guard();

-- ---------------------------------------------------------
-- H6: order_items must have a sane quantity and non-negative
--     financial values (defends against negative-quantity stock
--     manipulation and client-supplied garbage in the RPCs).
-- ---------------------------------------------------------
create or replace function public.order_items_write_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.quantity is null or new.quantity < 1 or new.quantity > 9999 then
    raise exception 'Jumlah item tidak valid' using errcode = 'P0001';
  end if;
  if new.unit_price is null or new.unit_price < 0 then
    raise exception 'Harga item tidak valid' using errcode = 'P0001';
  end if;
  if coalesce(new.discount, 0) < 0
     or coalesce(new.tax_percentage, 0) < 0
     or coalesce(new.tax_amount, 0) < 0
     or coalesce(new.subtotal, 0) < 0
     or coalesce(new.total, 0) < 0 then
    raise exception 'Nilai finansial item tidak valid' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_order_items_write_guard on public.order_items;
create trigger trg_order_items_write_guard
  before insert on public.order_items
  for each row execute function public.order_items_write_guard();

-- Orders must carry consistent, non-negative financial values.
-- total >= subtotal - discount always holds for every legit flow
-- (service charge and tax are non-negative). 1 rupiah tolerance
-- covers float rounding at the edge.
create or replace function public.orders_financial_write_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce(new.subtotal, 0) < 0
     or coalesce(new.discount, 0) < 0
     or coalesce(new.tax_amount, 0) < 0
     or coalesce(new.service_charge, 0) < 0
     or coalesce(new.total, 0) < 0
     or coalesce(new.paid_amount, 0) < 0
     or coalesce(new.change_amount, 0) < 0 then
    raise exception 'Nilai finansial order tidak valid' using errcode = 'P0001';
  end if;
  if coalesce(new.total, 0) + coalesce(new.discount, 0) + 1 < coalesce(new.subtotal, 0) then
    raise exception 'Total order tidak konsisten' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_orders_financial_write_guard on public.orders;
create trigger trg_orders_financial_write_guard
  before insert on public.orders
  for each row execute function public.orders_financial_write_guard();

-- ---------------------------------------------------------
-- H7: explicit, least-surprise grants for the username->email
--     lookup. It must stay anon-callable for the username login
--     (signInWithPassword happens pre-auth), but we remove the
--     implicit `public` grant so future default changes can't
--     widen it, and the login action is rate-limited app-side.
-- ---------------------------------------------------------
revoke all on function public.get_auth_email_by_username(text) from public;
grant execute on function public.get_auth_email_by_username(text) to anon, authenticated;