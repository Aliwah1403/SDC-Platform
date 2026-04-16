import { supabase } from '@/utils/auth/supabase';
import { toCamelCase, toSnakeCase } from '@/utils/caseMapping';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const today = () => new Date().toISOString().split('T')[0];

// ============================================================
// PROFILE
// ============================================================

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
}

// ============================================================
// HEALTH DATA
// ============================================================

/**
 * Fetch daily summaries for the last N days.
 * Default: 90 days back (matches mock data range).
 */
export async function fetchDailySummaries(userId, startDate) {
  const start = startDate || (() => {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return d.toISOString().split('T')[0];
  })();

  const { data, error } = await supabase
    .from('daily_summaries')
    .select('*')
    .eq('user_id', userId)
    .gte('date', start)
    .order('date', { ascending: false });
  if (error) throw error;
  return (data || []).map(toCamelCase);
}

export async function fetchHealthLogs(userId, date) {
  const { data, error } = await supabase
    .from('health_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(toCamelCase);
}

/**
 * Submit a symptom log:
 * 1. Insert raw log into health_logs
 * 2. Fetch all logs for today and aggregate
 * 3. Upsert daily_summaries
 * 4. Update streak (increment if consecutive day, reset to 1 if gap)
 */
export async function submitHealthLog(userId, logData) {
  const todayStr = today();
  const moodValue =
    logData.mood === 'excellent' ? 5
    : logData.mood === 'good' ? 4
    : logData.mood === 'fair' ? 3
    : logData.mood === 'poor' ? 2
    : typeof logData.mood === 'number' ? logData.mood
    : 1;

  // 1. Insert raw log
  const { error: logError } = await supabase
    .from('health_logs')
    .insert({
      user_id: userId,
      date: todayStr,
      pain_level: logData.painLevel ?? 0,
      body_locations: logData.bodyLocations ?? [],
      symptoms: logData.symptoms ?? [],
      mood: moodValue,
      hydration: logData.hydration ?? 0,
      notes: logData.notes || null,
      triggers: logData.triggers ?? [],
      activities: logData.activities ?? [],
    });
  if (logError) throw logError;

  // 2. Fetch all logs for today to compute aggregate
  const { data: todaysLogs, error: logsError } = await supabase
    .from('health_logs')
    .select('pain_level, hydration, mood')
    .eq('user_id', userId)
    .eq('date', todayStr)
    .order('created_at', { ascending: true });
  if (logsError) throw logsError;

  const maxPain = Math.max(...todaysLogs.map((l) => l.pain_level ?? 0));
  const maxHydration = Math.max(...todaysLogs.map((l) => l.hydration ?? 0));
  const latestMood = todaysLogs[todaysLogs.length - 1]?.mood ?? moodValue;

  // 3. Upsert daily summary
  const { error: summaryError } = await supabase
    .from('daily_summaries')
    .upsert(
      {
        user_id: userId,
        date: todayStr,
        pain_level: maxPain,
        hydration: maxHydration,
        mood: latestMood,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,date' }
    );
  if (summaryError) throw summaryError;

  // 4. Update streak
  const { data: streakRow, error: streakFetchError } = await supabase
    .from('streaks')
    .select('current_streak, longest_streak, last_log_date, repair_progress, days_until_next_repair, repairs_available, repairs_earned')
    .eq('user_id', userId)
    .single();
  if (streakFetchError) throw streakFetchError;

  const lastDate = streakRow.last_log_date;
  const alreadyLoggedToday = lastDate === todayStr;

  if (!alreadyLoggedToday) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const isConsecutive = lastDate === yesterdayStr;

    const newStreak = isConsecutive ? (streakRow.current_streak ?? 0) + 1 : 1;
    const newLongest = Math.max(streakRow.longest_streak ?? 0, newStreak);

    // Repair progress tracks consecutive days actually logged — resets on any
    // missed day regardless of streak repairs, since it measures genuine logging.
    const daysTarget = streakRow.days_until_next_repair ?? 30;
    const prevProgress = isConsecutive ? (streakRow.repair_progress ?? 0) : 0;
    const newProgress = prevProgress + 1;
    const earnedRepair = newProgress >= daysTarget;

    const { error: streakUpdateError } = await supabase
      .from('streaks')
      .update({
        current_streak: newStreak,
        longest_streak: newLongest,
        last_log_date: todayStr,
        repair_progress: earnedRepair ? 0 : newProgress,
        ...(earnedRepair && {
          repairs_available: (streakRow.repairs_available ?? 0) + 1,
          repairs_earned: (streakRow.repairs_earned ?? 0) + 1,
        }),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
    if (streakUpdateError) throw streakUpdateError;

    return { newStreak, isNewDay: true, earnedRepair };
  }

  return { newStreak: streakRow.current_streak ?? 0, isNewDay: false, earnedRepair: false };
}

// ============================================================
// MEDICATIONS
// ============================================================

/**
 * Fetch all active medications, merged with today's medication_logs
 * so each medication has `taken` (bool) and `takenAt` (ISO string | null).
 */
export async function fetchMedications(userId) {
  const todayStr = today();

  const [medsResult, logsResult] = await Promise.all([
    supabase
      .from('medications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true }),
    supabase
      .from('medication_logs')
      .select('medication_id, taken_at')
      .eq('user_id', userId)
      .eq('date', todayStr),
  ]);

  if (medsResult.error) throw medsResult.error;
  if (logsResult.error) throw logsResult.error;

  const takenMap = new Map(
    (logsResult.data || []).map((l) => [l.medication_id, l.taken_at])
  );

  return (medsResult.data || []).map((med) => ({
    ...toCamelCase(med),
    taken: takenMap.has(med.id),
    takenAt: takenMap.get(med.id) ?? null,
  }));
}

export async function addMedication(userId, med) {
  const { data, error } = await supabase
    .from('medications')
    .insert({
      user_id: userId,
      name: med.name,
      dosage: med.dosage || null,
      frequency: med.frequency || 'Daily',
      type: med.type || 'tablet',
      prescribed_by: med.prescribedBy || null,
      start_date: med.startDate || null,
      is_active: true,
      time: med.time || null,
      notes: med.notes || null,
      category: med.category || 'Supportive',
      rxcui: med.rxcui || null,
      brand_names: med.brandNames || null,
    })
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data);
}

export async function updateMedication(userId, id, updates) {
  const { error } = await supabase
    .from('medications')
    .update({ ...toSnakeCase(updates), updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteMedication(userId, id) {
  const { error } = await supabase
    .from('medications')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function toggleMedicationTaken(userId, medId) {
  const todayStr = today();

  // Check if already taken today
  const { data: existing } = await supabase
    .from('medication_logs')
    .select('id')
    .eq('medication_id', medId)
    .eq('date', todayStr)
    .maybeSingle();

  if (existing) {
    // Un-take: delete the log
    const { error } = await supabase
      .from('medication_logs')
      .delete()
      .eq('medication_id', medId)
      .eq('date', todayStr);
    if (error) throw error;
  } else {
    // Mark taken: insert log
    const { error } = await supabase
      .from('medication_logs')
      .insert({ medication_id: medId, user_id: userId, date: todayStr, taken_at: new Date().toISOString() });
    if (error) throw error;
  }
}

export async function markGroupTaken(userId, medIds) {
  const todayStr = today();
  const rows = medIds.map((id) => ({
    medication_id: id,
    user_id: userId,
    date: todayStr,
    taken_at: new Date().toISOString(),
  }));
  const { error } = await supabase
    .from('medication_logs')
    .upsert(rows, { onConflict: 'medication_id,date', ignoreDuplicates: false });
  if (error) throw error;
}

// ============================================================
// APPOINTMENTS
// ============================================================

export async function fetchAppointments(userId) {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });
  if (error) throw error;
  return (data || []).map(toCamelCase);
}

export async function addAppointment(userId, appt) {
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      user_id: userId,
      title: appt.title,
      doctor: appt.doctor || null,
      specialty: appt.specialty || null,
      facility: appt.facility || null,
      date: appt.date,
      time: appt.time || null,
      type: appt.type || 'routine',
      notes: appt.notes || null,
      status: appt.status || 'upcoming',
      added_to_calendar: appt.addedToCalendar ?? false,
      calendar_event_id: appt.calendarEventId || null,
      reminder_ids: appt.reminderIds ?? [],
    })
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data);
}

export async function updateAppointment(userId, id, changes) {
  const { error } = await supabase
    .from('appointments')
    .update({ ...toSnakeCase(changes), updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteAppointment(userId, id) {
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

// ============================================================
// STREAK
// ============================================================

export async function fetchStreak(userId) {
  const { data, error } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return toCamelCase(data);
}

/**
 * Use a repair to fill in a missed day:
 * - Inserts a repaired daily_summary for the missed date
 * - Decrements repairs_available, increments repairs_used
 */
export async function repairStreak(userId) {
  const { data: streakRow, error: fetchError } = await supabase
    .from('streaks')
    .select('repairs_available, repairs_used, current_streak')
    .eq('user_id', userId)
    .single();
  if (fetchError) throw fetchError;
  if ((streakRow.repairs_available ?? 0) <= 0) {
    throw new Error('No repairs available');
  }

  // A repair forgives the entire gap — set last_log_date to yesterday so
  // the streak appears alive again. The current_streak value is preserved
  // (the repair restores it, not extends it). When the user logs today,
  // submitHealthLog sees last_log_date = yesterday → isConsecutive = true
  // → streak increments normally.
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const { error: updateError } = await supabase
    .from('streaks')
    .update({
      repairs_available: (streakRow.repairs_available ?? 0) - 1,
      repairs_used: (streakRow.repairs_used ?? 0) + 1,
      last_log_date: yesterdayStr,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
  if (updateError) throw updateError;

  return { restoredStreak: streakRow.current_streak ?? 0 };
}

export async function updateClaimedBadges(userId, badgeIds) {
  const { error } = await supabase
    .from('streaks')
    .update({ claimed_badges: badgeIds, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
  if (error) throw error;
}

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

  // Check cache first
  const { data: cached } = await supabase
    .from('drug_info_cache')
    .select('*')
    .ilike('drug_name', normalizedName)
    .maybeSingle();

  if (cached) {
    const age = Date.now() - new Date(cached.fetched_at).getTime();
    if (age < CACHE_TTL_MS) return toCamelCase(cached);
  }

  // Fetch from OpenFDA — try generic name first, then brand name
  let result = await queryOpenFDA(`openfda.generic_name:"${normalizedName}"`);
  if (!result) result = await queryOpenFDA(`openfda.brand_name:"${normalizedName}"`);
  if (!result) return null;

  const row = {
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

  await supabase
    .from('drug_info_cache')
    .upsert(row, { onConflict: 'drug_name' });

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

// ============================================================
// METRIC GOALS
// ============================================================

export async function fetchMetricGoals(userId) {
  const { data, error } = await supabase
    .from('metric_goals')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return toCamelCase(data);
}

export async function updateMetricGoal(userId, metric, value) {
  const { error } = await supabase
    .from('metric_goals')
    .update({ [metric]: value, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
  if (error) throw error;
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

// ============================================================
// EMERGENCY CONTACTS
// ============================================================

export async function fetchEmergencyContacts(userId) {
  const { data, error } = await supabase
    .from('emergency_contacts')
    .select('*')
    .eq('user_id', userId)
    .order('is_primary', { ascending: false });
  if (error) throw error;
  return (data || []).map(toCamelCase);
}

export async function addEmergencyContact(userId, contact) {
  const { data, error } = await supabase
    .from('emergency_contacts')
    .insert({
      user_id: userId,
      name: contact.name,
      relationship: contact.relationship || null,
      phone: contact.phone,
      is_primary: contact.isPrimary ?? false,
      photo_url: contact.photoUrl ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data);
}

export async function uploadContactPhoto(userId, contactId, localUri) {
  // Normalize URI and get base64 — avoids fetch().blob() which is unreliable in Hermes/RN
  const result = await manipulateAsync(localUri, [], {
    format: SaveFormat.JPEG,
    compress: 0.8,
    base64: true,
  });

  // Decode base64 → Uint8Array for a reliable binary upload
  const binaryStr = atob(result.base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  const path = `${userId}/${contactId}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from('contact-photos')
    .upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from('contact-photos').getPublicUrl(path);
  return data.publicUrl;
}

export async function fetchContactCallLogs(userId, contactId) {
  const { data, error } = await supabase
    .from('contact_call_logs')
    .select('id, called_at')
    .eq('user_id', userId)
    .eq('contact_id', contactId)
    .order('called_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data || []).map(toCamelCase);
}

export async function recordContactCall(userId, contactId) {
  const calledAt = new Date().toISOString();

  // 1. Update aggregate fields — always runs, never blocked by log insert
  const { data: row, error: fetchError } = await supabase
    .from('emergency_contacts')
    .select('call_count')
    .eq('id', contactId)
    .eq('user_id', userId)
    .single();
  if (fetchError) throw fetchError;

  const { error: updateError } = await supabase
    .from('emergency_contacts')
    .update({
      call_count: (row.call_count ?? 0) + 1,
      last_called_at: calledAt,
    })
    .eq('id', contactId)
    .eq('user_id', userId);
  if (updateError) throw updateError;

  // 2. Insert call log — best-effort (table may not exist until migration is run)
  await supabase
    .from('contact_call_logs')
    .insert({ user_id: userId, contact_id: contactId, called_at: calledAt });
}

export async function updateEmergencyContact(userId, id, updates) {
  const { error } = await supabase
    .from('emergency_contacts')
    .update({ ...toSnakeCase(updates), updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteEmergencyContact(userId, id) {
  const { error } = await supabase
    .from('emergency_contacts')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

// ============================================================
// COMMUNITY
// ============================================================

// ── Feed ──────────────────────────────────────────────────────────────────

/**
 * Fetch community posts for a given feed filter.
 *
 * filter: 'popular' | 'recent' | 'following' | 'mine' | 'saved'
 * followedCategoryIds: string[] (needed for 'following' filter)
 * blockedCategoryIds:  string[] (always excluded)
 */
export async function fetchCommunityFeed({
  userId,
  filter = 'popular',
  followedCategoryIds = [],
  blockedCategoryIds = [],
  limit = 30,
  offset = 0,
}) {
  // Base query: posts + author profile (nickname + scd_type) + like/save status
  let query = supabase
    .from('community_posts')
    .select(`
      *,
      author:profiles!community_posts_user_id_fkey(nickname, scd_type, avatar_url),
      is_liked:community_likes!left(user_id),
      is_saved:community_saves!left(user_id),
      poll_options:community_poll_options(id, option_text, sort_order, vote_count),
      user_poll_vote:community_poll_votes!left(option_id)
    `)
    .eq('is_liked.user_id', userId)
    .eq('is_saved.user_id', userId)
    .eq('user_poll_vote.user_id', userId)
    .range(offset, offset + limit - 1);

  // Exclude blocked categories
  if (blockedCategoryIds.length > 0) {
    query = query.not('category', 'in', `(${blockedCategoryIds.join(',')})`);
  }

  // Apply feed-specific filters
  if (filter === 'popular') {
    query = query.order('like_count', { ascending: false });
  } else if (filter === 'recent') {
    query = query.order('created_at', { ascending: false });
  } else if (filter === 'following') {
    if (followedCategoryIds.length === 0) return [];
    query = query
      .in('category', followedCategoryIds)
      .order('created_at', { ascending: false });
  } else if (filter === 'mine') {
    query = query
      .eq('user_id', userId)
      .eq('is_system_post', false)
      .order('created_at', { ascending: false });
  } else if (filter === 'saved') {
    // For saved, join differently — just fetch saves and match
    const { data: saves, error: savesErr } = await supabase
      .from('community_saves')
      .select('post_id')
      .eq('user_id', userId);
    if (savesErr) throw savesErr;
    const savedIds = saves.map((s) => s.post_id);
    if (savedIds.length === 0) return [];
    query = query.in('id', savedIds).order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((p) => normaliseCommunityPost(p, userId));
}

/**
 * Fetch a single post with all top-level comments and their replies.
 */
export async function fetchPostDetail(postId, userId) {
  const { data: post, error: postErr } = await supabase
    .from('community_posts')
    .select(`
      *,
      author:profiles!community_posts_user_id_fkey(nickname, scd_type, avatar_url),
      is_liked:community_likes!left(user_id),
      is_saved:community_saves!left(user_id),
      poll_options:community_poll_options(id, option_text, sort_order, vote_count),
      user_poll_vote:community_poll_votes!left(option_id)
    `)
    .eq('is_liked.user_id', userId)
    .eq('is_saved.user_id', userId)
    .eq('user_poll_vote.user_id', userId)
    .eq('id', postId)
    .single();
  if (postErr) throw postErr;

  // Fetch top-level comments
  const { data: comments, error: commentsErr } = await supabase
    .from('community_comments')
    .select(`
      *,
      author:profiles!community_comments_user_id_fkey(nickname, avatar_url)
    `)
    .eq('post_id', postId)
    .is('parent_comment_id', null)
    .order('created_at', { ascending: true });
  if (commentsErr) throw commentsErr;

  // Fetch all replies for this post in one query
  const { data: replies, error: repliesErr } = await supabase
    .from('community_comments')
    .select(`
      *,
      author:profiles!community_comments_user_id_fkey(nickname, avatar_url)
    `)
    .eq('post_id', postId)
    .not('parent_comment_id', 'is', null)
    .order('created_at', { ascending: true });
  if (repliesErr) throw repliesErr;

  // Group replies under their parent comments
  const replyMap = {};
  (replies ?? []).forEach((r) => {
    const pid = r.parent_comment_id;
    if (!replyMap[pid]) replyMap[pid] = [];
    replyMap[pid].push(normaliseComment(r, userId));
  });

  const normalisedComments = (comments ?? []).map((c) => ({
    ...normaliseComment(c, userId),
    replies: replyMap[c.id] ?? [],
  }));

  return {
    ...normaliseCommunityPost(post, userId),
    comments: normalisedComments,
  };
}

// ── Posts ─────────────────────────────────────────────────────────────────

export async function createCommunityPost({
  userId,
  content,
  imageUrl,
  category,
  flair,
  isAnonymous = false,
  pollOptions = [], // string[] — option texts, empty if no poll
}) {
  // If imageUrl is a local device URI, upload it to Storage first
  let storedImageUrl = null;
  if (imageUrl) {
    const isLocal = imageUrl.startsWith('file://') || imageUrl.startsWith('ph://');
    if (isLocal) {
      const ext = 'jpg';
      const path = `${userId}/${Date.now()}.${ext}`;
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      const { error: uploadErr } = await supabase.storage
        .from('community-images')
        .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: false });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage
        .from('community-images')
        .getPublicUrl(path);
      storedImageUrl = urlData.publicUrl;
    } else {
      // Already a remote URL (e.g. re-used from another post)
      storedImageUrl = imageUrl;
    }
  }

  const { data: post, error: postErr } = await supabase
    .from('community_posts')
    .insert({
      user_id: userId,
      content,
      image_url: storedImageUrl,
      category,
      flair: flair ?? null,
      is_anonymous: isAnonymous,
    })
    .select('id')
    .single();
  if (postErr) throw postErr;

  if (pollOptions.length >= 2) {
    const options = pollOptions.map((text, i) => ({
      post_id: post.id,
      option_text: text,
      sort_order: i,
    }));
    const { error: optErr } = await supabase
      .from('community_poll_options')
      .insert(options);
    if (optErr) throw optErr;
  }

  return post.id;
}

export async function deleteCommunityPost(postId) {
  const { error } = await supabase
    .from('community_posts')
    .delete()
    .eq('id', postId);
  if (error) throw error;
}

// ── Likes ─────────────────────────────────────────────────────────────────

export async function likePost(userId, postId) {
  const { error } = await supabase
    .from('community_likes')
    .insert({ user_id: userId, post_id: postId });
  if (error && error.code !== '23505') throw error; // ignore duplicate
}

export async function unlikePost(userId, postId) {
  const { error } = await supabase
    .from('community_likes')
    .delete()
    .eq('user_id', userId)
    .eq('post_id', postId);
  if (error) throw error;
}

// ── Saves ─────────────────────────────────────────────────────────────────

export async function savePost(userId, postId) {
  const { error } = await supabase
    .from('community_saves')
    .insert({ user_id: userId, post_id: postId });
  if (error && error.code !== '23505') throw error;
}

export async function unsavePost(userId, postId) {
  const { error } = await supabase
    .from('community_saves')
    .delete()
    .eq('user_id', userId)
    .eq('post_id', postId);
  if (error) throw error;
}

// ── Reports ───────────────────────────────────────────────────────────────

export async function reportCommunityPost(userId, postId, reason, description = '') {
  const { error } = await supabase
    .from('community_reports')
    .insert({ reporter_id: userId, post_id: postId, reason, description: description || null });
  if (error && error.code !== '23505') throw error; // ignore duplicate report
}

export async function reportCommunityComment(userId, commentId, reason, description = '') {
  const { error } = await supabase
    .from('community_comment_reports')
    .insert({ reporter_id: userId, comment_id: commentId, reason, description: description || null });
  if (error && error.code !== '23505') throw error; // ignore duplicate report
}

// ── Comments ─────────────────────────────────────────────────────────────

export async function addComment(userId, postId, content) {
  const { data, error } = await supabase
    .from('community_comments')
    .insert({ user_id: userId, post_id: postId, content, parent_comment_id: null })
    .select('id, created_at')
    .single();
  if (error) throw error;
  return data;
}

export async function addReply(userId, postId, parentCommentId, replyingToName, content) {
  const { data, error } = await supabase
    .from('community_comments')
    .insert({
      user_id: userId,
      post_id: postId,
      parent_comment_id: parentCommentId,
      replying_to_name: replyingToName,
      content,
    })
    .select('id, created_at')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteComment(commentId) {
  const { error } = await supabase
    .from('community_comments')
    .delete()
    .eq('id', commentId);
  if (error) throw error;
}

// ── Polls ─────────────────────────────────────────────────────────────────

/**
 * Vote on a poll. If the user has already voted on this post, the old vote
 * is deleted first (change-vote). The trigger handles vote_count updates.
 */
export async function voteOnPoll(userId, postId, optionId) {
  // Delete previous vote first (no-op if none exists)
  await supabase
    .from('community_poll_votes')
    .delete()
    .eq('user_id', userId)
    .eq('post_id', postId);

  const { error } = await supabase
    .from('community_poll_votes')
    .insert({ user_id: userId, post_id: postId, option_id: optionId });
  if (error) throw error;
}

// ── Category preferences ──────────────────────────────────────────────────

export async function fetchCategoryPreferences(userId) {
  const { data, error } = await supabase
    .from('community_category_preferences')
    .select('category_id, action')
    .eq('user_id', userId);
  if (error) throw error;

  const followed = [];
  const blocked = [];
  (data ?? []).forEach((row) => {
    if (row.action === 'follow') followed.push(row.category_id);
    else if (row.action === 'block') blocked.push(row.category_id);
  });
  return { followedCategoryIds: followed, blockedCategoryIds: blocked };
}

export async function upsertCategoryPreference(userId, categoryId, action) {
  const { error } = await supabase
    .from('community_category_preferences')
    .upsert({ user_id: userId, category_id: categoryId, action });
  if (error) throw error;
}

export async function deleteCategoryPreference(userId, categoryId) {
  const { error } = await supabase
    .from('community_category_preferences')
    .delete()
    .eq('user_id', userId)
    .eq('category_id', categoryId);
  if (error) throw error;
}

// ── Notifications ─────────────────────────────────────────────────────────

export async function fetchCommunityNotifications(userId) {
  const { data, error } = await supabase
    .from('community_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map(toCamelCase);
}

export async function markAllCommunityNotificationsRead(userId) {
  const { error } = await supabase
    .from('community_notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
  if (error) throw error;
}

// ── Normalisation helpers ─────────────────────────────────────────────────

function normaliseCommunityPost(row, currentUserId) {
  const isCurrentUser = row.user_id === currentUserId;
  // PostgREST returns the joined row as an array when the FK targets a non-PK
  // unique column (profiles.user_id). Unwrap it here.
  const author = Array.isArray(row.author) ? (row.author[0] ?? {}) : (row.author ?? {});

  return {
    id: row.id,
    author: row.is_anonymous && !isCurrentUser
      ? { id: null, name: 'Anonymous', avatarInitials: '??', scdType: null, isCurrentUser: false }
      : {
          id: row.user_id,
          name: author.nickname ?? 'Unknown',
          avatarInitials: initials(author.nickname ?? 'U'),
          scdType: author.scd_type ?? null,
          isCurrentUser,
        },
    content: row.content,
    imageUrl: row.image_url ?? null,
    category: row.category,
    flair: row.flair ?? null,
    isAnonymous: row.is_anonymous,
    isSystemPost: row.is_system_post,
    systemCategory: row.system_category ?? null,
    isDiscussionPrompt: row.is_discussion_prompt,
    likes: row.like_count,
    commentCount: row.comment_count,
    timestamp: row.created_at,
    isLiked: Array.isArray(row.is_liked) ? row.is_liked.length > 0 : false,
    isSaved: Array.isArray(row.is_saved) ? row.is_saved.length > 0 : false,
    poll: normalisePoll(row.poll_options, row.user_poll_vote),
    comments: [],
  };
}

function normaliseComment(row, currentUserId) {
  const author = Array.isArray(row.author) ? (row.author[0] ?? {}) : (row.author ?? {});
  return {
    id: row.id,
    author: {
      userId: row.user_id,
      name: author.nickname ?? 'Unknown',
      avatarInitials: initials(author.nickname ?? 'U'),
    },
    content: row.content,
    timestamp: row.created_at,
    replyingToName: row.replying_to_name ?? null,
    isCurrentUser: row.user_id === currentUserId,
  };
}

function normalisePoll(options, userVote) {
  if (!options || options.length === 0) return null;
  const votedOptionId = Array.isArray(userVote) && userVote.length > 0
    ? userVote[0].option_id
    : null;
  return {
    options: options
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((o) => ({ id: o.id, text: o.option_text, votes: o.vote_count })),
    votedOptionId,
  };
}

function initials(name) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}
