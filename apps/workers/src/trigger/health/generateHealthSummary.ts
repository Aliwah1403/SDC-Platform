import { AbortTaskRunError, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";
import { supabase } from "../../lib/supabase";

const AiInsightsSchema = z.object({
  insights: z.array(z.object({
    metric: z.string(),
    headline: z.string(),
    detail: z.string(),
    tone: z.enum(["success", "warning", "danger", "info"]),
  })).min(2).max(6),
});

const SYSTEM_PROMPT = `You are a clinical summarisation assistant for a sickle cell disease health app called Hemo.

Interpret patient health data into concise, clinically relevant language suitable for a haematologist or GP.
- Write in third person.
- Be factual, not alarming, and do not diagnose.
- Do not recommend stopping or changing prescribed medication.
- Flag patterns a clinician would find worth discussing.
- Cover pain, hydration, medication adherence, symptoms/triggers, and other significant patterns.
- Use danger only for immediate clinical concern, warning for something worth monitoring, info for neutral notes, and success for positive or stable findings.`;

function formatMl(ml: number | null | undefined): string {
  if (ml == null) return "no data";
  return ml >= 1000 ? `${(ml / 1000).toFixed(1)} L` : `${Math.round(ml)} ml`;
}

function buildUserPrompt(
  snapshot: Record<string, any>,
  periodDays: number,
  healthLogs: Array<Record<string, any>>,
): string {
  const profile = snapshot.profile ?? {};
  const stats = snapshot.stats ?? {};
  const dateRange = snapshot.dateRange ?? {};
  const medications = Array.isArray(snapshot.medications) ? snapshot.medications : [];
  const topSymptoms = Array.isArray(snapshot.topSymptoms) ? snapshot.topSymptoms : [];
  const topTriggers = Array.isArray(snapshot.topTriggers) ? snapshot.topTriggers : [];
  const highPainDays = healthLogs.filter((l) => l.pain_level >= 7).length;
  const zeroPainDays = healthLogs.filter((l) => l.pain_level === 0).length;
  const hydrationGoalMl = snapshot.goals?.hydration ?? 2000;
  const hydrationGoalDays = healthLogs.filter((l) => l.hydration >= hydrationGoalMl).length;
  const activeMeds = medications.filter((m: any) => m.is_active);
  const medLines = activeMeds.map((m: any) => {
    const adherence = m.adherence;
    if (!adherence || adherence.scheduled === 0) return `- ${m.name} (${m.dosage ?? "no dose"}): adherence unavailable`;
    const pct = Math.round((adherence.taken / adherence.scheduled) * 100);
    return `- ${m.name} (${m.dosage ?? "no dose"}, ${m.frequency ?? "unknown frequency"}): ${adherence.taken}/${adherence.scheduled} doses (${pct}%)`;
  });

  return `Patient SCD type: ${profile.scd_type ?? "not specified"}
Period: ${snapshot.periodLabel ? `${snapshot.periodLabel} — ` : ""}${dateRange.start} to ${dateRange.end} (${periodDays} days)
Days logged: ${stats.totalDaysLogged ?? 0} of ${periodDays}

KEY STATS
- Average pain: ${stats.avgPain != null ? `${stats.avgPain}/10` : "no data"}
- High-pain days (≥7): ${highPainDays}
- Zero-pain days: ${zeroPainDays}
- Average fluid intake: ${formatMl(stats.avgHydration)} per day
- Fluid goal met (≥${formatMl(hydrationGoalMl)}): ${hydrationGoalDays}/${healthLogs.length} logged days
- Average mood: ${stats.avgMood != null ? `${stats.avgMood}/10` : "no data"}
- Average sleep: ${stats.avgSleep != null ? `${stats.avgSleep} hrs` : "no data"}
- Average steps: ${stats.avgSteps != null ? Math.round(stats.avgSteps).toLocaleString() : "no data"}
- Average heart rate: ${stats.avgHeartRate != null ? `${stats.avgHeartRate} bpm` : "no data"}

MEDICATIONS (${activeMeds.length} active)
${medLines.length ? medLines.join("\n") : "No active medications recorded"}

TOP SYMPTOMS
${topSymptoms.length ? topSymptoms.slice(0, 5).map((s: any) => `- ${s.name}: ${s.count} occurrences`).join("\n") : "No symptoms recorded"}

TOP TRIGGERS
${topTriggers.length ? topTriggers.slice(0, 5).map((t: any) => `- ${t.name}: ${t.count} occurrences`).join("\n") : "No triggers recorded"}
${snapshot.patientNote ? `\nPATIENT NOTE TO DOCTOR\n"${snapshot.patientNote}"` : ""}

Generate 3–5 clinical insights covering the most relevant patterns in this data.`;
}

async function generateInsights(apiKey: string, model: string, prompt: string) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2_000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `${prompt}\n\nReturn only valid JSON matching this shape: {"insights":[{"metric":"string","headline":"string","detail":"string","tone":"success|warning|danger|info"}]}` }],
    }),
  });
  if (!response.ok) throw new Error(`Anthropic request failed (${response.status})`);
  const body = await response.json() as { content?: Array<{ type: string; text?: string }> };
  const text = body.content?.find((part) => part.type === "text")?.text;
  if (!text) throw new Error("Anthropic response did not contain text");
  const jsonText = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
  return AiInsightsSchema.parse(JSON.parse(jsonText));
}

