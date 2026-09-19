-- Orders + line items. Inserts/updates happen only via Edge Functions using
-- the service role (which bypasses RLS); clients may only read their own.
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  status text not null default 'pending'
    check (status in ('pending','paid','fulfilled','cancelled')),
  subtotal_cents integer not null default 0,
  shipping_cents integer not null default 0,
  total_cents integer not null default 0,
  stripe_session_id text,
  stripe_payment_intent text,
  shipping_address jsonb,
  created_at timestamptz not null default now()
);
alter table public.orders enable row level security;

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  unit_price_cents integer not null,
  qty integer not null check (qty > 0)
);
alter table public.order_items enable row level security;

create index orders_user_idx on public.orders (user_id);
create index orders_session_idx on public.orders (stripe_session_id);
create index order_items_order_idx on public.order_items (order_id);

-- Owners (or admins) may read their orders; no client insert/update policies.
create policy "orders_select_own" on public.orders
  for select using (auth.uid() = user_id or public.is_admin());
create policy "order_items_select_own" on public.order_items
  for select using (
    public.is_admin() or exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );
