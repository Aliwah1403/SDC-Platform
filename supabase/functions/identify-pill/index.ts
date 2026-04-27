import { generateObject } from "npm:ai@4";
import { createAnthropic } from "npm:@ai-sdk/anthropic@1";
import { z } from "npm:zod@3";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Step 1: extract raw text/visual data from the image
const ExtractedImageSchema = z.object({
  drugName: z.string().nullable().describe("Drug or brand name visible on packaging or imprinted on pill"),
  ndcCode: z.string().nullable().describe("NDC code if visible (format: XXXXX-XXXX-XX)"),
  strength: z.string().nullable().describe("Dosage strength visible e.g. '500mg', '1g', '250mg/5mL'"),
  imprintCode: z.string().nullable().describe("Text or code imprinted on the pill itself"),
  pillShape: z.string().nullable().describe("Shape: round, oval, capsule, oblong, etc."),
  pillColor: z.string().nullable().describe("Color(s) of the pill"),
  confidence: z.enum(["high", "medium", "low"]).describe("How clearly the medication can be identified from this image"),
});

// Step 2: structure into the final user-facing result
const IdentifiedPillSchema = z.object({
  name: z.string().describe("The medication name identified"),
  commonName: z.string().describe("The name patients commonly use, including brand names. E.g. 'Hydroxyurea (Hydrea)'"),
  strength: z.string().nullable().describe("Dosage strength e.g. '500mg', '1g'"),
  form: z.string().nullable().describe("Tablet, capsule, liquid, etc."),
  indication: z.string().describe("What this medication treats, in plain English (2-3 sentences max)"),
  scdWarning: z.object({
    flagged: z.boolean(),
    reason: z.string().nullable().describe("Why this may be a concern for SCD patients, or null if safe"),
  }),
});

const VISION_SYSTEM_PROMPT = `You are a medication identification assistant. Your job is to extract any visible text and visual details from a photo of a medication package, bottle, or pill.

Look carefully for:
- Brand name or generic drug name (on the label or imprinted on the pill)
- NDC code (typically on packaging, format: XXXXX-XXXX-XX)
- Dosage strength (e.g. 500mg, 1g)
- Imprint codes on pills (letters/numbers stamped directly on the pill)
- Pill shape and color if visible

Return exactly what you can see — do not guess or invent information. If you cannot confidently read text, set the relevant field to null. Set confidence to 'low' if the image is blurry, poorly lit, or shows no readable text.`;

