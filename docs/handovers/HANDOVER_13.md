# Infinite Box — Handover #13 (2026-10-04)

Session #13. Started from Handover #12. Focus: **legal pages ready for launch** (Thailand / PDPA).

## Live state at session start (checked)

| Check | Handover #12 said | Reality |
|---|---|---|
| Git | local commits not pushed | Same: `main` 6 ahead of `origin/main` |
| Supabase | running | Awake: 0 orders, 2 users, 4 active products, 0 quotes/messages |

## Owner decisions

- Operator shown as **"Infinite Box"** (the owner prefers not to publish a personal name), address **345/316 Tambon Bang Khu Wat, Mueang Pathum Thani District, Pathum Thani 12000, Thailand**.
- Returns of catalogue items: **7 days** from delivery. Defects and damage must also be reported within **7 days**.
- **Ship within Thailand only.** International delivery is on request through the contact form.
- Retention: orders 5 years, quotes and messages 12 months. Quote validity: 14 days (default, not discussed).

## What this session did

| # | Commit | Change |
|---|---|---|
| 1 | `7950671` | **privacy.html / terms.html: all placeholders filled.** Privacy now covers the PDPA notice items: controller + address, legal basis per purpose, full provider list (Resend, ImprovMX and Hostinger added), transfers outside Thailand, the full list of rights including a complaint to the PDPC, breach notice, and minors under 20. Terms: Thai law and Thai courts, Thailand-only shipping, 7-day returns and defect claims, refunds within 15 days, 14-day quotes, no more "import duties". Both are dated 4 October 2026. |
| 2 | `60b8678` | FAQ "Do you ship internationally?" now says Thailand only. FAQ defect window changed from 14 to 7 days. The home strip "Ships worldwide" now reads "Ships across Thailand". Sitemap `lastmod` bumped. |
| 3 | `bf8de52` | `create-checkout-session` **v13**: Stripe accepts **TH** shipping addresses only. The deployed v12 matched the repo before the edit. Smoke test: OPTIONS 200, GET 405, anon POST 401. |

| 4 | `7edd14c` | Privacy §10 renamed **"Younger customers"**, worded for all ages: everyone may browse, and under-20s need a parent's or guardian's consent to create an account or order (PDPA §20 + Civil Code minors). Kept rather than removed at the owner's request. |
| 5 | `01dea62` | Product page spec values are **left-aligned** (this also affects the Contact page info box). Below 480px each label sits above its value. **Mobile overflow fix:** `.product-detail > * { min-width: 0 }`. The Mazda 6-photo thumbnail strip had widened the page to 496px at 375px; it now scrolls inside its column. |
| 6 | `0e5ac93` | List-type specs (several values separated by ` \| ` in Admin → Products, e.g. "Compatible with") always sit **under** their label (`.pd-meta-stack`). Single values stay beside the label on desktop. |

Verified in the preview: 0 `.placeholder` spans on both legal pages, no "worldwide" left in the pages, no console errors.

## Open items for the owner

- **This is template-quality wording, not legal advice.** A Thai lawyer's quick review before or soon after launch is worth it.
- **DBD e-commerce registration** (Commercial Registration Act) is generally required for online sellers. Check with an accountant. Once registered, put the registered name or number on both legal pages (PDPA expects an identifiable controller; "Infinite Box" is acceptable for now).
- Carried over from #12: the orphan storage image; the ImprovMX green badge plus a test mail.

## Next session (launch day, unchanged from #12)

1. "push main" → run the keep-awake workflow once and confirm it is green.
2. Zip the `site/` contents → the owner uploads them to Hostinger `public_html` (delete the coming-soon `index.html` + `assets/` first).
3. Supabase Auth Site URL → `https://infinite-box.co`; Google Auth Platform → Publish app.
4. Live re-test: login (email + Google), a `4242` checkout with a Thai address → paid + receipt (Reply-To = owner) + stock decrement; then restore stock and delete the order.
