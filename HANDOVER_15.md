# Infinite Box — Handover #15 (2026-10-05)

Session #15. Started from Handover #14. Focus: **Phase 14, international shipping by DHL zone**. Built, tested end to end, and cleaned up. Not pushed yet.

## Live state at session start (checked)

| Check | Handover #14 said | Reality |
|---|---|---|
| Git | `main` pushed | Same: in sync with `origin/main` |
| Supabase | clean | 0 orders, 2 users, 4 active products, 0 site_events |
| Checkout function | v13 (Thailand only) | Same |

## Owner decisions

- **Zone fees:** placeholders for now. The owner types the real DHL Express numbers into **Admin → Settings → International shipping** before launch. A banner stays on that card until the first save.
- **Countries:** a starter list of 44 main markets in 7 zones. More can be added in the same editor.
- **International delivery promise:** **7–21 business days** after the item is made.
- Carried over from #14:
  - Domestic stays ฿50, free from ฿800.
  - International shipping is never free.
  - The recipient pays duties and taxes.

## What this session did

| # | Commit | Change |
|---|---|---|
| 1 | `0b87b58` | **Migration 0019** (applied). Details below. |
| 2 | `bc718f1` | **Cart "Ship to" picker.** Details below. |
| 3 | `593b9f4` | **Admin.** Details below. |
| 4 | `41a02d4` | **Content.** Details below. |
| 5 | (this) | Handover #15 and PROJECT_PLAN ticks. |

**1. Migration 0019 and the functions**
- New `store_settings` rows:
  - `intl_zone_fees` (zone → satang);
  - `intl_country_zones` (country code → zone);
  - `intl_fees_placeholder` (true).
- New column `orders.ship_country`.
- **`create-checkout-session` v14:**
  - reads `ship_to`;
  - validates it against the zone map (400 "we don't ship to that country yet" otherwise);
  - charges the zone fee, which is never waived;
  - sets `allowed_countries` to that one country;
  - stores `ship_country`.
- **`stripe-webhook` v12:** the receipt and owner alert say "Shipping (DHL Express)" and add the duties note on international orders.

**2. Cart "Ship to" picker**
- Lists Thailand first, then the zoned countries by name (`Intl.DisplayNames`).
- Remembers the choice in `localStorage['ib-ship-to']`.
- International orders show the zone fee and the duties note. The free-shipping nudge appears for Thailand only.
- Falls back to Thailand if the saved country is no longer offered.

**3. Admin**
- Settings has a new "International shipping (DHL zones)" card:
  - each zone has a fee and its countries as codes, with the names previewed;
  - zones can be added and removed;
  - codes are validated: 2 letters, a real region, not TH, not in two zones;
  - zones renumber 1..n on save.
- The order drawer shows "Destination: <country> · DHL Express" and "Shipping (DHL Express)".

**4. Content**
- Terms §5:
  - Thailand vs international;
  - DHL Express to the listed countries;
  - the fee is never waived;
  - 7–21 business days;
  - the recipient pays duties, and a parcel refused over duties is refunded minus shipping.
- Terms §6: return shipping from abroad is at the buyer's cost.
- FAQ: "Do you ship internationally?" now answers yes.
- Privacy: DHL Express is named as the carrier, and it passes details to customs.
- Home strip: "Free shipping **in Thailand** from ฿800" and "Ships across Thailand and Worldwide".
- Legal "Last updated" and sitemap dates are now 2026-10-05.

### Starter zones (placeholder fees, my estimates, NOT DHL quotes)

| Zone | Fee | Countries |
|---|---|---|
| 1 | ฿900 | SG MY HK BN |
| 2 | ฿1,100 | CN TW MO PH VN ID KH LA MM |
| 3 | ฿1,200 | JP KR |
| 4 | ฿1,400 | AU NZ IN |
| 5 | ฿1,800 | US CA |
| 6 | ฿1,700 | GB IE DE FR NL BE LU IT ES PT AT CH SE DK NO FI PL |
| 7 | ฿1,600 | AE SA QA KW BH OM IL |

The fee is per order, whatever the weight. If DHL charges much more for heavy carts, a per-item surcharge could be added later.

## Verification

- **SQL:** the rows and the column exist. The security advisor shows only the known Pro-only leaked-password warning.
- **Cart** (desktop + 375px):
  - Thailand: ฿50 plus the nudge.
  - Singapore: ฿900 plus the duties note.
  - United States: ฿1,800.
  - No horizontal scroll and no console errors.
- **Admin Settings:**
  - TH or an unknown code is rejected with a toast.
  - A fee edit saved, persisted, and hid the banner. It was then restored to the placeholder by SQL.
  - Checked at 375px.
- **Function:** `ship_to: "BR"` gets a 400 and no order row is created.
- **End to end:** the owner paid a `4242` test checkout to Singapore.
  - The Stripe country field offered **only Singapore**, with the line "DHL Express (duties paid by recipient)" at ฿900.
  - The order was `paid` with `ship_country = SG` and shipping 90000.
  - Stock went from 2 to 1.
  - Receipt and owner alert sent (function logs).
  - The admin drawer showed the destination correctly.
- **Cleanup:**
  - the test order and its items were deleted, and W201 stock was restored to 2;
  - this session's site_events were deleted (0 rows);
  - the browser cart and ship-to choice were cleared.

## Open items for the owner

- **Before launch: enter the real DHL Express fees** in Admin → Settings (and adjust countries/zones to match DHL's zone chart for export from Thailand). The banner disappears after saving.
- Carried over:
  - About page wording tweaks and more "Our work" photos.
  - A Thai lawyer review and the DBD name on the legal pages.
  - The orphan storage image.
  - The ImprovMX badge and a test mail.

## Wrap-up

- `main` pushed to GitHub at the end of session #15 (`aefb2ad..8226e9a`), so all Phase 14 work is on GitHub.
- The owner signed up for a DHL account and will enter the real zone fees before launch day.

## Next session (#16): launch day

Same as Handover #14, plus the DHL fees:
1. Confirm the real DHL fees are saved (`intl_fees_placeholder` = false). If not yet, launch can still proceed only once the owner has entered them, since the placeholder fees are guesses.
2. Run the keep-awake workflow once (GitHub → Actions) and confirm it is green. Push any new commits first.
3. Zip the `site/` contents. The owner uploads them to Hostinger `public_html`, deleting the coming-soon `index.html` and `assets/` first.
4. Supabase Auth Site URL → `https://infinite-box.co`; Google Auth Platform → Publish app.
5. Live re-test:
   - login (email + Google);
   - one `4242` checkout to Thailand and one abroad → paid + receipt + stock decrement;
   - then restore stock and delete the orders.
6. Admin → Overview shows visits from the live domain.
