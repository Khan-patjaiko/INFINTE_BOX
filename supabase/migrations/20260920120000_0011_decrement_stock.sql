-- Atomically reduce products.stock by the quantities on a paid order.
-- Called by the stripe-webhook Edge Function (service role) on
-- checkout.session.completed. Idempotent per order via orders.stock_applied_at so a
-- redelivered webhook cannot double-decrement. Stock never goes below 0.
alter table public.orders add column stock_applied_at timestamptz;

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

  update public.products p
  set stock = greatest(p.stock - oi.qty, 0)
  from (
    select product_id, sum(qty) as qty
    from public.order_items
    where order_id = p_order_id and product_id is not null
    group by product_id
  ) oi
  where p.id = oi.product_id;
end;
$$;

revoke execute on function public.decrement_order_stock(uuid) from public, anon, authenticated;
grant execute on function public.decrement_order_stock(uuid) to service_role;
