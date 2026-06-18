import { createClient } from "jsr:@supabase/supabase-js@2";
import { generateObject } from "npm:ai@4";
import { createAnthropic } from "npm:@ai-sdk/anthropic@1";
import { z } from "npm:zod@3";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AiInsightsSchema = z.object({
  insights: z.array(
    z.object({
      metric: z.string().describe("The health metric this insight covers — e.g. 'Pain', 'Hydration', 'Medications', 'Symptoms', 'Sleep'"),
      headline: z.string().describe("A single-sentence headline naming the key finding"),
      detail: z.string().describe("2–4 sentences of clinical interpretation. Be factual, specific, and flag anything worth discussing at an appointment"),
      tone: z.enum(["success", "warning", "danger", "info"]).describe("'danger' = immediate clinical concern, 'warning' = worth monitoring, 'info' = neutral note, 'success' = positive finding"),
    }),
  ).min(2).max(6),
});

const SYSTEM_PROMPT = `You are a clinical summarisation assistant for a sickle cell disease health app called Hemo.

Your role is to interpret patient health data into concise, clinically relevant language suitable for a haematologist or GP.

Rules:
- Write in third person (e.g. "The patient...", "Pain levels were...")
- Be factual, not alarming
- Do not diagnose
- Do not recommend stopping or changing any prescribed medication
- Flag patterns that a clinician would find worth discussing at an appointment
- Keep each detail to 2–4 sentences
- Cover: pain trends, hydration, medication adherence, notable symptoms/triggers, and any other significant pattern
- Assign tone accurately: danger = requires immediate clinical attention, warning = notable concern worth monitoring, info = neutral observation, success = positive or stable finding`;

