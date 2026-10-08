# Infinite Box — Handover #18 (2026-10-09)

Session #18. Started from Handover #17. Focus: **getting the site found on Google and other search engines** (Phase 15), plus a header alignment fix.

## Live state at session start (checked)

| Check | Reality |
|---|---|
| Git | `main` = `origin/main` (`837d123`) |
| Supabase | 0 orders, 2 users, 4 active products, 43 site_events from 24 visitors |
| Crawlers | 200 for Googlebot/Bingbot UA; robots.txt + sitemap OK; www/http → apex 301 |
| Indexed? | `site:infinite-box.co` returned nothing (3 days after launch). Later in the session the owner found the site on Google only by searching `infinite-box.co`: indexed, not ranking yet |

## What this session did

| # | Commit | Change |
|---|---|---|
| 1 | `2b79c76` | Shop title/description now name the real catalogue (cup holders, console insert, phone mount; W124/W201/E90/Mazda); were "enclosures, brackets, gears". **Organization + WebSite JSON-LD** on home (logo, hello@, Pathum Thani/TH, Facebook + Instagram `sameAs`). **Product JSON-LD** injected by `product.html` (THB `Offer`/`AggregateOffer`, stock, absolute image URLs, brand). Sitemap lastmod bumped |
| 2 | `9b49715` | Home title (owner's wording): **"Custom Design, Development, Fabrication & 3D Printing Studio \| Infinite Box"**; description leads with reverse engineering, part/gadget design, 3D printing, fabrication |
| 3 | `945d583` | **IndexNow**: `site/indexnow-key.txt` (renamed from `<key>.txt` so it's recognisable) + `scripts/indexnow.sh` (checks the key file is live, then submits sitemap URLs or given URLs with `keyLocation`) |
| 4 | — | Owner uploaded the 5 files; live copies verified identical; `scripts/indexnow.sh` → **HTTP 202, 13 URLs**; `deployed` tag moved |
| 5 | — | Owner: **Bing Webmaster Tools** imported from Search Console (Administrator); sitemap submitted by hand (Domain properties import with 0 sitemaps), status Processing |
| 6 | — | Owner: Search Console **Request indexing** for home, shop and the 4 product pages |
| 7 | `79ecdaa` | **Header fix**: on desktop, `.mobile-actions` (empty flex item) still took the last `space-between` slot, so Log in / cart / Shop Now sat ~one gap left of the content edge. Now the whole group is `display:none` ≥768px. Verified 1600px (Shop Now right edge = hero right edge) and 375px (cart + menu still shown) |
| 8 | (this) | Handover #18; PROJECT_PLAN Phase 15 section |

## ⚠️ To deploy

`assets/css/styles.css` (header fix) is **not uploaded yet**. Owner: upload `site/assets/css/styles.css` to `public_html/assets/css/`, then Claude verifies and moves the `deployed` tag. (`bash scripts/deploy.sh --dry-run` lists it.)

## Keep forever

`public_html/indexnow-key.txt`: IndexNow ownership proof for Bing/Yandex. If deleted, `scripts/indexnow.sh` stops with a re-upload message. `deploy.sh` never deletes server files.

## Open items

1. **Rich Results Test** not run: Google's tool would not start in Claude's pane (sign-in / bot check). Owner: Search Console → URL Inspection on a product URL → Test live URL, or the Rich Results Test signed in. Expect Product snippets + Merchant listings valid; warnings about shippingDetails/returns/reviews are acceptable.
2. **Social share previews** (Facebook/LINE) for products still use the static generic tags: those scrapers don't run JavaScript. Fixed by prerendering (Phase 15 item).
3. Carried over from #17: email spam reputation re-check, orphan image in Storage, `OWNER_EMAIL` secret, Stripe live mode, Hostinger auto-deploy credentials file.

## Next session (#19) options (Phase 15, recommended order)

1. **Automatic sitemap** (owner asked to add it to the plan): `site/sitemap.php` reads active products from Supabase REST with the anon key, `.htaccess` rewrites `/sitemap.xml` → `sitemap.php`; then remove the static file. URL in Search Console/Bing unchanged.
2. **Services page(s)**: reverse engineering, 3D printing service, custom part design (Thailand); owner approves wording.
3. **Thai-language** key pages (owner chose "both audiences, English only" for now).
4. Prerendered product pages; "Our work" project pages.
5. Owner-side: website link on Facebook/Instagram/LINE/Shopee + car-club groups; Google Business Profile (declined today, recommended later).
