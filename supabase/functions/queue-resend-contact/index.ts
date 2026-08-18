import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { enqueueResendContact } from "../_shared/trigger-resend-contact.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return json({ error: "Unauthorized" }, 401);
    const { data: profile, error: profileError } = await supabase
      .from("profiles").select("onboarding_complete").eq("user_id", user.id).single();
    if (profileError || !profile?.onboarding_complete) return json({ error: "Onboarding is not complete" }, 400);
    const run = await enqueueResendContact("general", user.id);
    return json({ ok: true, queued: true, runId: run.id }, 202);
  } catch (error) {
    console.error("queue-resend-contact error:", error instanceof Error ? error.message : "unknown");
    return json({ error: "Could not queue contact sync" }, 503);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
}
