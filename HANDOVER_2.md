# Infinite Box — E-Commerce Web — Handover #2

Last updated: 2026-09-17

## What this session did

Starting point was [HANDOVER.md](HANDOVER.md) (Handover #1): a fully static, no-backend
`site/` (localStorage cart, fake forms, "Checkout" linking to `contact.html`, an
"Account" nav link with no real auth). This session turned it into a real, working
e-commerce site backed by Supabase — full plan in
[read-the-handover-file-snazzy-lampson.md](../../.claude/plans/) (saved under
`~/.claude/plans/`), executed end to end.

## New Supabase project

- **Name:** "Infinite Box Store"
- **Project ref:** `ptwfidmlnuggxvqhimhe`
- **Org:** `INFINITE_BOX` (`uymwhbyeqdqcazwwkfnd`), region `ap-southeast-1`
- **Cost:** $0/month (free tier)
- **Important:** this is a *separate, new* project — do **not** confuse it with the
  org's other existing project `fvowbhdysxlxigvrudsi` ("INFINITE BOX PETANA
  Project"), which is an unrelated lost-pet-tracking app with its own colliding
  `orders`/`profiles` tables. The store's data lives only in `ptwfidmlnuggxvqhimhe`.
- Public URL + anon/publishable key are in `site/assets/js/config.js` (safe to be
  public — access is governed by RLS, not by key secrecy).

## Database schema (all in `public` schema, RLS enabled on every table)

| Table | Purpose | Key RLS rule |
|---|---|---|
| `profiles` | 1 row per `auth.users`, auto-created via trigger | owner selects/updates own row; admins see all |
| `products` | Catalogue (replaces old hardcoded `products.js` array) | anon can `select` where `active = true`; writes admin-only |
| `orders` | Order header (status, totals, Stripe refs) | owner selects own; **no client insert/update** — only Edge Functions (service role) write orders |
| `order_items` | Line items per order | owner selects via parent order ownership |
| `quote_requests` | Custom-order quote submissions (`custom.html`) | anyone can insert; owner/admin can select |
| `contact_messages` | Contact form submissions (`contact.html`) | anyone can insert; admin-only select |

- Admin check is `private.is_admin()` — a `SECURITY DEFINER` helper deliberately
  moved to a **non-API-exposed `private` schema** (migration `0007_harden_helper_functions`)
  after the Supabase security advisor flagged it as callable via public REST RPC.
  **Advisor is clean (zero findings)** as of this session.
- `products` seeded with the same 8 items as the old static `products.js`
  (`prod-1..prod-8` → new slugs like `custom-enclosure`, `mounting-bracket`, etc.),
  prices converted to `price_cents` integers.
- Storage buckets: `product-images` (public read, admin write — for future real
  product photos) and `custom-uploads` (private — custom-order design files,
  written only via the `submit-quote` Edge Function using the service role).

Migrations applied (in order): `0001_profiles`, `0002_products`, `0003_orders`,
`0004_quotes_and_contact`, `0005_storage`, `0006_seed_products`,
`0007_harden_helper_functions`.

## Frontend changes (`site/`)

New shared scripts (loaded via `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2">`
on every page, before the page's own scripts):
- `assets/js/config.js` — public Supabase URL + anon key.
- `assets/js/supabase-client.js` — creates `window.IBDB` (the Supabase client).
- `assets/js/auth.js` — `window.IBAuth` (`getUser`, `signUp`, `signIn`, `signOut`,
  `refreshHeader`, `requireUser`). Also swaps the header "Account"/"Log in" link and
  keeps it in sync on auth state changes.

`assets/js/products.js` was **rewritten**: no longer a hardcoded array. Now exposes
`loadProducts()` (async, fetches from Supabase `products` table into the same
`PRODUCTS`-shaped global), `getProduct(id)`, plus shared render helpers
(`productCardHTML`, `productThumbHTML`, `formatPrice`, `ibEscape`) used by
index/shop/product/cart so markup-building logic isn't duplicated per page.

Per-page changes:
- **index.html** — **refactored to use the `#header-placeholder`/`#footer-placeholder`
  + `partials.js` injection pattern**, eliminating the old inline-header duplication
  that Handover #1 flagged as a known risk. Product grid now `await`s `loadProducts()`.
- **shop.html / product.html / cart.html** — render after `loadProducts()` resolves;
  shop's category filter now derives categories from live DB data.
- **cart.html** — "Checkout / Request Quote" (previously a dead link to
  `contact.html`) now calls the `create-checkout-session` Edge Function and redirects
  to Stripe Checkout; a "Need a custom quote instead?" link to `custom.html` was kept
  alongside it for the quote-only path.
- **custom.html / contact.html** — forms no longer fake success. `custom.html`
  uploads the design file + posts to the `submit-quote` Edge Function (multipart);
  `contact.html` inserts directly into `contact_messages` via `IBDB`.
- **about.html / faq.html / materials.html** — no content changes; just added the
  Supabase/auth script tags so their header shows correct login state.

New pages:
- `login.html`, `signup.html` — Supabase Auth email/password. Note: Supabase's
  default signup validation **rejects `@example.com`** addresses as a built-in
  anti-abuse rule (seen during testing) — use a real-looking domain when testing
  signup manually.
- `account.html` — requires auth (`IBAuth.requireUser()`, redirects to
  `login.html?next=...` if signed out); shows profile greeting + order history
  (`orders` + nested `order_items`, RLS-scoped to the signed-in user).
- `success.html` — Stripe checkout return page; clears the local cart, offers an
  "Account" link if the customer is signed in.
- `cancel.html` — Stripe checkout cancel return page; cart is preserved.

CSS: appended new rules to the end of `assets/css/styles.css` (loading/status text,
product `<img>` sizing for when real photos replace the SVG icons, `.auth-wrap`,
and `.account-head`/`.order-card`/`.order-status` for the account page) — existing
rules untouched.

## Edge Functions (deployed, Deno/TypeScript)

| Function | `verify_jwt` | Status |
|---|---|---|
| `submit-quote` | false | **Live and working** — no external dependency, verified end-to-end (row + uploaded file both confirmed in DB) |
| `create-checkout-session` | false | Deployed; **needs `STRIPE_SECRET_KEY`** to actually create a Stripe session. Currently returns a clean `503 {"error":"Payments are not configured yet..."}` instead of crashing (fixed a cold-start bug — see below) |
| `stripe-webhook` | false | Deployed; **needs `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`**. Verifies Stripe's signature, marks the matching `orders` row `paid` on `checkout.session.completed` |

**Bug fixed during verification:** both Stripe functions originally called
`new Stripe(secretKey, ...)` at module load time. With no `STRIPE_SECRET_KEY` set
yet, this threw during cold start and made the function 500 on *every* request,
including the `OPTIONS` CORS preflight (confirmed via `query_logs`). Fixed by moving
Stripe client construction inside the request handler, gated behind a check that
returns a proper JSON error if the key is missing. Both functions were redeployed
(version 2) with this fix.

`create-checkout-session` re-reads authoritative prices from the `products` table by
slug (never trusts client-supplied prices), creates a `pending` order + `order_items`
row via the service role before creating the Stripe session, and stores
`stripe_session_id` on the order.

## What's still needed to go fully live (payments)

Not yet done — requires the user's own Stripe account:
1. Get a Stripe **test** secret key (`sk_test_...`).
2. Create a Stripe webhook pointing at
   `https://ptwfidmlnuggxvqhimhe.supabase.co/functions/v1/stripe-webhook`, event
   `checkout.session.completed` → copy its signing secret (`whsec_...`).
3. In the Supabase dashboard → Infinite Box Store → Edge Functions → Secrets, set
   `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
4. Test with card `4242 4242 4242 4242`.

Supabase's own URL/anon/service-role env vars are auto-injected into Edge
Functions — nothing to configure there.

## Verification performed this session

All done against the live new Supabase project, then test data cleaned up
afterward (0 rows left in `orders`/`quote_requests`/`contact_messages`/`profiles`;
8 products remain as seeded):
- Anon can read all 8 products through RLS (`set local role anon` check).
- Home page loads live product data with correct prices/categories, no console errors.
- Shop page's category filter works against live data (verified "Mechanical" →
  correct 2 products).
- Contact form insert → confirmed row in `contact_messages`.
- Custom-order quote submission (with a real file attached) → confirmed row in
  `quote_requests` **and** the uploaded file in the `custom-uploads` bucket.
- Signup flow hit Supabase's `@example.com` rejection (see note above); a
  confirmed test user was created directly via SQL instead, and login was verified
  successful through the real `login.html` flow (had to backfill empty-string
  token columns on the manually-inserted `auth.users` row — a quirk of
  hand-created users, not something that will happen for real signups).
- Logged-in account page correctly showed only that user's own seeded order
  ($42.50, 2 items) — confirms RLS scoping on `orders`/`order_items` works from
  the actual page, not just from a service-role query.
- Checkout Edge Function invoked while unauthenticated Stripe keys are absent →
  confirmed it now fails cleanly (503 JSON error) instead of the pre-fix 500 crash.

## Git

- Repo was **not initialized** at the start of this session (Handover #1 noted this).
- Initialized this session: `git init`, branch renamed to `main`.
- Repo-local git identity set (does **not** touch global git config):
  `user.name = "Khan Patjaiko"`, `user.email = "khanleenine@gmail.com"`.
- `.gitignore` added (node_modules, `.env*`, Supabase local temp dirs, OS/editor cruft).
- **Initial commit** made: `f32421b` — "Initial commit: Infinite Box e-commerce site
  with Supabase backend" (49 files).
- **Remote linked and pushed:** `origin` →
  `https://github.com/Khan-patjaiko/INFINTE_BOX.git`, `main` now tracks
  `origin/main`.

## Known gaps / carried over from Handover #1 (still true)

- `coming-soon/` is still untouched — separate deploy, no backend, as designed.
- No real product photography yet — SVG line-art placeholders in `icons.js` still
  render when a product's `image_url` is null (the render helpers already support
  swapping in real `<img>` once `image_url` is populated in the `products` table —
  no further frontend code changes needed for that swap).
- No hosting/deployment yet for `site/` (Netlify/Vercel/Cloudflare Pages — still an
  open choice, "Phase 7" in the plan). Local preview remains
  `.claude/launch.json` → `infinite-box-site` (port 8790) / `infinite-box-coming-soon`
  (port 8791) via `http-server`.
- Stripe payments are wired but inert until the user supplies their own Stripe keys
  (see "What's still needed" above).
- Signup requires email confirmation by default (Supabase setting) — fine for
  production, but means a fresh signup won't get instant access unless that setting
  is changed in the Supabase Auth dashboard.

## Suggested next steps

- Add Stripe test keys and do a full live checkout test (see steps above).
- Decide on and set up static hosting for `site/`; re-point the Stripe webhook URL
  if hosting changes the domain used in `success_url`/`cancel_url` origin.
- Consider disabling Supabase's email-confirmation requirement if a frictionless
  signup is wanted before real launch, or leave it on for production.
- Replace SVG placeholder icons with real product photos by setting `image_url` on
  rows in the `products` table (frontend already supports it).
- Update `HANDOVER.md` (Handover #1) or treat this file as the current source of
  truth going forward — the two together now describe the full project history.
