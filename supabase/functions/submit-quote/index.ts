import { createClient } from "jsr:@supabase/supabase-js@2";
import { button, esc, kv, layout, nl2br, sendEmail, sendOwnerAlert, SITE_URL } from "../_shared/email.ts";

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

    const { data: row, error } = await admin.from("quote_requests").insert({
      user_id: userId,
      name,
      email,
      material,
      quantity,
      details,
      file_url: fileUrl,
    }).select("id").single();
    if (error) throw error;

    // Notifications (never throw; see _shared/email.ts).
    const id8 = String(row.id).slice(0, 8);
    const summary = kv([
      ["Name", esc(name)],
      ["Email", esc(email)],
      ["Material", esc(material || "—")],
      ["Quantity", esc(String(quantity))],
      ["Design file", fileUrl ? "attached (download from admin)" : "none"],
      ["Details", nl2br(details || "—")],
    ]);
    await sendOwnerAlert({
      subject: `New custom quote request ${id8} from ${name}`,
      replyTo: email,
      html: layout(`New quote request ${id8}`, summary + button(`${SITE_URL}/admin/quotes.html`, "Open in admin")),
    });
    await sendEmail({
      to: email,
      subject: "We received your custom order request — Infinite Box",
      html: layout(`Thanks, ${name}`, `
        <p style="margin:0 0 8px;font-size:15px;">We've received your custom order request (ref <strong>${id8}</strong>) and will review it and reply with a quote, usually within 2 business days.</p>
        ${summary}
        <p style="margin:16px 0 0;font-size:13px;color:#78716c;">Need to add something? Just reply to this email.</p>`),
    });

    return json({ ok: true, id: row.id });
  } catch (e) {
    console.error("submit-quote error", e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
