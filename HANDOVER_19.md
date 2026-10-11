# Infinite Box — Handover #19 (2026-10-12)

Session #19. Started from Handover #18. Focus:
- two new home photos;
- **English / Thai language switch** (Phase 16).

## Live state at session start (checked)

| Check | Reality |
|---|---|
| Git | `main` = `origin/main` (`94406cc`) |
| Supabase | 0 orders, 2 users, 4 active products, 0 quotes/messages, 70 site_events (2 visitors in 3 days) |

## What this session did

| # | Commit | Change |
|---|---|---|
| 1 | `143e6cb` | Home: photos 12 (Hongthai inhaler case) and 14 (Nespresso capsule dispenser) from `Home Page Pictures/…site2` added to the hero slideshow (8 slides) and the Our work gallery (13 tiles). 1080/600px JPEGs via sharp-cli |
| 2 | `ff2c6c5` | **Cache-bust**: every local CSS/JS link is `?v=19`. Bump the number on each release that changes CSS/JS (LiteSpeed caches them for 7 days; HTML is not cached) |
| 3 | `252595f` | `assets/js/i18n.js` (`IBI18n`, `ibT()`), **EN \| TH switch** in the header (desktop and mobile), translated header/footer/password checklist, IBM Plex Sans Thai fallback font |
| 4 | `6dd2136` | **Thai site at `/th/`** (17 pages), built from the English pages by `scripts/build-th.mjs` + `i18n/th.json`. Each Thai page gets `lang="th"`, a `/th/` canonical, and hreflang en/th/x-default; product pages set theirs in JS. Script strings go through `ibT()`; product photos resolve from the site root; no letter-spacing on Thai text |
| 5 | `13f7c99` | **Migration 0020** (applied live): `products.name_th/description_th/specs_th`, `orders.lang`, `quote_requests.lang`. Admin → Products has Thai fields; the Thai site falls back to English when they are empty |
| 6 | `99beb1d` | Functions (code only, **not deployed**): `create-checkout-session` takes `lang`, which sets the Stripe locale, Thai product names and errors, `/th/` return pages, and `orders.lang`. `stripe-webhook` sends a Thai receipt; `submit-quote` sends a Thai acknowledgement. Owner alerts stay English and gain a Language row |
| 7 | `76a17f0` | Sitemap: 22 en/th URLs with `xhtml:link` alternates, plus privacy/terms; robots.txt blocks `/th/` transactional pages |
| 8 | — | Owner approved: migration 0020 applied; Thai name/description/specs saved for the 4 products |
| 9 | (this) | Handover #19, PROJECT_PLAN Phase 16 |

### Owner tweaks after the main build

| Commit | Change |
|---|---|
| `fd760eb` `79c1964` `7545379` | Kept in English on the Thai site: footer brand lines, the home hero eyebrow and the About "Design. Development. Fabrication." heading. A `th.json` entry whose value equals the English text keeps it English |
| `56ec5dd` | Thai headings: line-height 1.4 (tone marks were touching the next line) |
| `72fdded` `45aad94` | Numbered-card sections (Home, About, Custom): smaller heading gap; cards line up with the heading, no outer padding |
| `6d9476c` | Home strip: "ABS, PETG & more" removed |
| `f6699bd` | Home card 02 is now **Full service, start to finish** (reverse engineering, design, development, fabrication, testing), EN + TH |

## How the Thai site works (read before editing pages)

- **Edit only the English pages** in `site/`. Then run:
  ```
  node scripts/build-th.mjs
  ```
  It rewrites `site/th/` and `site/assets/js/i18n-th.js`. It refuses to build, and lists the strings, if any text has no translation. `--missing` lists them without writing anything.
- `i18n/th.json` is keyed by the English text:
  - `"html"`: text found in the pages;
  - `"js"`: strings passed to `ibT("…")` in scripts (incl. categories, option names/values, order statuses, common Supabase errors).

  New English copy → add its Thai line → rebuild → commit `site/th/` too.
- New text in a script: wrap it, e.g. `ibT("Only {n} left in stock.", { n: 3 })`.
- Product text comes from the database (Admin → Products → Thai fields). Category and option names translate through `th.json` "js".
- Privacy/Terms and admin are English only. On Thai pages the footer links to the English legal pages.
- No automatic language redirect: visitors choose with EN | TH. Google finds the Thai pages through the sitemap and hreflang.

## Deploy

**Done 2026-10-12:**
- The owner uploaded `site-upload.zip` (all of `site/`, extracted over `public_html`).
- Claude verified that the live files are identical to local and that `/th/` pages return 200 for Googlebot.
- The live Thai product page was checked in the browser.
- IndexNow returned **HTTP 200 for 24 URLs**.
- The `deployed` tag is at `06750be`.

Still to do:
- ~~Owner: Search Console sitemap resubmit~~ **done, Success**. (A first attempt showed "invalid sitemap"; the file was valid. The sitemap box takes `https://infinite-box.co/sitemap.xml`, and page URLs go in URL Inspection.)
- **Edge Functions:** step 3 below.

Original steps:

1. **Upload `site/`**, either as a zip extracted over `public_html` or the changed files in File Manager. That means every `.html`, the new `th/` folder, `assets/js/*` (incl. new `i18n.js`, `i18n-th.js`), `assets/css/styles.css`, `assets/img/home/` (4 new JPEGs), `admin/products.html`, `sitemap.xml` and `robots.txt`.
2. Then `scripts/indexnow.sh` (submits the 24 sitemap URLs) and Search Console → Sitemaps → resubmit, plus Request indexing for `/th/`.
3. **Edge Functions** were not approved this session. Until they are deployed, Thai shoppers get the English Stripe page and English emails. Everything else works, and the old functions ignore `lang`. When ready: deploy `create-checkout-session`, `stripe-webhook`, `submit-quote` from `supabase/functions/` (migration 0020 is already live). Then do a signed-in `4242` checkout from `/th/cart.html`:
   - Stripe page in Thai;
   - `orders.lang = 'th'`;
   - Thai receipt arrives;
   - delete the test order.

## Open items

1. **Owner review of the Thai copy**: `i18n/th.json` and the 4 product texts were drafted by Claude. Fix any wording directly in `th.json` (then rebuild) or in Admin → Products.
2. Deploy the 3 Edge Functions (above).
3. Gallery is 13 tiles, so one sits alone in the last row at 4 columns; a 14th–16th photo fills it.
4. Carried over:
   - Rich Results Test;
   - automatic `sitemap.php` (must now also emit the `/th/` alternates);
   - email spam re-check;
   - orphan Storage image;
   - FTP credentials for `deploy.sh`;
   - Stripe live mode.

## Next session (#20) options

1. Deploy functions + Thai test checkout (if approved).
2. Thai Privacy/Terms (lawyer review advised).
3. Automatic sitemap (Phase 15) incl. Thai alternates.
4. Services pages in both languages (รับปริ้น 3D, รับออกแบบชิ้นงาน, reverse engineering).
