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

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  return `${local[0]}***@${domain}`;
}

Deno.serve(async (req: Request) => {
  // Verify the request comes from Supabase database webhook
  const webhookSecret = Deno.env.get("WAITLIST_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.error("[waitlist-welcome] WAITLIST_WEBHOOK_SECRET not configured");
    return new Response("Service misconfigured", { status: 500 });
  }
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${webhookSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

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

  const { email, source, created_at } = payload.record;
  if (!email) {
    console.error("[waitlist-welcome] Missing email in record");
    return new Response(JSON.stringify({ error: "Missing email" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const signedUpAt = created_at
    ? new Date(created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC"
    : new Date().toISOString();

  const sendEmail = async (payload: object, label: string): Promise<void> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const body = await res.text();
        console.error(`[waitlist-welcome] ${label} Resend error: status=${res.status} body=${body.slice(0, 300)}`);
        return;
      }
      console.log(`[waitlist-welcome] ${label} sent`);
    } catch (err) {
      clearTimeout(timeoutId);
      const message = controller.signal.aborted ? "timed out" : "failed";
      console.error(`[waitlist-welcome] ${label} ${message}`, err);
    }
  };

  const adminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL")?.trim();

  const sends: Promise<void>[] = [
    sendEmail(
      { to: [email], template: { id: "waitlist-email" } },
      `Welcome email to ${maskEmail(email)}`,
    ),
  ];

  if (adminEmail) {
    sends.push(
      sendEmail(
        {
          to: [adminEmail],
          template: { id: "admin-waitlist-notification" },
          variables: {
            SIGNUP_EMAIL: email,
            SOURCE: source || "landing-page",
            SIGNED_UP_AT: signedUpAt,
          },
        },
        "Admin waitlist notification",
      ),
    );
  } else {
    console.log("[waitlist-welcome] ADMIN_NOTIFICATION_EMAIL not set, skipping admin notify");
  }

  await Promise.all(sends);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
