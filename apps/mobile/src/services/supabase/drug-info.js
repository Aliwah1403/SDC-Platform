import { supabase } from '@/utils/auth/supabase';
import { toCamelCase } from '@/utils/caseMapping';
import { captureAIGeneration } from '@/utils/analytics';


// ============================================================
// DRUG INFO CACHE
// ============================================================

const OPENFDA_URL = 'https://api.fda.gov/drug/label.json';
const CACHE_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

function cleanFdaText(raw) {
  if (!raw) return null;
  // Strip leading section numbers like "6 ADVERSE REACTIONS" or "1 INDICATIONS AND USAGE"
  return raw.replace(/^\d+(\.\d+)?\s+[A-Z][A-Z\s]+\n?/, '').trim();
}
async function queryOpenFDA(searchParam) {
  const res = await fetch(`${OPENFDA_URL}?search=${encodeURIComponent(searchParam)}&limit=1`);
  if (!res.ok) return null;
  const data = await res.json();
  return data?.results?.[0] ?? null;
}

export async function fetchDrugInfo(drugName) {
  if (!drugName) return null;
  const normalizedName = drugName.toLowerCase().trim();

  const { data: cached } = await supabase
    .from('drug_info_cache')
    .select('*')
    .ilike('drug_name', normalizedName)
    .maybeSingle();

  // Fast path: already humanized and fresh
  if (cached?.humanized_at) {
    const age = Date.now() - new Date(cached.fetched_at).getTime();
    if (age < CACHE_TTL_MS) return toCamelCase(cached);
  }

  let row = cached;

  // Fetch from OpenFDA if no raw cache or stale
  const isCacheStale = !cached || Date.now() - new Date(cached.fetched_at).getTime() >= CACHE_TTL_MS;
  if (isCacheStale) {
    let result = await queryOpenFDA(`openfda.generic_name:"${normalizedName}"`);
    if (!result) result = await queryOpenFDA(`openfda.brand_name:"${normalizedName}"`);
    if (!result) return null;

    row = {
      drug_name: normalizedName,
      rxcui: result?.openfda?.rxcui?.[0] ?? null,
      description: cleanFdaText(result?.description?.[0]) ?? null,
      indications: cleanFdaText(result?.indications_and_usage?.[0]) ?? null,
      side_effects: cleanFdaText(result?.adverse_reactions?.[0]) ?? null,
      warnings: cleanFdaText(result?.warnings_and_cautions?.[0] ?? result?.warnings?.[0]) ?? null,
      mechanism: cleanFdaText(result?.mechanism_of_action?.[0]) ?? null,
      drug_interactions: cleanFdaText(result?.drug_interactions?.[0]) ?? null,
      dose_form: result?.dosage_forms_and_strengths?.[0] ?? null,
      brand_names: result?.openfda?.brand_name?.join(', ') ?? null,
      fetched_at: new Date().toISOString(),
    };
    await supabase.from('drug_info_cache').upsert(row, { onConflict: 'drug_name' });
  }

  // Humanize via Edge Function (one-time per drug, result written back to cache)
  try {
    const { data: fnResult, error: fnError } = await supabase.functions.invoke('humanize-drug-info', {
      body: {
        drugName: normalizedName,
        rawIndications: row.indications,
        rawSideEffects: row.side_effects,
        rawWarnings: row.warnings,
        rawInteractions: row.drug_interactions,
        rawMechanism: row.mechanism,
        clinicalName: row.brand_names || normalizedName,
      },
    });

    if (!fnError && fnResult?.data) {
      captureAIGeneration('drug_humanization', fnResult.meta);
      return toCamelCase({
        ...row,
        common_name: fnResult.data.commonName,
        humanized_indications: fnResult.data.humanizedIndications,
        humanized_mechanism: fnResult.data.humanizedMechanism,
        humanized_side_effects: fnResult.data.humanizedSideEffects,
        humanized_warnings: fnResult.data.humanizedWarnings,
        humanized_interactions: fnResult.data.humanizedInteractions,
        scd_contraindication: fnResult.data.scdContraindication,
        humanized_at: new Date().toISOString(),
      });
    }
  } catch {
    // Humanization failed — return raw FDA data gracefully
  }

  return toCamelCase(row);
}

export async function fetchDoseForm(rxcui) {
  if (!rxcui) return null;
  try {
    const res = await fetch(`https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/properties.json`);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.properties?.doseForms ?? null;
  } catch {
    return null;
  }
}
