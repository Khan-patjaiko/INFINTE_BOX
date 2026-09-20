-- Product category list. products.category stays free text, but the admin Category field
-- offers these (plus any category already in use) and the shop orders its filter chips by
-- this list. Edit with one SQL update; no redeploy needed:
--   update store_settings set value = '["A","B"]' where key = 'product_categories';
insert into public.store_settings (key, value) values (
  'product_categories',
  '["Enclosures","Mechanical","Prototyping","Resin","Accessories","Automotive","Home Decoration","Personal Gadgets","Pets Supplies"]'::jsonb
) on conflict (key) do update set value = excluded.value, updated_at = now();
