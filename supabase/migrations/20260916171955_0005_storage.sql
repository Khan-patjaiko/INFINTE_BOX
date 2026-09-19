-- Storage buckets.
-- product-images: public read (for real product photos later), admin-managed.
-- custom-uploads: private; only accessed server-side via Edge Functions
--   (service role), so no client-facing object policies are added.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('custom-uploads', 'custom-uploads', false)
on conflict (id) do nothing;

-- Public read for product images.
create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'product-images');

-- Admins manage product images.
create policy "product_images_admin_write" on storage.objects
  for all using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());
