import { forwardGeocode, nearbyHealthcare, placeDetails, reverseGeocode } from "./geoapify-client.ts";
import { chooseFacilityCandidate } from "./facility-candidate-score.mjs";
import { enrichWithGemini } from "./gemini-client.ts";

function field(value, source, confidence = null, sourceId = null) {
  return { value: value ?? null, source, sourceId, observedAt: new Date().toISOString(), confidence, status: source === "maps_url" ? "extracted" : "normalized" };
}

function parsedConfidence(value) {
  return value === "high" ? 1 : value === "medium" ? 0.75 : value === "low" ? 0.5 : null;
}

function normalizedCacheText(value) {
  return String(value || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim().slice(0, 300);
}

async function hashIdentifier(value, salt) {
  const bytes = new TextEncoder().encode(`${salt}:${value}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((part) => part.toString(16).padStart(2, "0")).join("");
}

async function enrichmentCacheKey(parsed, salt) {
  if (Number.isFinite(parsed.lat) && Number.isFinite(parsed.lng)) {
    const precision = parsed.name ? 4 : 5;
    const identity = `coordinates:${parsed.lat.toFixed(precision)},${parsed.lng.toFixed(precision)}:${normalizedCacheText(parsed.name)}`;
    return hashIdentifier(`cache:${identity}`, salt);
  }
  const identity = `text:${normalizedCacheText(parsed.name)}:${normalizedCacheText(parsed.address)}`;
  return hashIdentifier(`cache:${identity}`, salt);
}

async function readCache(adminClient, cacheKey) {
  try {
    const { data, error } = await adminClient
      .from("geoapify_enrichment_cache")
      .select("payload")
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    return !error && data?.payload && typeof data.payload === "object" ? data.payload : null;
  } catch { return null; }
}

function hasFieldValue(name, value) {
  return name === "categories" ? Array.isArray(value) && value.length > 0 : value !== null && value !== "";
}

function applyCachedPayload(result, payload) {
  result.candidate = payload.candidate || null;
  for (const [name, cachedField] of Object.entries(payload.fields || {})) {
    if (result.fields[name] && !hasFieldValue(name, result.fields[name].value)) result.fields[name] = cachedField;
  }
  for (const name of payload.corroboratedFields || []) {
    if (result.fields[name]) result.fields[name].status = "corroborated";
  }
  result.warnings.push("geoapify_cache_hit");
  return result;
}

function cachePayload(result) {
  const fields = Object.fromEntries(
    Object.entries(result.fields).filter(([, value]) => value?.source?.startsWith("geoapify")),
  );
  if (!result.candidate && Object.keys(fields).length === 0) return null;
  return {
    candidate: result.candidate,
    fields,
    corroboratedFields: Object.entries(result.fields)
      .filter(([, value]) => value?.status === "corroborated")
      .map(([name]) => name),
  };
}

async function writeCache(adminClient, cacheKey, result) {
  const payload = cachePayload(result);
  if (!payload) return;
  try {
    await adminClient.from("geoapify_enrichment_cache").upsert({
      cache_key: cacheKey,
      payload,
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "cache_key" });
  } catch {}
}

async function consumeQuota(adminClient, userId, ip, salt) {
  const identifiers = [["global", "global", 1000], ["user", userId, 10]];
  if (ip) identifiers.push(["ip", ip, 20]);
  for (const [scope, value, max] of identifiers) {
    const keyHash = await hashIdentifier(value, salt);
    const { data, error } = await adminClient.rpc("consume_geoapify_rate_limit", {
      p_scope: scope, p_key_hash: keyHash, p_max_requests: max, p_window: "24 hours",
    });
    if (error || data !== true) return false;
  }
  return true;
}

async function consumeGeminiQuota(adminClient, userId, ip, salt) {
  if (!adminClient || !salt || !userId) return "unavailable";
  const identifiers = [["global", "global", 300], ["user", userId, 5]];
  if (ip) identifiers.push(["ip", ip, 10]);
  try {
    for (const [scope, value, max] of identifiers) {
      // Namespace Gemini hashes so they cannot consume or read Geoapify limits.
      const keyHash = await hashIdentifier(`gemini:${value}`, salt);
      const { data, error } = await adminClient.rpc("consume_geoapify_rate_limit", {
        p_scope: scope, p_key_hash: keyHash, p_max_requests: max, p_window: "24 hours",
      });
      if (error) return "unavailable";
      if (data !== true) return "denied";
    }
    return "ok";
  } catch {
    return "unavailable";
  }
}

export async function enrichCareLocationGeoapify(parsed, { apiKey, adminClient, userId, ip, rateLimitSalt, fetchImpl = fetch } = {}) {
  const baseFields = {
    name: field(parsed.name, "maps_url", parsedConfidence(parsed.confidence?.name)),
    address: field(parsed.address, "maps_url", parsedConfidence(parsed.confidence?.address)),
    coordinates: field(Number.isFinite(parsed.lat) && Number.isFinite(parsed.lng) ? { lat: parsed.lat, lng: parsed.lng } : null, "maps_url", parsedConfidence(parsed.confidence?.coordinates)),
    phone: field(null, "maps_url"), website: field(null, "maps_url"), categories: field([], "maps_url"),
  };
  const result = {
    parsed: { provider: parsed.provider, sourceUrl: parsed.sourceUrl, providerPlaceId: parsed.providerPlaceId || null },
    candidate: null,
    fields: baseFields,
    warnings: [],
    lookupStages: [],
  };
  if (!(Number.isFinite(parsed.lat) && Number.isFinite(parsed.lng)) && !parsed.name && !parsed.address) {
    result.warnings.push("geoapify_no_lookup_fields");
    return result;
  }
  if (!apiKey) { result.warnings.push("geoapify_not_configured"); return result; }
  if (!adminClient || !rateLimitSalt) { result.warnings.push("geoapify_rate_limit_unavailable"); return result; }
  let cacheKey;
  try {
    cacheKey = await enrichmentCacheKey(parsed, rateLimitSalt);
    const cached = await readCache(adminClient, cacheKey);
    if (cached) return applyCachedPayload(result, cached);
    if (!(await consumeQuota(adminClient, userId, ip, rateLimitSalt))) { result.warnings.push("geoapify_daily_limit"); return result; }
  } catch {
    result.warnings.push("geoapify_infrastructure_unavailable");
    return result;
  }
  try {
    let reverse = null; let candidates = [];
    if (Number.isFinite(parsed.lat) && Number.isFinite(parsed.lng)) {
      const searchText = [parsed.name, parsed.address].filter(Boolean).join(", ");
      const [reverseResult, searchResult] = await Promise.allSettled([
        parsed.address ? Promise.resolve(null) : reverseGeocode(parsed.lat, parsed.lng, apiKey, fetchImpl),
        searchText
          ? forwardGeocode(searchText, apiKey, fetchImpl, { lat: parsed.lat, lng: parsed.lng })
          : Promise.resolve([]),
      ]);
      if (reverseResult.status === "fulfilled") reverse = reverseResult.value;
      else result.warnings.push(`geoapify_reverse_${reverseResult.reason?.code || "unavailable"}`);
      if (searchResult.status === "fulfilled") candidates = searchResult.value;
      else result.warnings.push(`geoapify_search_${searchResult.reason?.code || "unavailable"}`);
      result.lookupStages.push({ stage: "exact_search", candidateCount: candidates.length });

      let initialChoice = chooseFacilityCandidate({
        ...parsed,
        address: parsed.address || reverse?.address || null,
        countryCode: parsed.countryCode || reverse?.countryCode || null,
      }, candidates);
      if (!initialChoice.selected) {
        try {
          const nearby = await nearbyHealthcare(parsed.lat, parsed.lng, apiKey, fetchImpl);
          result.lookupStages.push({ stage: "nearby_healthcare", candidateCount: nearby.length });
          const seen = new Set(candidates.map((candidate) => candidate.id).filter(Boolean));
          candidates = candidates.concat(nearby.filter((candidate) => !candidate.id || !seen.has(candidate.id)));
        } catch (placesError) {
          result.warnings.push(`geoapify_places_${placesError?.code || "unavailable"}`);
        }
      }
    } else if (parsed.name || parsed.address) {
      candidates = await forwardGeocode([parsed.name, parsed.address].filter(Boolean).join(", "), apiKey, fetchImpl);
      result.lookupStages.push({ stage: "exact_search", candidateCount: candidates.length });
    }
    if (reverse && !result.fields.address.value) result.fields.address = field(reverse.address, "geoapify_reverse", 0.7, reverse.id);
    const choice = chooseFacilityCandidate({
      ...parsed,
      address: parsed.address || reverse?.address || null,
      countryCode: parsed.countryCode || reverse?.countryCode || null,
    }, candidates);
    if (choice.selected) {
      const selected = choice.selected.candidate; const confidence = choice.selected.score;
      result.candidate = { geoapifyPlaceId: selected.id, identityConfidence: confidence, decision: choice.decision, reasons: choice.selected.reasons };
      if (!result.fields.name.value && selected.name) result.fields.name = field(selected.name, "geoapify_places", confidence, selected.id);
      if (!result.fields.address.value && selected.address) result.fields.address = field(selected.address, "geoapify_places", confidence, selected.id);
      if (!result.fields.coordinates.value && Number.isFinite(selected.lat) && Number.isFinite(selected.lng)) result.fields.coordinates = field({ lat: selected.lat, lng: selected.lng }, "geoapify_places", confidence, selected.id);
      if (selected.phone) result.fields.phone = field(selected.phone, "geoapify_places", confidence, selected.id);
      if (selected.website) result.fields.website = field(selected.website, "geoapify_places", confidence, selected.id);
      if (selected.categories?.length) result.fields.categories = field(selected.categories, "geoapify_places", confidence, selected.id);
      if (selected.id && (!selected.phone || !selected.website)) {
        try {
          const details = await placeDetails(selected.id, apiKey, fetchImpl);
          result.lookupStages.push({ stage: "place_details", found: !!details });
          if (details?.phone && !result.fields.phone.value) result.fields.phone = field(details.phone, "geoapify_details", confidence, selected.id);
          if (details?.website && !result.fields.website.value) result.fields.website = field(details.website, "geoapify_details", confidence, selected.id);
        } catch { result.warnings.push("geoapify_details_unavailable"); }
      }
      if (result.fields.name.value && selected.name && result.fields.name.value.toLowerCase() === selected.name.toLowerCase()) result.fields.name.status = "corroborated";
      if (result.fields.address.value && selected.address && result.fields.address.value.toLowerCase() === selected.address.toLowerCase()) result.fields.address.status = "corroborated";
      if (result.fields.coordinates.value && choice.selected.distanceMeters !== null && choice.selected.distanceMeters <= 100) result.fields.coordinates.status = "corroborated";
    } else if (candidates.length) result.warnings.push("geoapify_candidate_uncertain");
  } catch (error) {
    result.warnings.push(`geoapify_${error?.code || "unavailable"}`);
  }
  await writeCache(adminClient, cacheKey, result);
  return result;
}

export async function enrichCareLocation(parsed, options = {}) {
  if (options.geminiEnabled) {
    if (!options.geminiApiKey) return enrichWithGemini(parsed, { apiKey: undefined });
    if (!options.geminiRateLimitSalt || !options.adminClient || !options.userId) {
      const empty = await enrichWithGemini(parsed, { apiKey: undefined });
      empty.warnings = ["gemini_rate_limit_unavailable"];
      return empty;
    }
    const result = await (async () => {
      const quota = await consumeGeminiQuota(options.adminClient, options.userId, options.ip, options.geminiRateLimitSalt);
      if (quota !== "ok") {
        const empty = await enrichWithGemini(parsed, { apiKey: undefined });
        empty.warnings = [quota === "denied" ? "gemini_daily_limit" : "gemini_rate_limit_unavailable"];
        return empty;
      }
      return enrichWithGemini(parsed, {
        apiKey: options.geminiApiKey,
        model: options.geminiModel,
        fetchImpl: options.fetchImpl,
      });
    })();
    return result;
  }
  return enrichCareLocationGeoapify(parsed, options);
}
