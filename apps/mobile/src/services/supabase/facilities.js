import { supabase } from '@/utils/auth/supabase';


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
  return (data || []).map((row) => ({
    id: row.place_id,
    placeId: row.place_id,
    name: row.name,
    type: row.type,
    address: row.address,
    phone: row.phone,
    lat: row.lat,
    lng: row.lng,
    rating: row.rating,
    website: row.website,
    scdSpecialist: row.scd_specialist,
  }));
}
export async function saveFacility(userId, facility) {
  const { error } = await supabase
    .from('saved_facilities')
    .upsert({
      user_id: userId,
      place_id: facility.placeId,
      name: facility.name,
      type: facility.type,
      address: facility.address,
      phone: facility.phone,
      lat: facility.lat,
      lng: facility.lng,
      rating: facility.rating,
      website: facility.website,
      scd_specialist: facility.scdSpecialist ?? false,
    }, { onConflict: 'user_id,place_id' });
  if (error) throw error;
}

export async function unsaveFacility(userId, placeId) {
  const { error } = await supabase
    .from('saved_facilities')
    .delete()
    .eq('user_id', userId)
    .eq('place_id', placeId);
  if (error) throw error;
}
