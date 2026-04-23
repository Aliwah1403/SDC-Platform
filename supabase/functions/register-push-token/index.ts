import { createClient } from "jsr:@supabase/supabase-js@2";

const NOVU_API_URL = "https://api.novu.co/v1";

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
    if (!novuApiKey) throw new Error("NOVU_API_KEY not configured");

    // Authenticate the caller via Supabase JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response("Unauthorized", { status: 401 });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return new Response("Unauthorized", { status: 401 });

    const { expoPushToken, platform } = await req.json();
    if (!expoPushToken) return new Response("Missing expoPushToken", { status: 400 });

    const novuHeaders = {
      "Content-Type": "application/json",
      "Authorization": `ApiKey ${novuApiKey}`,
    };

    // Upsert Novu subscriber (idempotent)
    const subscriberRes = await fetch(`${NOVU_API_URL}/subscribers`, {
      method: "POST",
      headers: novuHeaders,
      body: JSON.stringify({
        subscriberId: user.id,
        email: user.email,
      }),
    });
    if (!subscriberRes.ok) {
      const body = await subscriberRes.text();
      console.error(`[register-push-token] Novu upsert subscriber failed: status=${subscriberRes.status} body=${body.slice(0, 200)}`);
      return new Response(JSON.stringify({ error: "Failed to upsert Novu subscriber" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Register Expo push token on the subscriber
    const credentialsRes = await fetch(`${NOVU_API_URL}/subscribers/${user.id}/credentials`, {
      method: "PATCH",
      headers: novuHeaders,
      body: JSON.stringify({
        providerId: "expo",
        credentials: { deviceTokens: [expoPushToken] },
      }),
    });
    if (!credentialsRes.ok) {
      const body = await credentialsRes.text();
      console.error(`[register-push-token] Novu credentials update failed: status=${credentialsRes.status} body=${body.slice(0, 200)}`);
      return new Response(JSON.stringify({ error: "Failed to update Novu credentials" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Persist token in Supabase for reference
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { error: upsertError } = await serviceClient.from("push_tokens").upsert(
      { user_id: user.id, expo_push_token: expoPushToken, platform, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
    if (upsertError) {
      console.error(`[register-push-token] push_tokens upsert failed: ${upsertError.message}`);
      return new Response(JSON.stringify({ error: "Failed to persist push token" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[register-push-token]", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
