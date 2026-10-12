# Infinite Box — Handover #20 (2026-10-12)

Session #20. Started from Handover #19. Focus: **Admin → Visitors tab with visitor country** (Phase 17) and the **automatic sitemap** (Phase 15).

## Live state at session start (checked)

| Check | Reality |
|---|---|
| Git | `main` = `origin/main` (`a88235f`) |
| Supabase | 0 orders, 2 users, 4 active products, 0 quotes/messages, 138 site_events (48 visitors since 2026-10-04) |

## What this session did

| # | Commit | Change |
|---|---|---|
| 1 | `5aee965` | **Migration 0021** (applied live): `site_events.country`, `lang`, `referrer_host`. A BEFORE INSERT trigger `private.site_events_set_country()` takes the country from Cloudflare's `cf-ipcountry` request header (verified: a preview visit was saved as `TH`). No IP stored. `admin_site_stats(p_days)` accepts 1–400 days and also returns `countries`, `pages`, `langs`, `referrers`. Tracker in `main.js` sends `lang`, `referrer_host` (outside sites only) and keeps `th/` in the path. Privacy policy updated (date 12 Oct 2026) |
| 2 | `9bdf03b` | **Admin → Visitors** (`site/admin/visitors.html`, nav after Overview), with 7 / 30 / 90-day buttons. It shows: stat cards, visitors per day, countries, language, devices, top products, top pages, where visitors came from, and the funnel. Overview keeps 4 summary cards (today, 7d, page views 7d, top country) linking to it. Cache `?v=20`, `/th/` rebuilt |
| 3 | `a18f3d1` | **Automatic sitemap**: `site/sitemap.php` serves the pages in `sitemap.xml`, with its product entries replaced by the live active products (en + th alternates). If Supabase can't be reached it serves `sitemap.xml` as is. `.htaccess` rewrites `/sitemap.xml` to it. Checked in Node (no PHP locally): 16 pages + 4 products × 2 = 24 URLs, same as today |
| 4 | `de4c061` `4004a64` | Owner touch-ups: flag emoji per country (Twemoji flag font from jsDelivr, so Windows shows flags), full country names, Countries panel sized to its content on desktop |
| 5 | (this) | Handover #20, PROJECT_PLAN Phase 17 |
| 6 | `11100b5` | Admin → Products: Description boxes (EN + TH) 12 rows / 280px tall |
| 7 | (next) | **Migration 0022** (applied live): `products.weight_grams` (0–100,000, null = not entered). Admin → Products has **Gross weight (g, packed)** next to Material; admin only, not shown to customers |

Tests: 3 fake US/JP visits were inserted to check flags and layout, then deleted (twice), along with the one preview visit. Supabase security advisor: only the known Pro-only leaked-password warning.

## How visitor stats work now

- Country = Cloudflare's guess from the visitor's connection, set server-side (the browser can't fake it). VPN users show the VPN's country.
- Visits before 2026-10-12 have no country/language/referrer: they show as **Not recorded** and drop out after the 90-day window (or the 13-month purge).
- "Where visitors came from" counts only visitors tracked since 0021; `direct` = no outside referrer.
- Admin browsers still opt out (`ib-no-track`).

## Deploy

**Done 2026-10-12:**
- The owner uploaded the files below.
- Claude verified the live files are identical to local.
- `https://infinite-box.co/sitemap.xml` is served by `sitemap.php`: valid XML, 24 URLs (8 product URLs from the database).
- A live visit to `/th/shop.html` was saved as `country=TH`, `lang=th`, `path=th/shop.html`; the test visit was deleted.
- Search Console needs no resubmit (same URL count).

What was uploaded:

Upload these to `public_html` (zip extract with Overwrite, or File Manager):
- `admin/` (new `visitors.html`; `index.html` changed)
- `assets/js/main.js`, `assets/js/admin.js`, `assets/js/i18n-th.js`, `assets/css/styles.css`
- every `.html` in the root and `th/` (cache bump to `?v=20`)
- `privacy.html`
- `sitemap.php` (new)
- `.htaccess`

Don't delete anything; keep `indexnow-key.txt` and `sitemap.xml`.

After the upload, Claude checks that `https://infinite-box.co/sitemap.xml` returns 24 URLs (served by PHP) and that a live visit records a country. Until the upload, the live site keeps the old tracker: the database accepts it, but those visits get country only (no lang/referrer).

## Open items

1. Deploy the 3 Edge Functions (Thai checkout + emails) + Thai `4242` test — still not approved.
2. Owner proofreads `i18n/th.json` and the product Thai text.
3. Carried over:
   - Rich Results Test;
   - email spam re-check;
   - orphan Storage image;
   - FTP credentials for `deploy.sh`;
   - Stripe live mode;
   - the 13-tile gallery's last row.

## Next session (#21) options

1. Edge Functions deploy / Thai test checkout.
2. Services pages in both languages (รับปริ้น 3D, รับออกแบบชิ้นงาน, reverse engineering).
3. Thai Privacy/Terms (lawyer review advised).
4. Prerender product pages for crawlers.