const STRUCTURE_SYSTEM_PROMPT = `You are a medical information assistant for Hemo, a health app for people with Sickle Cell Disease (SCD).

Given extracted medication details, provide:
1. The medication's common name (what patients call it, including brand names in brackets)
2. A plain-English indication (what it treats) at 8th-grade reading level, using "you/your" language
3. An SCD safety assessment — flag=true if the drug may worsen SCD symptoms, trigger vaso-occlusive crises, or is contraindicated for SCD patients (e.g. vasoconstrictors, certain NSAIDs in renal complications, decongestants). flag=false for standard SCD treatments or generally safe medications.

Be concise. Do not invent dosage numbers or clinical facts beyond what is generally known about the drug.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response("Unauthorized", { status: 401 });

    const body = await req.json();
    const { imageBase64, mimeType = "image/jpeg" } = body;

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ data: null, error: "imageBase64 required", meta: null }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const client = createAnthropic({ apiKey: anthropicKey });
    const startTime = Date.now();

    // Normalise mimeType — Claude only accepts jpeg, png, gif, webp. iOS often gives heic.
    const SUPPORTED = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const safeMimeType = SUPPORTED.includes(mimeType) ? mimeType : "image/jpeg";

    // Strip whitespace — expo-image-picker base64 strings often contain MIME line-wrapping
    // newlines (\r\n every 76 chars) which the Anthropic API rejects as unprocessable.
    const cleanBase64 = imageBase64.replace(/\s+/g, "");

    console.log("[identify-pill] mimeType:", mimeType, "safeMimeType:", safeMimeType);
    console.log("[identify-pill] raw length:", imageBase64?.length, "clean length:", cleanBase64.length);

    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let modelUsed = "claude-haiku-4-5-20251001";

    // Step 1 — Vision: extract raw info from image
    let extracted: z.infer<typeof ExtractedImageSchema>;

    const runVision = async (model: string) => {
      const result = await generateObject({
        model: client(model),
        schema: ExtractedImageSchema,
        system: VISION_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", image: cleanBase64, mimeType: safeMimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp" },
              { type: "text", text: "Extract all medication details visible in this image." },
            ],
          },
        ],
      });
      return result;
    };

    try {
      console.log("[identify-pill] Running vision step with haiku...");
      const step1 = await runVision("claude-haiku-4-5-20251001");
      extracted = step1.object;
      totalInputTokens += step1.usage.promptTokens;
      totalOutputTokens += step1.usage.completionTokens;
      console.log("[identify-pill] Haiku extracted:", JSON.stringify(extracted));

      // Escalate to Sonnet if Haiku couldn't extract enough
      if (extracted.confidence === "low" && !extracted.drugName) {
        console.log("[identify-pill] Escalating to Sonnet...");
        modelUsed = "claude-sonnet-4-6";
        const step1Fallback = await runVision("claude-sonnet-4-6");
        extracted = step1Fallback.object;
        totalInputTokens += step1Fallback.usage.promptTokens;
        totalOutputTokens += step1Fallback.usage.completionTokens;
        console.log("[identify-pill] Sonnet extracted:", JSON.stringify(extracted));
      }
    } catch (visionErr) {
      console.error("[identify-pill] Vision step failed:", visionErr instanceof Error ? visionErr.message : String(visionErr));
      // Vision failed — escalate to Sonnet
      modelUsed = "claude-sonnet-4-6";
      const step1Sonnet = await runVision("claude-sonnet-4-6");
      extracted = step1Sonnet.object;
      totalInputTokens += step1Sonnet.usage.promptTokens;
      totalOutputTokens += step1Sonnet.usage.completionTokens;
      console.log("[identify-pill] Sonnet fallback extracted:", JSON.stringify(extracted));
    }

    if (!extracted.drugName && !extracted.imprintCode && !extracted.ndcCode) {
      return new Response(
        JSON.stringify({
          data: null,
          error: "Could not identify any medication text in this image. Try a clearer photo with good lighting.",
          meta: {
            model: modelUsed,
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
            cacheReadTokens: 0,
            latencyMs: Date.now() - startTime,
          },
        }),
        { status: 422, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    // Step 2 — Text: structure into user-facing result
    const extractedSummary = [
      extracted.drugName && `Drug name: ${extracted.drugName}`,
      extracted.strength && `Strength: ${extracted.strength}`,
      extracted.imprintCode && `Imprint code: ${extracted.imprintCode}`,
      extracted.pillShape && `Shape: ${extracted.pillShape}`,
      extracted.pillColor && `Color: ${extracted.pillColor}`,
      extracted.ndcCode && `NDC: ${extracted.ndcCode}`,
    ]
      .filter(Boolean)
      .join("\n");

    const step2 = await generateObject({
      model: client("claude-haiku-4-5-20251001"),
      schema: IdentifiedPillSchema,
      system: STRUCTURE_SYSTEM_PROMPT,
      prompt: `Identify and provide information for this medication:\n\n${extractedSummary}\n\nProvide the common name, what it treats, and assess if it has any concerns for Sickle Cell Disease patients.`,
    });

    totalInputTokens += step2.usage.promptTokens;
    totalOutputTokens += step2.usage.completionTokens;

    const latencyMs = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        data: {
          ...step2.object,
          strength: step2.object.strength ?? extracted.strength,
        },
        error: null,
        meta: {
          model: modelUsed,
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          cacheReadTokens: 0,
          latencyMs,
        },
      }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? (err.stack ?? err.message) : String(err);
    console.error("[identify-pill] Outer catch:", msg);
    return new Response(
      JSON.stringify({ data: null, error: "Failed to identify medication", meta: null }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }
});
