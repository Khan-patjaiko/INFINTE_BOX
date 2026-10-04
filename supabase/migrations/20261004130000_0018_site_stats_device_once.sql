-- Devices: count each visitor once, under the device of their latest event, so the split
-- adds up to the visitor total (a resized window or tablet + desktop no longer double-counts).
create or replace function public.admin_site_stats(p_days int default 30)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  tz constant text := 'Asia/Bangkok';
  today_start timestamptz := date_trunc('day', now() at time zone tz) at time zone tz;
  since timestamptz := today_start - make_interval(days => p_days - 1);
  week_start timestamptz := today_start - interval '6 days';
  result jsonb;
begin
  if not private.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;

  with ev as (
    select * from public.site_events where created_at >= since
  )
  select jsonb_build_object(
    'days', p_days,
    'today', (select jsonb_build_object('visitors', count(distinct visitor_id),
                                        'views', count(*) filter (where event = 'page_view'))
              from ev where created_at >= today_start),
    'week', (select jsonb_build_object('visitors', count(distinct visitor_id),
                                       'views', count(*) filter (where event = 'page_view'))
             from ev where created_at >= week_start),
    'period', (select jsonb_build_object('visitors', count(distinct visitor_id),
                                         'views', count(*) filter (where event = 'page_view'))
               from ev),
    'daily', (select coalesce(jsonb_agg(jsonb_build_object(
                       'day', d.day, 'visitors', coalesce(x.visitors, 0), 'views', coalesce(x.views, 0))
                     order by d.day), '[]'::jsonb)
              from (select ((since at time zone tz)::date + i) as day
                    from generate_series(0, p_days - 1) as i) d
              left join (select (created_at at time zone tz)::date as day,
                                count(distinct visitor_id) as visitors,
                                count(*) filter (where event = 'page_view') as views
                         from ev group by 1) x on x.day = d.day),
    'top_products', (select coalesce(jsonb_agg(t order by t.views desc, t.carts desc), '[]'::jsonb)
                     from (select e.product_slug as slug,
                                  coalesce(p.name, e.product_slug) as name,
                                  count(*) filter (where e.event = 'page_view') as views,
                                  count(distinct e.visitor_id) filter (where e.event = 'page_view') as visitors,
                                  count(*) filter (where e.event = 'add_to_cart') as carts
                           from ev e
                           left join public.products p on p.slug = e.product_slug
                           where e.product_slug is not null
                           group by e.product_slug, p.name
                           order by views desc, carts desc
                           limit 5) t),
    'funnel', (select jsonb_build_object(
                 'visitors', count(distinct visitor_id),
                 'product_viewers', count(distinct visitor_id) filter (where event = 'page_view' and product_slug is not null),
                 'add_to_cart', count(distinct visitor_id) filter (where event = 'add_to_cart'),
                 'checkout', count(distinct visitor_id) filter (where event = 'checkout_start'),
                 'paid_orders', (select count(*) from public.orders o
                                 where o.status in ('paid', 'fulfilled') and o.created_at >= since))
               from ev),
    'devices', (select coalesce(jsonb_object_agg(device, n), '{}'::jsonb)
                from (select device, count(*) as n
                      from (select distinct on (visitor_id) visitor_id, device
                            from ev order by visitor_id, created_at desc) last_dev
                      group by device) dv)
  ) into result;

  return result;
end;
$$;
