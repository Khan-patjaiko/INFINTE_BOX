# Infinite Box — Project Plan (living roadmap)

Last updated: 2026-09-20 · Source of truth for phases and tasks. Session history lives in
[HANDOVER.md](HANDOVER.md), [HANDOVER_2.md](HANDOVER_2.md), [HANDOVER_3.md](HANDOVER_3.md),
[HANDOVER_4.md](HANDOVER_4.md). How the system is built (four-layer architecture review) lives in
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
Tick boxes here as work lands; add a new phase rather than rewriting history.

## Where we are now (as of 2026-09-19)

**Overall: ~85% to a launchable v1.** The store works end-to-end locally including test-mode
payments and a per-order status page; it is not yet deployed (Hostinger hosting is purchased
but nothing uploaded).

| Area | Status |
|---|---|
| Static site design (14 pages, dark theme, design tokens) | ✅ Done |
| Supabase project `ptwfidmlnuggxvqhimhe` — schema, RLS, storage, seed (8 migrations) | ✅ Done, advisor clean |
| Live product catalogue from DB (index/shop/product/cart) | ✅ Done |
| Cart (localStorage) | ✅ Done |
| Custom quote form → `submit-quote` Edge Function + file upload | ✅ Live, verified |
| Contact form → `contact_messages` | ✅ Live, verified |
| Auth: email/password + `account.html` order history | ✅ Done |
| Auth: Google OAuth | ⚠️ Provider enabled + button wired; **no Google user exists in `auth.users`** (checked 2026-09-18) — end-to-end sign-in still unconfirmed, needs a real re-test |
| UI polish pass #1 (spacing scale, focus ring, mobile padding, nav animation) | ✅ Done |
| Stripe checkout (`create-checkout-session`, `stripe-webhook`) | ✅ **Live in test mode** — full checkout verified 2026-09-19 (paid order, address captured, cancel path preserves cart) |
| Order status page (`order.html` + `get-order` Edge Function) | ✅ Done 2026-09-19 — linked from `success.html` ("My order") and `account.html` order cards |
| Hosting | ⚠️ **Hostinger purchased**, not yet deployed |
| Git | ⚠️ Local `main` is **ahead of `origin/main`** (not pushed) as of 2026-09-19 |
| Backend source in git (`supabase/` migrations + Edge Functions) | ✅ Done 2026-09-19 — exported from the hosted project; edit here first, then deploy (see `supabase/README.md`) |
| Real product photography | ❌ None (SVG placeholders; frontend ready for `image_url`) |
| Admin UI (manage products/orders/quotes) | ❌ None — DB has `is_admin` + policies, no page |
| Email notifications (order confirmation, new quote alert) | ❌ None |
| Coming-soon page email capture | ❌ localStorage only, not a real list |

**Immediate blockers on the user side:** (1) product photos, (2) upload `site/` to Hostinger
`public_html` and point the domain at it.

---

## Web structure (current)

```
E-Commerce Web/
├── site/                          ← main storefront (static, deploy to Hostinger public_html)
│   ├── index.html                 Home (hero, featured products)          [partials.js header/footer]
│   ├── shop.html                  Catalogue grid + category filter (live DB)
│   ├── product.html?id=<slug>     Product detail + spec table
│   ├── cart.html                  Cart → Stripe Checkout / link to custom quote
│   ├── custom.html                Custom-order quote form (+ file upload)
│   ├── contact.html               Contact form
│   ├── about.html · faq.html · materials.html   Static content
│   ├── login.html · signup.html   Email/password + Google OAuth
│   ├── account.html               Auth-guarded: profile + order history (cards link to order.html)
│   ├── order.html?id=<uuid> or ?session_id=<cs_...>  Single-order status (items, total, shipping address)
│   ├── success.html · cancel.html Stripe return pages (success.html has a "My order" button → order.html)
│   └── assets/
│       ├── css/styles.css         Single stylesheet, HSL tokens, --space-* scale
│       ├── js/config.js           Supabase URL + anon key (public)
│       ├── js/supabase-client.js  window.IBDB
│       ├── js/auth.js             window.IBAuth (signUp/signIn/signInWithGoogle/signOut/requireUser/refreshHeader)
│       ├── js/products.js         loadProducts()/getProduct() + shared render helpers
│       ├── js/icons.js            SVG placeholder icons
│       ├── js/main.js             window.IB cart API, mobile nav
│       ├── js/partials.js         HEADER_HTML / FOOTER_HTML injection (all pages)
│       └── img/                   icon-/logo- dark/light PNGs
├── supabase/                      ← backend source of truth (mirrors hosted project)
│   ├── config.toml                project id, verify_jwt=false per function
│   ├── migrations/*.sql           8 migrations (same versions as production)
│   └── functions/<name>/index.ts  submit-quote · create-checkout-session · stripe-webhook · get-order
├── docs/ARCHITECTURE.md           Four-layer architecture reference
├── coming-soon/index.html         Standalone pre-launch page (separate deploy, no backend)
├── Example/                       Original Airo export (reference only)
├── .claude/launch.json            preview servers: infinite-box-site :8790, infinite-box-coming-soon :8791
└── HANDOVER*.md                   Session history

Supabase (project ptwfidmlnuggxvqhimhe, ap-southeast-1)
├── Tables: profiles, products, orders, order_items, quote_requests, contact_messages, store_settings (RLS on all)
├── Helper: private.is_admin()
├── Storage: product-images (public read), custom-uploads (private)
├── Auth: email/password (confirmation on), Google OAuth
└── Edge Functions: submit-quote ✅ · create-checkout-session ✅ (v5, reads shipping fee from `store_settings`) · stripe-webhook ✅ · get-order ✅ (v1, returns a single order for its owner or by Stripe session id)

Nav: Shop · Custom Orders · About · Account/Log in · Cart · Shop Now
Footer: Shop (All Products / Custom Orders / Materials) · Company (About / Contact / FAQ)
```

