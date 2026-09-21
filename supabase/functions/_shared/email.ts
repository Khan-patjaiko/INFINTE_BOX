// Transactional email via Resend (https://resend.com/docs/api-reference/emails/send-email).
// Shared by stripe-webhook, submit-quote and submit-contact.
//
// sendEmail() NEVER throws: a failed or disabled email must not fail the caller
// (a 500 from stripe-webhook would make Stripe retry and re-run the handler).
// Secrets (Supabase → Edge Functions → Secrets):
//   RESEND_API_KEY  — from resend.com; unset = emails disabled (logged, not an error)
//   EMAIL_FROM      — e.g. "Infinite Box <orders@infinite-box.co>" (needs a verified domain;
//                     "onboarding@resend.dev" works for testing to the Resend account owner)
//   OWNER_EMAIL     — where new-order / new-quote / new-message alerts go

export const SITE_URL = "https://infinite-box.co";
export const OWNER_EMAIL = Deno.env.get("OWNER_EMAIL") ?? null;

export interface EmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface EmailResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function sendEmail(input: EmailInput): Promise<EmailResult> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("EMAIL_FROM") ?? "Infinite Box <onboarding@resend.dev>";
  if (!apiKey) {
    console.warn("email disabled (RESEND_API_KEY not set); skipped:", input.subject);
    return { ok: false, error: "disabled" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: Array.isArray(input.to) ? input.to : [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text ?? htmlToText(input.html),
        reply_to: input.replyTo,
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("email send failed", res.status, body);
      return { ok: false, error: `${res.status} ${JSON.stringify(body)}` };
    }
    console.log("email sent", body.id, "→", input.to, "·", input.subject);
    return { ok: true, id: body.id };
  } catch (e) {
    console.error("email send error", e);
    return { ok: false, error: String((e as Error)?.message ?? e) };
  }
}

// Send the owner alert if OWNER_EMAIL is configured; otherwise log and skip.
export function sendOwnerAlert(input: Omit<EmailInput, "to">): Promise<EmailResult> {
  if (!OWNER_EMAIL) {
    console.warn("owner alert skipped (OWNER_EMAIL not set):", input.subject);
    return Promise.resolve({ ok: false, error: "no OWNER_EMAIL" });
  }
  return sendEmail({ ...input, to: OWNER_EMAIL });
}

// ---- Template helpers -------------------------------------------------------

export function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function money(cents: number | null | undefined): string {
  // Thai baht; whole amounts print without decimals (฿399, ฿1,299).
  return "฿" + ((cents ?? 0) / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function nl2br(s: unknown): string {
  return esc(s).replace(/\r?\n/g, "<br>");
}

// orders.shipping_address is the Stripe address object plus name/phone.
export function addressLines(addr: Record<string, unknown> | null | undefined): string {
  if (!addr) return "";
  const parts = [
    addr.name, addr.line1, addr.line2,
    [addr.city, addr.state, addr.postal_code].filter(Boolean).join(" "),
    addr.country, addr.phone,
  ].filter((p) => p && String(p).trim());
  return parts.map((p) => esc(p)).join("<br>");
}

// Minimal, inline-styled layout that renders in every mail client.
export function layout(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f5f5f4;font-family:Helvetica,Arial,sans-serif;color:#1c1917;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center">
<table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">
<tr><td style="background:#0c0a09;padding:20px 28px;">
  <a href="${SITE_URL}" style="color:#ffffff;text-decoration:none;font-size:18px;font-weight:700;letter-spacing:.02em;">Infinite Box</a>
</td></tr>
<tr><td style="padding:28px;">
  <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#ea580c;">${esc(title)}</h1>
  ${bodyHtml}
</td></tr>
<tr><td style="padding:16px 28px;background:#fafaf9;font-size:12px;color:#78716c;">
  Infinite Box · <a href="${SITE_URL}" style="color:#78716c;">${SITE_URL.replace("https://", "")}</a> · hello@infinite-box.co
</td></tr>
</table></td></tr></table></body></html>`;
}

export function button(href: string, label: string): string {
  return `<p style="margin:24px 0 8px;"><a href="${esc(href)}" style="display:inline-block;background:#ea580c;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">${esc(label)}</a></p>`;
}

export function kv(rows: Array<[string, string]>): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;font-size:14px;margin:12px 0;">` +
    rows.map(([k, v]) =>
      `<tr><td style="padding:6px 0;color:#78716c;vertical-align:top;width:140px;">${esc(k)}</td><td style="padding:6px 0;">${v}</td></tr>`
    ).join("") + `</table>`;
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|tr|h\d|div)>/gi, "\n")
    .replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n").trim();
}
