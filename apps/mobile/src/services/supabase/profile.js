import { supabase } from '@/utils/auth/supabase';
import { toCamelCase, toSnakeCase } from '@/utils/caseMapping';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';


export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return toCamelCase(data);
}
export async function updateProfile(userId, fields) {
  const { error } = await supabase
    .from('profiles')
    .update({ ...toSnakeCase(fields), updated_at: new Date().toISOString() })
    .eq('user_id', userId);
  if (error) throw error;
}

export async function uploadAvatar(userId, localUri) {
  const result = await manipulateAsync(localUri, [{ resize: { width: 400 } }], {
    format: SaveFormat.JPEG,
    compress: 0.85,
    base64: true,
  });

  const binaryStr = atob(result.base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  const path = `${userId}/avatar.jpg`;
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  await updateProfile(userId, { avatarUrl: data.publicUrl });
  return data.publicUrl;
}

/**
 * Batch write at onboarding completion:
 * - Updates profile fields
 * - Inserts emergency contacts (replaces existing)
 * - Inserts medications
 * - Sets onboarding_complete = true
 */
export async function completeOnboarding(userId, onboardingData) {
  const {
    nickname,
    dob,
    scdType,
    height,
    weight,
    checkInTime,
    notificationsEnabled,
    biometricsEnabled,
    preferredHospital,
    bloodType,
    allergies = [],
    emergencyContacts = [],
    medications = [],
    timezone,
    timezoneAuto = true,
  } = onboardingData;

  // 1. Update profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      nickname: nickname || null,
      dob: dob || null,
      scd_type: scdType || null,
      height: height || null,
      weight: weight || null,
      check_in_time: checkInTime || null,
      notifications_enabled: notificationsEnabled ?? false,
      biometrics_enabled: biometricsEnabled ?? false,
      preferred_hospital: preferredHospital || null,
      blood_type: bloodType || null,
      allergies: allergies.length > 0 ? allergies : [],
      timezone: timezone || null,
      timezone_auto: timezoneAuto,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
  if (profileError) throw profileError;

  // 2. Insert emergency contacts (skip if empty)
  if (emergencyContacts.length > 0) {
    const contactRows = emergencyContacts.map((c, i) => ({
      user_id: userId,
      name: c.name,
      relationship: c.relationship || null,
      phone: c.phone,
      is_primary: i === 0,
    }));
    const { error: contactError } = await supabase
      .from('emergency_contacts')
      .insert(contactRows);
    if (contactError) throw contactError;
  }

  // 3. Insert medications (skip if empty)
  if (medications.length > 0) {
    const medRows = medications.map((m) => ({
      user_id: userId,
      name: m.name,
      dosage: m.dosage || null,
      frequency: m.frequency || 'Daily',
      type: m.type || 'tablet',
      category: m.category || 'Supportive',
      rxcui: m.rxcui || null,
      brand_names: m.brandNames || null,
      is_active: true,
    }));
    const { error: medError } = await supabase
      .from('medications')
      .insert(medRows);
    if (medError) throw medError;
  }

  // 4. Seed default hydration containers (Step 9 amendment, 2026-07-19) — skip
  // if this user already has some (e.g. onboarding retried after a partial
  // failure above), so a re-run never duplicates seed rows.
  const { data: existingContainers, error: existingContainersError } = await supabase
    .from('hydration_containers')
    .select('id')
    .eq('user_id', userId)
    .limit(1);
  if (existingContainersError) throw existingContainersError;
  if (!existingContainers || existingContainers.length === 0) {
    const { error: containersError } = await supabase
      .from('hydration_containers')
      .insert([
        { user_id: userId, name: 'Glass', ml: 250, icon: 'glass-water', is_default: true, sort_order: 0 },
        { user_id: userId, name: 'Bottle', ml: 500, icon: 'bottle', is_default: false, sort_order: 1 },
        { user_id: userId, name: 'Mug', ml: 350, icon: 'mug', is_default: false, sort_order: 2 },
        { user_id: userId, name: 'Carton', ml: 1000, icon: 'carton', is_default: false, sort_order: 3 },
      ]);
    if (containersError) throw containersError;
  }
}