**Planned additions (later phases):** `site/admin/` (products, orders, quotes dashboard),
optional `privacy.html` / `terms.html` (required for Stripe live mode + Google OAuth
verification).

---

## Project phases

Phases 0–6 of the original plan are complete. Numbering continues from there.

### Phase 7 — Housekeeping & verification (now, ~1 session)
Goal: clean state, everything known-good.
- [x] Commit Handover #3 working tree (`styles.css`, `auth.js`, `login.html`, `signup.html`) + `HANDOVER_2.md`, `HANDOVER_3.md`, `PROJECT_PLAN.md` — done 2026-09-19 (Handover #4 session).
- [ ] Push `main` to `origin/main` — local is 3 commits ahead as of 2026-09-19; not pushed yet (only push when the user asks).
- [x] Fix CRLF warning: added `.gitattributes` (`* text=auto eol=lf`, PNGs binary).
- [x] Supabase sanity check (2026-09-18): only `testuser@infinitebox.dev` (email provider) exists; **no Google user** → Google sign-in must be re-tested end-to-end. Tables otherwise clean (0 orders/quotes/messages, 8 products, 1 leftover test file in `custom-uploads`).
- [ ] Re-test Google sign-in from `login.html` in a real browser and confirm a `provider = google` row + `profiles.full_name` appear.
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
- [ ] Confirm HTTPS active.
- [ ] Supabase → Auth → URL Configuration: add `https://<domain>/**` to Redirect URLs; set Site URL.
- [ ] Google Cloud Console: add production domain to authorized JS origins if required.
- [ ] Re-run login (email + Google) and a test checkout on the live domain.
- [ ] Deploy `coming-soon/` separately (or retire it once the store is live — user decision).
- [ ] Add `robots.txt`, favicon links check, `<meta description>` per page, Open Graph tags.

### Phase 10 — Content & catalogue
- [ ] Real product photography → upload to `product-images` bucket → set `products.image_url`. Zero frontend changes needed.
- [ ] Review copy on about/faq/materials (currently from the Airo export).
- [ ] Add `privacy.html` and `terms.html` + footer links (Stripe live mode and Google OAuth app verification both want these).
- [ ] Turn coming-soon email capture into a real list (Mailchimp/Brevo) **or** drop the page.

### Phase 11 — Admin dashboard (new build, ~2 sessions)
Same static-page pattern, guarded by `profiles.is_admin` (RLS already enforces it server-side).
- [ ] `site/admin/index.html` — overview: recent orders, new quotes, unread messages.
- [ ] `site/admin/products.html` — CRUD on `products` (name, price, category, specs, active, image upload to bucket).
- [ ] `site/admin/orders.html` — list + status change (`paid → fulfilled`), view items/address.
- [ ] `site/admin/quotes.html` — list `quote_requests`, download design file (signed URL via service role or admin storage policy), set status/quoted price.
- [ ] `site/admin/messages.html` — `contact_messages` inbox.
- [ ] Guard: `IBAuth.requireAdmin()` in `auth.js` (redirect non-admins); mark the owner's profile `is_admin = true` via SQL.
- [ ] Optional: storage policy so admins can read `custom-uploads` directly from the client.

### Phase 12 — Notifications & customer experience
- [ ] Email on order paid (customer receipt) and on new quote/contact (owner alert) — Resend (or similar) called from `stripe-webhook` / `submit-quote` Edge Functions; API key as a secret.
- [x] Single-order detail page linked from `account.html` — done early, 2026-09-19: built as `order.html` (not `orders.html`) accepting `?id=` (signed-in, ownership-checked) or `?session_id=` (guest, straight off the Stripe redirect); see Handover #4.
- [ ] Profile edit on `account.html` (name, phone, default shipping address).
- [ ] Password reset flow (`reset-password.html` using Supabase `resetPasswordForEmail`).
- [ ] Decide on Supabase email-confirmation setting for signup (keep on for prod; consider custom SMTP so emails don't come from Supabase's rate-limited default).

### Phase 13 — Polish pass #2 & launch readiness
- [ ] Migrate remaining hardcoded px spacing onto `--space-*`.
- [ ] Responsive audit of cart/custom/account/admin pages at 375px.
- [ ] Lighthouse pass (performance, a11y, SEO).
- [ ] Error/empty states for every DB read (products fetch fail, no orders, etc.).
- [ ] Stripe → **live mode** keys; swap secrets; final live purchase test with a real card + refund.
- [ ] Update `HANDOVER_4.md` / retire older handovers into `PROJECT_PLAN.md` as source of truth.

### Backlog / ideas (not scheduled)
- Product search, product variants (size/colour/material options), stock quantities.
- Discount codes (Stripe Coupons).
- Multi-currency (site is USD; business appears Thailand-based — confirm currency + Stripe country support).
- PWA / offline cart, analytics (Plausible/GA4), reviews.

---

## Suggested execution order

1. **Phase 7** — now, no blockers.
2. **Phase 11 (admin)** can start immediately in parallel with waiting on Stripe/Hostinger — it's pure code and unblocks the owner from needing the Supabase dashboard to manage products/quotes.
3. **Phase 9** next — Hostinger is paid for and ready, just needs `site/` uploaded.
4. **Phase 10 → 12 → 13** toward launch.

