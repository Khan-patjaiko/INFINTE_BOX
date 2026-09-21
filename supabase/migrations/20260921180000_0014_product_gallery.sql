-- Product photo gallery (2026-09-21, Handover #8).
-- products.image_url stays the thumbnail (shop cards, cart, admin list); products.images is
-- the ordered gallery shown on product.html (image_url is prepended if it is not already in
-- the list). Paths are relative to the site root ("assets/img/products/…") so they resolve
-- whether the site is served from localhost:8790, a Live Server at the repo root, or
-- Hostinger; admin/ pages prefix "../" for relative paths.
alter table public.products add column if not exists images jsonb not null default '[]'::jsonb;

update public.products set
  image_url = 'assets/img/products/w201-190e-cup-holder-1.jpg',
  images = '["assets/img/products/w201-190e-cup-holder-1.jpg","assets/img/products/w201-190e-cup-holder-2.jpg"]'
  where slug = 'w201-190e-cup-holder';

update public.products set
  image_url = 'assets/img/products/mazda-phone-mount-7-inch-1.jpg',
  images = '["assets/img/products/mazda-phone-mount-7-inch-1.jpg","assets/img/products/mazda-phone-mount-7-inch-2.jpg","assets/img/products/mazda-phone-mount-7-inch-3.jpg","assets/img/products/mazda-phone-mount-7-inch-4.jpg","assets/img/products/mazda-phone-mount-7-inch-5.jpg","assets/img/products/mazda-phone-mount-7-inch-6.jpg"]'
  where slug = 'mazda-phone-mount-7-inch';

update public.products set
  image_url = 'assets/img/products/w124-cup-holder-1.jpg',
  images = '["assets/img/products/w124-cup-holder-1.jpg","assets/img/products/w124-cup-holder-2.jpg","assets/img/products/w124-cup-holder-3.jpg","assets/img/products/w124-cup-holder-4.jpg"]'
  where slug = 'w124-cup-holder';

update public.products set
  image_url = 'assets/img/products/bmw-e90-center-console-insert-1.jpg',
  images = '["assets/img/products/bmw-e90-center-console-insert-1.jpg","assets/img/products/bmw-e90-center-console-insert-2.jpg","assets/img/products/bmw-e90-center-console-insert-3.jpg","assets/img/products/bmw-e90-center-console-insert-4.jpg","assets/img/products/bmw-e90-center-console-insert-5.jpg","assets/img/products/bmw-e90-center-console-insert-6.jpg"]'
  where slug = 'bmw-e90-center-console-insert';
