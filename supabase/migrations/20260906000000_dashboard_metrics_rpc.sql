-- =====================================================
-- PERFORMANCE: Dashboard aggregation RPC
-- Replaces 10+ sequential client-side fetches with 1 DB call
-- Returns today metrics + 7-day trend + top products + payment methods
-- =====================================================

create or replace function public.get_dashboard_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_branch uuid;
  v_org uuid;
  v_today_start timestamptz;
  v_today_end timestamptz;
  v_result jsonb;
begin
  select b.id, b.organization_id
    into v_branch, v_org
    from profiles pr
    join branches b on b.id = pr.branch_id
    where pr.user_id = auth.uid()
    limit 1;

  if v_branch is null then
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

  with today_orders as (
    select
      o.id, o.total, o.status, o.created_at,
      oi.product_id, oi.quantity, oi.unit_price
    from orders o
    left join order_items oi on oi.order_id = o.id
    where o.branch_id = v_branch
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
        then quantity * coalesce(
          (select p.cost_price from products p where p.id = product_id limit 1), 0
        ) end
      ), 0) as cogs
    from today_orders
    where product_id is not null
  ),
  customer_stats as (
    select count(*)::int as total_customers
    from customers c
    where c.organization_id = v_org
  ),
  low_stock as (
    select count(*)::int as low_count
    from inventory_items i
    where i.organization_id = v_org
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
      and o.branch_id = v_branch
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
    where o.branch_id = v_branch
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
    where o.branch_id = v_branch
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
