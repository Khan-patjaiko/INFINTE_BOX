# Infinite Box — Handover #16 (2026-10-06)

Session #16. Started from Handover #15. Focus: **Phase 9, publish the store**. **`https://infinite-box.co` now serves the real store** (Stripe still in test mode).

## Live state at session start (checked)

| Check | Handover #15 said | Reality |
|---|---|---|
| Git | pushed | Same: `main` = `origin/main` (`cb64888`) |
| DHL fees | placeholders | **Saved by the owner** (`intl_fees_placeholder = false`): Z1 ฿500, Z2 ฿600, Z3 ฿800, Z4 ฿800, Z5 ฿1,800, Z6 ฿1,700, Z7 ฿1,600. Owner confirmed Z5–7 are final too |
| Supabase | clean | 0 orders, 2 users, 4 active products, 0 site_events |

## Owner decisions

- Launch now with **Stripe in test mode**; live keys in a later session (Phase 13).
- All saved DHL fees are final.

## What this session did

| # | Commit | Change |
|---|---|---|
| 1 | — | Zipped `site/` (75 files, 3.2 MB) with forward-slash paths; the owner deleted the coming-soon files and extracted it into `public_html` |
| 2 | `c07a9e9` | **`site/.htaccess`**: `www` and `http` → 301 `https://infinite-box.co` (one origin for the cart and auth redirects). Created by the owner in `public_html` too |
| 3 | (this) | Handover #16 and PROJECT_PLAN ticks |

**Launch toggles (owner):**
- Supabase Auth Site URL → `https://infinite-box.co`.
- Google Auth Platform → **In production** (Google shows a "requires verification" banner: that is brand verification, not needed for basic sign-in).

**Upload notes for next time:**
- PowerShell 5.1 `Compress-Archive` writes backslash paths; build the zip with `System.IO.Compression` and `/` separators.
- Hostinger's File Browser extract dialog *requires* a folder name; typing `.` extracts into `public_html` itself.
- That File Browser has no "show hidden files" switch; `.htaccess` was made with **New file**. The zip from `site/` now includes `.htaccess`, so re-uploads overwrite it (keep "Overwrite existing files" ticked).

## Verification (live domain)

- All 21 pages + admin pages + `robots.txt` + `sitemap.xml`: 200; unknown page 404; directory listing 403; no broken images; no site console errors.
- Redirects: `http://` → `https://`; `https://www` → apex (1 hop); `http://www` → apex (2 hops).
- **Test 1** (Google login, Thailand): Mazda Black/Mount Only ฿279 + ฿50 = ฿329, `paid`, variant stock 2→1, receipt + owner alert sent.
- **Test 2** (Japan): Mazda Black/Clamp ฿329 + ฿800 DHL = ฿1,129, `paid`, `ship_country = JP`, variant stock 2→1, emails sent.
- **Test 3** (email sign-up): `khanleenine+livetest@gmail.com` confirmation link opened **infinite-box.co** (Site URL works), login worked.
- **Cleanup:** 3 orders deleted (incl. one abandoned pending TH order), Mazda stock restored to 12 (2 per variant), the test account deleted, the test browser's 29 site_events deleted. **33 events from ~18 real visitors kept.**

## Open items for the owner

- Glance at **Admin → Overview** to see the real visits.
- Carried over: About wording / more "Our work" photos, lawyer review + DBD name, orphan storage image, ImprovMX badge + test mail.

## Wrap-up

- Keep-awake workflow run manually by the owner: **green** (the Actions page hides the workflow list in the "All workflows ▾" dropdown on narrow windows).
- `main` pushed (`cb64888..152cab3`).

## Next session (#17) options

1. **Stripe live mode** (Phase 13): confirm a Thailand Stripe account settling in THB, live secret key + new live webhook → Supabase secrets, one real-card purchase + refund.
2. **Google Search Console + OAuth brand verification** (Phase 9 post-launch): verify `infinite-box.co` (DNS TXT at GoDaddy), submit the sitemap, then submit the OAuth app for brand verification.
