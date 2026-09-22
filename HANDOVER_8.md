# Infinite Box — Handover #8 (2026-09-21)

Session #8. Started from Handover #7 with `main` = `origin/main` and a clean tree. The user
chose **pre-launch chores** over deploying, so this session is small and mostly account-level.
Phase 9 (deploy to Hostinger) is now the only engineering phase left.

## What this session did

| # | Chore | Done by | Result |
|---|---|---|---|
| 1 | Grant admin to the owner's Google account | Claude (SQL) | `profiles.is_admin = true` for `khanleenine@gmail.com` |
| 2 | Remove the SQL-created test user | Claude (SQL, after user confirmed) | `testuser@infinitebox.dev` deleted from `auth.users`; profile cascaded. Checked first: 0 orders / 0 quotes / 0 storage objects referenced it. DB now has **1 user, 1 profile, 1 admin** (the owner). |
| 3 | Real social URLs | Claude | `partials.js` `SOCIAL_LINKS`: Facebook `profile.php?id=61573015261066`, Instagram `infinite_box_2024` (QR tracking params stripped), Line `line.me/ti/p/ejUu2UnLOG` |
| 4 | Supabase Auth SMTP → Resend | User (dashboard) | Sender `Infinite Box <hello@infinite-box.co>`, `smtp.resend.com:465`, user `resend`, password = new Resend API key **`supabase-auth`** (Sending access, scoped to `infinite-box.co`). Supabase auto-raised the email rate limit 2/h → 30/h (visible in `auth_logs`). |
| 5 | Verify SMTP | Claude + user | Triggered `forgot-password.html` for the owner's address from the preview; `auth_logs` show `user_recovery_requested` with no SMTP error; **user confirmed the email arrived from `hello@infinite-box.co`**. |
| 6 | Leaked Password Protection | — | **Pro-plan only** — Supabase refused the toggle on the free plan. Skipped; documented in the plan. |
| 7 | Password minimum → 8 | User (dashboard) + Claude | Dashboard min length set to 8; `signup.html` raised from `minlength="6"` to `8` to match `reset-password.html`; hint added under the field. |
| 9 | Admin header bug | Claude | The admin "View store" link used class `account-link`, so `IBAuth.refreshHeader()` rewrote it to `account.html` after sign-in → `admin/account.html` 404 (found by the user on first admin login with the Google account). Renamed to `store-link` (`admin.js`, CSS selector widened). Commit `6f6916b`, pushed. |
| 10 | Admin product form simplified | Claude (user request) | Removed *Placeholder icon* and *Sort order* from the product drawer + the Sort column. New products: `sort = max+1`, `icon_key = "enclosure"`; edits keep existing values. Commit `098ab8b`, pushed. Reordering now = SQL on `products.sort` (backlog: drag-to-reorder). |
| 11 | **Store currency → THB** | Claude (user decision) | Prices supplied in THB, store was USD. `price_cents`/`*_cents` now hold satang (Stripe treats THB as 2-decimal, so no arithmetic changed). `฿` formatting in `products.js formatPrice`, `money()` in account/order/admin.js and `_shared/email.ts` (whole amounts without decimals: ฿399, ฿1,299). Admin labels "Price (THB)", terms.html copy updated. `create-checkout-session` **v10**: `currency: "thb"` + shipping rule; `stripe-webhook` **v9** redeployed for the email formatter. **Note:** the kept test order `4ea2920d` (3050) now displays as ฿30.50 — it was a USD test. |
| 12 | Shipping ฿50, free from ฿800 | Claude (user decision) | `store_settings.shipping_cents = 5000`, new `free_shipping_threshold_cents = 80000`. Cart shows "Free" + an "Add ฿X more for free shipping" nudge; checkout function applies the same rule and labels the Stripe shipping line "Free shipping" at ฿0. Verified in the pane: 1× Mazda → ฿279 + ฿50; 3× → ฿837, Free. |
| 13 | Real catalogue (4 products) | Claude, from the user's `Product/` folder | Migration **0013** (applied): deleted the 7 unordered seed products, deactivated Custom Enclosure (order 4ea2920d references it), inserted **W201 190E Cup Holder ฿399 (stock 2)**, **Mazda Phone Mount 7" ฿279 (5)**, **W124 Cup Holder ฿599 (3)**, **BMW E90 Center Console Insert ฿259 (3)** — category `Automotive` (the existing chip; the user wrote "Automotive Accessories"), material ABS, specs as `Compatible with` / `Material`. Descriptions keep their bullet lines (`.pd-desc { white-space: pre-line }`). Photos: `1.png` of each poster (Mazda → `4.png` showing the phone in the mount; BMW → `2.png` because `1.png` has a "BWM E90" typo) converted with `sharp-cli` to 1200px JPEG (115–200 KB) in `site/assets/img/products/`, referenced root-absolute so admin/ pages resolve them too. The raw `Product/` folder stays **untracked** (15 MB of posters). |
| 14 | Test order deleted | Claude (user request) | Order `4ea2920d` + its item removed; Custom Enclosure then deleted too (nothing references it). `orders` / `order_items` are empty; `products` = the 4 real ones only. |
| 15 | Product photo gallery | Claude (user request) | User's Chrome showed a broken product image (their server root differs from the pane's, so the root-absolute `/assets/…` path 404'd) → paths are now **relative to the site root** (`assets/img/products/…`); `admin/products.html` `imgSrc()` prefixes `../` for relative paths. Migration **0014**: `products.images jsonb` (ordered gallery); all poster shots converted (18 JPEGs, 2.2 MB total). `products.js` exposes `p.images` (image_url first, de-duped). `product.html`: main image + ‹ › arrows + "n / N" counter + thumbnail strip, keyboard arrows and touch swipe; single-photo products show no controls. Verified in the pane. **Admin cannot edit the gallery yet** (only the thumbnail via Photo upload) — backlog. |
| 16 | Admin account changed | Claude (user decision) | Google sign-in from `admin/` first bounced to `localhost:3000` (Supabase default Site URL) because the Redirect URLs list did not cover `admin/`; user set Site URL = `http://localhost:8790` and Redirect URLs `http://localhost:8790/**`, `https://infinite-box.co/**`. They then signed in with a **different** Google account, `chaopraya.khan@gmail.com`, and chose to make it the sole admin: `is_admin` moved from `khanleenine@gmail.com` (now a normal customer) to `chaopraya.khan@gmail.com`. Launch day: change Site URL to `https://infinite-box.co`. |
| 17 | Home strip | Claude (user request) | Centred; "Lead time" / "Layer res" replaced with "Free shipping from ฿800" / "Designed & printed in Thailand". |
| 18 | Product page text | Claude (user request) | Spec labels fixed at 140px (no wrap); multi-line spec values and "- " description lines render as bullet lists; admin Specs editor round-trips lists as `A | B | C`. Mazda/W124 "Compatible with" split into one model per line. |
| 19 | Cart stale lines | Claude (user report) | Badge showed 2 with an empty cart: localStorage still held deleted placeholder slugs. `cart.html` now prunes lines whose product no longer exists and re-saves. |
| 20 | Admin link in header | Claude | `IBAuth.refreshHeader()` reads the user's own `profiles.is_admin` and inserts an orange **Admin** link (desktop header + mobile nav) → `admin/index.html`. Root cause of "can't reach admin": the user signed in via the storefront Log in button, which lands on account.html by design. |
| 21 | **Product options (variants)** | Claude (user request) | Migration **0015**: `products.options jsonb` (`[{name, values[]}]`), `order_items.options jsonb`. Admin drawer: **Options** editor (+ Add option; name + comma-separated values). `product.html`: chip picker per group, must choose before Add to Cart, single-value groups preselect. Cart lines keyed by product+options (`IB.lineKey`), choice shown under the name. `create-checkout-session` **v11** validates values against the product, sums stock across variant lines, stores options per order line, adds them as the Stripe line-item description. `stripe-webhook` **v10** prints them in receipts; account/order/admin-orders show them. **v1 limits:** same price and shared stock across variants. Test data: BMW insert has `Slot type: 3 slot / 4 slot` + `Color: Black, Grey, Red, Blue` — **edit/remove in Admin → Products** if that's not real. Verified in the pane (picker, cart lines, qty/remove per line); the admin editor and a paid checkout with options are untested — user to try. |
| 22 | Options UI restyle | Claude (user reference: Bambu Lab product page) | Bold heading per group with the chosen value beside it, 96px-min outlined buttons with an accent selected state, and **circular colour swatches** when every value in a group resolves to a colour — named colours (black/white/grey/red/orange/yellow/green/blue/navy/purple/pink/brown/beige/gold/bronze/silver/transparent) or an inline hex, e.g. . The hex is stripped from the visible label but kept in the stored value. Verified in the pane. |
| 8 | Password conditions checklist | Claude (user request) | Replaced the hint sentence with a live "Password conditions" checklist on `signup.html` and `reset-password.html` (shared `IBAuth.attachPasswordRules` in `auth.js`, `.pw-rules` CSS): 8–50 chars, ≥1 uppercase, ≥1 lowercase, ≥1 number, ≥1 symbol, plus a Confirm-password field (new on signup) with a live "Passwords do not match" error. Submit stays disabled until all pass; handlers re-check before calling Supabase. Verified in the pane (weak / mismatch / match / too-long states). **Client-side only** — server-side enforcement is Supabase → Auth → Email → *Password Requirements* (free plan, not turned on). |

