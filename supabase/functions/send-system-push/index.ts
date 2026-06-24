// Called by a Supabase Database Webhook on system_notifications INSERT.
// Triggers a Novu push notification to the recipient via the system-notification workflow.

const NOVU_API_URL = "https://api.novu.co/v1";
const WORKFLOW_ID = "system-notification";

interface SystemNotificationRecord {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: SystemNotificationRecord;
  schema: string;
  old_record: SystemNotificationRecord | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  const webhookSecret = Deno.env.get("SYSTEM_PUSH_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.error("[send-system-push] SYSTEM_PUSH_WEBHOOK_SECRET not configured");
    return new Response("Service misconfigured", { status: 500 });
  }
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${webhookSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const novuApiKey = Deno.env.get("NOVU_API_KEY");
  if (!novuApiKey) {
    console.error("[send-system-push] NOVU_API_KEY not configured");
    return new Response("Service misconfigured", { status: 500 });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  if (payload.type !== "INSERT" || payload.table !== "system_notifications") {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const record = payload.record;
  if (!record?.user_id || !record?.title || !record?.body) {
    console.error("[send-system-push] Missing required fields in record");
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const triggerRes = await fetch(`${NOVU_API_URL}/events/trigger`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `ApiKey ${novuApiKey}`,
    },
    body: JSON.stringify({
      name: WORKFLOW_ID,
      to: { subscriberId: record.user_id },
      payload: {
        title: record.title,
        body: record.body,
        type: record.type,
        data: record.data ?? {},
      },
    }),
  });

  if (!triggerRes.ok) {
    const body = await triggerRes.text();
    console.error(`[send-system-push] Novu trigger failed: status=${triggerRes.status} body=${body.slice(0, 300)}`);
    return new Response(JSON.stringify({ error: "Novu trigger failed" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log(`[send-system-push] Notification sent to user ${record.user_id} type=${record.type}`);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
