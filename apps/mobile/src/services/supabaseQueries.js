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
