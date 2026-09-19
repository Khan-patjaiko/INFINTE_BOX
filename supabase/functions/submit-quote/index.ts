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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const form = await req.formData();
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const material = String(form.get("material") ?? "");
    const quantity = parseInt(String(form.get("quantity") ?? "1"), 10) || 1;
    const details = String(form.get("details") ?? "");
    const file = form.get("file");

    if (!name || !email) return json({ error: "Name and email are required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Optionally attach the logged-in user.
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader && !authHeader.includes(ANON_KEY)) {
      const anon = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data } = await anon.auth.getUser();
      if (data?.user) userId = data.user.id;
    }

    // Upload the design file (if any) to the private bucket.
    let fileUrl: string | null = null;
    if (file && file instanceof File && file.size > 0) {
      if (file.size > 50 * 1024 * 1024) return json({ error: "File too large (max 50MB)" }, 400);
      const ext = (file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${crypto.randomUUID()}.${ext}`;
      const buf = new Uint8Array(await file.arrayBuffer());
      const { error: upErr } = await admin.storage
        .from("custom-uploads")
        .upload(path, buf, { contentType: file.type || "application/octet-stream" });
      if (upErr) throw upErr;
      fileUrl = path;
    }

    const { error } = await admin.from("quote_requests").insert({
      user_id: userId,
      name,
      email,
      material,
      quantity,
      details,
      file_url: fileUrl,
    });
    if (error) throw error;

    return json({ ok: true });
  } catch (e) {
    console.error("submit-quote error", e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
