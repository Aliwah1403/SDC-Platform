import { supabase } from '@/utils/auth/supabase';
import { normalizeCareLocationResolution } from '@/utils/careLocationEnrichment';

export const CARE_LOCATION_ROLES = Object.freeze({
  PREFERRED_ED: 'preferred_ed',
  REGULAR_CLINIC: 'regular_scd_clinic',
  PHARMACY: 'pharmacy',
  TRANSFUSION_CENTRE: 'transfusion_centre',
  OTHER: 'other',
});

export const CARE_LOCATION_ROLE_LABELS = Object.freeze({
  preferred_ed: 'Preferred emergency department',
  regular_scd_clinic: 'Regular SCD / haematology clinic',
  pharmacy: 'Pharmacy',
  transfusion_centre: 'Transfusion centre',
  other: 'Other care location',
});

export function formatVerificationState(row) {
  if (row?.source_kind === 'verified_directory') return 'verified';
  if (row?.source_kind === 'legacy_google') return 'legacy';
  return 'user_added';
}

export function normalizeCareLocation(row) {
  if (!row) return null;
  return {
    id: row.id,
    legacyPlaceId: row.place_id,
    name: row.name,
    role: row.role || CARE_LOCATION_ROLES.OTHER,
    address: row.address || '',
    phone: row.phone || '',
    careTeamPhone: row.care_team_phone || '',
    website: row.website || '',
    notes: row.notes || '',
    countryCode: row.country_code || null,
    lat: Number.isFinite(row.lat) ? row.lat : null,
    lng: Number.isFinite(row.lng) ? row.lng : null,
    sourceKind: row.source_kind || 'legacy_google',
    directoryFacilityId: row.directory_facility_id || null,
    sourceProvider: row.source_provider || null,
    sourceUrl: row.source_url || null,
    providerPlaceId: row.provider_place_id || null,
    geoapifyPlaceId: row.geoapify_place_id || null,
    enrichmentProvenance: row.enrichment_provenance || null,
    enrichmentStatus: row.enrichment_status || 'not_requested',
    enrichmentSuggestions: row.enrichment_suggestions || null,
    enrichmentRequestedAt: row.enrichment_requested_at || null,
    enrichmentStartedAt: row.enrichment_started_at || null,
    enrichmentCompletedAt: row.enrichment_completed_at || null,
    enrichmentAttemptCount: row.enrichment_attempt_count || 0,
    enrichmentErrorCode: row.enrichment_error_code || null,
    verification: { state: formatVerificationState(row) },
    updatedAt: row.updated_at || row.saved_at,
  };
}

export function selectPreferredEmergencyDepartment(locations = []) {
  return locations.find((location) => location.role === CARE_LOCATION_ROLES.PREFERRED_ED) || null;
}

export function selectRegularClinic(locations = []) {
  return locations.find((location) => location.role === CARE_LOCATION_ROLES.REGULAR_CLINIC) || null;
}

// ============================================================
// SAVED FACILITIES
// ============================================================

export async function fetchSavedFacilities(userId) {
  const { data, error } = await supabase
    .from('saved_facilities')
    .select('*')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(normalizeCareLocation);
}

function manualPlaceId(location) {
  return location.legacyPlaceId || `manual:${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`}`;
}

export async function saveCareLocation(userId, location) {
  const requestedRole = location.role || CARE_LOCATION_ROLES.OTHER;
  const payload = {
    user_id: userId,
    place_id: manualPlaceId(location),
    name: location.name.trim(),
    type: null,
    address: location.address?.trim() || null,
    phone: location.phone?.trim() || null,
    care_team_phone: location.careTeamPhone?.trim() || null,
    website: location.website?.trim() || null,
    notes: location.notes?.trim() || null,
    country_code: location.countryCode || null,
    lat: Number.isFinite(location.lat) ? location.lat : null,
    lng: Number.isFinite(location.lng) ? location.lng : null,
    source_kind: location.sourceKind || 'user',
    directory_facility_id: location.directoryFacilityId || null,
    source_provider: location.sourceProvider || null,
    source_url: location.sourceUrl?.trim() || null,
    provider_place_id: location.providerPlaceId?.trim() || null,
    geoapify_place_id: location.geoapifyPlaceId?.trim() || null,
    enrichment_provenance: location.enrichmentProvenance || null,
    updated_at: new Date().toISOString(),
  };

  if (location.consumeEnrichmentSuggestions) {
    payload.enrichment_status = 'completed';
    payload.enrichment_suggestions = null;
    payload.enrichment_completed_at = new Date().toISOString();
    payload.enrichment_error_code = null;
  }

  if (!location.id) payload.role = CARE_LOCATION_ROLES.OTHER;

  let query = supabase.from('saved_facilities');
  const result = location.id
    ? await query.update(payload).eq('id', location.id).eq('user_id', userId).select().single()
    : await query.insert(payload).select().single();
  if (result.error) throw result.error;

  let saved = normalizeCareLocation(result.data);
  if (!location.id || result.data.role !== requestedRole) {
    saved = await setCareLocationRole(result.data.id, requestedRole);
  }

  const shouldAutoEnrich = !location.id && saved.sourceUrl && (!saved.phone || !saved.website);
  if (shouldAutoEnrich) {
    try {
      const queued = await queueCareLocationEnrichment(saved.id);
      if (queued?.queued) saved = { ...saved, enrichmentStatus: queued.status || 'pending' };
    } catch (error) {
      if (__DEV__) console.warn('[CareLocation] Background enrichment could not be queued', error?.message);
    }
  }
  return saved;
}

export async function setCareLocationRole(locationId, role) {
  const { data, error } = await supabase.rpc('set_care_location_role', {
    p_location_id: locationId,
    p_role: role,
  });
  if (error) throw error;
  return normalizeCareLocation(data);
}

export async function deleteCareLocation(userId, locationId) {
  const { error } = await supabase
    .from('saved_facilities')
    .delete()
    .eq('user_id', userId)
    .eq('id', locationId);
  if (error) throw error;
}

export async function queueCareLocationEnrichment(locationId) {
  const { data, error } = await supabase.functions.invoke('queue-care-location-enrichment', {
    body: { locationId },
  });
  if (error) {
    let details = null;
    try { details = await error.context?.json?.(); } catch {}
    throw new Error(details?.error || error.message || 'Could not queue care location enrichment');
  }
  return data;
}

export async function dismissCareLocationEnrichment(userId, locationId) {
  const completedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('saved_facilities')
    .update({
      enrichment_status: 'completed',
      enrichment_suggestions: null,
      enrichment_completed_at: completedAt,
      enrichment_error_code: null,
    })
    .eq('id', locationId)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return normalizeCareLocation(data);
}

// Backward-compatible aliases while callers migrate to the CareLocation model.
export const saveFacility = saveCareLocation;

export async function resolveCareLocationLink(url) {
  const { data, error } = await supabase.functions.invoke('resolve-care-location-link', {
    body: { url },
  });
  if (error) {
    let details = null;
    try { details = await error.context?.json?.(); } catch {}
    const enrichedError = new Error(details?.error || error.message || 'Could not resolve this maps link');
    enrichedError.code = details?.code || error.code || 'resolve_failed';
    throw enrichedError;
  }
  if (!data?.data) throw new Error(data?.error || 'Could not resolve this maps link');
  return normalizeCareLocationResolution(data.data);
}
export async function unsaveFacility(userId, placeId) {
  const { error } = await supabase
    .from('saved_facilities')
    .delete()
    .eq('user_id', userId)
    .eq('place_id', placeId);
  if (error) throw error;
}
