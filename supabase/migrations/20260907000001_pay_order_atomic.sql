-- =====================================================
-- PAY EXISTING ORDER (transaction-safe)
-- Completes payment for orders that were created outside
-- the POS atomic flow (e.g. QR menu self-ordering) and
-- for orders paid partially in the POS.
-- Fixes: P1 - QR menu orders could never be marked PAID;
--        QR order stock was never consumed; dashboard
--        realtime subscription to payments was dead.
-- =====================================================

-- -----------------------------------------------------
-- 1) Track whether stock was already consumed per order
-- -----------------------------------------------------
alter table public.orders
  add column if not exists stock_deducted boolean not null default false;

-- Existing non-QR rows were created via the atomic POS flow
-- (stock already consumed at creation). QR_MENU rows were
-- not, and will be consumed once on first payment.
update public.orders
  set stock_deducted = true
  where coalesce(source, 'POS') <> 'QR_MENU';

-- Before insert: normalize source and flag stock deduction.
-- POS atomic inserts (source NULL/'POS') => stock_deducted = true
-- QR menu inserts (source 'QR_MENU')      => stock_deducted = false
create or replace function public.orders_stock_flag_before_insert()
returns trigger
language plpgsql
as $$
begin
  new.source := coalesce(nullif(new.source, ''), 'POS');
  new.stock_deducted := (new.source <> 'QR_MENU');
  return new;
end;
$$;

drop trigger if exists orders_stock_flag_before_insert on public.orders;
create trigger orders_stock_flag_before_insert
  before insert on public.orders
  for each row execute function public.orders_stock_flag_before_insert();

-- -----------------------------------------------------
-- 2) Enable realtime for payments (dashboard subscribes)
-- -----------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'payments'
  ) then
    alter publication supabase_realtime add table public.payments;
  end if;
end;
$$;

