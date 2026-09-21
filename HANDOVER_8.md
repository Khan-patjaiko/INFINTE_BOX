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
| 8 | Password conditions checklist | Claude (user request) | Replaced the hint sentence with a live "Password conditions" checklist on `signup.html` and `reset-password.html` (shared `IBAuth.attachPasswordRules` in `auth.js`, `.pw-rules` CSS): 8–50 chars, ≥1 uppercase, ≥1 lowercase, ≥1 number, ≥1 symbol, plus a Confirm-password field (new on signup) with a live "Passwords do not match" error. Submit stays disabled until all pass; handlers re-check before calling Supabase. Verified in the pane (weak / mismatch / match / too-long states). **Client-side only** — server-side enforcement is Supabase → Auth → Email → *Password Requirements* (free plan, not turned on). |

## Commits (4, on top of `d4038ab`)

```
d6c781d Live password-conditions checklist on signup and reset
c5f3d9d Password hints: suggest a mix of upper/lower/number/symbol
9285f36 Signup: require 8-character passwords to match reset page and Auth setting
44586e2 Footer: real Facebook / Instagram / Line profile URLs
```
plus the docs commit for this handover. **Not pushed** — the user pushes on request.

## Live state at end of session (verified via SQL)

- `auth.users`: 1 (`khanleenine@gmail.com`, provider google, admin)
- `orders`: 1 (`4ea2920d`, paid — the owner's own test; kept deliberately)
- `quote_requests` / `contact_messages`: 0
- `products`: 8; stock all **0** except Custom Enclosure = 1 → store still shows "Sold out"
- `store_settings`: `shipping_cents = 650`, 5 categories
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
2. **User content:** stock counts + product photos (Admin → Products — now reachable with the
   Google account), legal placeholders in `privacy.html` / `terms.html`.
3. Optional: Supabase → Auth → Email → Password Requirements → letters+digits+symbols.
4. Phase 13: Stripe live keys + real purchase/refund test.
5. `push main` when ready.
