-- International shipping by DHL Express zone (2026-10-04, Handover #15, Phase 14).
--
-- Domestic (TH) keeps shipping_cents / free_shipping_threshold_cents. Abroad, the fee is one
-- flat amount per order for the destination's zone and is never waived; the buyer pays
-- import duties. A country missing from intl_country_zones cannot be shipped to.
-- store_settings already has public read + admin write RLS (0008), so no policy changes.
--
-- The fees below are PLACEHOLDERS (rough estimates, not DHL quotes). intl_fees_placeholder
-- stays true until the owner saves real numbers in Admin → Settings, which shows a banner
-- meanwhile.

insert into public.store_settings (key, value) values
('intl_zone_fees', '{"1": 90000, "2": 110000, "3": 120000, "4": 140000, "5": 180000, "6": 170000, "7": 160000}'::jsonb),
('intl_country_zones', '{
  "SG":"1","MY":"1","HK":"1","BN":"1",
  "CN":"2","TW":"2","MO":"2","PH":"2","VN":"2","ID":"2","KH":"2","LA":"2","MM":"2",
  "JP":"3","KR":"3",
  "AU":"4","NZ":"4","IN":"4",
  "US":"5","CA":"5",
  "GB":"6","IE":"6","DE":"6","FR":"6","NL":"6","BE":"6","LU":"6","IT":"6","ES":"6","PT":"6",
  "AT":"6","CH":"6","SE":"6","DK":"6","NO":"6","FI":"6","PL":"6",
  "AE":"7","SA":"7","QA":"7","KW":"7","BH":"7","OM":"7","IL":"7"
}'::jsonb),
('intl_fees_placeholder', 'true'::jsonb)
on conflict (key) do nothing;

-- Destination chosen in the cart, stored when the order is created (before Stripe collects
-- the full address), so pending orders show where they were headed too.
alter table public.orders add column if not exists ship_country text;
