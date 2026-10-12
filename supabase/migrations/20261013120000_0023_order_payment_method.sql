-- How the customer chose to pay in the cart: 'card' (Stripe card, incl. Apple/Google Pay) or
-- 'promptpay' (Thai bank-app QR, delivery in Thailand only). Set by create-checkout-session;
-- null on orders placed before PromptPay existed.
alter table public.orders
  add column if not exists payment_method text
  check (payment_method in ('card', 'promptpay'));
