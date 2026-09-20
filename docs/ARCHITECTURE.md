# Infinite Box — Architecture

Last reviewed: 2026-09-19. This is the durable reference for *how the system is built*, grouped
into the four standard e-commerce layers. The roadmap (what is done / what is next) lives in
[PROJECT_PLAN.md](../PROJECT_PLAN.md); session history lives in the `HANDOVER_*.md` files.

## Pattern

**JAMstack / Backend-as-a-Service.** A dependency-free static front-end talks directly to
Supabase (Postgres + Auth + Storage + Edge Functions) over HTTPS, and hands payment off to
Stripe Checkout. There is no application server of our own.

```
 Browser (site/*.html + assets/js)
   │  supabase-js (anon key, RLS-scoped)          ┌─────────────┐
   ├──────────────────────────────────────────────▶│  Postgres    │ products, orders, order_items,
   │  reads: products, own orders/profile          │  + RLS       │ profiles, quote_requests,
   │  writes: contact_messages                     └──────▲──────┘ contact_messages
   │                                                      │ service role
   │  functions.invoke()                           ┌──────┴──────┐
   ├──────────────────────────────────────────────▶│ Edge Funcs  │ submit-quote · create-checkout-session
   │                                               │  (Deno)     │ get-order · stripe-webhook ◀── Stripe events
   │  redirect to session.url                      └──────┬──────┘
   ▼                                                      │ Storage: product-images (public),
 Stripe Checkout ──── success.html / cancel.html          │          custom-uploads (private)
                                                          ▼
                                                   Supabase Auth (email+password, Google)
```

Design principles that hold everywhere:

1. **The browser never holds a secret.** Only the publishable anon key ships to the client
   ([config.js](../site/assets/js/config.js)); Stripe keys and the service-role key live in
   Edge Function secrets.
2. **Prices and totals are computed server-side.** The client sends `{slug, qty}`; the
   Edge Function looks prices up in `products` ([create-checkout-session](../supabase/functions/create-checkout-session/index.ts)).
3. **Payment truth comes only from the signed webhook.** `success.html` never mutates state;
   `orders.status` flips to `paid` in [stripe-webhook](../supabase/functions/stripe-webhook/index.ts)
   after signature verification.
4. **Data access is enforced in the database (RLS), not in page JS.** Client code is a
   convenience layer; the policies in `supabase/migrations/` are the actual guard.

---

## Layer 1 — Front-End (presentation)

| Concern | Implementation |
|---|---|
| Pages | 14 static HTML files in [`site/`](../site) — home, shop, product, cart, custom, contact, about, faq, materials, login, signup, account, order, success/cancel. No framework, no build step. |
| Shared chrome | [partials.js](../site/assets/js/partials.js) injects header/footer; [icons.js](../site/assets/js/icons.js) SVG placeholders |
| Data client | [supabase-client.js](../site/assets/js/supabase-client.js) → `window.IBDB` (supabase-js pinned to `2.116.0` via jsDelivr) |
| Auth | [auth.js](../site/assets/js/auth.js) → `window.IBAuth`: signUp / signIn / signInWithGoogle / signOut / `requireUser()` guard / header state |
| Catalogue | [products.js](../site/assets/js/products.js): `loadProducts()` (active products, sorted), `getProduct(slug)`, `ibEscape`, `productCardHTML` |
| Cart | [main.js](../site/assets/js/main.js) → `window.IB`: localStorage cart `{id: slug, qty}`, badge, mobile nav |
| Styling | Single [styles.css](../site/assets/css/styles.css), HSL design tokens, `--space-*` scale, dark theme |
| Security | All DB-sourced strings pass through `ibEscape()` before `innerHTML` |

Customer journey: `shop → product?id=<slug> → cart → (Edge Function) → Stripe Checkout →
success?session_id= → order?session_id=` ; signed-in users also get `account → order?id=`.

Known gaps: shipping fee is duplicated (`6.5` in cart.html, `650` in the Edge Function);
no search/variants; SEO meta/OG/robots pending (Phase 9); Google OAuth end-to-end unverified.

## Layer 2 — Back-End (application logic)

Four Supabase Edge Functions (Deno, TypeScript) under [`supabase/functions/`](../supabase/functions).
All run with `verify_jwt = false` and handle auth themselves so guests and Stripe can call them.

| Function | Trigger | Responsibility |
|---|---|---|
| `create-checkout-session` | cart.html Checkout button | Authoritative price lookup by slug; insert `pending` order + items (service role); create Stripe Checkout session with flat shipping, address + phone collection; store `stripe_session_id` |
| `stripe-webhook` | Stripe `checkout.session.completed` / `.expired` | Verify signature → set `paid`, `stripe_payment_intent`, customer email, `shipping_address`; expired → `cancelled` |
| `get-order` | order.html | Return one order: by `session_id` (capability token, guest) or by `id` (JWT owner or admin); whitelists returned fields |
| `submit-quote` | custom.html form | Validate, upload design file to private `custom-uploads`, insert `quote_requests` (attaches user if signed in) |

