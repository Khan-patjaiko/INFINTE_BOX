-- Admin dashboard support (site/admin/). RLS already lets admins *read* everything;
-- this adds the write access the dashboard needs plus a few bookkeeping columns.

-- Quotes: admins record the price they quoted and internal notes.
alter table public.quote_requests
  add column quoted_price_cents integer check (quoted_price_cents >= 0),
  add column admin_note text;

-- Contact inbox: read/unread flag.
alter table public.contact_messages
  add column is_read boolean not null default false;

-- Admins may change order status (paid -> fulfilled, cancel, etc.).
create policy "orders_admin_update" on public.orders
  for update using (private.is_admin()) with check (private.is_admin());

-- Admins may update quotes (status, quoted price, note).
create policy "quotes_admin_update" on public.quote_requests
  for update using (private.is_admin()) with check (private.is_admin());

-- Admins may mark contact messages read/unread.
create policy "contact_admin_update" on public.contact_messages
  for update using (private.is_admin()) with check (private.is_admin());

-- Admins may read customers' design files from the private bucket (signed URLs).
create policy "custom_uploads_admin_read" on storage.objects
  for select using (bucket_id = 'custom-uploads' and private.is_admin());
