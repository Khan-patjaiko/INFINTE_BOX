# Infinite Box — Handover #21 (2026-10-12)

Session #21. Started from Handover #20. Focus: **PromptPay for Thai customers** (Phase 18). Live and verified with a real payment and refund.

## Live state at session start (checked)

| Check | Reality |
|---|---|
| Git | `main` = `origin/main` (`cd81aef`) |
| Supabase | 0 orders, 2 users, 5 active products (new: Mazda 3 front bumper triangle cover, 4 variants × 5; Mazda phone mount stock 25) |
| Functions | Deployed checkout v19 / webhook v16 / submit-quote v10. The source matched the repo; Handover #20's "v17/v14/v8" just counted differently |

## What this session did

| # | Commit | Change |
|---|---|---|
| 1 | `5e1e7f7` | **Migration 0023** (live): `orders.payment_method` (`card` / `promptpay`; null on older orders). `create-checkout-session` takes `pay_method` and sets `payment_method_types: [payMethod]`. PromptPay is refused with 400 unless `ship_to = TH`. The receipt + owner alert show "Paid by: Card / PromptPay (QR)" (Thai: บัตร / พร้อมเพย์ (QR)) |
| 2 | `095368c` | **Cart**: when shipping to Thailand and signed in, there are two buttons: **Pay with PromptPay QR** (primary) and **Pay by card** (outline), plus a bank-app note. Abroad there is one Checkout button (card). The FAQ has "How can I pay?" and the terms mention PromptPay. Thai strings added; cache `?v=21` on cart/faq/order |
| 3 | `2823c3d` | Order page shows "Paid by …" once paid; Admin → Orders drawer has a **Payment** row |
| 4 | `b1121b1` | `get-order` returns `payment_method` (it whitelists fields, so the order page couldn't see it before) |
| 5 | `8e65278` | Owner request: cart note that bank apps show the receiver as **STRIPE PAYMENTS (THAILAND) LTD**, not INFINITE-BOX.CO (EN + TH); cart cache `?v=22` |

Deployed: `create-checkout-session` **v20**, `stripe-webhook` **v17**, `get-order` **v8**. The live cart sent no `pay_method` until the upload, so it stayed card-only in the meantime.

## Tests

**Sandbox** (owner swapped in the sandbox keys; PromptPay was on in the sandbox):

| Test | Result |
|---|---|
| PromptPay paid | Paid, `promptpay`, stock 3→2, receipt + alert sent, webhook 200; Stripe redirected to `success.html`; order page shows "Paid by PromptPay (QR)" |
| PromptPay QR expired | Stripe shows "The payment attempt expired" with a retry option; order stays pending, no stock taken, no emails |
| Card 4242 (owner entered it) | Paid, `card`, stock applied |
| PromptPay with `ship_to: JP` | 400, Thai message (tested against the deployed function with curl) |

Cleanup: all `cs_test_` orders deleted, stock restored.

Sandbox tip: Stripe's PromptPay "Simulate scan" opens a new tab, which Claude's browser pane blocks. Workaround:
1. Read the `payments.stripe.com/promptpay/instructions/…` iframe URL from the checkout page.
2. Open it in a second tab.
3. Catch the `window.open` URL, which is `…/payment_methods/test_payment?payment_attempt=…`.
4. Open that URL and click **Authorize** or **Expire Test Payment**.

**Live:**
- The owner created a **new restricted live key** (the old one wasn't saved anywhere) and put the live `whsec` back.
- The owner uploaded the files.
- Real PromptPay purchase from the owner's bank app: ฿149 (Mazda 3 bumper cover, Carbon Fiber / BM), `cs_live_` session, paid, webhook 200, receipt + alert, variant stock 5→4.
- **Refunded** in Stripe. For PromptPay refunds, Stripe emails the buyer for their bank account number first.
- Test order deleted and stock restored (5/5/5/5, total 20).
- The owner's 4 abandoned live checkouts (3 × BMW E90, 1 × W201) were deleted on request. **0 orders now.**
- Supabase security advisor: only the known Pro-only leaked-password warning.

## Facts worth knowing

- PromptPay ignores the statement descriptor: the bank app shows **STRIPE PAYMENTS (THAILAND) LTD**. The cart says so.
- PromptPay works only for Thai banks and THB; the code offers it only for Thai delivery.
- PromptPay confirms instantly (`checkout.session.completed` arrives paid). The webhook (v14+) also handles `async_payment_succeeded` / `async_payment_failed`.
- **To test again without real money:** sandbox `sk_test` / `whsec` into the two Supabase secrets, test, then back to live. The live key is now the **new** restricted key; the owner should delete the old "Infinite Box – Supabase" key in Stripe if not done yet.

## Deploy

**Uploaded by the owner and verified identical to local:** `cart.html`, `faq.html`, `order.html`, `terms.html`, `th/cart.html`, `th/faq.html`, `th/order.html`, `assets/js/i18n-th.js`, `admin/orders.html`.

**Receiver note** (`8e65278`, then owner's edits `ef4ba08` bold + Thai "แทน", `a408ed8` English "because we use Stripe as our secure payment gateway", `14cbcd4` Thai ends "เนื่องจากเราใช้ Stripe เป็นระบบรับชำระเงิน"): `cart.html`, `th/cart.html`, `assets/js/i18n-th.js` uploaded and verified identical to local.

## Open items

1. Owner: delete the old live restricted key ("Infinite Box – Supabase") in Stripe.
2. Owner proofreads `i18n/th.json` (new: payment strings) and the product Thai text.
3. Carried over:
   - Rich Results Test;
   - email spam re-check;
   - orphan Storage image;
   - FTP credentials for `deploy.sh`;
   - the 13-tile gallery's last row.

## Next session (#22) options

1. Services pages in both languages (รับปริ้น 3D, รับออกแบบชิ้นงาน, reverse engineering).
2. Thai Privacy/Terms (lawyer review advised).
3. Prerender product pages for crawlers.
4. Admin: mark orders shipped + a "your order shipped" email (with tracking number).
