// Called by a Supabase Database Webhook on community_notifications INSERT.
// Fires a Novu push notification to the recipient — push is only sent on the
// first event (INSERT) so subsequent aggregated likes/replies don't spam.

const NOVU_API_URL = "https://api.novu.co/v1";
const WORKFLOW_ID = "community-activity";

function buildMessage(row: Record<string, unknown>): { title: string; body: string } | null {
  const actor = (row.actor_name as string | null) ?? "Someone";
  const type = row.type as string;

  if (type === "like") {
    return { title: "New like", body: `${actor} liked your post` };
  }
  if (type === "comment") {
    return { title: "New comment", body: `${actor} commented on your post` };
  }
  if (type === "reply") {
    return { title: "New reply", body: `${actor} replied to your comment` };
  }
  // category_post, system_poll, etc. — no push for these via this function
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const novuApiKey = Deno.env.get("NOVU_API_KEY");
    if (!novuApiKey) {
      console.error("[send-community-push] NOVU_API_KEY not configured");
      return new Response("Server misconfigured", { status: 500 });
    }

    // Supabase Database Webhooks send the record in { type, table, schema, record, old_record }
    const payload = await req.json();
    const row: Record<string, unknown> = payload?.record ?? payload;

    const userId = row.user_id as string | null;
    const postId = row.post_id as string | null;
    const type = row.type as string | null;

    if (!userId || !type) {
      return new Response("Missing user_id or type", { status: 400 });
    }

    const message = buildMessage(row);
    if (!message) {
      // Not a push-worthy event type
      return new Response(JSON.stringify({ skipped: true }), {
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
        to: { subscriberId: userId },
        payload: {
          title: message.title,
          body: message.body,
          postId: postId ?? null,
          type,
        },
      }),
    });

    if (!triggerRes.ok) {
      const body = await triggerRes.text();
      console.error(`[send-community-push] Novu trigger failed: status=${triggerRes.status} body=${body.slice(0, 300)}`);
      return new Response(JSON.stringify({ error: "Novu trigger failed" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[send-community-push]", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
