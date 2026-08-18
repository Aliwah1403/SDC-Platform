import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ data: null, error: "Unauthorized" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return json({ data: null, error: "Unauthorized" }, 401);

    const { token } = await req.json();
    if (!token || typeof token !== "string") return json({ data: null, error: "token is required" }, 400);

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: row, error } = await serviceClient
      .from("export_tokens")
      .select("id, user_id, mode, expires_at, is_active, data_snapshot")
      .eq("token", token)
      .single();
    if (error || !row) return json({ data: null, error: "Token not found" }, 404);
    if (row.user_id !== user.id) return json({ data: null, error: "Unauthorized" }, 403);
    if (row.mode !== "health_summary") return json({ data: null, error: "Token is not a health_summary" }, 400);
    if (!row.is_active) return json({ data: null, error: "Token has been revoked" }, 403);
    if (new Date(row.expires_at) < new Date()) return json({ data: null, error: "Token has expired" }, 410);

    const snapshot = row.data_snapshot as Record<string, unknown>;
    if (Array.isArray(snapshot?.aiInsights) && snapshot.aiInsights.length > 0) {
      return json({ data: { insights: snapshot.aiInsights, cached: true }, error: null });
    }

    const triggerKey = Deno.env.get("TRIGGER_SECRET_KEY");
    if (!triggerKey) throw new Error("TRIGGER_SECRET_KEY not configured");
    const triggerResponse = await fetch(
      "https://api.trigger.dev/api/v1/tasks/generate-health-summary/trigger",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${triggerKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: { exportTokenId: row.id },
          options: { idempotencyKey: `health-summary:${row.id}`, tags: ["feature:health-summary"] },
        }),
      },
    );
    if (!triggerResponse.ok) {
      const detail = await triggerResponse.text();
      console.error("Trigger.dev enqueue failed:", detail.slice(0, 300));
      throw new Error("Failed to enqueue health summary");
    }
    const run = await triggerResponse.json();
    return json({ data: { queued: true, runId: run.id, token }, error: null }, 202);
  } catch (err) {
    console.error("generate-health-summary enqueue error:", err instanceof Error ? err.message : "unknown");
    return json({ data: null, error: "Failed to queue health summary insights" }, 503);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}
