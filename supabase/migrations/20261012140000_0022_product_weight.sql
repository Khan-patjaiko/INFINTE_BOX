-- Gross (packed) weight per product, in grams, for packing and shipping.
-- Admin → Products only; not shown on the storefront. Null = not entered yet.
alter table public.products
  add column weight_grams integer check (weight_grams between 0 and 100000);
