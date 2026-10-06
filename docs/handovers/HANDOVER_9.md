# Infinite Box — Handover #9 (2026-09-21)

Session #9. Started from Handover #8 with `main` = `origin/main` and a clean tree. The user
asked to **put the coming-soon page on the real domain now**, while the store keeps being
finished. Result: **`https://infinite-box.co` is live** (coming-soon page). Half of Phase 9
(domain + HTTPS) is therefore done; the store upload is still pending.

## What this session did

| # | Step | Done by | Result |
|---|---|---|---|
| 1 | `coming-soon/index.html` | Claude | Added `<meta name="robots" content="noindex, nofollow">` (user decision: don't let Google index the placeholder). Notify-Me form left **as-is** (localStorage only — user decision "keep for now"). |
| 2 | Zip for upload | Claude | `coming-soon.zip` (index.html + assets/, root-level paths) built with Windows `tar.exe -a`. Note: PowerShell `Compress-Archive` writes backslash paths that Linux extractors keep literally — don't use it for server uploads. |
| 3 | Hostinger website | User (pane) | Premium plan → "Continue setup" → **Upload your PHP or HTML** (the "advanced users" option; the Migrate branch is wrong) → existing domain `infinite-box.co` → Malaysia DC. Confirmed the "free email plan will be deleted" dialog (irrelevant: email is Resend). |
| 4 | Files | User (pane) | File Manager → `public_html`: extracted into a subfolder first, then moved `index.html` + `assets/` to the root and deleted the folder + zip. Final `public_html` = `index.html`, `assets/img/{icon-dark,icon-light,logo-light}.png`. |
| 5 | DNS | User (GoDaddy) | Hostinger "Connect via DNS records" tab (NOT nameservers): edited `A @` from parked `160.153.0.66` → **`145.79.26.182`**; `CNAME www → infinite-box.co` already existed. All Resend rows (`send`, `rsend`, DKIM CNAMEs, SPF TXT) untouched. Propagated within a minute on 8.8.8.8 / 1.1.1.1. |
| 6 | HTTPS | Hostinger auto | Lifetime (Let's Encrypt) SSL installed itself after the domain connected; Force HTTPS on. |
| 7 | Verify | Claude | `https://infinite-box.co` 200, `https://www.` 200, `http://` → 301 https, page title + noindex tag confirmed via curl, screenshot in the pane renders logo/fonts/glow correctly. |
| 8 | Docs | Claude | PROJECT_PLAN Phase 9 ticks + status table; this file; memory updated. |

## Live state at handover

- **`https://infinite-box.co`** → coming-soon page (Hostinger, website `infinite-box.co`, FTP user `u327527817`)
- GoDaddy DNS: nameservers unchanged (`ns43/ns44.domaincontrol.com`); `A @ 145.79.26.182`, `CNAME www`, Resend records intact
- Supabase Auth: still Site URL `http://localhost:8790` (unchanged — store not live)
- Google OAuth app: still Testing (unchanged)
- No DB / Edge Function changes this session

## Gotchas noted this session

- Hostinger's onboarding hides the plain-HTML option under "For advanced users → Upload your
  PHP or HTML"; "Migrate" expects a backup+database and rejects a plain zip.
- Hostinger's File Manager "Extract" creates a folder named after the zip; move the contents
  up afterwards.
- **Do not accept Hostinger's nameserver suggestion** (`atlas/hyperion.dns-parking.com`) —
  email records live at GoDaddy. Use the "Connect via DNS records" tab every time.
- `curl` on this Windows box can't negotiate TLS (schannel error) *before* a cert exists; once
  installed it works — an early `000` is not a page problem.

## Suggested next steps

1. **Finish Phase 9 when the store is ready:** File Manager → `public_html` → delete
   `index.html` + `assets/` → upload/extract `site/` at the root (incl. `admin/`, `robots.txt`,
   `sitemap.xml`). Then Supabase Site URL → `https://infinite-box.co`, publish the Google OAuth
   app, re-test login + checkout live, Search Console + brand verification.
2. Optional now that the domain answers: Google Search Console verification (DNS TXT at
   GoDaddy or HTML file in `public_html`) — it survives the store upload.
3. Coming-soon email capture is still not collected anywhere (Phase 10 item) — decide before
   sharing the URL widely, or accept that signups are lost.
4. User content: legal placeholders in `privacy.html` / `terms.html`; Phase 13 Stripe live keys.
5. Push `main` when the user says so.