-- -----------------------------------------------------
-- 3) ATOMIC PAYMENT FOR AN EXISTING ORDER
-- -----------------------------------------------------
create or replace function public.pay_order_atomic(
  p_order_id uuid,
  p_payments jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
  v_branch uuid;
  v_role text;
  v_org uuid;
  v_order_id uuid;
  v_order_number text;
  v_status text;
  v_payment_status text;
  v_old_paid numeric := 0;
  v_total numeric := 0;
  v_customer_id uuid;
  v_source text;
  v_stock_deducted boolean := false;
  v_added numeric := 0;
  v_new_paid numeric := 0;
  v_new_status text;
  v_change numeric := 0;
  pay jsonb;
  v_pay_method text;
  v_pay_amount numeric;
  v_item record;
  v_recipe uuid;
  ri record;
  v_inv_qty numeric;
  v_new_qty numeric;
  v_quantity numeric;
  v_points numeric;
  v_points_per numeric := 10000;
  v_loyalty jsonb;
  v_total_spent numeric;
  v_new_level text;
  v_silver_min numeric := 1000000;
  v_gold_min numeric := 5000000;
  v_platinum_min numeric := 10000000;
  v_cust_name text;
begin
  select pr.id, pr.branch_id, pr.role
    into v_profile_id, v_branch, v_role
    from profiles pr
    where pr.user_id = auth.uid() and pr.is_active = true and pr.deleted_at is null;

  if v_profile_id is null then
    raise exception 'Unauthorized: akun tidak ditemukan atau tidak aktif' using errcode = 'P0001';
  end if;

  if v_role not in ('SUPER_ADMIN','OWNER','MANAGER','CASHIER','WAITER') then
    raise exception 'Forbidden: role tidak diizinkan menerima pembayaran' using errcode = 'P0001';
  end if;

  -- Lock the order row so concurrent payments cannot race
  select id, order_number, status, payment_status, paid_amount, total,
         customer_id, source, stock_deducted, organization_id
    into v_order_id, v_order_number, v_status, v_payment_status, v_old_paid, v_total,
         v_customer_id, v_source, v_stock_deducted, v_org
    from orders
    where id = p_order_id
    for update;

  if v_order_id is null then
    raise exception 'Order tidak ditemukan' using errcode = 'P0001';
  end if;

  if v_status in ('CANCELLED','REFUNDED') then
    raise exception 'Order sudah dibatalkan atau direfund' using errcode = 'P0001';
  end if;

  if v_payment_status = 'PAID' and coalesce(v_old_paid, 0) >= coalesce(v_total, 0) then
    raise exception 'Order sudah lunas' using errcode = 'P0001';
  end if;

  if p_payments is null or jsonb_array_length(p_payments) = 0 then
    raise exception 'Pembayaran kosong' using errcode = 'P0001';
  end if;

  -- Validate and sum newly paid amounts
  for pay in select * from jsonb_array_elements(p_payments)
  loop
    v_pay_method := pay->>'method';
    v_pay_amount := coalesce((pay->>'amount')::numeric, 0);
    if v_pay_amount <= 0 then
      raise exception 'Jumlah pembayaran tidak valid' using errcode = 'P0001';
    end if;
    if v_pay_method is null or v_pay_method = '' then
      raise exception 'Metode pembayaran tidak valid' using errcode = 'P0001';
    end if;
    v_added := v_added + v_pay_amount;
  end loop;

  if v_added <= 0 then
    raise exception 'Jumlah pembayaran tidak valid' using errcode = 'P0001';
  end if;

  v_new_paid := coalesce(v_old_paid, 0) + v_added;
  if coalesce(v_total, 0) > 0 and v_new_paid >= v_total then
    v_new_status := 'PAID';
    v_change := greatest(0, v_new_paid - v_total);
  else
    v_new_status := 'PARTIAL';
    v_change := 0;
  end if;

  -- Record payments
  for pay in select * from jsonb_array_elements(p_payments)
  loop
    v_pay_method := pay->>'method';
    v_pay_amount := coalesce((pay->>'amount')::numeric, 0);
    insert into payments (order_id, amount, method, status, created_by)
    values (v_order_id, v_pay_amount, v_pay_method, 'SUCCESS', v_profile_id);
  end loop;

  update orders
    set paid_amount = v_new_paid,
        change_amount = v_change,
        payment_status = v_new_status,
        completed_by = case when v_new_status = 'PAID' and v_payment_status <> 'PAID' then v_profile_id else completed_by end,
        completed_at = case when v_new_status = 'PAID' and v_payment_status <> 'PAID' then now() else completed_at end,
        updated_at = now()
    where id = v_order_id;

  -- Consume stock for orders that never went through the
  -- atomic create flow (e.g. QR_MENU) and were not deducted.
  if not coalesce(v_stock_deducted, false) then
    for v_item in
      select oi.product_id, oi.quantity
      from order_items oi
      where oi.order_id = v_order_id
    loop
      select r.id into v_recipe
      from recipes r
      join products p on p.id = r.product_id
      where p.id = v_item.product_id and p.stock_tracking = true
      limit 1;

      if v_recipe is not null then
        for ri in (
          select recipe_items.inventory_item_id, recipe_items.quantity
          from recipe_items
          where recipe_items.recipe_id = v_recipe
        )
        loop
          select quantity into v_inv_qty
          from inventory_items
          where id = ri.inventory_item_id
          for update;

          if v_inv_qty is null then
            continue;
          end if;

          v_quantity := coalesce(v_item.quantity, 1);
          v_new_qty := greatest(0, v_inv_qty - (ri.quantity * v_quantity));

          update inventory_items
            set quantity = v_new_qty, updated_at = now()
          where id = ri.inventory_item_id;

          insert into stock_movements (
            organization_id, branch_id, inventory_item_id, movement_type,
            quantity, before_quantity, after_quantity, reference, reference_id,
            cost_price, notes, created_by
          ) values (
            v_org, v_branch, ri.inventory_item_id, 'SALE_CONSUMPTION',
            ri.quantity * v_quantity, v_inv_qty, v_new_qty,
            'ORDER', v_order_id, 0,
            'Konsumsi penjualan order ' || v_order_number, v_profile_id
          );
        end loop;
      end if;
    end loop;

    update orders
      set stock_deducted = true, updated_at = now()
      where id = v_order_id;
  end if;

  -- Loyalty auto-earn on the newly paid amount
  if v_customer_id is not null and v_added > 0 then
    select c.name, c.total_spent
      into v_cust_name, v_total_spent
      from customers c where c.id = v_customer_id for update;

    if v_cust_name is not null then
      select value into v_loyalty
        from settings
        where organization_id = v_org and key = 'loyalty'
        limit 1;

      if v_loyalty is not null then
        v_points_per := coalesce((v_loyalty->>'points_per_currency')::numeric, 10000);
        v_silver_min := coalesce((v_loyalty->>'silver_min')::numeric, 1000000);
        v_gold_min := coalesce((v_loyalty->>'gold_min')::numeric, 5000000);
        v_platinum_min := coalesce((v_loyalty->>'platinum_min')::numeric, 10000000);
      end if;

      if v_points_per > 0 then
        v_points := floor(v_added / v_points_per);
        if v_points > 0 then
          update customers
            set points = coalesce(points, 0) + v_points,
                total_spent = coalesce(total_spent, 0) + v_added,
                is_member = true
            where id = v_customer_id;

          v_total_spent := coalesce(v_total_spent, 0) + v_added;
          if v_total_spent >= v_platinum_min then v_new_level := 'PLATINUM';
          elsif v_total_spent >= v_gold_min then v_new_level := 'GOLD';
          elsif v_total_spent >= v_silver_min then v_new_level := 'SILVER';
          else v_new_level := 'BRONZE';
          end if;
          update customers set member_level = v_new_level where id = v_customer_id;

          insert into customer_points (customer_id, points, type, reference, reference_id, description)
          values (v_customer_id, v_points, 'EARN', v_order_number, v_order_id,
            'Poin dari order ' || v_order_number);
        else
          update customers
            set total_spent = coalesce(total_spent, 0) + v_added
            where id = v_customer_id;
        end if;
      end if;
    end if;
  end if;

  -- Notify staff
  perform public.notify_staff(
    v_org, 'payment', 'Pembayaran Diterima',
    'Pembayaran ' || to_char(v_added, 'FM999G999G999G999') || ' untuk order ' || v_order_number,
    jsonb_build_object('order_id', v_order_id)
  );

  -- Audit log
  insert into audit_logs (organization_id, user_id, action, entity, entity_id, new_data)
  values (v_org, v_profile_id, 'PAYMENT', 'order', v_order_id::text,
    jsonb_build_object('order_number', v_order_number, 'amount', v_added, 'payment_status', v_new_status));

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'payment_status', v_new_status,
    'paid_amount', v_new_paid
  );
end;
$$;

revoke all on function public.pay_order_atomic(uuid, jsonb) from anon;
revoke all on function public.pay_order_atomic(uuid, jsonb) from public;
grant execute on function public.pay_order_atomic(uuid, jsonb) to authenticated;