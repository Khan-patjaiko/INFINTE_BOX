-- Custom-order quote requests and generic contact messages.
create table public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  material text,
  quantity integer,
  details text,
  file_url text,
  status text not null default 'new'
    check (status in ('new','quoted','accepted','closed')),
  created_at timestamptz not null default now()
);
alter table public.quote_requests enable row level security;

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  created_at timestamptz not null default now()
);
alter table public.contact_messages enable row level security;

-- Anyone may submit a quote or contact message. Quote authors (if logged in)
-- and admins may read quotes; contact messages are admin-read only.
create policy "quotes_insert_any" on public.quote_requests
  for insert with check (true);
create policy "quotes_select_own" on public.quote_requests
  for select using (auth.uid() = user_id or public.is_admin());

create policy "contact_insert_any" on public.contact_messages
  for insert with check (true);
create policy "contact_select_admin" on public.contact_messages
  for select using (public.is_admin());
