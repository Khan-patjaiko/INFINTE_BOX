import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@17.7.0?target=denonext";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
// Store currency: Thai baht. All *_cents values are satang (Stripe treats THB as 2-decimal).
const CURRENCY = "thb";
// Flat-rate shipping lives in store_settings.shipping_cents, waived once the subtotal reaches
// store_settings.free_shipping_threshold_cents (migrations 0008 / 0013). These are only the
// fallbacks if those rows are missing or unreadable.
const DEFAULT_SHIPPING_CENTS = 5000;
const DEFAULT_FREE_SHIPPING_FROM_CENTS = 80000;
// Countries Stripe Checkout will accept a shipping address for. Edit freely.
const SHIP_TO = [
  "US", "CA", "GB", "IE", "AU", "NZ", "TH", "SG", "MY", "JP", "KR", "HK",
  "DE", "FR", "NL", "BE", "ES", "IT", "PT", "AT", "CH", "SE", "NO", "DK", "FI",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) return json({ error: "Payments are not configured yet. Please try again later." }, 503);
  const stripe = new Stripe(stripeKey, {
    apiVersion: "2024-06-20",
    httpClient: Stripe.createFetchHttpClient(),
  });

  try {
    const { items, origin } = await req.json();
    if (!Array.isArray(items) || items.length === 0) return json({ error: "Cart is empty" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: settingRows } = await admin.from("store_settings")
      .select("key,value").in("key", ["shipping_cents", "free_shipping_threshold_cents"]);
    const setting = (key: string, fallback: number) => {
      const v = (settingRows ?? []).find((r: { key: string }) => r.key === key)?.value;
      return Number.isInteger(v) && (v as number) >= 0 ? v as number : fallback;
    };
    const flatShippingCents = setting("shipping_cents", DEFAULT_SHIPPING_CENTS);
    const freeShippingFromCents = setting("free_shipping_threshold_cents", DEFAULT_FREE_SHIPPING_FROM_CENTS);

    // Checkout requires a signed-in customer (no guest orders): every order is tied to
    // an account so it shows up in account.html and the customer gets the receipt.
    let userId: string | null = null;
    let userEmail: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader && !authHeader.includes(ANON_KEY)) {
      const anon = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data } = await anon.auth.getUser();
      if (data?.user) {
        userId = data.user.id;
        userEmail = data.user.email ?? null;
      }
    }
    if (!userId || !userEmail) return json({ error: "Please log in to check out." }, 401);

    // Authoritative price lookup by slug (never trust client prices).
    const slugs = items.map((i: { id: string }) => i.id);
    const { data: products, error: pErr } = await admin
      .from("products").select("*").in("slug", slugs).eq("active", true);
    if (pErr) throw pErr;

    const bySlug = new Map((products ?? []).map((p: { slug: string }) => [p.slug, p]));
    const lineItems: unknown[] = [];
    const orderItems: { product_id: string; name: string; unit_price_cents: number; qty: number; options: Record<string, string> }[] = [];
    const soldOut: string[] = [];
    let subtotal = 0;

    type OptionGroup = { name: string; values: string[] };
    type ProductRow = { id: string; slug: string; name: string; price_cents: number; stock: number; options?: OptionGroup[] };
    // Several cart lines may point at one product (different options): stock is checked on the sum.
    const qtyByProduct = new Map<string, number>();
    for (const i of items) {
      const p = bySlug.get(i.id) as ProductRow | undefined;
      if (!p) continue;
      qtyByProduct.set(p.id, (qtyByProduct.get(p.id) ?? 0) + Math.max(1, parseInt(String(i.qty), 10) || 1));
    }
    const overStock = new Set<string>();
    for (const [pid, total] of qtyByProduct) {
      const p = [...bySlug.values()].find((x) => (x as ProductRow).id === pid) as ProductRow;
      // Stock is authoritative here; the cart page only mirrors it for UX.
      if (total > (p.stock ?? 0)) { overStock.add(pid); soldOut.push(p.stock > 0 ? `${p.name} (only ${p.stock} left)` : `${p.name} (sold out)`); }
    }

    for (const i of items) {
      const p = bySlug.get(i.id) as ProductRow | undefined;
      if (!p || overStock.has(p.id)) continue;
      const qty = Math.max(1, parseInt(String(i.qty), 10) || 1);
      // Options: every group the product defines must have a value from its list; anything
      // else the client sent is dropped.
      const groups = Array.isArray(p.options) ? p.options : [];
      const sent = (i.options && typeof i.options === "object") ? i.options as Record<string, unknown> : {};
      const options: Record<string, string> = {};
      for (const g of groups) {
        const v = String(sent[g.name] ?? "");
        if (!g.values.includes(v)) return json({ error: `Please choose ${g.name} for ${p.name}.` }, 400);
        options[g.name] = v;
      }
      const optionText = Object.keys(options).map((k) => `${k}: ${options[k]}`).join(" · ");
      subtotal += p.price_cents * qty;
      lineItems.push({
        quantity: qty,
        price_data: {
          currency: CURRENCY,
          unit_amount: p.price_cents,
          product_data: { name: p.name, ...(optionText ? { description: optionText } : {}), metadata: { slug: p.slug, ...options } },
        },
      });
      orderItems.push({ product_id: p.id, name: p.name, unit_price_cents: p.price_cents, qty, options });
    }
    if (soldOut.length) return json({ error: "Not enough stock: " + soldOut.join(", ") + ". Please update your cart.", sold_out: soldOut }, 409);
    if (lineItems.length === 0) return json({ error: "No valid items in cart" }, 400);

    const shippingCents = freeShippingFromCents > 0 && subtotal >= freeShippingFromCents ? 0 : flatShippingCents;
    const total = subtotal + shippingCents;

    const { data: order, error: oErr } = await admin.from("orders").insert({
      user_id: userId,
      email: userEmail,
      status: "pending",
      subtotal_cents: subtotal,
      shipping_cents: shippingCents,
      total_cents: total,
    }).select().single();
    if (oErr) throw oErr;

    const { error: iErr } = await admin.from("order_items")
      .insert(orderItems.map((oi) => ({ ...oi, order_id: order.id })));
    if (iErr) throw iErr;

    const baseUrl = (typeof origin === "string" && origin.startsWith("http")) ? origin : SUPABASE_URL;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems as never,
      customer_email: userEmail,
      // Flat-rate shipping shown as a proper shipping line, and collect the address.
      shipping_options: [{
        shipping_rate_data: {
          type: "fixed_amount",
          display_name: shippingCents === 0 ? "Free shipping" : "Standard shipping",
          fixed_amount: { amount: shippingCents, currency: CURRENCY },
        },
      }],
      shipping_address_collection: { allowed_countries: SHIP_TO as never },
      phone_number_collection: { enabled: true },
      success_url: `${baseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cancel.html`,
      client_reference_id: order.id,
      metadata: { order_id: order.id },
    });

    await admin.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);

    return json({ url: session.url });
  } catch (e) {
    console.error("create-checkout-session error", e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
