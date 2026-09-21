-- Store currency switches from USD to Thai baht (THB) and the placeholder catalogue is
-- replaced by the first four real products (2026-09-21, Handover #8).
--
-- Money columns keep their *_cents names but now hold satang (1/100 THB) — Stripe treats
-- THB as a two-decimal currency, so the arithmetic in the Edge Functions is unchanged.
-- Every price display in the site/admin/emails prints "฿" (see formatPrice / money()).

-- Shipping: flat ฿50, waived once the subtotal reaches ฿800.
update public.store_settings set value = '5000'::jsonb, updated_at = now() where key = 'shipping_cents';
insert into public.store_settings (key, value) values ('free_shipping_threshold_cents', '80000'::jsonb)
  on conflict (key) do update set value = excluded.value, updated_at = now();

-- Placeholder products from the 0006 seed: delete the seven nobody ordered; Custom Enclosure
-- is referenced by order 4ea2920d (order_items.product_id) so it is deactivated instead.
delete from public.products
  where slug in ('mounting-bracket','prototype-shell','resin-detail-part','cable-organiser',
                 'gear-assembly','desk-organizer','phone-stand')
    and not exists (select 1 from public.order_items oi where oi.product_id = products.id);
update public.products set active = false, stock = 0 where slug = 'custom-enclosure';

-- Real products. Photos are bundled with the site (site/assets/img/products/, 1200px JPEG,
-- root-absolute so they resolve from admin/ too); the admin Photo upload still works and
-- simply overwrites image_url with a storage URL.
insert into public.products
  (slug, name, material, price_cents, category, description, specs, icon_key, sort, stock, active, image_url)
values
('w201-190e-cup-holder', 'Mercedes-Benz W201 190E Cup Holder', 'ABS', 39900, 'Automotive',
 E'Upgrade your classic ride with our custom W201 190E cup holder.\nDesigned specifically for the Mercedes-Benz W201 interior, keeping your cabin clean and your drinks secure while you enjoy the drive.',
 '{"Compatible with":"Mercedes-Benz W201 190E","Material":"ABS"}', 'tray', 1, 2, true,
 '/assets/img/products/w201-190e-cup-holder.jpg'),

('mazda-phone-mount-7-inch', 'Mazda Phone Mount for 7" Screen', 'ABS', 27900, 'Automotive',
 E'Upgrade your Mazda driving experience.\n- Perfect custom fit: designed specifically for the Mazda 7-inch screen shape — no generic, one-size-fits-all wobbles.\n- Safer navigation: keep your eyes on the road while checking your GPS maps in the ideal viewing position.\n- Solid stability: holds your phone securely, even on bumpy roads or sharp turns.',
 '{"Compatible with":"Mazda 2 (2014–2026), Mazda 3 (2014–2016), CX-30 (2014–2026), MX-5 (2015–2023) — 7-inch screen models","Material":"ABS"}', 'stand', 2, 5, true,
 '/assets/img/products/mazda-phone-mount-7-inch.jpg'),

('w124-cup-holder', 'Mercedes-Benz W124 Cup Holder', 'ABS', 59900, 'Automotive',
 E'Improve your W124 driving experience.\nKeep your favourite drink secure and enjoy it on your road trip.',
 '{"Compatible with":"Mercedes-Benz W124, W123","Material":"ABS"}', 'tray', 3, 3, true,
 '/assets/img/products/w124-cup-holder.jpg'),

('bmw-e90-center-console-insert', 'BMW E90 Center Console Insert', 'ABS', 25900, 'Automotive',
 E'Our BMW E90 center console insert turns your empty console into a functional slot for:\n- Coffee cup & water bottle\n- Smartphone\n- Keys, coins and small gear\nUpgrade your center console in seconds.',
 '{"Compatible with":"BMW E9x without the centre iDrive knob","Material":"ABS"}', 'tray', 4, 3, true,
 '/assets/img/products/bmw-e90-center-console-insert.jpg')
on conflict (slug) do update set
  name = excluded.name, material = excluded.material, price_cents = excluded.price_cents,
  category = excluded.category, description = excluded.description, specs = excluded.specs,
  icon_key = excluded.icon_key, sort = excluded.sort, stock = excluded.stock,
  active = excluded.active, image_url = excluded.image_url;
