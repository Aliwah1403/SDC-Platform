import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const TRIGGER_URL = "https://api.trigger.dev/api/v1/tasks/welcome-email/trigger";

interface RegisteredPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: { id?: string; email?: string } | null;
}

function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
}

Deno.serve(async (request) => {
  const secret = Deno.env.get("REGISTERED_WEBHOOK_SECRET");
  const triggerKey = Deno.env.get("TRIGGER_SECRET_KEY");
  if (!secret || !triggerKey) {
    console.error("[registered-webhook] Required secrets are not configured");
    return new Response("Service misconfigured", { status: 500 });
  }

  const body = await request.text();
  const webhookSecret = request.headers.get("x-registered-webhook-secret");
  if (!webhookSecret || !timingSafeEqual(webhookSecret, secret)) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: RegisteredPayload;
  try {
    payload = JSON.parse(body);
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  if (payload.type !== "INSERT" || payload.table !== "users" || payload.schema !== "auth") {
    return Response.json({ ok: true });
  }

  const userId = payload.record?.id;
  if (!userId) return new Response("Missing user id", { status: 400 });

  const response = await fetch(TRIGGER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${triggerKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      payload: { userId },
      options: {
        delay: "10m",
        idempotencyKey: `welcome-email:${userId}`,
        tags: ["welcome-email", `user:${userId}`],
      },
    }),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    console.error(`[registered-webhook] Trigger.dev enqueue failed: ${response.status} ${detail}`);
    return new Response("Could not queue welcome email", { status: 502 });
  }

  return Response.json({ ok: true });
});
