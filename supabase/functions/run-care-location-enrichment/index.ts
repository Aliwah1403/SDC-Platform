import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { enrichCareLocation } from "../resolve-care-location-link/facility-enrichment.ts";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = req.headers.get("Authorization");
  if (!serviceRoleKey || authorization !== `Bearer ${serviceRoleKey}`) {
    return json({ error: "Unauthorized" }, 401);
  }
  let body: { locationId?: unknown; userId?: unknown; requestId?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const isUuid = (value: unknown) => typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value);
  if (!isUuid(body.locationId) || !isUuid(body.userId) || !isUuid(body.requestId)) {
    return json({ error: "Invalid enrichment request" }, 400);
  }

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey, {
    auth: { persistSession: false },
  });
  const { data: location, error } = await admin
    .from("saved_facilities")
    .select("id,user_id,name,address,lat,lng,country_code,source_provider,source_url,provider_place_id,enrichment_request_id,enrichment_status")
    .eq("id", body.locationId)
    .eq("user_id", body.userId)
    .eq("enrichment_request_id", body.requestId)
    .maybeSingle();
  if (error) return json({ error: "Could not read care location" }, 500);
  if (!location) return json({ error: "Care location request is stale", code: "stale_request" }, 409);
  if (!["pending", "processing"].includes(location.enrichment_status)) {
    return json({ error: "Care location request is no longer active", code: "stale_request" }, 409);
  }

  const parsed = {
    provider: location.source_provider,
    name: location.name,
    address: location.address,
    lat: location.lat,
    lng: location.lng,
    countryCode: location.country_code,
    sourceUrl: location.source_url,
    providerPlaceId: location.provider_place_id,
    confidence: {
      name: location.name ? "high" : "unavailable",
      address: location.address ? "high" : "unavailable",
      coordinates: Number.isFinite(location.lat) && Number.isFinite(location.lng) ? "high" : "unavailable",
    },
  };

  const geminiEnabled = Deno.env.get("CARE_LOCATION_GEMINI_ENABLED") === "true";
  const geoapifyEnabled = Deno.env.get("CARE_LOCATION_GEOAPIFY_ENABLED") === "true";
  if (!geminiEnabled && !geoapifyEnabled) {
    return json({ error: "Care location enrichment is disabled", code: "disabled" }, 503);
  }

  try {
    const enrichment = await enrichCareLocation(parsed, {
      apiKey: Deno.env.get("GEOAPIFY_API_KEY"),
      geminiApiKey: Deno.env.get("GEMINI_API_KEY"),
      geminiModel: Deno.env.get("CARE_LOCATION_GEMINI_MODEL") || "gemini-3.6-flash",
      geminiEnabled,
      adminClient: admin,
      userId: location.user_id,
      ip: null,
      geminiRateLimitSalt: Deno.env.get("CARE_LOCATION_GEMINI_RATE_LIMIT_SALT") || Deno.env.get("GEMINI_RATE_LIMIT_SALT"),
      rateLimitSalt: Deno.env.get("GEOAPIFY_RATE_LIMIT_SALT"),
    });
    return json({ data: enrichment });
  } catch (enrichmentError) {
    console.error(`run-care-location-enrichment: ${enrichmentError?.code || "unavailable"}`);
    return json({ error: "Care location enrichment was unavailable", code: "provider_unavailable" }, 503);
  }
});
