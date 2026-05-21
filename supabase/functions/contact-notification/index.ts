import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_URL = "https://api.resend.com/emails";
const ADMIN_EMAIL = "hemocell00@gmail.com";

interface ContactRecord {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: ContactRecord;
  schema: string;
  old_record: ContactRecord | null;
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

Deno.serve(async (req: Request) => {
  const webhookSecret = Deno.env.get("CONTACT_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.error("[contact-notification] CONTACT_WEBHOOK_SECRET not configured");
    return new Response("Service misconfigured", { status: 500 });
  }
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${webhookSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.error("[contact-notification] RESEND_API_KEY not configured");
    return new Response(JSON.stringify({ error: "Email service not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  if (payload.type !== "INSERT" || payload.table !== "contact_submissions") {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!payload.record || typeof payload.record !== "object") {
    return new Response(JSON.stringify({ error: "Invalid payload: missing record" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id: submissionId, first_name, last_name, email, subject, message, created_at } = payload.record;
  if (!email || !first_name || !subject || !message) {
    console.error("[contact-notification] Missing required fields in record");
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  let res: Response;
  try {
    res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: [ADMIN_EMAIL],
        reply_to: email,
        template: {
          id: "admin-contact-notification",
          variables: {
            SENDER_FIRST_NAME: first_name,
            SENDER_LAST_NAME: last_name,
            SENDER_EMAIL: email,
            SUBJECT: subject,
            MESSAGE: message,
            SUBMITTED_AT: formatDate(created_at),
          },
        },
      }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    const message = controller.signal.aborted ? "Resend request timed out" : "Resend request failed";
    console.error(`[contact-notification] ${message}`, err);
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
  clearTimeout(timeoutId);

  if (!res.ok) {
    const body = await res.text();
    console.error(`[contact-notification] Resend error: status=${res.status} body=${body.slice(0, 300)}`);
    return new Response(JSON.stringify({ error: "Failed to send email" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log(`[contact-notification] Admin notification sent for submission ${submissionId}`);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
