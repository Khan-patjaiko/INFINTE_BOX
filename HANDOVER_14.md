# Infinite Box — Handover #14 (2026-10-04)

Session #14. Started from Handover #13. Focus: **UI before publish** (home page with real photos, full visual audit), then **visitor statistics in Admin → Overview** (owner's request mid-session).

## Live state at session start (checked)

| Check | Handover #13 said | Reality |
|---|---|---|
| Git | local commits not pushed | Same: `main` 14 ahead of `origin/main` |
| Supabase | awake | 0 orders, 2 users, 4 active products, 0 quotes/messages |

## Owner decisions

- Home hero is a **slideshow of the owner's photos**, starting on the phone mount. A gallery below shows all 11 photos. The owner will add more photos later, so the empty slot at the end of the gallery stays for now.
- Home text, all in the owner's words:
  - Tagline: **"Design · Development · Fabrication"**.
  - Headline: **"From idea / to real part."**
  - Paragraph: "We reverse engineer, design, develop and fabricate parts, specialising in 3D printing. Automotive parts and interior accessories, desk accessories, personal gadgets and more. We are a design & 3D printing studio, est. 2024, based in Thailand."
- The page `<title>` and meta description keep "for Small Businesses" (the owner chose not to change them).
- Promises made honest:
  - Quotes: "usually within 2 business days" everywhere. This matches the quote ack email.
  - "Rush production" is gone from Home and FAQ.
  - "10+ materials" is now "ABS, PETG & more".
- Footer line, in the owner's wording: "Design • Development • Fabrication" / "INFINITE BOX - 3D Printing Studio est. 2024, Based in Thailand".
- About page: the template story is replaced with the real process (scan → design → prototype → shop) and custom work. The owner will send small wording tweaks later.
- Visitor stats are **built in-house in Supabase** (not GA4 or Plausible). Metrics:
  - visitors and page views
  - top products
  - sales funnel
  - devices

  Traffic sources were not chosen.

## What this session did

| # | Commit | Change |
|---|---|---|
| 1 | `a546af7` `5bb33a6` | `site/assets/img/home/`: the owner's 11 posters converted with sharp-cli. 600px gallery JPEGs plus 1080px hero slides (6 of them). The folder is about 1 MB in total. The raw `Home Page Pictures/` folder stays **untracked**. |
| 2 | `70390d8` | **Hero slideshow** (6 photos, crossfade every 5 s, dots under the frame). It pauses on hover/focus or a hidden tab, and doesn't move with reduced motion. Phones now see the photo under the copy (before, the hero media was hidden below 1024px). Adds the **"Our work" gallery** section. |
| 3 | `e5a1323` `e70de70` `f27ecdd` | Home tagline, headline and paragraph (see decisions). Quote-time / rush / materials claims fixed on index, about, custom and faq. `og:image` is now the hero photo, with `twitter:card` set to `summary_large_image`. |
| 4 | `1a4e735` | Custom order page: the dashed box is now the file picker (a label). It accepts drag-and-drop, highlights, and shows the chosen file name and size. The native white "Choose File" button is hidden. |
| 5 | `335a163` | Mobile menu button now sets `aria-expanded` and its label (open/close). |
| 6 | `b97490a` | **Product page, Shopee order:** price → options → qty + Add to Cart, then description + specs below a divider (`.pd-details`). At 375px the button moved from ~1680px down the page to ~1060px. |
| 7 | `22efeb3` | About page rewrite and the footer tagline (`partials.js`). |
| 8 | `d0a9023` `8a5c2b0` | **Visitor stats.** Migrations **0017** + **0018** (both applied). Details below. |

### Visitor stats (how it works)

- **Table `site_events`.**
  - Columns: `visitor_id` uuid, `event` (page_view / add_to_cart / checkout_start), `path`, `product_slug`, `device`.
  - Anyone may insert, but only with a current timestamp. Only admins can read.
  - Checked: a signed-out visitor sees 0 rows.
- **Tracker: `track()` in `main.js`.**
  - Records a page view on every storefront page (with the product slug on `product.html`) and Add to Cart. `cart.html` records the checkout start before calling Stripe.
  - Uses a random ID in `localStorage['ib-vid']`. No IP, cookie or account link.
  - Skips browsers that report themselves as automated (`navigator.webdriver`).
  - **Admin browsers opt out:** `admin.js` sets `localStorage['ib-no-track']` once the admin check passes. Visit the admin once on any new device you browse the shop from.
- **`admin_site_stats(p_days)`** (SECURITY INVOKER, Bangkok days).
  - Returns: today / 7d / 30d visitors + views, the daily series, the top 5 products (views, visitors, in-cart), the funnel (visitors → product viewers → cart → checkout → paid orders), and devices (each visitor counted once, by their latest event).
- **pg_cron job `purge-old-site-events`** deletes rows older than 13 months, nightly at 03:30 UTC.
- **Overview UI:** 4 stat cards, a 30-day bar chart with tooltips, a Top products table, funnel + device bars. Checked at desktop and at 375px.
- **Privacy policy** now covers it in §2 (what), §3 (legitimate interest), §6 (13 months) and §8 (local storage).
- The 8 test rows from this session were deleted, so the stats start at zero.

## Audit result (desktop 1024px + phone 375px)

- **All 20 public pages, the 6 admin pages and Account:** no sideways scrolling at 375px and no console errors.
- **Already fine:**
  - Product thumbnails scroll inside their own strip.
  - The admin drawers sit off-screen while closed, which is intended.
- **Not bugs:**
  - The browser pane's tab list hides `"` in titles; `document.title` is correct.
  - The mobile menu's open animation doesn't run while the pane is hidden.

## Open items for the owner

- About page wording tweaks (the owner said they'd send them).
- More "Our work" photos (12 photos fill every grid layout).
- Optional: the home `<title>` / meta description still say "for Small Businesses".
- About heading now "Design. Development. Fabrication." (done at wrap-up).
- Carried over: a Thai lawyer review + the DBD registration name on the legal pages; the orphan storage image; the ImprovMX badge + a test mail.

## Next session (launch day, unchanged)

1. `main` was **pushed at the end of session #14** (all Handover #11–#14 work is on GitHub). Run the keep-awake workflow once (GitHub → Actions) and confirm it is green.
2. Zip the `site/` contents → the owner uploads them to Hostinger `public_html` (delete the coming-soon `index.html` + `assets/` first).
3. Supabase Auth Site URL → `https://infinite-box.co`; Google Auth Platform → Publish app.
4. Live re-test: login (email + Google), a `4242` checkout with a Thai address → paid + receipt + stock decrement; then restore stock and delete the order.
5. After the live test, open Admin → Overview and confirm the visits from the live domain show up. Your own browser is excluded once you've opened the admin there.
