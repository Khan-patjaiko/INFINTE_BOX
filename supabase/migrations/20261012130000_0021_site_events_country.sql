-- Admin → Visitors tab: country, language and referring site per visit.
-- country: 2-letter code. The server takes it from Cloudflare's cf-ipcountry request header
-- (the browser's own value is only used when that header is missing). No IP is stored.
-- lang: 'en' | 'th' (the page's language).
-- referrer_host: the other website that sent the visitor ('' = direct or an internal click;
-- null = recorded before this migration).
alter table public.site_events
  add column country text check (country ~ '^[A-Z]{2}$'),
  add column lang text check (lang in ('en', 'th')),
  add column referrer_host text check (char_length(referrer_host) <= 100);

create or replace function private.site_events_set_country()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  hdr text := upper(coalesce(current_setting('request.headers', true)::json->>'cf-ipcountry', ''));
begin
  if hdr ~ '^[A-Z]{2}$' and hdr not in ('XX', 'T1') then
    new.country := hdr;
  end if;
  return new;
end;
$$;

create trigger site_events_set_country
  before insert on public.site_events
  for each row execute function private.site_events_set_country();

-- Stats for any range (1–400 days). Adds countries, pages, languages and referrers.
create or replace function public.admin_site_stats(p_days int default 30)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  tz constant text := 'Asia/Bangkok';
  n_days int := least(greatest(coalesce(p_days, 30), 1), 400);
  today_start timestamptz := date_trunc('day', now() at time zone tz) at time zone tz;
  since timestamptz := today_start - make_interval(days => n_days - 1);
  week_start timestamptz := today_start - interval '6 days';
  result jsonb;
begin
  if not private.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;

  with ev as (
    select * from public.site_events where created_at >= least(since, week_start)
  ), rng as (
    select * from ev where created_at >= since
  )
  select jsonb_build_object(
    'days', n_days,
    'today', (select jsonb_build_object('visitors', count(distinct visitor_id),
                                        'views', count(*) filter (where event = 'page_view'))
              from ev where created_at >= today_start),
    'week', (select jsonb_build_object('visitors', count(distinct visitor_id),
                                       'views', count(*) filter (where event = 'page_view'))
             from ev where created_at >= week_start),
    'period', (select jsonb_build_object('visitors', count(distinct visitor_id),
                                         'views', count(*) filter (where event = 'page_view'))
               from rng),
    'daily', (select coalesce(jsonb_agg(jsonb_build_object(
                       'day', d.day, 'visitors', coalesce(x.visitors, 0), 'views', coalesce(x.views, 0))
                     order by d.day), '[]'::jsonb)
              from (select ((since at time zone tz)::date + i) as day
                    from generate_series(0, n_days - 1) as i) d
              left join (select (created_at at time zone tz)::date as day,
                                count(distinct visitor_id) as visitors,
                                count(*) filter (where event = 'page_view') as views
                         from rng group by 1) x on x.day = d.day),
    'top_products', (select coalesce(jsonb_agg(t order by t.views desc, t.carts desc), '[]'::jsonb)
                     from (select e.product_slug as slug,
                                  coalesce(p.name, e.product_slug) as name,
                                  count(*) filter (where e.event = 'page_view') as views,
                                  count(distinct e.visitor_id) filter (where e.event = 'page_view') as visitors,
                                  count(*) filter (where e.event = 'add_to_cart') as carts
                           from rng e
                           left join public.products p on p.slug = e.product_slug
                           where e.product_slug is not null
                           group by e.product_slug, p.name
                           order by views desc, carts desc
                           limit 10) t),
    'pages', (select coalesce(jsonb_agg(t order by t.views desc), '[]'::jsonb)
              from (select path, count(*) as views, count(distinct visitor_id) as visitors
                    from rng where event = 'page_view'
                    group by path order by views desc limit 10) t),
    'funnel', (select jsonb_build_object(
                 'visitors', count(distinct visitor_id),
                 'product_viewers', count(distinct visitor_id) filter (where event = 'page_view' and product_slug is not null),
                 'add_to_cart', count(distinct visitor_id) filter (where event = 'add_to_cart'),
                 'checkout', count(distinct visitor_id) filter (where event = 'checkout_start'),
                 'paid_orders', (select count(*) from public.orders o
                                 where o.status in ('paid', 'fulfilled') and o.created_at >= since))
               from rng),
    -- Each visitor counted once: device / language of their latest event,
    -- country of their latest event that has one ('??' = not recorded).
    'devices', (select coalesce(jsonb_object_agg(device, n), '{}'::jsonb)
                from (select device, count(*) as n
                      from (select distinct on (visitor_id) visitor_id, device
                            from rng order by visitor_id, created_at desc) v
                      group by device) dv),
    'countries', (select coalesce(jsonb_agg(jsonb_build_object('code', code, 'visitors', n) order by n desc, code), '[]'::jsonb)
                  from (select coalesce(country, '??') as code, count(*) as n
                        from (select distinct on (visitor_id) visitor_id, country
                              from rng order by visitor_id, (country is null), created_at desc) v
                        group by 1) c),
    'langs', (select coalesce(jsonb_object_agg(coalesce(lang, 'unknown'), n), '{}'::jsonb)
              from (select lang, count(*) as n
                    from (select distinct on (visitor_id) visitor_id, lang
                          from rng order by visitor_id, (lang is null), created_at desc) v
                    group by lang) l),
    -- First outside website that sent each visitor in the range; 'direct' = tracked since
    -- migration 0021 with no outside referrer; visitors from before that are left out.
    'referrers', (select coalesce(jsonb_agg(jsonb_build_object('host', host, 'visitors', n) order by n desc, host), '[]'::jsonb)
                  from (select host, count(*) as n
                        from (select visitor_id,
                                     coalesce((array_agg(referrer_host order by created_at)
                                               filter (where referrer_host <> ''))[1], 'direct') as host
                              from rng where referrer_host is not null
                              group by visitor_id) v
                        group by host order by n desc limit 10) r)
  ) into result;

  return result;
end;
$$;
