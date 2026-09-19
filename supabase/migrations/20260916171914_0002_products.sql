-- Product catalogue (source of truth; replaces hardcoded products.js array).
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  material text,
  price_cents integer not null check (price_cents >= 0),
  category text,
  description text,
  specs jsonb not null default '{}'::jsonb,
  icon_key text,
  image_url text,
  active boolean not null default true,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.products enable row level security;

create index products_active_sort_idx on public.products (active, sort);

-- Anyone (including anon) can read active products; admins manage all.
create policy "products_select_active" on public.products
  for select using (active = true or public.is_admin());
create policy "products_admin_write" on public.products
  for all using (public.is_admin()) with check (public.is_admin());
