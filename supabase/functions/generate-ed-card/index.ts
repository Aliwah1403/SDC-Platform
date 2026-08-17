import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WEB_BASE_URL = Deno.env.get("WEB_BASE_URL") ?? "https://hemo-scd.com";
const TTL_HOURS = 4;

function currentEnvironment() {
  const explicit = Deno.env.get("HEMO_APP_ENV") ?? Deno.env.get("APP_ENV");
  if (explicit === "staging" || explicit === "production") return explicit;
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  if (supabaseUrl.includes("pqwrxhqcgwrjazsurujm")) return "staging";
  return "production";
}

function buildPublicUrl(route: string, token: string) {
  const url = new URL(`${WEB_BASE_URL.replace(/\/+$/g, "")}/${route}/${token}`);
  if (currentEnvironment() === "staging") {
    url.searchParams.set("env", "staging");
  }
  return url.toString();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ data: null, error: "Unauthorized" }),
        { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ data: null, error: "Unauthorized" }),
        { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const today = new Date().toISOString().split("T")[0];
    const sixMonthsAgo = new Date(Date.now() - 180 * 86400 * 1000).toISOString().split("T")[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400 * 1000).toISOString().split("T")[0];

    const [profileResult, medicationsResult, contactsResult, healthLogsResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, dob, scd_type, blood_type, allergies, preferred_hospital, weight")
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("medications")
        .select("id, name, dosage, frequency, category, prescribed_by")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: true }),
      supabase
        .from("emergency_contacts")
        .select("id, name, relationship, phone")
        .eq("user_id", user.id)
        .order("is_primary", { ascending: false }),
      supabase
        .from("health_logs")
        .select("date, pain_level")
        .eq("user_id", user.id)
        .gte("date", sixMonthsAgo)
        .lte("date", today)
        .order("date", { ascending: false }),
    ]);

    const NO_ROWS = "PGRST116";
    if (profileResult.error && profileResult.error.code !== NO_ROWS) {
      console.error("profile query failed:", profileResult.error);
      return new Response(JSON.stringify({ data: null, error: "Data fetch failed" }), {
        status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
    if (medicationsResult.error || contactsResult.error || healthLogsResult.error) {
      console.error("query failed", medicationsResult.error ?? contactsResult.error ?? healthLogsResult.error);
      return new Response(JSON.stringify({ data: null, error: "Data fetch failed" }), {
        status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const profile = profileResult.data ?? {};
    const medications = medicationsResult.data ?? [];
    const contacts = contactsResult.data ?? [];
    const healthLogs = healthLogsResult.data ?? [];

    // Crisis episodes: pain >= 7
    const crisisLogs = healthLogs.filter((l) => (l.pain_level ?? 0) >= 7);
    const recentCrises = crisisLogs.slice(0, 5).map((l) => ({
      date: l.date,
      duration_hours: 0,
      peak_pain: l.pain_level,
    }));

    // Stats
    const last30 = healthLogs.filter((l) => l.date >= thirtyDaysAgo);
    const painVals = last30.map((l) => l.pain_level).filter((v) => v != null) as number[];
    const avgPainLast30Days = painVals.length > 0
      ? Math.round((painVals.reduce((a, b) => a + b, 0) / painVals.length) * 10) / 10
      : null;

    const cardData = {
      generatedAt: new Date().toISOString(),
      patient: {
        name: profile.full_name ?? "Patient",
        dob: profile.dob ?? "",
        scd_type: profile.scd_type ?? "Unknown",
        blood_type: profile.blood_type ?? null,
        allergies: Array.isArray(profile.allergies) ? profile.allergies : [],
        preferred_hospital: profile.preferred_hospital ?? null,
        weight_kg: profile.weight ?? null,
      },
      painPlan: {
        baseline_pain: avgPainLast30Days != null ? Math.round(avgPainLast30Days) : 0,
        effective_medications: medications.slice(0, 5).map((m) => ({
          name: m.name,
          dosage: m.dosage ?? "",
        })),
        medications_to_avoid: Array.isArray(profile.allergies) ? profile.allergies : [],
        individualized_notes: null,
      },
      medications: medications.map((m) => ({
        id: m.id,
        name: m.name,
        dosage: m.dosage ?? "",
        frequency: m.frequency ?? "",
        category: m.category ?? "Other",
        prescribed_by: m.prescribed_by ?? null,
      })),
      contacts: contacts.map((c) => ({
        id: c.id,
        name: c.name,
        relationship: c.relationship ?? "",
        phone: c.phone,
      })),
      recentCrises,
      stats: {
        crisesLast6Months: crisisLogs.length,
        lastCrisisDate: crisisLogs[0]?.date ?? null,
        avgPainLast30Days,
      },
    };

    // Revoke any existing active tokens for this user before issuing new one
    await supabase
      .from("ed_card_tokens")
      .update({ is_active: false })
      .eq("user_id", user.id)
      .eq("is_active", true);

    const expiresAt = new Date(Date.now() + TTL_HOURS * 3600 * 1000).toISOString();
    const { data: tokenRow, error: insertError } = await supabase
      .from("ed_card_tokens")
      .insert({ user_id: user.id, card_data: cardData, expires_at: expiresAt })
      .select("token")
      .single();

    if (insertError || !tokenRow) {
      console.error("insert error:", insertError?.message);
      return new Response(
        JSON.stringify({ data: null, error: "Failed to create ED card token" }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const route = "ed-card";
    const environment = currentEnvironment();
    const url = buildPublicUrl(route, tokenRow.token);
    return new Response(
      JSON.stringify({
        data: {
          token: tokenRow.token,
          route,
          environment,
          expiresAt,
          url,
        },
        error: null,
      }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("generate-ed-card error:", err instanceof Error ? err.message.slice(0, 200) : "unknown");
    return new Response(
      JSON.stringify({ data: null, error: "Internal server error" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }
});