function buildUserPrompt(snapshot: Record<string, unknown>, periodDays: number): string {
  const profile = (snapshot.profile as Record<string, unknown>) ?? {};
  const stats = (snapshot.stats as Record<string, unknown>) ?? {};
  const dateRange = (snapshot.dateRange as { start: string; end: string }) ?? {};
  const medications = (snapshot.medications as Array<Record<string, unknown>>) ?? [];
  const topSymptoms = (snapshot.topSymptoms as Array<{ name: string; count: number }>) ?? [];
  const topTriggers = (snapshot.topTriggers as Array<{ name: string; count: number }>) ?? [];
  const healthLogs = (snapshot.healthLogs as Array<Record<string, unknown>>) ?? [];
  const patientNote = snapshot.patientNote as string | undefined;

  // Derive high-pain days from logs
  const highPainDays = healthLogs.filter((l) => (l.pain_level as number) >= 7).length;
  const zeroPainDays = healthLogs.filter((l) => (l.pain_level as number) === 0).length;

  // Hydration compliance (goal = 8 glasses)
  const hydrationGoalDays = healthLogs.filter((l) => (l.hydration as number) >= 8).length;

  // Build medication adherence lines
  const activeMeds = medications.filter((m) => m.is_active);
  const medLines = activeMeds.map((m) => {
    const adherence = m.adherence as { taken: number; scheduled: number } | null;
    if (!adherence || adherence.scheduled === 0) return `- ${m.name} (${m.dosage ?? "no dose"}): adherence data unavailable`;
    const pct = Math.round((adherence.taken / adherence.scheduled) * 100);
    return `- ${m.name} (${m.dosage ?? "no dose"}, ${m.frequency ?? "unknown frequency"}): ${adherence.taken}/${adherence.scheduled} doses (${pct}%)`;
  });

  const symptomLines = topSymptoms.slice(0, 5).map((s) => `- ${s.name}: ${s.count} occurrences`);
  const triggerLines = topTriggers.slice(0, 5).map((t) => `- ${t.name}: ${t.count} occurrences`);

  return `Patient SCD type: ${profile.scd_type ?? "not specified"}
Period: ${dateRange.start} to ${dateRange.end} (${periodDays} days)
Days logged: ${stats.totalDaysLogged ?? 0} of ${periodDays}

KEY STATS
- Average pain: ${stats.avgPain != null ? `${stats.avgPain}/10` : "no data"}
- High-pain days (≥7): ${highPainDays}
- Zero-pain days: ${zeroPainDays}
- Average hydration: ${stats.avgHydration != null ? `${stats.avgHydration}/10 glasses` : "no data"}
- Hydration goal met (≥8 glasses): ${hydrationGoalDays}/${healthLogs.length} logged days
- Average mood: ${stats.avgMood != null ? `${stats.avgMood}/10` : "no data"}
- Average sleep: ${stats.avgSleep != null ? `${stats.avgSleep} hrs` : "no data"}
- Average steps: ${stats.avgSteps != null ? Math.round(stats.avgSteps as number).toLocaleString() : "no data"}
- Average heart rate: ${stats.avgHeartRate != null ? `${stats.avgHeartRate} bpm` : "no data"}

MEDICATIONS (${activeMeds.length} active)
${medLines.length > 0 ? medLines.join("\n") : "No active medications recorded"}

TOP SYMPTOMS
${symptomLines.length > 0 ? symptomLines.join("\n") : "No symptoms recorded"}

TOP TRIGGERS
${triggerLines.length > 0 ? triggerLines.join("\n") : "No triggers recorded"}
${patientNote ? `\nPATIENT NOTE TO DOCTOR\n"${patientNote}"` : ""}

Generate 3–5 clinical insights covering the most relevant patterns in this data. Prioritise anything a clinician would want to discuss at an appointment.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY not configured");

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

    const { token } = await req.json();
    if (!token || typeof token !== "string") {
      return new Response(
        JSON.stringify({ data: null, error: "token is required" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: row, error: fetchError } = await supabase
      .from("export_tokens")
      .select("user_id, mode, expires_at, period_days, data_snapshot")
      .eq("token", token)
      .single();

    if (fetchError || !row) {
      return new Response(
        JSON.stringify({ data: null, error: "Token not found" }),
        { status: 404, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }
    if (row.user_id !== user.id) {
      return new Response(
        JSON.stringify({ data: null, error: "Unauthorized" }),
        { status: 403, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }
    if (row.mode !== "health_summary") {
      return new Response(
        JSON.stringify({ data: null, error: "Token is not a health_summary" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }
    if (new Date(row.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ data: null, error: "Token has expired" }),
        { status: 410, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const snapshot = row.data_snapshot as Record<string, unknown>;

    // Already generated — return cached result
    if (Array.isArray(snapshot.aiInsights) && snapshot.aiInsights.length > 0) {
      return new Response(
        JSON.stringify({ data: { insights: snapshot.aiInsights, cached: true }, error: null }),
        { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const periodDays: number = row.period_days ?? 30;
    const userPrompt = buildUserPrompt(snapshot, periodDays);

    const anthropic = createAnthropic({ apiKey: anthropicKey });
    const startTime = Date.now();

    let result: { object: { insights: unknown[] }; usage: { promptTokens: number; completionTokens: number } };
    let modelUsed = "claude-haiku-4-5-20251001";

    try {
      result = await generateObject({
        model: anthropic("claude-haiku-4-5-20251001"),
        schema: AiInsightsSchema,
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
      }) as typeof result;
    } catch (_haikuError) {
      modelUsed = "claude-sonnet-4-6";
      result = await generateObject({
        model: anthropic("claude-sonnet-4-6"),
        schema: AiInsightsSchema,
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
      }) as typeof result;
    }

    const latencyMs = Date.now() - startTime;
    const insights = result.object.insights;

    // Persist insights into the token's data_snapshot
    const updatedSnapshot = { ...snapshot, aiInsights: insights };
    const { error: updateError } = await supabase
      .from("export_tokens")
      .update({ data_snapshot: updatedSnapshot })
      .eq("token", token);

    if (updateError) {
      console.error("Failed to persist aiInsights:", updateError.message);
    }

    return new Response(
      JSON.stringify({
        data: {
          insights,
          cached: false,
          meta: {
            model: modelUsed,
            inputTokens: result.usage.promptTokens,
            outputTokens: result.usage.completionTokens,
            latencyMs,
          },
        },
        error: null,
      }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("generate-health-summary error:", err instanceof Error ? err.message.slice(0, 200) : "unknown");
    return new Response(
      JSON.stringify({ data: null, error: "Failed to generate health summary insights" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }
});
