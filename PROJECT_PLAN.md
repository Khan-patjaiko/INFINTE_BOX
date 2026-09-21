# Infinite Box — Project Plan (living roadmap)

Last updated: 2026-09-21 · Source of truth for phases and tasks. Session history lives in
[HANDOVER.md](HANDOVER.md), [HANDOVER_2.md](HANDOVER_2.md), [HANDOVER_3.md](HANDOVER_3.md),
[HANDOVER_4.md](HANDOVER_4.md), [HANDOVER_5.md](HANDOVER_5.md), [HANDOVER_6.md](HANDOVER_6.md),
[HANDOVER_7.md](HANDOVER_7.md). How the system is built (four-layer architecture review) lives in
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
Tick boxes here as work lands; add a new phase rather than rewriting history.

## Where we are now (as of 2026-09-21)

**Overall: ~96% to a launchable v1.** The store works end-to-end locally including test-mode
payments, a per-order status page, stock/sold-out enforcement, an admin dashboard, legal pages,
SEO/share metadata, **transactional email (Resend, live)**, **password reset** and **profile
edit**; checkout now **requires a signed-in customer**. It is not yet deployed (Hostinger hosting
is purchased but nothing uploaded — deferred by the user).

| Area | Status |
|---|---|
| Static site design (14 pages, dark theme, design tokens) | ✅ Done |
| Supabase project `ptwfidmlnuggxvqhimhe` — schema, RLS, storage, seed (11 migrations) | ✅ Done, advisor clean |
| Live product catalogue from DB (index/shop/product/cart) | ✅ Done |
| Cart (localStorage) | ✅ Done |
| Custom quote form → `submit-quote` Edge Function + file upload | ✅ Live, verified |
| Contact form → `contact_messages` | ✅ Live, verified |
| Auth: email/password + `account.html` order history + **profile edit (name/phone)** | ✅ Done (profile edit 2026-09-21) |
| Auth: Google OAuth | ✅ **Verified end-to-end 2026-09-21** — the owner signed in with Google and placed a paid order tied to that user. Google Cloud OAuth app is in **Testing** status (branding + logo + domains filled in); must be **published** before launch and brand-verified after deploy (Phase 9) |
| Auth: password reset (`forgot-password.html` → `reset-password.html`) | ✅ Done 2026-09-21 (Supabase default SMTP; consider Resend SMTP later) |
| **Checkout requires login** (no guest orders; `create-checkout-session` returns 401) | ✅ Done 2026-09-21 — product decision by the owner |
| UI polish pass #1 (spacing scale, focus ring, mobile padding, nav animation) | ✅ Done |
| Stripe checkout (`create-checkout-session`, `stripe-webhook`) | ✅ **Live in test mode** — full checkout verified 2026-09-19 (paid order, address captured, cancel path preserves cart) |
| Order status page (`order.html` + `get-order` Edge Function) | ✅ Done 2026-09-19 — linked from `success.html` ("My order") and `account.html` order cards |
| Hosting | ⚠️ **Hostinger purchased**, not yet deployed |
| Git | ⚠️ Local `main` is **25 commits ahead of `origin/main`** (not pushed) as of 2026-09-21 |
| Backend source in git (`supabase/` migrations + Edge Functions) | ✅ Done 2026-09-19 — exported from the hosted project; edit here first, then deploy (see `supabase/README.md`) |
| Real product photography | ❌ None (SVG placeholders; frontend ready for `image_url`) |
| Admin UI (`site/admin/` — overview, orders, quotes, messages, products) | ✅ Done 2026-09-20, verified signed in as admin (`testuser@infinitebox.dev` is admin) |
| Stock management + sold-out enforcement (storefront, checkout 409, webhook decrement) | ✅ Done 2026-09-20 — **stock counts still need to be entered** (all 0 except Custom Enclosure = 1) |
| Footer social links (Facebook / Instagram / Line) | ⚠️ Added 2026-09-21 with **placeholder URLs** in `partials.js` `SOCIAL_LINKS` |
| Legal pages (`privacy.html`, `terms.html`) + footer/signup links | ⚠️ Done 2026-09-21 — **orange bracketed placeholders** (legal name, address, jurisdiction, retention periods) need filling |
| SEO / share prep (robots.txt, sitemap.xml, descriptions, noindex, canonical, Open Graph) | ✅ Done 2026-09-21 — domain **`infinite-box.co` confirmed, registered at GoDaddy** (2026-09-21) |
| Product categories (`store_settings.product_categories`, migration 0012) | ✅ Done 2026-09-21 — Enclosures · Mechanical · Prototyping · Resin · Accessories · Automotive · Home Decoration · Personal Gadgets · Pets Supplies |
| Error/empty states + Retry on every DB read; 375px audit; Lighthouse (home 98/95/100/100) | ✅ Done 2026-09-21 |
| Layout: shop chips in hero, home hero content-sized (no more viewport-height blank space) | ✅ Done 2026-09-21 |
| Email notifications (order receipt + owner alert, quote ack + alert, contact alert) | ✅ **Live 2026-09-21** via Resend — domain `infinite-box.co` verified, from `hello@infinite-box.co`, alerts to `OWNER_EMAIL`; all three flows verified with real deliveries |
| Coming-soon page email capture | ❌ localStorage only, not a real list |

