import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_URL = "https://api.resend.com/emails";

interface WaitlistRecord {
  id: number;
  email: string;
  source: string;
  created_at: string;
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: WaitlistRecord;
  schema: string;
  old_record: WaitlistRecord | null;
}

Deno.serve(async (req: Request) => {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.error("[waitlist-welcome] RESEND_API_KEY not configured");
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

  if (payload.type !== "INSERT" || payload.table !== "waitlist_signups") {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { email } = payload.record;
  if (!email) {
    console.error("[waitlist-welcome] Missing email in record");
    return new Response(JSON.stringify({ error: "Missing email" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: [email],
      template: { id: "waitlist-email" },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[waitlist-welcome] Resend error: status=${res.status} body=${body.slice(0, 300)}`);
    return new Response(JSON.stringify({ error: "Failed to send email" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log(`[waitlist-welcome] Sent welcome email to ${email}`);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
