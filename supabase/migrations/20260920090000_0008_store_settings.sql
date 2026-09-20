-- Store-wide settings (key/value). Single source of truth for values that both the
-- storefront and the Edge Functions need, e.g. the flat shipping fee. Public read so the
-- cart page can show the fee before checkout; only admins can change values.
create table public.store_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.store_settings enable row level security;

create policy "store_settings_select_all" on public.store_settings
  for select using (true);
create policy "store_settings_admin_write" on public.store_settings
  for all using (private.is_admin()) with check (private.is_admin());

-- Flat-rate shipping in US cents. Previously hardcoded as 6.5 in cart.html and 650 in
-- create-checkout-session; both now read this row (and fall back to 650 if it is missing).
insert into public.store_settings (key, value) values ('shipping_cents', '650'::jsonb);
