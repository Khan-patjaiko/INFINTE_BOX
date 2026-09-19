import { createClient } from "jsr:@supabase/supabase-js@2";

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

// Fields safe to return to the customer. Never send internal-only columns.
function pickOrder(o: Record<string, unknown>) {
  return {
    id: o.id,
    email: o.email,
    status: o.status,
    subtotal_cents: o.subtotal_cents,
    shipping_cents: o.shipping_cents,
    total_cents: o.total_cents,
    shipping_address: o.shipping_address,
    created_at: o.created_at,
    order_items: o.order_items,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { id, session_id } = await req.json();
    if (!id && !session_id) return json({ error: "Missing id or session_id" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Guest / just-paid lookup: the Stripe checkout session id acts as a one-time
    // capability token (long, random, only known to the browser that completed
    // checkout or an email receipt) — no sign-in required.
    if (session_id) {
      const { data, error } = await admin
        .from("orders").select("*, order_items(*)")
        .eq("stripe_session_id", session_id).maybeSingle();
      if (error) throw error;
      if (!data) return json({ error: "Order not found" }, 404);
      return json({ order: pickOrder(data) });
    }

    // Signed-in lookup by order id: caller must own the order or be an admin.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || authHeader.includes(ANON_KEY)) return json({ error: "Sign in required" }, 401);
    const anon = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await anon.auth.getUser();
    if (!userData?.user) return json({ error: "Sign in required" }, 401);

    const { data: order, error: oErr } = await admin
      .from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
    if (oErr) throw oErr;
    if (!order) return json({ error: "Order not found" }, 404);

    if (order.user_id !== userData.user.id) {
      const { data: profile } = await admin
        .from("profiles").select("is_admin").eq("id", userData.user.id).maybeSingle();
      if (!profile?.is_admin) return json({ error: "Not found" }, 404);
    }

    return json({ order: pickOrder(order) });
  } catch (e) {
    console.error("get-order error", e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
