import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@17.7.0?target=denonext";

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
        const { error } = await admin.from("orders").update(update).eq("id", orderId);
        if (error) throw error;
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
