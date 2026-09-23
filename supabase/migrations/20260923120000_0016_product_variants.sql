-- Per-variant price, stock and SKU (2026-09-23, Handover #10).
--
-- products.variants holds one entry per combination of products.options values:
--   [{"options":{"Color":"Blue","Style":"Clip"},"price_cents":27900,"stock":2,"sku":"MZ-BL-C"}, ...]
-- The options object uses the same shape as order_items.options, so a paid line is matched to
-- its variant with jsonb equality (key order doesn't matter). For products with variants,
-- products.price_cents (lowest variant price) and products.stock (sum of variant stock) are
-- summary columns kept in sync by the admin UI and by decrement_order_stock below.
-- Products without options keep variants = [] and behave exactly as before.
alter table public.products add column if not exists variants jsonb not null default '[]'::jsonb;
alter table public.order_items add column if not exists sku text;

create or replace function public.decrement_order_stock(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Claim the order first; bail if already applied.
  update public.orders set stock_applied_at = now()
  where id = p_order_id and stock_applied_at is null;
  if not found then return; end if;

  -- Plain products: one shared stock count.
  update public.products p
  set stock = greatest(p.stock - oi.qty, 0)
  from (
    select product_id, sum(qty) as qty
    from public.order_items
    where order_id = p_order_id and product_id is not null
    group by product_id
  ) oi
  where p.id = oi.product_id and jsonb_array_length(p.variants) = 0;

  -- Products with variants: decrement the matching variant (order preserved, floor 0)...
  update public.products p
  set variants = (
    select coalesce(jsonb_agg(
      case when q.qty is null then v.elem
           else jsonb_set(v.elem, '{stock}', to_jsonb(greatest(coalesce((v.elem->>'stock')::int, 0) - q.qty, 0)))
      end order by v.ord), '[]'::jsonb)
    from jsonb_array_elements(p.variants) with ordinality as v(elem, ord)
    left join (
      select options, sum(qty) as qty
      from public.order_items
      where order_id = p_order_id and product_id = p.id
      group by options
    ) q on q.options = v.elem->'options'
  )
  where jsonb_array_length(p.variants) > 0
    and p.id in (select product_id from public.order_items where order_id = p_order_id);

  -- ...then refresh the summary stock.
  update public.products p
  set stock = (select coalesce(sum(coalesce((e->>'stock')::int, 0)), 0) from jsonb_array_elements(p.variants) e)
  where jsonb_array_length(p.variants) > 0
    and p.id in (select product_id from public.order_items where order_id = p_order_id);
end;
$$;

revoke execute on function public.decrement_order_stock(uuid) from public, anon, authenticated;
grant execute on function public.decrement_order_stock(uuid) to service_role;

-- Owner decision: the BMW insert's options were test data; it goes back to a plain product.
update public.products set options = '[]'::jsonb, variants = '[]'::jsonb
where slug = 'bmw-e90-center-console-insert';
