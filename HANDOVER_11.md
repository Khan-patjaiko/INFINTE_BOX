# Infinite Box — Handover #11 (2026-09-23)

Session #11. Started from Handover #10. The owner picked the backlog item **Admin UI for
`store_settings`**: a Settings page so the shipping fee, the free-shipping threshold and the
category list can be changed without SQL.

## Live state at session start (checked, not taken from the docs)

| Check | Handover #10 said | Reality |
|---|---|---|
| Git | 3 feature commits + docs local only | Already pushed: `main` = `origin/main` at `973fb0a` |
| Mazda Phone Mount | Test variants (Black/Blue × Clip/Magnet) | **The owner set the real options**: Color Black/Red × Style Clamp ฿329 / Magnet ฿359 / Mount Only ฿279, stock 2 each (12 total), no SKUs |
| Other products | W201 ฿399/2, W124 ฿599/3, BMW ฿259/3 | Same; all plain, all "Automotive" |
| Orders | 1 paid test order `127c7b4e` ฿628 | Same (delete before launch) |
| Users | owner = admin, khanleenine = customer | Same |
| Edge Functions | checkout v12, webhook v10 | Same |
| Orphan test image `w201-190e-cup-holder-1790177065026.png` | In `product-images` | Still there |

The repo root has an untracked `Product/` folder (Facebook post images). It is personal and was not committed.

## What this session did

| # | Change | Result |
|---|---|---|
| 1 | **`site/admin/settings.html`** (new) + a "Settings" link in the admin nav (`admin.js` `PAGES`) | **Shipping card**: Shipping fee (฿) and Free shipping from (฿) fields, with a live sentence such as "Orders under ฿800 pay ฿50 shipping; ฿800 and over ship free." Blank or 0 in "Free shipping from" means never free; `cart.html` and `create-checkout-session` already treat 0 that way. Negative or blank fees are blocked. Save upserts both rows. **Categories card**: one row per category with ↑ ↓ × and a "N products" count (only the number on phones). There is an Add box that rejects blanks and case-insensitive duplicates. Save writes the ordered list. **Renaming** a category also updates `products.category` on its products. **Removing** a category that products still use asks first; the products keep the label, and the shop still shows it as a chip. Each card shows "Last saved …". |
| 2 | `styles.css` | `.settings-*` / `.cat-*` block uses `minmax(0,1fr)` grids so cards don't overflow at 375px. |

No migration and no Edge Function deploy were needed: RLS `store_settings_admin_write` (migration 0008) already allowed admin writes.

## Verified (pane on :8790, signed in as admin; SQL)

- The page loads ฿50 / ฿800 and the 9 categories, with Automotive = 4 products.
- Fee −5 → Save was blocked, with the field highlighted. Fee 60 → Save → DB `shipping_cents = 6000`. The cart with the BMW insert (฿259) showed **Shipping ฿60, Total ฿319**. Restored to ฿50 (DB `5000`).
- Adding "mechanical" was rejected as a duplicate. Added "Test" and moved it up → saved → the Shop chips showed the new order.
- Renamed Automotive → "Car Parts" and Test → "Test2" → toast "Renamed … on 4 product(s)", and SQL showed all 4 products as "Car Parts". Removing "Car Parts" and cancelling the confirm saved nothing. Reverted: "Car Parts" → Automotive and removed Test2. **The DB is back to the original 9 categories, ฿50 / ฿800, and all products are "Automotive".**
- 375px: no horizontal page scroll. No console errors.
- Not re-tested: the signed-out redirect. It is the shared `IBAdmin.requireAdmin()`, unchanged.

## Live state at handover

Same as the start table: the settings values are unchanged, and `store_settings.updated_at` now shows today.
Edge Functions and migrations are unchanged (16 migrations).

## Suggested next steps

1. Push `main` when the owner says "push main" (1 feature commit + docs are local).
2. Phase 9 launch prep: delete test order `127c7b4e` and the orphan image, upload `site/` to Hostinger, and do the launch-day toggles (Supabase Site URL, publish the Google OAuth app).
3. Legal placeholders in `privacy.html` / `terms.html`.
4. Optional: per-variant photos, and SKUs for the Mazda variants.
