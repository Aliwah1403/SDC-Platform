import { supabase } from "@/utils/auth/supabase";
import { captureAIGeneration, captureAIError } from "@/utils/analytics";
import { Sentry } from "@/utils/sentry";

/**
 * Identify a medication from a base64 image via the identify-pill Edge Function.
 * Returns { name, commonName, strength, form, indication, scdWarning } or throws.
 */
export async function identifyPill(imageBase64, mimeType = "image/jpeg") {
  const { data: fnData, error: fnError } = await supabase.functions.invoke("identify-pill", {
    body: { imageBase64, mimeType },
  });

  if (fnError) {
    const err = new Error(fnError.message ?? "Identification failed");
    Sentry.captureException(err);
    captureAIError("pill_identification", fnError.message, fnData?.meta);
    throw err;
  }

  if (fnData?.error) {
    const err = new Error(fnData.error);
    // Only report unexpected errors to Sentry — "couldn't identify" is a user-facing non-issue
    if (!fnData.error.includes("Could not identify")) {
      Sentry.captureException(err);
    }
    captureAIError("pill_identification", fnData.error, fnData?.meta);
    throw err;
  }

  if (!fnData?.data) {
    const err = new Error("No result returned");
    Sentry.captureException(err);
    captureAIError("pill_identification", "no_result", fnData?.meta);
    throw err;
  }

  captureAIGeneration("pill_identification", fnData.meta);

  return fnData.data;
}
