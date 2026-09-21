// Contact form → contact_messages + owner alert email.
// Replaces the browser-side insert so a notification can be sent server-side.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { button, esc, kv, layout, nl2br, sendOwnerAlert, SITE_URL } from "../_shared/email.ts";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name ?? "").trim().slice(0, 200);
    const email = String(body.email ?? "").trim().slice(0, 320);
    const subject = String(body.subject ?? "").trim().slice(0, 300);
    const message = String(body.message ?? "").trim().slice(0, 10000);

    if (!name || !email || !message) return json({ error: "Name, email and message are required" }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Invalid email" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: row, error } = await admin.from("contact_messages")
      .insert({ name, email, subject: subject || null, message })
      .select("id").single();
    if (error) throw error;

    await sendOwnerAlert({
      subject: `New message from ${name}${subject ? ": " + subject : ""}`,
      replyTo: email,
      html: layout("New contact message", kv([
        ["From", `${esc(name)} &lt;${esc(email)}&gt;`],
        ["Subject", esc(subject || "—")],
        ["Message", nl2br(message)],
      ]) + button(`${SITE_URL}/admin/messages.html`, "Open inbox")),
    });

    return json({ ok: true, id: row.id });
  } catch (e) {
    console.error("submit-contact error", e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
