import { supabase } from '@/utils/auth/supabase';

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
    updated_at: new Date().toISOString(),
  };

  if (!location.id) payload.role = CARE_LOCATION_ROLES.OTHER;

  let query = supabase.from('saved_facilities');
  const result = location.id
    ? await query.update(payload).eq('id', location.id).eq('user_id', userId).select().single()
    : await query.insert(payload).select().single();
  if (result.error) throw result.error;

  if (!location.id || result.data.role !== requestedRole) {
    return setCareLocationRole(result.data.id, requestedRole);
  }
  return normalizeCareLocation(result.data);
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

// Backward-compatible aliases while callers migrate to the CareLocation model.
export const saveFacility = saveCareLocation;

export async function resolveCareLocationLink(url) {
  const { data, error } = await supabase.functions.invoke('resolve-care-location-link', {
    body: { url },
  });
  if (error) throw error;
  if (!data?.data) throw new Error(data?.error || 'Could not resolve this maps link');
  return data.data;
}
export async function unsaveFacility(userId, placeId) {
  const { error } = await supabase
    .from('saved_facilities')
    .delete()
    .eq('user_id', userId)
    .eq('place_id', placeId);
  if (error) throw error;
}