## Commits (18, on top of `d4038ab`)

```
2c1be1f Product options UI: headings, buttons, colour swatches
b7c6eab Product options (variants) end to end
464d639 Header: Admin link for admins
762f9a4 Product page: bullet lists + fixed spec labels
af0d3e5 Home strip: centre + new items
b9a71fa Cart: prune deleted products
d676e6b Shop cards: square photo box
a5f68a5 Product photo gallery: products.images + prev/next, thumbnails, swipe
4781bc5 Catalogue: replace placeholders with the first 4 real products + photos
6909811 Switch store currency to THB; flat ฿50 shipping, free from ฿800
098ab8b Admin products: drop Placeholder icon and Sort order fields
6f6916b Admin header: stop auth.js rewriting View store link
d6c781d Live password-conditions checklist on signup and reset
c5f3d9d Password hints: suggest a mix of upper/lower/number/symbol
9285f36 Signup: require 8-character passwords to match reset page and Auth setting
44586e2 Footer: real Facebook / Instagram / Line profile URLs
```
plus the docs commits for this handover. **Pushed to `origin/main`** at the end of the session.

## Live state at end of session (verified via SQL)

- `auth.users`: 2 — `chaopraya.khan@gmail.com` (google, **admin**), `khanleenine@gmail.com` (google, customer)
- `orders`: 0 (test order deleted at the user's request)
- `quote_requests` / `contact_messages`: 0
- `products`: exactly the 4 real products (stock 2/5/3/3), each with a 2–6 photo gallery
- `store_settings`: `shipping_cents = 5000`, `free_shipping_threshold_cents = 80000`, 9 categories
- Supabase Auth: Site URL `http://localhost:8790`, Redirect URLs `http://localhost:8790/**`, `https://infinite-box.co/**`
- Edge Functions: create-checkout-session v11 · stripe-webhook v10 · submit-quote v3 · submit-contact v1 · get-order v1
- Hostinger: nothing uploaded; GoDaddy DNS not pointed

## Gotchas noted this session

- Port 8790 was again held by another chat's `http-server`; `navigate` to `localhost:8790`
  reused it fine. The pane's network log only records same-origin requests, so Supabase API
  calls don't appear there — use `query_logs` (`source = 'auth_logs'`) to confirm auth events.
- `products` has no `sort_order` column (the admin page orders by something else); don't
  assume it in SQL.
- Resend API keys are shown once; the `supabase-auth` key lives only in the Supabase SMTP
  config now. Rotating it means creating a new key in Resend and pasting it into the dashboard.

## Suggested next steps

1. **Phase 9 — deploy** (nothing blocks it): upload `site/` to Hostinger `public_html`, point
   GoDaddy DNS, HTTPS on, then Supabase → Auth → URL Configuration (Site URL +
   `https://infinite-box.co/**`), **publish the Google OAuth app**, re-test email + Google
   login and a test checkout on the live domain, then Search Console + brand verification.
2. **User content:** legal placeholders in `privacy.html` / `terms.html`. Stock/photos are done for the first 4 products; more products go in via Admin → Products.
   Before Stripe live mode, confirm the Stripe account settles in THB (Phase 13).
3. Optional: Supabase → Auth → Email → Password Requirements → letters+digits+symbols.
4. Phase 13: Stripe live keys + real purchase/refund test.
5. Session-end: `main` was pushed (`d4038ab..6f6916b` + docs).
