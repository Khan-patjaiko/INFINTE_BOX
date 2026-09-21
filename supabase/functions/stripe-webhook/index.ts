import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@17.7.0?target=denonext";
import {
  addressLines, button, esc, kv, layout, money, sendEmail, sendOwnerAlert, SITE_URL,
} from "../_shared/email.ts";

const cryptoProvider = Stripe.createSubtleCryptoProvider();
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey || !webhookSecret) {
    return new Response("Stripe not configured", { status: 503 });
  }
  const stripe = new Stripe(stripeKey, {
    apiVersion: "2024-06-20",
    httpClient: Stripe.createFetchHttpClient(),
  });

  const signature = req.headers.get("stripe-signature");
  const body = await req.text();
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body, signature, webhookSecret, undefined, cryptoProvider,
    );
  } catch (err) {
    console.error("Signature verification failed", err);
    return new Response(`Webhook Error: ${(err as Error).message}`, { status: 400 });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id ?? session.client_reference_id;
      if (orderId) {
        const update: Record<string, unknown> = {
          status: "paid",
          stripe_payment_intent: (session.payment_intent as string) ?? null,
        };
        const details = session.customer_details;
        if (details?.email) update.email = details.email;
        // Stripe 17 exposes the collected address under session.shipping_details
        // (older API versions) or customer_details.address; take whichever is set.
        const ship = (session as unknown as { shipping_details?: { name?: string; address?: unknown } }).shipping_details;
        const address = ship?.address ?? details?.address ?? null;
        if (address) {
          update.shipping_address = {
            name: ship?.name ?? details?.name ?? null,
            phone: details?.phone ?? null,
            ...(address as Record<string, unknown>),
          };
        }
        // Only the delivery that flips pending → paid gets a row back; Stripe retries
        // and duplicate deliveries see none and skip the emails below.
        const { data: paidRows, error } = await admin.from("orders").update(update)
          .eq("id", orderId).eq("status", "pending").select("*");
        if (error) throw error;
        // Reduce stock for the items sold (idempotent per order; see migration 0011).
        const { error: stockErr } = await admin.rpc("decrement_order_stock", { p_order_id: orderId });
        if (stockErr) throw stockErr;

        if (paidRows && paidRows.length) await sendOrderEmails(admin, paidRows[0]);
      }
    } else if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id ?? session.client_reference_id;
      if (orderId) {
        await admin.from("orders").update({ status: "cancelled" })
          .eq("id", orderId).eq("status", "pending");
      }
    }
  } catch (e) {
    console.error("Webhook handling error", e);
    return new Response("Handler error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});

// Customer receipt + owner alert. Never throws (sendEmail swallows errors).
async function sendOrderEmails(
  admin: ReturnType<typeof createClient>,
  order: Record<string, unknown>,
) {
  const { data: items } = await admin.from("order_items")
    .select("name, qty, unit_price_cents, options").eq("order_id", order.id as string);
  const id8 = String(order.id).slice(0, 8);
  const total = money(order.total_cents as number);

  const optionText = (o: unknown) => {
    const rec = (o && typeof o === "object") ? o as Record<string, unknown> : {};
    return Object.keys(rec).map((k) => `${esc(k)}: ${esc(rec[k])}`).join(" · ");
  };
  const itemRows = (items ?? []).map((it) =>
    `<tr><td style="padding:6px 0;">${esc(it.name)} × ${it.qty}${optionText(it.options) ? `<br><span style="color:#78716c;font-size:12px;">${optionText(it.options)}</span>` : ""}</td>` +
    `<td style="padding:6px 0;text-align:right;">${money(it.unit_price_cents * it.qty)}</td></tr>`
  ).join("");
  const summary = `<table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;font-size:14px;border-top:1px solid #e7e5e4;margin-top:12px;">
    ${itemRows}
    <tr><td style="padding:6px 0;border-top:1px solid #e7e5e4;color:#78716c;">Subtotal</td><td style="padding:6px 0;border-top:1px solid #e7e5e4;text-align:right;">${money(order.subtotal_cents as number)}</td></tr>
    <tr><td style="padding:6px 0;color:#78716c;">Shipping</td><td style="padding:6px 0;text-align:right;">${money(order.shipping_cents as number)}</td></tr>
    <tr><td style="padding:8px 0;font-weight:700;border-top:1px solid #e7e5e4;">Total</td><td style="padding:8px 0;font-weight:700;text-align:right;border-top:1px solid #e7e5e4;">${total}</td></tr>
  </table>`;
  const addr = addressLines(order.shipping_address as Record<string, unknown> | null);
  const addrBlock = addr ? `<p style="margin:16px 0 4px;color:#78716c;font-size:14px;">Shipping to</p><p style="margin:0;font-size:14px;">${addr}</p>` : "";

  const email = String(order.email ?? "");
  if (email && email !== "guest@pending") {
    const link = order.stripe_session_id
      ? `${SITE_URL}/order.html?session_id=${encodeURIComponent(String(order.stripe_session_id))}`
      : `${SITE_URL}/order.html?id=${encodeURIComponent(String(order.id))}`;
    await sendEmail({
      to: email,
      subject: `Order ${id8} confirmed — Infinite Box`,
      html: layout(`Thanks for your order`, `
        <p style="margin:0 0 8px;font-size:15px;">We've received your payment for order <strong>${id8}</strong> and will start printing shortly. You'll hear from us again when it ships.</p>
        ${summary}${addrBlock}
        ${button(link, "View your order")}
        <p style="margin:16px 0 0;font-size:13px;color:#78716c;">Questions? Reply to this email or write to hello@infinite-box.co.</p>`),
    });
  }

  await sendOwnerAlert({
    subject: `New order ${id8} · ${total}`,
    replyTo: email && email !== "guest@pending" ? email : undefined,
    html: layout(`New paid order ${id8}`, `
      ${kv([["Customer", esc(email)], ["Order id", esc(String(order.id))], ["Stripe PI", esc(String(order.stripe_payment_intent ?? ""))]])}
      ${summary}${addrBlock}
      ${button(`${SITE_URL}/admin/orders.html`, "Open in admin")}`),
  });
}