Direct client → DB paths (RLS-protected, no function): `contact_messages` insert;
`products` read; own `orders`/`order_items`/`profiles` read on account.html.

Known gaps: no notifications (email receipts / owner alerts), no admin back-office, no
rate-limiting or bot protection on the public insert paths, webhook has no event-id
idempotency log (replays are harmless today).

## Layer 3 — Database (data)

Postgres on Supabase, schema defined by 8 migrations in [`supabase/migrations/`](../supabase/migrations).
RLS is enabled on every table.

| Table | Purpose | Key rules |
|---|---|---|
| `profiles` | 1:1 with `auth.users`, auto-created by trigger `private.handle_new_user()` | owner read/update; `is_admin` flag |
| `products` | Catalogue; `slug` is the public id | anon read where `active`; admin write |
| `orders` | One row per checkout; money in **integer cents**; `status ∈ pending/paid/fulfilled/cancelled` | owner/admin read only; writes via service role |
| `order_items` | Line items; **snapshots `name` + `unit_price_cents`** so history survives price edits; nullable FK to `products` | read via parent order |
| `quote_requests` | Custom-order enquiries; `status ∈ new/quoted/accepted/closed`; `file_url` = storage path | anyone insert; owner/admin read |
| `contact_messages` | Contact form | anyone insert; admin read |

Helpers live in the non-API `private` schema (`is_admin()`, `handle_new_user()`) so they
cannot be called via PostgREST. Storage: `product-images` (public read, admin write),
`custom-uploads` (private, service-role only). Indexes: `products(active, sort)`,
`orders(user_id)`, `orders(stripe_session_id)`, `order_items(order_id)`.

Known gaps: no stock / variants / `settings` table; `orders.email` uses a `guest@pending`
placeholder until the webhook overwrites it.

## Layer 4 — Infrastructure (hosting, delivery, operations)

| Concern | Current state |
|---|---|
| Static hosting | Hostinger (purchased). Deploy = upload `site/` to `public_html`; no build. **Not yet deployed.** |
| Backend hosting | Supabase managed project `ptwfidmlnuggxvqhimhe`, region ap-southeast-1 |
| Payments | Stripe, **test mode**; webhook endpoint → `/functions/v1/stripe-webhook` |
| Secrets | Supabase Edge Function secrets (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`); never in git |
| Source control | git, single `main`; backend source mirrored in `supabase/` (see [supabase/README.md](../supabase/README.md)) |
| Environments | One Supabase project serves dev and prod |
| Local preview | [`.claude/launch.json`](../.claude/launch.json): `http-server site -p 8790`, `coming-soon -p 8791` |
| CI/CD, tests | None |
| Observability | Supabase function/DB logs only; no alerting |
| Legal | `privacy.html` / `terms.html` not yet written (needed for Stripe live + Google OAuth verification) |

Known gaps (by severity): not deployed; no CI/deploy script; single environment; no
alerting on webhook failures; backup/PITR tier not reviewed; legal pages missing.

---

## Standard e-commerce components → this project

| Standard component | Infinite Box | Status |
|---|---|---|
| Storefront UI | `site/` | ✅ |
| Catalogue | `products` + `products.js` | ✅ (no search/variants) |
| Cart | localStorage via `main.js` | ✅ |
| Checkout / order creation | `create-checkout-session` | ✅ |
| Payment gateway | Stripe Checkout + `stripe-webhook` | ✅ test mode |
| Order management (customer) | `account.html`, `order.html`, `get-order` | ✅ |
| Order management (admin) | — (RLS policies ready) | ❌ Phase 11 |
| Identity | Supabase Auth: email + Google | ✅ (Google unverified) |
| Customer intake | `contact_messages`, `submit-quote` | ✅ |
| Notifications | — | ❌ Phase 12 |
| Media | `product-images` bucket, `image_url` | ✅ ready, no photos |
| Hosting / CDN | Hostinger | ⚠️ not deployed |
| Serverless runtime | Supabase Edge Functions | ✅ |
| Database | Supabase Postgres + RLS | ✅ |
| Secrets management | Supabase secrets | ✅ |
| Backend source in git | `supabase/` | ✅ since 2026-09-19 |
| CI/CD | — | ❌ |
| Observability | logs only | ⚠️ |
| Legal / compliance | — | ❌ Phase 10 |
