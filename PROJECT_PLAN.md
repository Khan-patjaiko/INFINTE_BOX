# Infinite Box — Project Plan (living roadmap)

Last updated: 2026-09-18 · Source of truth for phases and tasks. Session history lives in
[HANDOVER.md](HANDOVER.md), [HANDOVER_2.md](HANDOVER_2.md), [HANDOVER_3.md](HANDOVER_3.md).
Tick boxes here as work lands; add a new phase rather than rewriting history.

## Where we are now (as of 2026-09-18)

**Overall: ~75% to a launchable v1.** The store works end-to-end locally except payments
(inert until Stripe keys are set) and it is not deployed.

| Area | Status |
|---|---|
| Static site design (14 pages, dark theme, design tokens) | ✅ Done |
| Supabase project `ptwfidmlnuggxvqhimhe` — schema, RLS, storage, seed (7 migrations) | ✅ Done, advisor clean |
| Live product catalogue from DB (index/shop/product/cart) | ✅ Done |
| Cart (localStorage) | ✅ Done |
| Custom quote form → `submit-quote` Edge Function + file upload | ✅ Live, verified |
| Contact form → `contact_messages` | ✅ Live, verified |
| Auth: email/password + `account.html` order history | ✅ Done |
| Auth: Google OAuth | ⚠️ Provider enabled + button wired; **no Google user exists in `auth.users`** (checked 2026-09-18) — end-to-end sign-in still unconfirmed, needs a real re-test |
| UI polish pass #1 (spacing scale, focus ring, mobile padding, nav animation) | ✅ Done |
| Stripe checkout (`create-checkout-session`, `stripe-webhook`) | ⚠️ Deployed, **inert** — no `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` |
| Hosting | ⚠️ Decided (Hostinger), **not deployed** |
| Git | ⚠️ 1 commit; Handover #3 changes (4 files) + HANDOVER_2/3.md **uncommitted** |
| Real product photography | ❌ None (SVG placeholders; frontend ready for `image_url`) |
| Admin UI (manage products/orders/quotes) | ❌ None — DB has `is_admin` + policies, no page |
| Email notifications (order confirmation, new quote alert) | ❌ None |
| Coming-soon page email capture | ❌ localStorage only, not a real list |

**Immediate blockers on the user side:** (1) Stripe account + test keys, (2) Hostinger
account/domain, (3) product photos.

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
│   ├── account.html               Auth-guarded: profile + order history
│   ├── success.html · cancel.html Stripe return pages
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
├── coming-soon/index.html         Standalone pre-launch page (separate deploy, no backend)
├── Example/                       Original Airo export (reference only)
├── .claude/launch.json            preview servers: infinite-box-site :8790, infinite-box-coming-soon :8791
└── HANDOVER*.md                   Session history

Supabase (project ptwfidmlnuggxvqhimhe, ap-southeast-1)
├── Tables: profiles, products, orders, order_items, quote_requests, contact_messages (RLS on all)
├── Helper: private.is_admin()
├── Storage: product-images (public read), custom-uploads (private)
├── Auth: email/password (confirmation on), Google OAuth
└── Edge Functions: submit-quote ✅ · create-checkout-session ⚠️ · stripe-webhook ⚠️

Nav: Shop · Custom Orders · About · Account/Log in · Cart · Shop Now
Footer: Shop (All Products / Custom Orders / Materials) · Company (About / Contact / FAQ)
```

**Planned additions (later phases):** `site/admin/` (products, orders, quotes dashboard),
`site/orders.html?id=` (single order detail), optional `privacy.html` / `terms.html`
(required for Stripe live mode + Google OAuth verification).

---

## Project phases

Phases 0–6 of the original plan are complete. Numbering continues from there.

### Phase 7 — Housekeeping & verification (now, ~1 session)
Goal: clean state, everything known-good.
- [ ] Commit Handover #3 working tree (`styles.css`, `auth.js`, `login.html`, `signup.html`) + `HANDOVER_2.md`, `HANDOVER_3.md`, `PROJECT_PLAN.md`; push to `origin/main`.
- [x] Fix CRLF warning: added `.gitattributes` (`* text=auto eol=lf`, PNGs binary).
- [x] Supabase sanity check (2026-09-18): only `testuser@infinitebox.dev` (email provider) exists; **no Google user** → Google sign-in must be re-tested end-to-end. Tables otherwise clean (0 orders/quotes/messages, 8 products, 1 leftover test file in `custom-uploads`).
- [ ] Re-test Google sign-in from `login.html` in a real browser and confirm a `provider = google` row + `profiles.full_name` appear.
- [ ] Remove the SQL-created test user (`testuser@infinitebox.dev`) or keep it deliberately and note it.
- [ ] Smoke-test all 14 pages in the preview (console clean, header auth state correct).

### Phase 8 — Payments go-live (test mode) (blocked on user: Stripe keys)
- [ ] User creates Stripe account, gets `sk_test_…`.
- [ ] User creates webhook → `https://ptwfidmlnuggxvqhimhe.supabase.co/functions/v1/stripe-webhook`, event `checkout.session.completed`, gets `whsec_…`.
- [ ] Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` in Supabase → Edge Functions → Secrets.
- [ ] Full test checkout with `4242 4242 4242 4242` → `success.html` → `orders.status = 'paid'` confirmed via SQL.
- [ ] Verify `cancel.html` path preserves the cart.
- [ ] Guest checkout: confirm order is created with `user_id = null` and email captured from Stripe.
- [ ] Decide shipping model (flat $6.50 is hardcoded in the Edge Function) — keep or make it a `settings` row.

### Phase 9 — Deployment to Hostinger (blocked on user: hosting/domain)
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
- [ ] `orders.html?id=` single-order detail page linked from `account.html`.
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
3. **Phase 8 → 9** as soon as the user supplies Stripe keys and Hostinger access.
4. **Phase 10 → 12 → 13** toward launch.