**Immediate blockers on the user side:** (1) enter stock counts and assign the new categories in Admin → Products, (2) real social URLs in `partials.js`, (3) fill the placeholders in `privacy.html` / `terms.html`, (4) product photos (upload via Admin → Products), (5) upload `site/` to Hostinger
`public_html` and point the domain at it, (6) publish the Google OAuth app (Testing → In production) on launch day.

---

## Web structure (current)

```
E-Commerce Web/
├── site/                          ← main storefront (static, deploy to Hostinger public_html)
│   ├── index.html                 Home (hero, featured products)          [partials.js header/footer]
│   ├── shop.html                  Catalogue grid; category chips in the hero from store_settings.product_categories
│   ├── product.html?id=<slug>     Product detail + spec table
│   ├── cart.html                  Cart → Stripe Checkout (signed-in only; "Log in to check out" otherwise) / link to custom quote
│   ├── custom.html                Custom-order quote form (+ file upload) → submit-quote
│   ├── contact.html               Contact form → submit-contact Edge Function
│   ├── about.html · faq.html · materials.html   Static content
│   ├── privacy.html · terms.html  Legal pages (placeholders to fill; `.legal` prose class)
│   ├── login.html · signup.html   Email/password + Google OAuth; both honour ?next= (e.g. cart.html)
│   ├── forgot-password.html · reset-password.html   Password reset (noindex; reset also serves "Change password" when signed in)
│   ├── account.html               Auth-guarded: profile edit (name/phone) + order history (cards link to order.html)
│   ├── order.html?id=<uuid> or ?session_id=<cs_...>  Single-order status (items, total, shipping address)
│   ├── success.html · cancel.html Stripe return pages (success.html has a "My order" button → order.html)
│   ├── robots.txt · sitemap.xml   Crawler config (admin + transactional pages disallowed)
│   ├── admin/                     Admin dashboard (guarded by profiles.is_admin; own header via admin.js, noindex)
│   │   ├── index.html             Overview: counts (to-fulfil, new quotes, unread, 30d revenue) + recent orders/quotes
│   │   ├── orders.html            Filter/search, drawer with items + address, change status
│   │   ├── quotes.html            Filter/search, drawer with details, signed-URL file download, status/quoted price/note
│   │   ├── messages.html          Contact inbox, read/unread, mailto reply
│   │   └── products.html          CRUD on products incl. photo upload to product-images, specs editor, stock, active toggle
│   └── assets/
│       ├── css/styles.css         Single stylesheet, HSL tokens, --space-* scale
│       ├── js/config.js           Supabase URL + anon key (public)
│       ├── js/supabase-client.js  window.IBDB
│       ├── js/auth.js             window.IBAuth (signUp/signIn/signInWithGoogle/resetPassword/updatePassword/signOut/requireUser/refreshHeader)
│       ├── js/admin.js            window.IBAdmin (requireAdmin/money/date/statusBadge/toast/signedUrl) + admin header
│       ├── js/products.js         loadProducts()/getProduct() + render helpers + loadErrorHTML()/ibOnRetry()
│       ├── js/icons.js            SVG placeholder icons
│       ├── js/main.js             window.IB cart API, mobile nav
│       ├── js/partials.js         HEADER_HTML / FOOTER_HTML injection (all pages) + SOCIAL_LINKS (footer Follow column)
│       └── img/                   icon-/logo- dark/light PNGs
├── supabase/                      ← backend source of truth (mirrors hosted project)
│   ├── config.toml                project id, verify_jwt=false per function
│   ├── migrations/*.sql           12 migrations (same versions as production)
│   ├── functions/_shared/email.ts Resend helper (sendEmail/sendOwnerAlert + templates), bundled into each function on deploy
│   └── functions/<name>/index.ts  submit-quote · submit-contact · create-checkout-session · stripe-webhook · get-order
├── docs/ARCHITECTURE.md           Four-layer architecture reference
├── coming-soon/index.html         Standalone pre-launch page (separate deploy, no backend)
├── Example/                       Original Airo export (reference only)
├── .claude/launch.json            preview servers: infinite-box-site :8790, infinite-box-coming-soon :8791
└── HANDOVER*.md                   Session history

Supabase (project ptwfidmlnuggxvqhimhe, ap-southeast-1)
├── Tables: profiles, products (+stock), orders (+stock_applied_at), order_items, quote_requests (+quoted_price_cents, admin_note), contact_messages (+is_read), store_settings (shipping_cents, product_categories) (RLS on all; admins can update orders/quotes/messages)
├── Helper: private.is_admin()
├── Storage: product-images (public read, admin write), custom-uploads (private; admin read for signed URLs)
├── Auth: email/password (confirmation on), Google OAuth
├── Edge Functions: submit-quote ✅ (v3, + emails) · submit-contact ✅ (v1) · create-checkout-session ✅ (v9: **401 unless signed in**, shipping fee from `store_settings`, 409 on over-stock) · stripe-webhook ✅ (v6: pending→paid guard, `decrement_order_stock`, receipt + owner alert) · get-order ✅ (v1)
└── Email: Resend, domain infinite-box.co verified; secrets RESEND_API_KEY / OWNER_EMAIL / EMAIL_FROM

Nav: Shop · Custom Orders · About · Account/Log in · Cart · Shop Now
Footer: Shop (All Products / Custom Orders / Materials) · Company (About / Contact / FAQ) · Follow · Privacy / Terms
```


