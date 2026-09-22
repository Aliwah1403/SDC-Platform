import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { enqueueCareLocationEnrichment } from "../_shared/trigger-care-location-enrichment.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Unauthorized" }, 401);
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return json({ error: "Unauthorized" }, 401);

  let body: { locationId?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  if (typeof body.locationId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.locationId)) {
    return json({ error: "A valid care location is required" }, 400);
  }

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceRoleKey) return json({ error: "Background enrichment is unavailable" }, 503);
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey, {
    auth: { persistSession: false },
  });
  const { data: location, error: locationError } = await admin
    .from("saved_facilities")
    .select("id,user_id,name,address,phone,website,lat,lng,source_url,enrichment_status,enrichment_requested_at")
    .eq("id", body.locationId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (locationError) return json({ error: "Could not read care location" }, 500);
  if (!location) return json({ error: "Care location not found" }, 404);
  if (!location.source_url || !location.name ||
    (!(Number.isFinite(location.lat) && Number.isFinite(location.lng)) && !location.address)) {
    return json({ queued: false, reason: "insufficient_identity" });
  }
  if (location.phone && location.website) {
    return json({ queued: false, reason: "no_missing_fields" });
  }
  const requestedAt = location.enrichment_requested_at
    ? Date.parse(location.enrichment_requested_at)
    : Number.NaN;
  const activeRequestIsFresh = ["pending", "processing"].includes(location.enrichment_status) &&
    Number.isFinite(requestedAt) && Date.now() - requestedAt < 2 * 60 * 1000;
  if (activeRequestIsFresh) {
    return json({ queued: true, alreadyQueued: true, status: location.enrichment_status });
  }

  const requestId = crypto.randomUUID();
  const now = new Date().toISOString();
  const { error: pendingError } = await admin
    .from("saved_facilities")
    .update({
      enrichment_status: "pending",
      enrichment_request_id: requestId,
      enrichment_requested_at: now,
      enrichment_started_at: null,
      enrichment_completed_at: null,
      enrichment_suggestions: null,
      enrichment_error_code: null,
    })
    .eq("id", location.id)
    .eq("user_id", user.id);
  if (pendingError) return json({ error: "Could not queue enrichment" }, 500);

  try {
    const run = await enqueueCareLocationEnrichment(location.id, user.id, requestId);
    return json({ queued: true, runId: run.id, status: "pending" }, 202);
  } catch (error) {
    console.error("queue-care-location-enrichment error:", error instanceof Error ? error.message : "unknown");
    await admin
      .from("saved_facilities")
      .update({
        enrichment_status: "failed",
        enrichment_completed_at: new Date().toISOString(),
        enrichment_error_code: "queue_unavailable",
      })
      .eq("id", location.id)
      .eq("enrichment_request_id", requestId);
    return json({ error: "Could not queue enrichment" }, 503);
  }
});
