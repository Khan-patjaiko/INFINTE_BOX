# Infinite Box — Handover #10 (2026-09-23)

Session #10. Started from Handover #8/#9 with `main` = `origin/main` and a clean tree. The live
state matched the docs: 4 products, 0 orders, 2 users, and the coming-soon page on
`infinite-box.co`. The owner picked the **admin gallery editor** backlog item. Mid-session they
asked for **Shopee-style product options** (their reference was Shopee Seller Centre's
"ข้อมูลการขาย" page): each option combination gets its own price and stock, and there are no
per-variant photos for now.

## Owner decisions

- Price displays as a **range** (`฿279 – ฿299`) until every option is chosen, then as the exact price.
- A product can have **up to 3 option groups**.
- The **BMW E90 insert's test options were removed**. It is a plain product again: ฿259, stock 3.

## What this session did

| # | Change | Result |
|---|---|---|
| 1 | **Gallery editor** (`admin/products.html`) | The single "Photo" field became a **Photos** strip. You can add several files at once, reorder with ← →, and remove with ×. The first photo is marked "Main". On save, new files upload to `product-images` first; only then is the row written: `images` in the shown order, `image_url = images[0]`. |
| 2 | **Migration 0016** `product_variants` | Adds `products.variants jsonb`: `[{options:{Color,Style}, price_cents, stock, sku}]`. Adds `order_items.sku`. `decrement_order_stock` is redefined: for products with variants it decrements the variant whose `options` equals `order_items.options` (jsonb equality, so key order doesn't matter; floor 0), then sets `products.stock` to the sum. Plain products work as before. Idempotency through `stock_applied_at` is unchanged. BMW options were cleared in the same migration. |
| 3 | **create-checkout-session v12** | Works in three passes: resolve each line (options validated, then the variant looked up by a sorted-key `optKey`); check stock per stock pool (the variant, or the product for plain products); build the Stripe and order lines with the **variant price** and `sku`. Returns 400 if a variant no longer exists and 409 when stock is short (e.g. "Mazda … (Blue / Magnet) only 1 left"). |
| 4 | **Admin variant editor** | There are up to 3 option cards. Each has a name input and one input per value, with an empty "Add value" input always last and × buttons. Below them, a **Variant list** table has one row per combination, merged by the first group as in Shopee, with **\*Price (฿)**, **\*Stock** and **SKU**, plus an "Apply to all" bar. Typed values are kept per combination while options are edited. When a product has options, the base Price and Stock fields are hidden and saved as min price / total stock. Save checks that every option has a name and a value, that option names differ, and that every row has a price and a stock; it highlights bad rows. The list table shows the price range. |
| 5 | **Storefront** | `products.js` adds `variantKey`, `findVariant`, `lineInfo`, `formatPriceRange`, `priceMin/priceMax`. Cards show the range. `product.html` shows the exact price and stock once everything is chosen ("Only N left" / "This option is sold out" with a disabled button), dims values whose combinations are all out of stock, and limits qty to the variant's stock. `cart.html` uses the variant's price and stock per line and drops lines whose variant no longer exists. |
| 6 | Admin orders drawer | Shows `SKU: …` next to the options. |

## Verified (pane on :8790, signed in as admin; SQL)

- Gallery: reorder → save → the DB order changed. Adding a generated PNG uploaded it to storage and appended it. Removing it restored W201 to its original 2 photos.
- Mazda: Color (Black, Blue) × Style (Clip, Magnet) with Apply to all ฿279 / stock 2, then Blue+Magnet set to ฿299 / 0 / `MZ-BL-MAG`. DB: 4 variants, `price_cents 27900`, `stock 6`. Reopening keeps the values. Adding "Red" creates 2 rows with blank stock, and Save is blocked with the rows highlighted.
- Product page: range → exact price; Blue+Magnet shows sold out with the button disabled; qty limited to 2.
- Cart (Blue+Magnet temporarily given stock 1 via SQL): qty 2 was limited to 1, the lines were ฿299 + ฿279, subtotal ฿578 + ฿50 shipping.
- **Paid test checkout** (the owner entered the 4242 card): order `127c7b4e` is paid with the correct amounts and SKU. Stock went Blue+Magnet 1→0 and Black+Clip 2→1, and the product total went 7→5. The owner got the receipt email. The admin drawer shows the options and SKU.
- At 375px the variant table scrolls sideways inside its box, and the page itself doesn't scroll sideways. The security advisor shows only the known Pro-only leaked-password warning.

## Live state at handover

- **Mazda Phone Mount now has test options/variants** (Color Black/Blue × Style Clip/Magnet, stock 1/2/2/0). **Replace them with the real options in Admin → Products, or remove the option groups** to go back to a plain product (then set Price and Stock again).
- `orders`: 1 paid test order `127c7b4e` (฿628), kept. Delete it before launch or ask Claude to.
- One orphan test image, `product-images/w201-190e-cup-holder-1790177065026.png` (64px orange square), is in storage and not referenced by anything.
- Edge Functions: create-checkout-session **v12**; the others are unchanged.
- The migration file is `supabase/migrations/20260923120000_0016_product_variants.sql`. Production records it as version `20260923151839`; local filenames already differed from production versions before this session.

## Gotchas

- In this palette `--secondary` is **yellow**. Use `--muted` for subtle panel backgrounds.
- A bash heredoc swallowed `\d` in a regex again. Keep using the Edit tool for regex-bearing JS.
- A second chat's dev server held port 8790 at first. Later `preview_start` succeeded once it had gone.
- An unexplained 401 appeared once in the console during the session. It is most likely the known unauthenticated `get-order` call around the Stripe redirect; nothing failed.

## Suggested next steps

1. Set the real Mazda options, or remove them, in Admin → Products.
2. Phase 9: upload `site/` to Hostinger and do the launch-day toggles (see PROJECT_PLAN).
3. The legal placeholders in `privacy.html` / `terms.html`.
4. Optional: per-variant photos (backlog) and an admin UI for `store_settings`.
5. Push `main` when the owner says "push main" (3 feature commits + docs are local only).
