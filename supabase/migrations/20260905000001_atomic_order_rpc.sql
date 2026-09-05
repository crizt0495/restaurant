-- =====================================================
-- ATOMIC ORDER CREATION (transaction-safe)
-- Fixes: P0 - createOrder payload transition, stock race conditions
-- All validations happen server-side; branch is derived from auth.uid()
-- =====================================================

create or replace function public.create_order_atomic(
  p_order_type text,
  p_table_id text,
  p_customer_id text,
  p_subtotal numeric,
  p_discount numeric,
  p_tax_amount numeric,
  p_service_charge numeric,
  p_total numeric,
  p_paid_amount numeric,
  p_change_amount numeric,
  p_notes text,
  p_items jsonb,
  p_payments jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_branch uuid;
  v_profile_id uuid;
  v_role text;
  v_order_id uuid;
  v_order_number text;
  v_order_total numeric;
  rec record;
  v_quantity numeric;
  v_unit_price numeric;
  v_item_discount numeric;
  v_tax_perc numeric;
  v_subtotal numeric;
  v_tax_amount numeric;
  v_line_total numeric;
  v_product_id uuid;
  v_item_id uuid;
  v_recipe uuid;
  ri record;
  v_inv_qty numeric;
  v_new_qty numeric;
  mod jsonb;
  pay jsonb;
  v_paid numeric;
  v_pay_method text;
  v_pay_amount numeric;
  v_attempt int := 0;
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
    raise exception 'Forbidden: role tidak diizinkan membuat order' using errcode = 'P0001';
  end if;

  if v_branch is null then
    raise exception 'Akun tidak terhubung ke cabang mana pun' using errcode = 'P0001';
  end if;

  select b.organization_id into v_org from branches b where b.id = v_branch;
  if v_org is null then
    raise exception 'Cabang tidak valid' using errcode = 'P0001';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Order tidak memiliki item' using errcode = 'P0001';
  end if;

  -- Generate unique order number with collision retry
  loop
    v_attempt := v_attempt + 1;
    if v_attempt > 10 then
      raise exception 'Gagal membuat nomor order' using errcode = 'P0001';
    end if;
    v_order_number := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(floor(random()*10000)::int::text, 4, '0');
    begin
      insert into orders (
        organization_id, branch_id, order_number, status, order_type,
        table_id, customer_id, cashier_id, subtotal, discount, tax_amount,
        service_charge, total, paid_amount, change_amount, payment_status, notes
      ) values (
        v_org, v_branch, v_order_number, 'NEW', p_order_type,
        nullif(p_table_id,'')::uuid, nullif(p_customer_id,'')::uuid, v_profile_id, p_subtotal, p_discount, p_tax_amount,
        p_service_charge, p_total, p_paid_amount, p_change_amount,
        case
          when coalesce(p_paid_amount,0) >= coalesce(p_total,0) and coalesce(p_total,0) > 0 then 'PAID'
          when coalesce(p_paid_amount,0) > 0 then 'PARTIAL'
          else 'UNPAID'
        end,
        nullif(p_notes, '')
      )
      returning id into v_order_id;
      exit;
    exception when unique_violation then
      -- retry with a new order number
      v_order_id := null;
    end;
  end loop;

  -- Order items
  for rec in select * from jsonb_array_elements(p_items) with ordinality as t(value, n)
  loop
    v_product_id := ((rec.value)->>'product_id')::uuid;
    v_quantity := coalesce(((rec.value)->>'quantity')::numeric, 1);
    v_unit_price := coalesce(((rec.value)->>'unit_price')::numeric, 0);
    v_item_discount := coalesce(((rec.value)->>'discount')::numeric, 0);
    v_tax_perc := coalesce(((rec.value)->>'tax_percentage')::numeric, 0);
    v_subtotal := v_unit_price * v_quantity;
    v_tax_amount := (v_subtotal - v_item_discount) * v_tax_perc / 100;
    v_line_total := v_subtotal - v_item_discount + v_tax_amount;

    insert into order_items (
      order_id, product_id, product_name, variant_id, variant_name,
      quantity, unit_price, discount, tax_percentage, tax_amount, subtotal, total, notes
    ) values (
      v_order_id, v_product_id, (rec.value)->>'product_name', ((rec.value)->>'variant_id')::uuid, (rec.value)->>'variant_name',
      v_quantity, v_unit_price, v_item_discount, v_tax_perc, v_tax_amount, v_subtotal, v_line_total,
      nullif((rec.value)->>'notes', '')
    )
    returning id into v_item_id;

    for mod in select * from jsonb_array_elements(coalesce(rec.value->'modifiers', '[]'::jsonb))
    loop
      insert into order_item_modifiers (order_item_id, modifier_name, option_name, price)
      values (v_item_id, mod->>'name', mod->>'option_name', coalesce((mod->>'price')::numeric, 0));
    end loop;

    -- Atomic stock consumption via recipe (locks inventory row)
    select r.id into v_recipe
    from recipes r
    join products p on p.id = r.product_id
    where p.id = v_product_id and p.stock_tracking = true
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

        v_new_qty := greatest(0, v_inv_qty - (ri.quantity * v_quantity));

        update inventory_items
        set quantity = v_new_qty,
            updated_at = now()
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

  -- Payments
  for pay in select * from jsonb_array_elements(p_payments)
  loop
    v_pay_method := pay->>'method';
    v_pay_amount := coalesce((pay->>'amount')::numeric, 0);
    insert into payments (order_id, amount, method, status, created_by)
    values (v_order_id, v_pay_amount, v_pay_method, 'SUCCESS', v_profile_id);
  end loop;

  -- Mark table occupied for dine-in
  if nullif(p_table_id,'') is not null and p_order_type = 'DINE_IN' then
    update restaurant_tables set status = 'OCCUPIED', updated_at = now() where id = nullif(p_table_id,'')::uuid;
  end if;

  -- Notifications
  insert into notifications (organization_id, user_id, type, title, message, data)
  values (v_org, null, 'new_order', 'New Order',
    'Order ' || v_order_number || ' masuk dengan total ' || to_char(coalesce(p_total,0), 'FM999G999G999G999'),
    jsonb_build_object('order_id', v_order_id));

  -- Owner notification for large transactions
  if coalesce(p_total, 0) >= 1000000 then
    insert into notifications (organization_id, user_id, type, title, message, data)
    values (v_org, null, 'payment', 'Transaksi Besar',
      'Transaksi ' || v_order_number || ' senilai ' || to_char(coalesce(p_total,0), 'FM999G999G999G999'),
      jsonb_build_object('order_id', v_order_id));
  end if;

  -- Audit log
  insert into audit_logs (organization_id, user_id, action, entity, entity_id, new_data)
  values (v_org, v_profile_id, 'CREATE', 'order', v_order_id::text,
    jsonb_build_object('order_number', v_order_number, 'total', p_total));

  -- Loyalty auto-earn for member customers
  if nullif(p_customer_id,'') is not null then
    select c.name, c.total_spent
      into v_cust_name, v_total_spent
      from customers c where c.id = nullif(p_customer_id,'')::uuid for update;
    
    if v_cust_name is not null then
      -- Fetch loyalty settings
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
        v_points := floor(coalesce(p_total,0) / v_points_per);
        if v_points > 0 then
          update customers
            set points = coalesce(points, 0) + v_points,
                total_spent = coalesce(total_spent, 0) + coalesce(p_total, 0),
                is_member = true
            where id = nullif(p_customer_id,'')::uuid;
          
          -- Level evaluation
          v_total_spent := coalesce(v_total_spent, 0) + coalesce(p_total, 0);
          if v_total_spent >= v_platinum_min then v_new_level := 'PLATINUM';
          elsif v_total_spent >= v_gold_min then v_new_level := 'GOLD';
          elsif v_total_spent >= v_silver_min then v_new_level := 'SILVER';
          else v_new_level := 'BRONZE';
          end if;
          update customers set member_level = v_new_level where id = nullif(p_customer_id,'')::uuid;
          
          insert into customer_points (customer_id, points, type, reference, reference_id, description)
          values (nullif(p_customer_id,'')::uuid, v_points, 'EARN', v_order_number, v_order_id,
            'Poin dari order ' || v_order_number);
        else
          update customers
            set total_spent = coalesce(total_spent, 0) + coalesce(p_total, 0)
            where id = nullif(p_customer_id,'')::uuid;
        end if;
      end if;
    end if;
  end if;

  return jsonb_build_object('order_id', v_order_id, 'order_number', v_order_number);
end;
$$;

revoke all on function public.create_order_atomic(text, text, text, numeric, numeric, numeric, numeric, numeric, numeric, numeric, text, jsonb, jsonb) from anon;
revoke all on function public.create_order_atomic(text, text, text, numeric, numeric, numeric, numeric, numeric, numeric, numeric, text, jsonb, jsonb) from public;
grant execute on function public.create_order_atomic(text, text, text, numeric, numeric, numeric, numeric, numeric, numeric, numeric, text, jsonb, jsonb) to authenticated;