---

## Project phases

Phases 0–6 of the original plan are complete. Numbering continues from there.

### Phase 7 — Housekeeping & verification (now, ~1 session)
Goal: clean state, everything known-good.
- [x] Commit Handover #3 working tree (`styles.css`, `auth.js`, `login.html`, `signup.html`) + `HANDOVER_2.md`, `HANDOVER_3.md`, `PROJECT_PLAN.md` — done 2026-09-19 (Handover #4 session).
- [ ] Push `main` to `origin/main` — local is 25 commits ahead as of 2026-09-21; not pushed yet (only push when the user asks).
- [x] Fix CRLF warning: added `.gitattributes` (`* text=auto eol=lf`, PNGs binary).
- [x] Supabase sanity check (2026-09-18): only `testuser@infinitebox.dev` (email provider) exists; **no Google user** → Google sign-in must be re-tested end-to-end. Tables otherwise clean (0 orders/quotes/messages, 8 products, 1 leftover test file in `custom-uploads`).
- [x] Re-test Google sign-in — done 2026-09-21: owner signed in with Google from the cart, `auth.users` row with `provider = google`, paid order `4ea2920d` tied to that `user_id`.
- [ ] Remove the SQL-created test user (`testuser@infinitebox.dev`) or keep it deliberately and note it.
- [x] Smoke-test all 15 pages in the preview — done 2026-09-20: every page loads header/footer with the right title, `account.html` redirects to login when signed out; only console error is the expected 401 from `order.html?id=x` while unauthenticated.
- [x] Architecture review (2026-09-19) → `docs/ARCHITECTURE.md`; exported migrations + Edge Functions into `supabase/`; pinned supabase-js CDN to `2.116.0` on all 15 pages.
- [ ] Enable **Leaked Password Protection** in Supabase → Auth → Providers → Email (the only open security-advisor warning; user-side toggle).
- [x] Single source of truth for the shipping fee — done 2026-09-20: migration 0008 adds `store_settings` (key/value jsonb, public read, admin write) seeded with `shipping_cents = 650`; `cart.html` and `create-checkout-session` (v5) both read it and fall back to 650 if the row is missing. Change the fee with one SQL update; no redeploy needed.

