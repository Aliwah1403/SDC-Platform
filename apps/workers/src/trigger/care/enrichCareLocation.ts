import { logger, queue, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";
import { supabase } from "../../lib/supabase";

const careLocationEnrichmentQueue = queue({
  name: "care-location-enrichment",
  concurrencyLimit: 3,
});

const payloadSchema = z.object({
  locationId: z.string().uuid(),
  userId: z.string().uuid(),
  requestId: z.string().uuid(),
});

const PERMANENT_WARNING_CODES = new Set([
  "geoapify_not_configured",
  "geoapify_rate_limit_unavailable",
  "geoapify_daily_limit",
  "geoapify_no_lookup_fields",
  "gemini_not_configured",
  "gemini_daily_limit",
  "gemini_invalid_request",
  "gemini_authentication",
  "gemini_model_unavailable",
  "gemini_refinement_invalid_request",
  "gemini_refinement_authentication",
  "gemini_refinement_model_unavailable",
]);

const TRANSIENT_WARNING_CODES = new Set([
  "gemini_timeout", "gemini_quota", "gemini_provider_failed", "gemini_invalid_response",
  "gemini_response_too_large", "gemini_unavailable", "gemini_refinement_timeout",
  "gemini_refinement_quota", "gemini_refinement_provider_failed", "gemini_refinement_invalid_response",
  "gemini_refinement_response_too_large", "gemini_refinement_unavailable", "gemini_rate_limit_unavailable",
]);

function usefulContactFields(location: { phone: string | null; website: string | null }, enrichment: any) {
  const fields = enrichment?.fields || {};
  const validGeminiField = (field: any) => field?.source === "gemini_search" &&
    typeof field?.sourceId === "string" && typeof field?.sourceUrl === "string" &&
    field.sourceId === field.sourceUrl && typeof field?.sourceTitle === "string" &&
    typeof field?.evidence === "string" && field?.value;
  return {
    phone: !location.phone && ((fields.phone?.source?.startsWith("geoapify") && fields.phone?.value) || validGeminiField(fields.phone))
      ? fields.phone
      : null,
    website: !location.website && ((fields.website?.source?.startsWith("geoapify") && fields.website?.value) || validGeminiField(fields.website))
      ? fields.website
      : null,
  };
}

function automaticProvenance(fields: { phone: any; website: any }, enrichment: any) {
  const provenance: Record<string, unknown> = {
    mode: "automatic_missing_fields",
    enrichedAt: new Date().toISOString(),
    fields: Object.fromEntries(Object.entries(fields)
      .filter(([, field]) => field?.value)
      .map(([name, field]) => [name, {
        source: field.source,
        sourceId: field.sourceId || null,
        sourceUrl: field.sourceUrl || null,
        sourceTitle: field.sourceTitle || null,
        evidence: field.evidence || null,
        observedAt: field.observedAt || null,
        confidence: field.confidence ?? null,
      }])),
  };
  if (enrichment?.groundedResult) {
    provenance.groundedResult = enrichment.groundedResult;
  }
  return provenance;
}

async function updateActiveRequest(locationId: string, requestId: string, values: Record<string, unknown>) {
  const { error } = await supabase
    .from("saved_facilities")
    .update(values)
    .eq("id", locationId)
    .eq("enrichment_request_id", requestId);
  if (error) throw error;
}

export const enrichCareLocation = schemaTask({
  id: "enrich-care-location",
  queue: careLocationEnrichmentQueue,
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 2_000,
    maxTimeoutInMs: 20_000,
    factor: 2,
    randomize: true,
  },
  schema: payloadSchema,
  catchError: async ({ payload, ctx }) => {
    if (ctx.attempt.number >= 3) {
      await supabase
        .from("saved_facilities")
        .update({
          enrichment_status: "failed",
          enrichment_completed_at: new Date().toISOString(),
          enrichment_error_code: "background_unavailable",
        })
        .eq("id", payload.locationId)
        .eq("user_id", payload.userId)
        .eq("enrichment_request_id", payload.requestId);
    }
  },
  run: async ({ locationId, userId, requestId }, { ctx }) => {
    const { data: location, error } = await supabase
      .from("saved_facilities")
      .select("id,user_id,phone,website,enrichment_status,enrichment_request_id,enrichment_attempt_count")
      .eq("id", locationId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (!location) return { status: "not_found" };
    if (location.enrichment_request_id !== requestId ||
      !["pending", "processing"].includes(location.enrichment_status)) {
      return { status: "stale" };
    }

    await updateActiveRequest(locationId, requestId, {
      enrichment_status: "processing",
      enrichment_started_at: new Date().toISOString(),
      enrichment_attempt_count: Math.max(location.enrichment_attempt_count || 0, ctx.attempt.number),
      enrichment_error_code: null,
    });

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase worker credentials are not configured");

    const response = await fetch(`${supabaseUrl}/functions/v1/run-care-location-enrichment`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ locationId, userId, requestId }),
      signal: AbortSignal.timeout(30_000),
    });
    const body = await response.json().catch(() => ({}));
    if (response.status === 409 || body?.code === "stale_request") return { status: "stale" };
    if (!response.ok || !body?.data) {
      throw new Error(`Care location enrichment function failed (${response.status})`);
    }

    const enrichment = body.data;
    const warnings = Array.isArray(enrichment.warnings) ? enrichment.warnings : [];
    const transientFailure = warnings.find((warning: string) => TRANSIENT_WARNING_CODES.has(warning));
    if (transientFailure) throw new Error(`Care location provider temporarily unavailable (${transientFailure})`);
    const permanentFailure = warnings.find((warning: string) => PERMANENT_WARNING_CODES.has(warning));
    if (permanentFailure) {
      await updateActiveRequest(locationId, requestId, {
        enrichment_status: "failed",
        enrichment_suggestions: null,
        enrichment_completed_at: new Date().toISOString(),
      enrichment_error_code: permanentFailure.replace(/^(geoapify|gemini)_/, ""),
      });
      return { status: "failed", reason: permanentFailure };
    }

    const fields = usefulContactFields(location, enrichment);
    const hasContactFields = !!(fields.phone || fields.website);
    let appliedPhone = false;
    let appliedWebsite = false;
    if (hasContactFields) {
      const { data: application, error: applicationError } = await supabase.rpc("apply_care_location_enrichment", {
        p_location_id: locationId,
        p_user_id: userId,
        p_request_id: requestId,
        p_phone: fields.phone?.value || null,
        p_website: fields.website?.value || null,
        p_provenance: automaticProvenance(fields, enrichment),
      });
      if (applicationError) throw applicationError;
      if (application?.status === "stale") return { status: "stale" };
      appliedPhone = application?.appliedPhone === true;
      appliedWebsite = application?.appliedWebsite === true;
    } else {
      await updateActiveRequest(locationId, requestId, {
        enrichment_status: "no_match",
        enrichment_suggestions: null,
        enrichment_completed_at: new Date().toISOString(),
        enrichment_error_code: null,
      });
    }

    logger.info("Care location enrichment finished", {
      locationId,
      outcome: hasContactFields ? "completed" : "no_match",
      appliedPhone,
      appliedWebsite,
      warningCount: warnings.length,
    });
    return {
      status: hasContactFields ? "completed" : "no_match",
      fieldsApplied: Number(appliedPhone) + Number(appliedWebsite),
    };
  },
});
