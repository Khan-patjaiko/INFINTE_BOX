-- Product options / variants (2026-09-21, Handover #8).
--
-- products.options is an ordered list of option groups the customer must choose from on
-- product.html, e.g. [{"name":"Color","values":["Black","White"]},
--                     {"name":"Slot type","values":["3 slot","4 slot"]}].
-- Options do not change the price and share the product's stock (v1). The chosen values
-- travel with the cart line and are stored per order line in order_items.options
-- ({"Color":"Black","Slot type":"4 slot"}) so receipts, order pages and the admin
-- orders drawer can show what to print.
alter table public.products add column if not exists options jsonb not null default '[]'::jsonb;
alter table public.order_items add column if not exists options jsonb not null default '{}'::jsonb;
