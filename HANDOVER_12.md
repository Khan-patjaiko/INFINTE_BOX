# Infinite Box — Handover #12 (2026-10-04)

Session #12. Started from Handover #11. The owner picked **Phase 9 launch prep**. This session covered the launch-readiness fixes. The upload and launch-day toggles wait until the legal pages are filled in, which is the next session.

## Live state at session start (checked, not taken from the docs)

| Check | Handover #11 said | Reality |
|---|---|---|
| Git | 1 feature commit + docs local | Same: `main` 2 ahead of `origin/main` |
| Supabase | running | **Auto-paused** (free plan, 11 days without activity). It was restoring on arrival (`COMING_UP`); tables appeared after ~10 min with **all data intact** |
| Products / users / settings / Edge Functions | as #11 | Same |
| Test order `127c7b4e` + orphan image | present | Present |

## What this session did

| # | Change | Result |
|---|---|---|
| 1 | **Customer emails reply to the owner** (`stripe-webhook`, `submit-quote`): the order receipt and the quote acknowledgement now set `replyTo: OWNER_EMAIL` | Before, a customer pressing Reply wrote to `hello@infinite-box.co`, which had no inbox. **Deployed: stripe-webhook v11, submit-quote v6.** The deployed sources were compared with `supabase/` first and matched. Note: submit-quote v5 had bundled an old `_shared/email.ts` with a `$` formatter (unused there); v6 now carries the current ฿ helper. Smoke test: webhook 400 without a signature, submit-quote 405 on GET. |
| 2 | **`.github/workflows/keep-supabase-awake.yml`** | Every 3 days (`17 3 */3 * *`) plus a manual run: one anon REST read of `products`, so the free project never reaches 7 idle days. The request was tested locally and returned a row. **It only takes effect after "push main".** Then trigger it once via GitHub → Actions → Run workflow. Alternative: Supabase Pro ($25/mo). |
| 3 | **Test order deleted** (owner approved) | `127c7b4e`: 1 order + 2 order_items removed. `orders` is now empty. Stock was not touched: the owner had re-entered real stock after that order. |
| 4 | **`hello@infinite-box.co` receives mail** via ImprovMX (free) | Alias `hello@ → khanleenine@gmail.com`. The owner added GoDaddy MX `@` → `mx1.improvmx.com` (10) / `mx2.improvmx.com` (20). Verified live on GoDaddy NS, 8.8.8.8 and 1.1.1.1. Resend's `send.` records are unaffected. At wrap-up ImprovMX still showed "Checking" (normal; it re-checks on its own). |

## Open items for the owner

- **Orphan image is still there.** SQL delete is blocked by `storage.protect_delete()`. Do it in Supabase → Storage → product-images → tick `w201-190e-cup-holder-1790177065026.png` → Delete. No product references it (checked).
- **ImprovMX:** wait for the green badge, then send a test mail to `hello@infinite-box.co` from another account. If it asks for SPF, **edit** the existing TXT to `v=spf1 include:secureserver.net include:spf.improvmx.com ~all`. Never add a second SPF record.
- Consider pointing the alias at `chaopraya.khan@gmail.com` (admin) instead of the customer test account.
- **Legal details** for `privacy.html` / `terms.html`: the business legal name (own name if a sole trader) and the address. The country is **Thailand** (confirmed). Proposed retention: orders 5 years, quotes and messages 12 months. Also check with an accountant whether DBD e-commerce registration applies.

## Next session (launch day)

1. Fill the legal placeholders (owner brings name + address; PDPA wording for Thailand).
2. "push main" → run the keep-awake workflow once and confirm it is green.
3. Zip `site/` contents → owner uploads to Hostinger `public_html` (delete the coming-soon `index.html` + `assets/` first, extract at the root).
4. Supabase Auth Site URL → `https://infinite-box.co`; Google Auth Platform → Publish app.
5. Live re-test: pages, email and Google login, a `4242` checkout → paid + receipt (check that Reply-To is the owner) + stock decrement, then restore stock and delete the order.
