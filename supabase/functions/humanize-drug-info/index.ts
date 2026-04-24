import { createClient } from "jsr:@supabase/supabase-js@2";
import { generateObject } from "npm:ai@4";
import { createAnthropic } from "npm:@ai-sdk/anthropic@1";
import { z } from "npm:zod@3";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HumanizedDrugSchema = z.object({
  commonName: z.string().describe("The name patients commonly know this drug by, including brand names in brackets"),
  humanizedIndications: z.string().describe("Plain English: what this medication treats and why it helps"),
  humanizedMechanism: z.string().nullable().describe("How the drug works, explained simply in 1-2 sentences"),
  humanizedSideEffects: z.string().describe("The most common side effects in simple terms"),
  humanizedWarnings: z.string().describe("Important warnings rewritten in patient-friendly language"),
  humanizedInteractions: z.string().nullable().describe("Key drug interactions explained simply, or null if none known"),
  scdContraindication: z.object({
    flagged: z.boolean(),
    reason: z.string().nullable().describe("Why this drug may be a concern for SCD patients, or null"),
  }),
});

const SYSTEM_PROMPT = `You are a medical information simplifier for Hemo, a health app for people living with Sickle Cell Disease (SCD).

Your job: transform dense clinical FDA drug label text into clear, warm, patient-friendly language.

Rules:
- Write at an 8th-grade reading level
- Use "you" and "your" language ("This medication helps you..." not "The patient...")
- Keep each field to 2–4 sentences maximum — be concise
- For commonName: give the name patients actually use. Example: "Hydroxyurea (also known as Hydrea or Droxia)" not just the USAN name. If the input name is already a common name, keep it
- For scdContraindication: flag=true if the drug may worsen SCD symptoms, trigger vaso-occlusive crises, or is contraindicated for SCD patients (e.g. vasoconstrictors, NSAIDs in renal complications, certain decongestants). flag=false if it is safe or is a standard SCD treatment
- If a raw field is null or empty, write a brief helpful placeholder like "No information available for this medication"
- Do not invent specific dosage numbers or medical facts — only simplify what is provided`;

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

    const body = await req.json();
    const { drugName, rawIndications, rawSideEffects, rawWarnings, rawInteractions, rawMechanism, clinicalName } = body;

    if (!drugName) {
      return new Response(JSON.stringify({ data: null, error: "drugName required", meta: null }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const anthropic = createAnthropic({ apiKey: anthropicKey });
    const startTime = Date.now();

    const userPrompt = `Drug name: ${clinicalName || drugName}

Indications (what it treats): ${rawIndications || "Not available"}

Mechanism of action: ${rawMechanism || "Not available"}

Side effects: ${rawSideEffects || "Not available"}

Warnings: ${rawWarnings || "Not available"}

Drug interactions: ${rawInteractions || "Not available"}

Simplify all fields for a Sickle Cell Disease patient.`;

    let object: z.infer<typeof HumanizedDrugSchema>;
    let usage: { promptTokens: number; completionTokens: number };
    let modelUsed = "claude-haiku-4-5-20251001";

    try {
      const result = await generateObject({
        model: anthropic("claude-haiku-4-5-20251001"),
        schema: HumanizedDrugSchema,
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
      });
      object = result.object;
      usage = result.usage;
    } catch {
      // Fallback to Sonnet if Haiku fails validation
      modelUsed = "claude-sonnet-4-6";
      const result = await generateObject({
        model: anthropic("claude-sonnet-4-6"),
        schema: HumanizedDrugSchema,
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
      });
      object = result.object;
      usage = result.usage;
    }

    const latencyMs = Date.now() - startTime;

    // Write humanized fields back to the shared cache using service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    await supabaseAdmin
      .from("drug_info_cache")
      .update({
        common_name: object.commonName,
        humanized_indications: object.humanizedIndications,
        humanized_mechanism: object.humanizedMechanism,
        humanized_side_effects: object.humanizedSideEffects,
        humanized_warnings: object.humanizedWarnings,
        humanized_interactions: object.humanizedInteractions,
        scd_contraindication: object.scdContraindication,
        humanized_at: new Date().toISOString(),
      })
      .ilike("drug_name", drugName.toLowerCase().trim());

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
    console.error("humanize-drug-info error:", err instanceof Error ? err.message.slice(0, 200) : "unknown");
    return new Response(
      JSON.stringify({ data: null, error: "Failed to humanize drug information", meta: null }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }
});
