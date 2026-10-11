-- English / Thai site (2026-10-12, Handover #19, Phase 16).
--
-- Products get optional Thai copies of the customer-facing text; the Thai site (/th/) shows
-- them and falls back to the English columns when they are empty. Existing RLS covers the new
-- columns (public read of active products, admin write).
alter table public.products add column if not exists name_th text;
alter table public.products add column if not exists description_th text;
alter table public.products add column if not exists specs_th jsonb;

-- The language the customer used, so the receipt / quote acknowledgement goes out in it.
alter table public.orders add column if not exists lang text not null default 'en';
alter table public.quote_requests add column if not exists lang text not null default 'en';

do $$ begin
  alter table public.orders add constraint orders_lang_check check (lang in ('en', 'th'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.quote_requests add constraint quote_requests_lang_check check (lang in ('en', 'th'));
exception when duplicate_object then null; end $$;
