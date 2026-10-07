# Infinite Box — Handover #17 (2026-10-06 → 2026-10-07)

Session #17. Started from Handover #16. Focus: **small fixes, email, Google Search Console + brand verification**. Stripe live mode was planned but **the owner chose to stay in test mode** for now.

## Live state at session start (checked)

| Check | Handover #16 said | Reality |
|---|---|---|
| Git | pushed | Same: `main` = `origin/main` (`5fd1510`) |
| Supabase | clean | 0 orders, 2 users, 4 active products, 33 site_events from 17 visitors |
| ImprovMX | (badge open) | **Red "Incorrect DNS records"**: MX fine, root SPF missing `include:spf.improvmx.com` |

## What this session did

| # | Commit | Change |
|---|---|---|
| 1 | — | **SPF fixed** (owner, GoDaddy): root TXT is now `v=spf1 include:secureserver.net include:spf.improvmx.com ~all` (one SPF record, edited, not added). ImprovMX shows Active / all green |
| 2 | — | **ImprovMX alias** `hello@` now forwards to `chaopraya.khan@gmail.com` (was `khanleenine@gmail.com`) |
| 3 | — | **Gmail "Send mail as"** on `chaopraya.khan@gmail.com`: `Infinite Box <hello@infinite-box.co>` via `smtp.resend.com:465`, user `resend`, Resend API key `gmail-send-as` (Sending access, domain-scoped). Replies to hello@ go out as Infinite Box; personal mail stays personal |
| 4 | `a9ef225` | Handovers #1–#15 moved to `docs/handovers/` (links fixed); stale PROJECT_PLAN lines corrected (OAuth "Testing", "Thailand-only", blockers, git row, coming-soon "LIVE") |
| 5 | — | **Google Cloud**: `chaopraya.khan@gmail.com` added as project **Owner**; OAuth user-support + developer contact switched to it |
| 6 | — | **Search Console**: Domain property `infinite-box.co` verified by GoDaddy TXT `google-site-verification=XcHd…` (keep it forever); sitemap `https://infinite-box.co/sitemap.xml` submitted |
| 7 | `e3cdb59` | **Brand verification** passed and **published**: Google sign-in now shows "Infinite Box" + logo |
| 8 | (this) | Handover #17 + PROJECT_PLAN ticks |

**Gotcha:** Search Console's GoDaddy auto-setup (Domain Connect) asked to enable `domain-verification, **gmail-setup**`. `gmail-setup` would replace the ImprovMX MX records with Google Workspace's. It failed silently and was cancelled; the TXT was added by hand. Never use that button.

## Verification

- `Resolve-DnsName` (8.8.8.8 and 1.1.1.1): merged SPF + Google TXT live; MX still `mx1`/`mx2.improvmx.com`.
- A test sent as Infinite Box: **SPF, DKIM, DMARC all PASS** (Gmail "Show original").
- `sitemap.xml` fetched with a Googlebot user agent: 200, `application/xml`, 9 URLs; `robots.txt` allows it.

## Open items

1. **Business email lands in spam/junk** (Gmail and another provider), even though authentication passes. Cause: new-domain reputation. Advised: Resend → Domains → infinite-box.co → turn **open/click tracking off**; write real-looking emails; get replies; re-check in 2–4 weeks. Fallback: Google Workspace mailbox (~$7/mo). **Also check whether the store's own receipts land in spam** (owner to look at the 2026-10-06 test receipts).
2. **Sitemap shows "Couldn't fetch"** in Search Console (Last read empty): normal for a new property. If it persists after 2–3 days, use URL Inspection → Test live URL on the sitemap.
3. **Orphan image** `w201-190e-cup-holder-1790177065026.png` still in Storage → `product-images` (owner deletes in the dashboard; SQL delete is blocked).
4. **`OWNER_EMAIL` secret**: still `khanleenine@gmail.com` unless the owner changed it. It receives order/quote alerts and is the Reply-To on customer receipts. Set it to `chaopraya.khan@gmail.com` to keep everything in one inbox.
5. The Resend connector in Claude is linked to an empty Resend account, not the store's.
6. Carried over: About wording / more "Our work" photos, lawyer review + DBD name.

## Next session (#18) options

1. **Stripe live mode** (Phase 13), when the owner is ready. Check first that the Stripe account is Thai and pays out THB to a Thai bank; then a live webhook + `sk_live`/`whsec` secrets, one real ฿309 purchase + refund. Test cards stop working after the switch.
2. **Product pages in `sitemap.xml`** (`product.html?id=<slug>` for the 4 products) so Google can list them.
3. Optional: a separate test environment (second free Supabase project with Stripe test keys) so `4242` testing stays possible after going live.

## Addendum (2026-10-07): sitemap + product pages

- Search Console then said **"Sitemap could not be read"** (Last read 10/7/26). The file is valid (parsed as XML; live copy identical to `site/sitemap.xml`; 200 for Googlebot UA, HEAD, gzip/brotli, HTTP/1.0; http/www 301 to it), so the cause is on Google's side or in how Hostinger answers Google's own IPs. Owner to run **URL Inspection → Test live URL** on the sitemap to see what Google gets.
- **`product.html` had a static canonical `https://infinite-box.co/product.html`**, so all 4 products looked like one duplicate page to Google. Now each product sets its own canonical `product.html?id=<slug>` and meta description (first 155 chars of its description) once loaded; static `og:url` removed.
- `sitemap.xml` now lists the 4 product pages (13 URLs). **New products must be added to `site/sitemap.xml` by hand** (no build step).
- Deploy: upload `site/product.html` and `site/sitemap.xml` to `public_html` (overwrite).