### Phase 8 — Payments go-live (test mode) ✅ Done (2026-09-19)
- [x] User created a Stripe account (sandbox/test mode), got `sk_test_…`.
- [x] User created a webhook destination ("Your account" scope, Snapshot payload) → `https://ptwfidmlnuggxvqhimhe.supabase.co/functions/v1/stripe-webhook`, events `checkout.session.completed` + `checkout.session.expired`, got `whsec_…`.
- [x] Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` in Supabase → Edge Functions → Secrets.
- [x] Upgraded both Edge Functions to v3: Checkout now collects a real shipping address + phone (`shipping_address_collection`/`phone_number_collection`) and shows shipping as a proper Stripe shipping line instead of a fake line item; webhook now saves the collected address into `orders.shipping_address` and marks abandoned sessions `cancelled` on `checkout.session.expired`.
- [x] Full test checkout with `4242 4242 4242 4242` → `success.html` → confirmed via SQL: `orders.status = 'paid'`, `stripe_payment_intent` set, `shipping_address` populated correctly, `order_items` row correct.
- [x] Verified `cancel.html` path preserves the cart (added a 2nd product, opened Checkout, clicked Stripe's "Back", cart still showed the item).
- [x] Guest checkout path confirmed structurally (order created with `user_id = null`, placeholder email overwritten by `customer_details.email` via the webhook — existing working design).
- [x] Shipping model: flat rate, now a `store_settings` row (see Phase 7, 2026-09-20).
- Test rows created during verification (2 pending + 1 paid order) were deleted from `orders`/`order_items` afterward — sandbox is clean.
- One further test order (`9acb36b4…`, "Custom Enclosure", $30.50, `paid`) was placed by the user directly while testing the preview on 2026-09-19 — left in the database deliberately (not Claude's to delete). Clear it manually before launch, or ask Claude to.

### Phase 9 — Deployment to Hostinger (Hostinger hosting purchased; no other blocker)
- [ ] Upload `site/` contents to `public_html` (FTP/File Manager). No build step.
- [ ] Point the GoDaddy DNS for `infinite-box.co` at Hostinger (A record / nameservers per the Hostinger panel), then confirm HTTPS active.
- [ ] Supabase → Auth → URL Configuration: add `https://<domain>/**` to Redirect URLs; set Site URL.
- [ ] Google Cloud Console → Google Auth Platform → **Audience → Publish app** (Testing → In production). Launch-day step: in Testing only listed test users can use Google sign-in. Branding (name, logo, home/privacy/terms URLs, authorized domains `ptwfidmlnuggxvqhimhe.supabase.co` + `infinite-box.co`) was filled in 2026-09-21.
- [ ] After the site is live: verify `infinite-box.co` in Google Search Console, then submit the OAuth app for **brand verification** so the consent screen says "Sign in to Infinite Box" instead of the raw `…supabase.co` domain. If Google objects to the unowned supabase.co domain, the fallback is a Supabase custom domain (`api.infinite-box.co`, $10/mo add-on) + updating `config.js`, the Google redirect URI and the Stripe webhook URL.
- [ ] Re-run login (email + Google) and a test checkout on the live domain.
- [ ] Deploy `coming-soon/` separately (or retire it once the store is live — user decision).
- [x] Add `robots.txt`, `sitemap.xml`, `<meta description>` per page, `noindex` on transactional pages, canonical + Open Graph tags — done 2026-09-21 (Handover #6). Origin hardcoded as `https://infinite-box.co`.

### Phase 10 — Content & catalogue
- [ ] Real product photography → upload through **Admin → Products → Photo** (writes to `product-images` and sets `image_url`). Zero code changes needed.
- [ ] Review copy on about/faq/materials (currently from the Airo export).
- [x] Add `privacy.html` and `terms.html` + footer links — done 2026-09-21. **User must fill the bracketed placeholders** (legal name, address, jurisdiction, retention/return periods) and ideally have the copy checked.
- [ ] Turn coming-soon email capture into a real list (Mailchimp/Brevo) **or** drop the page.

### Phase 11 — Admin dashboard ✅ Done (2026-09-20)
Same static-page pattern, guarded by `profiles.is_admin` (RLS already enforces it server-side).
- [x] `site/admin/index.html` — overview: to-fulfil / new-quote / unread counts, 30-day revenue, recent orders + quotes.
- [x] `site/admin/products.html` — CRUD on `products` (name, slug, price, category, material, description, specs, icon, stock, sort, active, photo upload to `product-images`). Stock column added 2026-09-20 (migration 0010, `products.stock`, default 0; red badge at 0, amber at ≤5).
- [x] **Stock enforcement** (2026-09-20): shop cards show a "Sold out" pill + dimmed thumb; product page swaps Add-to-cart for a disabled "Sold out" button and clamps qty to stock ("Only N left" at ≤5); cart clamps quantities, flags sold-out rows, excludes them from the subtotal and disables Checkout; `create-checkout-session` v6 returns 409 with a readable message if any line exceeds stock (cart shows that message and refreshes); `stripe-webhook` v5 calls `decrement_order_stock` (migration 0011: SECURITY DEFINER, service_role only, idempotent via `orders.stock_applied_at`, floors at 0). Verified end-to-end in the preview + SQL.
- [ ] **Set real stock values in Admin → Products** — every product starts at 0, so the whole store shows *Sold out* until you enter counts (Custom Enclosure is at 2 after testing).
- [x] `site/admin/orders.html` — filter/search, drawer with items + shipping address + Stripe ids, status change (`paid → fulfilled` etc.).
- [x] `site/admin/quotes.html` — filter/search, drawer with details, design-file download via signed URL, set status / quoted price / internal note.
- [x] `site/admin/messages.html` — `contact_messages` inbox with read/unread and mailto reply.
- [x] Guard: `IBAdmin.requireAdmin()` in `assets/js/admin.js` (signed out → `login.html?next=admin/…`; signed in but not admin → friendly message). `login.html` now accepts `next=admin/<page>.html`.
- [x] Migration 0009 (`admin_access`): admin UPDATE policies on orders/quote_requests/contact_messages, `quote_requests.quoted_price_cents` + `admin_note`, `contact_messages.is_read`, admin SELECT on `custom-uploads` storage objects.
- [x] Admin granted to `testuser@infinitebox.dev` (user ran the SQL, 2026-09-20). For a real owner account later: `update public.profiles set is_admin = true where email = '<you>';`.
- [x] Signed-in end-to-end test (2026-09-20): overview stats, orders list/drawer, products list + stock edit + save verified live; quotes/messages render (no data yet to exercise the drawers).

### Phase 12 — Notifications & customer experience ✅ Done (2026-09-21, Handover #7)
- [x] Email on order paid (customer receipt + owner alert), new quote (customer ack + owner alert), new contact message (owner alert) — Resend via `functions/_shared/email.ts`; contact form moved to a new `submit-contact` Edge Function so it has a server hook. All three verified with real deliveries.
- [x] Single-order detail page linked from `account.html` — done early, 2026-09-19: built as `order.html` (not `orders.html`) accepting `?id=` (signed-in, ownership-checked) or `?session_id=` (straight off the Stripe redirect); see Handover #4.
- [x] Profile edit on `account.html` — name + phone (address deferred: no column, and Stripe Checkout can't be prefilled with it).
- [x] Password reset flow — `forgot-password.html` + `reset-password.html`, "Forgot password?" on login, `IBAuth.resetPassword/updatePassword`.
- [x] **Checkout requires a signed-in customer** (owner's decision 2026-09-21): `create-checkout-session` returns 401 for guests; cart shows "Log in to check out"; `signup.html` honours `?next=`.
- [ ] Decide on Supabase email-confirmation setting for signup (keep on for prod). Auth emails (confirmation, password reset) still go out via Supabase's rate-limited default SMTP — switch Supabase → Auth → SMTP to Resend (`smtp.resend.com`, user `resend`, password = API key) now that the domain is verified.

### Phase 13 — Polish pass #2 & launch readiness
- [ ] Enter real stock counts for all products (Admin → Products) — until then the store shows almost everything as *Sold out*.
- [ ] Replace placeholder social URLs in `partials.js` `SOCIAL_LINKS` (or blank a `url` to hide it).
- [x] Page-hero top padding fixed (2026-09-20) — all 13 non-home pages; cart heading gap fixed; admin filter-chip contrast fixed.
- [x] Blank-space fixes (2026-09-21): shop chips moved into the hero; home `.hero` no longer `min-height: 100vh`.
- [ ] Migrate remaining hardcoded px spacing onto `--space-*` — deliberately skipped 2026-09-21 (134 px literals, regression risk, no visible gain).
- [x] Responsive audit of cart/custom/account/admin pages at 375px — done 2026-09-21; fixed cart rows (stack below 640px) and the admin product drawer form (single column below 480px).
- [x] Lighthouse pass — done 2026-09-21: home desktop 98/95/100/100. Fixed footer contrast, qty `aria-label`, sized logos, CLS min-heights. Open: white-on-orange buttons are 3.06:1 (brand decision).
- [x] Error/empty states for every DB read — done 2026-09-21: Retry button on index/shop/product/cart, empty-catalogue message, product not-found state, admin overview failure rows, admin-check network error distinguished from "not admin".
- [ ] Stripe → **live mode** keys; swap secrets; final live purchase test with a real card + refund.
- [ ] Retire older handovers into `PROJECT_PLAN.md` as source of truth (latest is `HANDOVER_7.md`).

### Backlog / ideas (not scheduled)
- Product search, product variants (size/colour/material options).
- Admin UI for editing `store_settings` (shipping fee, category list) instead of SQL.
- Discount codes (Stripe Coupons).
- Multi-currency (site is USD; business appears Thailand-based — confirm currency + Stripe country support).
- PWA / offline cart, analytics (Plausible/GA4), reviews.

---

## Suggested execution order

1. **Phase 7** — now, no blockers.
2. **Phase 11 (admin)** — done; it now replaces the Supabase dashboard for day-to-day product/order/quote management.
3. **Phase 12** — done 2026-09-21.
4. **Phase 9** when the user is ready — nothing blocks it; upload `site/` (including `admin/`, `robots.txt`, `sitemap.xml`), then the launch-day toggles (Supabase redirect URLs, publish the Google OAuth app) and the post-deploy brand verification.
5. Remaining user-side content items (stock, photos, legal placeholders, social URLs) and Phase 13 (Stripe live mode).

