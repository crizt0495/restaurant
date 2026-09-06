-- =====================================================
-- SUPER_ADMIN: default full access
--
-- Problem: SUPER_ADMIN profile had branch_id = NULL, so every
-- query/action that resolved organization_id/branch_id from the
-- user context broke (NULL filters return no rows; NULL FK causes
-- insert failures).
--
-- Fix 1: assign the SUPER_ADMIN to the main branch (writes / defaults).
--        RLS policies already let SUPER_ADMIN read across ALL branches.
-- Fix 2: make get_dashboard_metrics() aggregate across ALL branches
--        when the caller is SUPER_ADMIN.
-- =====================================================

update profiles
set branch_id = b.id
from (
  select id, organization_id
  from branches
  order by created_at asc
  limit 1
) b
where profiles.role = 'SUPER_ADMIN'
  and profiles.branch_id is null;

-- ---------------------------------------------------------
-- Rewrite dashboard metrics: SUPER_ADMIN sees all branches
-- ---------------------------------------------------------
create or replace function public.get_dashboard_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_branch uuid;
  v_org uuid;
  v_orgs uuid[];
  v_branch_filter text;
  v_today_start timestamptz;
  v_today_end timestamptz;
  v_result jsonb;
begin
  select p.role, p.branch_id, b.organization_id
    into v_role, v_branch, v_org
    from profiles p
    left join branches b on b.id = p.branch_id
    where p.user_id = auth.uid()
    limit 1;

  if v_role is null then
    return jsonb_build_object(
      'todaySales', 0, 'todayOrders', 0, 'todayProfit', 0,
      'avgOrderValue', 0, 'totalCustomers', 0, 'lowStockItems', 0,
      'pendingOrders', 0, 'cancelledOrders', 0,
      'salesTrend', '[]'::jsonb,
      'topProducts', '[]'::jsonb,
      'paymentMethods', '[]'::jsonb,
      'busyHours', '[]'::jsonb
    );
  end if;

  v_today_start := date_trunc('day', now());
  v_today_end := v_today_start + interval '1 day';

  -- SUPER_ADMIN sees ALL branches; other roles see only their branch.
  if v_role = 'SUPER_ADMIN' or v_branch is null then
    v_branch_filter := null;
  else
    v_branch_filter := v_branch::text;
  end if;

  if v_role = 'SUPER_ADMIN' or v_org is null then
    select coalesce(array_agg(distinct organization_id), array[]::uuid[])
      into v_orgs
      from branches;
  else
    v_orgs := array[v_org];
  end if;

  with today_orders as (
    select
      o.id, o.total, o.status, o.created_at, o.branch_id,
      oi.product_id, oi.quantity, oi.unit_price
    from orders o
    left join order_items oi on oi.order_id = o.id
    where (v_branch_filter is null or o.branch_id = v_branch_filter::uuid)
      and o.created_at >= v_today_start
      and o.created_at < v_today_end
  ),
  today_stats as (
    select
      coalesce(sum(case when status not in ('CANCELLED','REFUNDED') then total end), 0) as sales,
      count(case when status not in ('CANCELLED','REFUNDED') then 1 end) as order_count,
      coalesce(sum(case when status in ('NEW','CONFIRMED','PREPARING') then 1 else 0 end), 0) as pending,
      coalesce(sum(case when status in ('CANCELLED','REFUNDED') then 1 else 0 end), 0) as cancelled,
      coalesce(sum(
        case when status not in ('CANCELLED','REFUNDED')
        then oi.quantity * coalesce(
          (select p.cost_price from products p where p.id = oi.product_id limit 1), 0
        ) end
      ), 0) as cogs
    from today_orders
    where product_id is not null
  ),
  customer_stats as (
    select count(*)::int as total_customers
    from customers c
    where (v_orgs = array[]::uuid[] or c.organization_id = any(v_orgs))
  ),
  low_stock as (
    select count(*)::int as low_count
    from inventory_items i
    where (v_orgs = array[]::uuid[] or i.organization_id = any(v_orgs))
      and i.deleted_at is null
      and i.quantity < i.minimum_stock
  ),
  seven_day_trend as (
    select
      to_char(d.day, 'Dy') as label,
      coalesce(sum(o.total), 0) as value
    from (
      select generate_series(
        date_trunc('day', now()) - interval '6 days',
        date_trunc('day', now()),
        '1 day'
      ) as day
    ) d
    left join orders o on date_trunc('day', o.created_at) = d.day
      and (v_branch_filter is null or o.branch_id = v_branch_filter::uuid)
      and o.status not in ('CANCELLED','REFUNDED')
    group by d.day
    order by d.day
  ),
  product_sales as (
    select
      oi.product_id,
      sum(oi.quantity)::int as qty,
      sum(oi.quantity * oi.unit_price) as revenue
    from today_orders oi
    where oi.product_id is not null
      and oi.status not in ('CANCELLED','REFUNDED')
    group by oi.product_id
    order by revenue desc
    limit 5
  ),
  top_products as (
    select jsonb_build_object(
      'name', p.name,
      'qty', ps.qty,
      'revenue', ps.revenue
    ) as data
    from product_sales ps
    join products p on p.id = ps.product_id
  ),
  today_payments as (
    select
      p.method,
      sum(p.amount) as amount
    from payments p
    join orders o on o.id = p.order_id
    where (v_branch_filter is null or o.branch_id = v_branch_filter::uuid)
      and p.status = 'SUCCESS'
      and p.payment_date >= v_today_start
      and p.payment_date < v_today_end
    group by p.method
  ),
  today_hourly as (
    select
      extract(hour from o.created_at)::int as hour,
      count(*)::int as cnt
    from orders o
    where (v_branch_filter is null or o.branch_id = v_branch_filter::uuid)
      and o.created_at >= v_today_start
      and o.created_at < v_today_end
      and o.status not in ('CANCELLED','REFUNDED')
    group by extract(hour from o.created_at)
  )
  select jsonb_build_object(
    'todaySales',        coalesce(ts.sales, 0),
    'todayOrders',       coalesce(ts.order_count, 0),
    'todayProfit',       coalesce(ts.sales, 0) - coalesce(ts.cogs, 0),
    'avgOrderValue',     case when coalesce(ts.order_count, 0) > 0
                         then coalesce(ts.sales, 0) / ts.order_count else 0 end,
    'totalCustomers',    coalesce(cs.total_customers, 0),
    'lowStockItems',     coalesce(ls.low_count, 0),
    'pendingOrders',     coalesce(ts.pending, 0),
    'cancelledOrders',   coalesce(ts.cancelled, 0),
    'salesTrend',        coalesce(jsonb_agg(sdt.label || '|' || sdt.value), '[]'),
    'topProducts',       coalesce((select jsonb_agg(data) from top_products), '[]'),
    'paymentMethods',    coalesce(jsonb_agg(jsonb_build_object('method', tp.method, 'amount', tp.amount)), '[]'),
    'busyHours',         coalesce(jsonb_agg(jsonb_build_object('label', th.hour || ':00', 'value', th.cnt)), '[]')
  )
  into v_result
  from today_stats ts
  cross join customer_stats cs
  cross join low_stock ls
  left join seven_day_trend sdt on true
  left join top_products on true
  left join today_payments tp on true
  left join today_hourly th on true
  group by ts.sales, ts.order_count, ts.pending, ts.cancelled, ts.cogs,
           cs.total_customers, ls.low_count;

  return v_result;
end;
$$;

grant execute on function public.get_dashboard_metrics() to authenticated;