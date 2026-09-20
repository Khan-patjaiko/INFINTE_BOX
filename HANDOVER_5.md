# Infinite Box — E-Commerce Web — Handover #5

Last updated: 2026-09-21 (session ran 2026-09-20 → 21)

## What this session did

Starting point was [HANDOVER_4.md](HANDOVER_4.md): Stripe live in test mode, order status
page done, backend vendored into `supabase/`, nothing deployed to Hostinger. The user chose to
**defer Hostinger** and go straight to Phase 11. This session: (1) closed the remaining
Phase 7 items Claude could do alone, (2) built the **admin dashboard** (Phase 11) and verified
it signed in, (3) added **stock management with sold-out enforcement** end-to-end, (4) fixed
four UI issues the user spotted, (5) added social links to the footer. Nine commits, all
local (see [Git state](#git-state)).

## Part 1 — Phase 7 housekeeping

- **Shipping fee single source of truth.** Migration 0008 adds `store_settings` (key/value
  jsonb; public read, admin write) seeded with `shipping_cents = 650`. `cart.html` and
  `create-checkout-session` both read it and fall back to 650. To change the fee:
  `update store_settings set value = '800' where key = 'shipping_cents';` — no redeploy.
- **Smoke test of all 15 pages** in the preview: every page loads header/footer with the right
  title; `account.html` redirects to login when signed out; only console error is the expected
  401 from `order.html?id=x` unauthenticated.
- Still open in Phase 7 (all user-side): push to origin, Google sign-in re-test, Leaked
  Password Protection toggle, decide fate of `testuser@infinitebox.dev`.

## Part 2 — Admin dashboard (Phase 11) — built and verified

Five static pages under `site/admin/`, same pattern as the storefront, guarded client-side by
`IBAdmin.requireAdmin()` and server-side by RLS (`private.is_admin()`):

| Page | What it does |
|---|---|
| `index.html` | Overview: orders to fulfil, new quotes, unread messages, 30-day revenue; recent orders + quotes tables (rows click through) |
| `orders.html` | Filter chips by status, search by email/id, drawer with items + shipping address + Stripe ids, **change status** (`paid → fulfilled` etc.), link to customer view |
| `quotes.html` | Filter/search, drawer with full details, **download design file** via 10-min signed URL from the private bucket, set status / quoted price / internal note |
| `messages.html` | Contact inbox with read/unread (opening marks read), mailto reply |
| `products.html` | Full CRUD: name, slug (auto from name), price, category (datalist), material, description, specs editor (`Label: value` per line), placeholder icon, **stock**, sort, active toggle, **photo upload** to `product-images` (this is how real photos get added — Phase 10 needs no code) |

Shared code: [`site/assets/js/admin.js`](site/assets/js/admin.js) — injects its own admin
header (Overview · Orders · Quotes · Messages · Products · View store · Log out), exposes
`window.IBAdmin` (`requireAdmin`, `money`, `date`, `statusBadge`, `toast`, `signedUrl`).
Signed out → `../login.html?next=admin/<page>.html` (login's `next` regex was widened to
allow the `admin/` prefix); signed in but not admin → friendly "not an admin" message.
Admin CSS is a block at the end of `styles.css` (tables, drawer, stat cards, toast).

**Migration 0009 `admin_access`**: admin UPDATE policies on `orders`, `quote_requests`,
`contact_messages`; new columns `quote_requests.quoted_price_cents`, `.admin_note`,
`contact_messages.is_read`; admin SELECT on `custom-uploads` storage objects (for signed URLs).

**Admin account:** the only user is `testuser@infinitebox.dev` / `TestPass123!` (created by
SQL in Handover #3). Claude's attempt to set `is_admin = true` was blocked by the permission
classifier, so the **user ran it in the Supabase SQL Editor**. That account is now admin and
was used to verify all five pages live. When the owner signs up with a real account, grant it
the same way: `update public.profiles set is_admin = true where email = '<you>';`.

## Part 3 — Stock management + sold-out enforcement

User asked first for a stock column, then for products to be sold out at 0. Built in two steps:

**Migration 0010 `product_stock`**: `products.stock integer not null default 0 check >= 0`.
Admin Products shows a Stock column (red badge at 0, amber at ≤5) and edits it in the drawer.

**Migration 0011 `decrement_stock`**: `orders.stock_applied_at` + SQL function
`public.decrement_order_stock(order_id)` — SECURITY DEFINER, `revoke … from public, anon,
authenticated; grant … to service_role`, idempotent per order (claims `stock_applied_at`
first), floors stock at 0. Verified: anon call → "permission denied"; ran against the paid
test order → Custom Enclosure 3 → 2; second call → no change.

Enforcement at every layer:
- **`products.js`** maps `stock` and `soldOut`; `productCardHTML` adds a "SOLD OUT" pill
  and dims the thumb/price.
- **`product.html`**: sold-out → disabled "Sold out" button + link to custom orders (no add
  button rendered); in stock → qty picker clamped to stock, "Only N left" note at ≤5.
- **`cart.html`**: clamps quantities to stock (writes back to localStorage), flags sold-out
  rows in red, excludes them from the subtotal, disables Checkout until removed; if the Edge
  Function returns 409 the cart shows the server's message and re-fetches products.
- **`create-checkout-session` v6**: rejects any line with `qty > stock` → 409
  `{ error: "Not enough stock: …", sold_out: [...] }` (verified by direct invoke).
- **`stripe-webhook` v5**: after marking paid, calls `decrement_order_stock`.

**⚠ Every product currently has stock 0 except Custom Enclosure (2)**, so the storefront
shows almost everything as *Sold out* until the user enters counts in Admin → Products.

## Part 4 — UI fixes (all user-reported from the preview)

1. **Big blank space above page titles** (login, and in fact all 13 `.page-hero` pages):
   hero had `padding-top: 160px` sized for an overlaid header, but the header is `sticky`
   (in flow). Now 48px mobile / 80px desktop.
2. **Gap between "Your Cart" and the rows**: cart's borderless hero + full `.section` top
   padding. Section top padding → 8px on that page only.
3. **Orange-on-orange active filter chip in admin**: the admin CSS block redefined
   `.filter-chip.active` with only `color`, leaving the shop rule's solid-orange background.
   Removed the duplicate; the shared rule (orange bg, white text) applies everywhere.
4. **Footer "Follow" column** (Facebook · Instagram · Line) added right of Company, with
   inline SVG icons; footer grid is now 4 columns on desktop. URLs live in `SOCIAL_LINKS` at
   the top of `partials.js` and are **placeholders** (`facebook.com/infinitebox` etc.) — user
   to replace; an empty `url` hides that entry.

## Backend state (Supabase project `ptwfidmlnuggxvqhimhe`)

- Migrations: **11** (0008 store_settings, 0009 admin_access, 0010 product_stock,
  0011 decrement_stock added this session). `supabase/migrations/` matches production.
- Edge Functions: `submit-quote` v2 · `create-checkout-session` **v6** · `stripe-webhook`
  **v5** · `get-order` v1. `supabase/functions/` matches what is deployed.
- Security advisor: only the pre-existing Leaked Password Protection warning (user-side).
- Data: 1 paid test order (`9acb36b4…`, left deliberately, now with `stock_applied_at` set),
  1 user (admin), 8 products, `store_settings.shipping_cents = 650`.

## Verification notes / gotchas for the next session

- The preview server (`preview_start` → `infinite-box-site`, :8790) restarted a couple of
  times mid-session and the browser session was lost each time; log in again via the form.
  Claude fills the login form with the documented test credentials via `form_input`.
- After scrolling, the browser pane sometimes returns black screenshots when the desktop
  window is hidden; DOM/JS checks still work — verify numerically in that case.
- `Python` is not on PATH on this machine; use `node -e` for scripted file edits. Shell
  heredocs with backticks/quotes inside `sed` broke once — writing a small `.js` in the
  scratchpad and running it was the reliable pattern.
- The old `SHIPPING_CENTS` constant is gone; anything else that hardcodes 650/6.5 is a bug.

## What's still not done

- **Not pushed** — see Git state.
- **Not deployed** — Hostinger explicitly deferred by the user this session.
- **Stock values** — user must enter them (Admin → Products) or the store shows sold out.
- **Social URLs** — placeholders in `partials.js`.
- Google sign-in re-test, Leaked Password Protection toggle, test-user decision (Phase 7).
- Email notifications, password reset, profile edit (Phase 12) — untouched.
- `privacy.html` / `terms.html` — footer links still `#`.

## Git state

Working tree clean. `main` is **9 commits ahead of `origin/main`** (push only when the user
asks):

```
ebb5183 Add Follow column (Facebook, Instagram, Line) to the footer
cb8b965 Enforce stock: sold-out storefront, checkout stock check, decrement on paid
0eb92b1 Add stock column to products and admin product management
4172fd0 Fix unreadable orange-on-orange text on active admin filter chips
580a070 Remove excess gap between cart heading and cart rows
747660b Add admin dashboard (site/admin/) with migration 0009 for admin write access
b93db68 Reduce excess top padding on page heroes (header is sticky, not overlaid)
47d686e Move shipping fee to store_settings table; smoke-test all pages
9fb7743 Add architecture review, vendor Supabase backend into repo, pin supabase-js   (from Handover #4)
```
(plus this handover commit)

## Suggested next steps

1. **User:** enter stock counts in Admin → Products; paste real social URLs into
   `partials.js`; optionally push `main`.
2. **Phase 9 — Hostinger** when the user is ready: upload `site/` (incl. `admin/`) to
   `public_html`, add the domain to Supabase Auth redirect URLs, re-test login + checkout.
3. **Phase 12** — email notifications (order paid receipt, new quote alert) from the
   `stripe-webhook` / `submit-quote` functions; password reset page.
4. **Phase 10** — real photos now just need uploading through Admin → Products.
