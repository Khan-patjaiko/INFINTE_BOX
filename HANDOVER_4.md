# Infinite Box — E-Commerce Web — Handover #4

Last updated: 2026-09-19

## What this session did

Starting point was [HANDOVER_3.md](HANDOVER_3.md) (Handover #3): UI polish + Google sign-in
added, but **nothing from that session was committed yet**, and Stripe was still fully inert
(no keys). This session did three things: (1) went live with Stripe in test mode end-to-end,
(2) built a single-order status page, (3) fixed two UI bugs the user found while testing.
Everything below is committed (see [Git state](#git-state) at the end).

## Part 1 — Stripe payments go live (test mode)

The user had already purchased Hostinger hosting and, this session, created a Stripe account
in **sandbox/test mode** (Stripe's current name for what used to be "test mode" — a toggle in
the dashboard, no verification required) and walked through the setup live:

1. Created an event destination ("Your account" scope — not Connect/"Connected accounts",
   since this store has no Connect platform — Snapshot payload style) pointing at
   `https://ptwfidmlnuggxvqhimhe.supabase.co/functions/v1/stripe-webhook`, listening to
   `checkout.session.completed` and `checkout.session.expired`.
2. Got `sk_test_…` and `whsec_…` and saved them as `STRIPE_SECRET_KEY` /
   `STRIPE_WEBHOOK_SECRET` in Supabase → Edge Functions → Secrets (Claude never saw these
   values — per policy, secrets are entered by the user, not typed by Claude).

While that was happening, upgraded both existing Edge Functions to v3 (deployed via the
Supabase MCP tools, not tracked as local files in this repo — same as before):

- **`create-checkout-session`**: shipping is now a real Stripe `shipping_options` line
  ("Standard shipping", $6.50) instead of being smuggled in as a fake line item; added
  `shipping_address_collection` (allow-list of ~25 countries incl. TH/US/CA/EU/AU/NZ/SG/etc.,
  editable at the top of the function) and `phone_number_collection`; the order id is now
  also passed as `client_reference_id` (belt-and-braces alongside `metadata.order_id`).
- **`stripe-webhook`**: on `checkout.session.completed` it now also writes the collected
  shipping address (name/phone/line1/line2/city/state/postal/country) into the existing-but-
  previously-unused `orders.shipping_address` jsonb column. New: handles
  `checkout.session.expired` by marking the matching pending order `cancelled` (the `orders`
  status check constraint already allowed `cancelled`, so no migration needed).

### Verification (Claude, in the browser preview)

Ran two full real checkouts against Stripe's sandbox with the test card
`4242 4242 4242 4242`:

- **Guest checkout**: cart → Checkout → real Stripe Checkout page (confirmed by the
  "Sandbox" badge and a Thai-localized UI, since the Stripe account is Thailand-based) →
  filled email/name/address/phone/card → Pay → landed on `success.html` → confirmed via SQL
  that the order flipped to `status = 'paid'` with `stripe_payment_intent` set and
  `shipping_address` populated exactly as entered.
- **Cancel path**: added a second product, opened Checkout, clicked Stripe's own "Back" link
  → landed on `cancel.html` → confirmed the cart still contained the item (not wiped).
- **Signed-in checkout** (as `testuser@infinitebox.dev`): confirmed Stripe pre-fills the
  email from the session and skips asking for it; order lands `paid` with `user_id` set
  correctly.

All test order rows created during this verification were deleted from `orders`/
`order_items` afterward via SQL. One further order was placed by the **user themselves**
while testing the shared preview later in the session (`id` starting `9acb36b4…`, "Custom
Enclosure", $30.50, `paid`) — left in the database deliberately, since it's the user's own
test data, not Claude's to delete. Worth clearing before launch.

**Decision explicitly made and confirmed with the user:** stay in Stripe's sandbox/test mode
for now; do **not** click "Switch to live account" until the store is fully built, tested, and
deployed (Phase 13). Sandbox = test mode; switching to live would also trigger Stripe's
business-verification flow, which isn't needed yet.

## Part 2 — Order status page

The user asked for a "My Order" button next to "Continue shopping" on the post-checkout page,
plus somewhere to see that order's status. This pulled forward a Phase 12 backlog item
(`orders.html?id=`) and built it as:

- **`site/order.html`** — new page, shows status (pending/paid/fulfilled/cancelled — with a
  one-line plain-English description of each), line items, total, and the shipping address.
  Reachable two ways:
  - `?session_id=<stripe checkout session id>` — for guests (or anyone) straight off the
    Stripe redirect. No sign-in required; the session id itself is treated as a one-time
    capability token (long, random, only known to the browser that completed checkout or an
    email receipt), the same pattern most storefronts use for guest order confirmations.
  - `?id=<order id>` — for signed-in customers browsing from `account.html`. Requires
    sign-in and is ownership-checked server-side.
- **`site/success.html`** — replaced the old sign-in-gated "View my orders" link (which
  pointed at the order *list*, not this specific order, and only showed for signed-in users)
  with a **"My order"** button, built from the `?session_id=` Stripe already puts on the
  `success_url`. Works for guest checkouts too, which the old link didn't.
- **`site/account.html`** — each order card in the history list is now a link to
  `order.html?id=<id>`.
- **New Edge Function `get-order`** (v1) backs both lookups with one shared authorization
  rule: a `session_id` lookup returns the order unconditionally (capability-token model
  above); an `id` lookup requires a valid `Authorization` header and only returns the order if
  `order.user_id` matches the caller, or the caller's `profiles.is_admin` is true. Returns a
  hand-picked safe subset of columns (no internal-only fields). This keeps `orders` RLS
  (`auth.uid() = user_id OR is_admin()`) as the only *client-side* read path, while giving
  guests a narrow, deliberate side door for their own just-placed order.
- **`assets/css/styles.css`**: added `.order-address` to match the existing `.order-card` /
  `.order-status` / `.order-line` pattern.

### Verification

- Guest checkout → "My order" button → status page showed `PAID`, correct item/total, and the
  exact shipping address entered.
- Signed-in checkout → `account.html` order card → same status page via `?id=`.
- Confirmed the authorization boundary: while signed in as `testuser@infinitebox.dev`, called
  `get-order` directly from the browser console with another customer's order id — got a 404,
  not the order. (Also correctly 404s on a nonexistent id.)
- Test orders removed afterward (except the user's own, as noted above).

## Part 3 — Two UI bugs (found by the user, fixed same session)

The user tested the live preview themselves and flagged two things on `account.html`,
screenshots + inspected element attached in chat:

1. **"Log out" button unreadable** — near-white text on a near-white background. Root cause:
   `.btn` / `.btn-outline` never set an explicit `background`, so on a real `<button>` element
   (this is the *only* `<button class="btn btn-outline">` in the whole site — every other
   `.btn-outline` is an `<a>` tag) it fell back to the browser's default light-gray button
   chrome, which clashed with the light `.btn-outline` text color. Fixed by adding
   `background: transparent` to both `.btn` and `.btn-outline`.
2. **"PAID" status badge text not centered** — the badge (a `<span class="order-status paid">`)
   was stretching to ~48px tall to match its taller sibling (a two-line "Order ID / date"
   block) because `.order-card-head` is a flex row with no `align-items` set, defaulting to
   `stretch`; the text then sat at the top of that tall box instead of being centered in the
   pill shape. Fixed by adding `align-items: flex-start` to `.order-card-head` so the badge
   keeps its natural (small) size.

Both verified fixed in the browser preview afterward (screenshot: dark button with readable
"Log out" text; correctly-sized, centered "PAID" pill).

## Known gaps / carried over (still true from Handover #3)

- **Google sign-in still not independently re-verified** — `auth.users` still shows only the
  one SQL-created `testuser@infinitebox.dev`. This is unrelated to anything done this session;
  still needs a real end-to-end test and a check that a `provider = google` row appears.
- **Not yet deployed** — Hostinger hosting is purchased; nothing has been uploaded to
  `public_html` yet. This is next (Phase 9), see Suggested next steps.
- **No admin UI** — `is_admin` and RLS exist; no page yet to manage products/orders/quotes.
- **No email notifications** — order-paid receipts / new-quote alerts don't exist yet.
- `coming-soon/` untouched.
- Shipping is still a hardcoded flat $6.50 in `create-checkout-session` (not a `settings`
  table row) — deliberately deferred, noted in `PROJECT_PLAN.md`.

## Git state

Working tree is clean. `main` is **3 commits ahead of `origin/main`** (not pushed — push only
happens when the user asks):

```
d0467c0 Fix unreadable log-out button and off-center order status badge
13d9a53 Add order status page and "My order" link on checkout success
f88aa95 Mark Phase 8 (Stripe test-mode checkout) complete
7392ef4 Add Google sign-in, UI polish pass, project roadmap and handover docs   (already on origin)
f32421b Initial commit: Infinite Box e-commerce site with Supabase backend      (already on origin)
```

Note: the three new Edge Functions/versions (`create-checkout-session` v3, `stripe-webhook`
v3, `get-order` v1) live only in Supabase — deployed directly via the Supabase MCP tools, the
same way `submit-quote` was in earlier sessions. This repo has never tracked Edge Function
source locally (no `supabase/functions/` directory); worth a look in a future session if the
project wants that in version control too.

## Suggested next steps

1. **Push to `origin/main`** if the user wants the remote caught up (3 commits sitting local).
2. **Phase 9 — deploy to Hostinger.** Hosting is paid for; just needs `site/`'s contents
   uploaded to `public_html` (no build step), then:
   - Add the live domain to Supabase → Auth → URL Configuration → Redirect URLs.
   - Re-run a login + checkout test against the live domain.
3. Decide whether to clear the user's leftover test order (`9acb36b4…`) from the database
   before launch.
4. Re-test Google sign-in end-to-end and confirm a `provider = google` row in `auth.users`.
5. Phase 11 (admin dashboard) can start any time in parallel — pure code, no external
   blockers.
