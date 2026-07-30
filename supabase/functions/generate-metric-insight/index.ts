import { createClient } from "jsr:@supabase/supabase-js@2";
import { generateObject } from "npm:ai@4";
import { createAnthropic } from "npm:@ai-sdk/anthropic@1";
import { z } from "npm:zod@3";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const InsightSchema = z.object({
  headline: z.string().describe("A short, warm headline summarising the user's current metric status (1 sentence)"),
  paragraph: z.string().describe("A single flowing paragraph (2-3 sentences) giving context and 1-2 concrete, actionable tips — written as natural prose, not a list"),
});

const SYSTEM_PROMPT = `You are a compassionate health coach inside Hemo, a mobile app for people living with Sickle Cell Disease (SCD).

Your job: generate a personalised, actionable health insight for a specific metric based on the user's current data.

Rules:
- Write in a warm, encouraging, non-alarmist tone
- Use "you" and "your" language
- Be specific to SCD — mention relevant SCD context (e.g. dehydration triggering crises, pain management, fatigue)
- Headlines should be reassuring even when values are poor — focus on what the user can do
- The paragraph must be short and scannable: 2-3 sentences, no bullet points, no headings, no colons-as-labels
- Weave in 1-2 concrete, immediately actionable tips as part of the natural sentence flow, not a list
- Never suggest stopping prescribed medication or ignoring a doctor's advice
- If the metric is outside a healthy range, be empathetic — acknowledge it's hard before offering guidance
- Keep the whole paragraph under ~45 words`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response("Unauthorized", { status: 401 });

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) return new Response("Unauthorized", { status: 401 });

    const { metric, currentValue, statusLabel, trendDelta, lowerIsBetter, range, unit, goal, scdType } = await req.json();

    if (!metric || currentValue == null || !statusLabel) {
      return new Response(JSON.stringify({ data: null, error: "metric, currentValue, and statusLabel are required", meta: null }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const trendDescription = trendDelta == null
      ? "no trend data available"
      : lowerIsBetter
        ? trendDelta > 0 ? `worsening (up ${Math.abs(trendDelta).toFixed(1)} ${unit})` : `improving (down ${Math.abs(trendDelta).toFixed(1)} ${unit})`
        : trendDelta < 0 ? `worsening (down ${Math.abs(trendDelta).toFixed(1)} ${unit})` : `improving (up ${Math.abs(trendDelta).toFixed(1)} ${unit})`;

    const userPrompt = `Metric: ${metric}
Current value: ${currentValue} ${unit}
Status: ${statusLabel}
Trend over last ${range} days: ${trendDescription}
Goal: ${goal != null ? `${goal} ${unit}` : "not set"}
User's SCD type: ${scdType || "not specified"}

Generate a personalised insight card for this metric.`;

    const anthropic = createAnthropic({ apiKey: anthropicKey });
    const startTime = Date.now();

    let object: z.infer<typeof InsightSchema>;
    let usage: { promptTokens: number; completionTokens: number };
    let modelUsed = "claude-haiku-4-5-20251001";

    try {
      const result = await generateObject({
        model: anthropic("claude-haiku-4-5-20251001"),
        schema: InsightSchema,
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
      });
      object = result.object;
      usage = result.usage;
    } catch (_haikusError) {
      modelUsed = "claude-sonnet-4-6";
      const result = await generateObject({
        model: anthropic("claude-sonnet-4-6"),
        schema: InsightSchema,
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
      });
      object = result.object;
      usage = result.usage;
    }

    const latencyMs = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        data: object,
        error: null,
        meta: {
          model: modelUsed,
          inputTokens: usage.promptTokens,
          outputTokens: usage.completionTokens,
          cacheReadTokens: 0,
          latencyMs,
        },
      }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("generate-metric-insight error:", err instanceof Error ? err.message.slice(0, 200) : "unknown");
    return new Response(
      JSON.stringify({ data: null, error: "Failed to generate metric insight", meta: null }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }
});
