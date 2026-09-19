-- Move SECURITY DEFINER helpers out of the API-exposed public schema so they
-- can't be invoked via PostgREST /rpc, while still being usable inside RLS
-- policies and the auth trigger.
create schema if not exists private;
grant usage on schema private to postgres, anon, authenticated, service_role, supabase_auth_admin;

-- Drop policies that depend on public.is_admin() so the function can be replaced.
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "products_select_active" on public.products;
drop policy if exists "products_admin_write" on public.products;
drop policy if exists "orders_select_own" on public.orders;
drop policy if exists "order_items_select_own" on public.order_items;
drop policy if exists "quotes_select_own" on public.quote_requests;
drop policy if exists "contact_select_admin" on public.contact_messages;
drop policy if exists "product_images_admin_write" on storage.objects;

-- Replace the auth trigger + its function (relocate to private schema).
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.is_admin();

create or replace function private.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure private.handle_new_user();

-- Recreate policies referencing private.is_admin().
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id or private.is_admin());

create policy "products_select_active" on public.products
  for select using (active = true or private.is_admin());
create policy "products_admin_write" on public.products
  for all using (private.is_admin()) with check (private.is_admin());

create policy "orders_select_own" on public.orders
  for select using (auth.uid() = user_id or private.is_admin());
create policy "order_items_select_own" on public.order_items
  for select using (
    private.is_admin() or exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );

create policy "quotes_select_own" on public.quote_requests
  for select using (auth.uid() = user_id or private.is_admin());
create policy "contact_select_admin" on public.contact_messages
  for select using (private.is_admin());

create policy "product_images_admin_write" on storage.objects
  for all using (bucket_id = 'product-images' and private.is_admin())
  with check (bucket_id = 'product-images' and private.is_admin());