export const generateHealthSummary = schemaTask({
  id: "generate-health-summary",
  retry: { maxAttempts: 3, minTimeoutInMs: 2_000, maxTimeoutInMs: 30_000, factor: 2 },
  schema: z.object({ exportTokenId: z.string().uuid() }),
  run: async ({ exportTokenId }) => {
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY not configured");

    const { data: row, error } = await supabase
      .from("export_tokens")
      .select("id, user_id, mode, expires_at, period_days, data_snapshot, is_active")
      .eq("id", exportTokenId)
      .single();
    if (error || !row) throw new AbortTaskRunError("Export token not found");
    if (row.mode !== "health_summary" || !row.is_active || new Date(row.expires_at) < new Date()) {
      return { skipped: true, reason: "token-not-active" };
    }

    const snapshot = (row.data_snapshot ?? {}) as Record<string, any>;
    if (Array.isArray(snapshot.aiInsights) && snapshot.aiInsights.length > 0) {
      return { cached: true, insightCount: snapshot.aiInsights.length };
    }

    const dateRange = snapshot.dateRange ?? {};
    let healthLogs = Array.isArray(snapshot.healthLogs) ? snapshot.healthLogs : [];
    if (healthLogs.length === 0 && dateRange.start && dateRange.end) {
      const { data } = await supabase
        .from("health_logs")
        .select("date, pain_level, symptoms, mood, hydration, triggers")
        .eq("user_id", row.user_id)
        .gte("date", dateRange.start)
        .lte("date", dateRange.end)
        .order("date", { ascending: true });
      healthLogs = data ?? [];
    }

    let result: z.infer<typeof AiInsightsSchema>;
    let model = "claude-haiku-4-5-20251001";
    try {
      result = await generateInsights(anthropicKey, model, buildUserPrompt(snapshot, row.period_days ?? 30, healthLogs));
    } catch {
      model = "claude-sonnet-4-6";
      result = await generateInsights(anthropicKey, model, buildUserPrompt(snapshot, row.period_days ?? 30, healthLogs));
    }

    const { error: updateError } = await supabase
      .from("export_tokens")
      .update({ data_snapshot: { ...snapshot, aiInsights: result.insights } })
      .eq("id", exportTokenId);
    if (updateError) throw updateError;

    return { cached: false, model, insightCount: result.insights.length };
  },
});
