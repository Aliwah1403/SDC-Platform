import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { resolveMapsLink } from "./maps-link-parser.mjs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const JSON_HEADERS = { ...CORS_HEADERS, "Content-Type": "application/json" };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed", code: "method_not_allowed" }, 405);

  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > 4096) return json({ error: "Request too large", code: "request_too_large" }, 413);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Unauthorized", code: "unauthorized" }, 401);
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return json({ error: "Unauthorized", code: "unauthorized" }, 401);

  try {
    const rawBody = await req.text();
    if (new TextEncoder().encode(rawBody).byteLength > 4096) {
      return json({ error: "Request too large", code: "request_too_large" }, 413);
    }
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return json({ error: "Invalid JSON", code: "invalid_json" }, 400);
    }
    if (!body || typeof body.url !== "string") return json({ error: "A maps link is required", code: "url_required" }, 400);
    const data = await resolveMapsLink(body.url);
    return json({ data });
  } catch (error) {
    const code = typeof error?.code === "string" ? error.code : "resolve_failed";
    const status = ["unsupported_url", "url_required"].includes(code) ? 400 : 422;
    console.warn(`[resolve-care-location-link] ${code}`);
    return json({ error: error?.message || "Could not resolve this maps link", code }, status);
  }
});
