import { supabase } from '@/utils/auth/supabase';
import { toCamelCase, toSnakeCase } from '@/utils/caseMapping';

const today = () => new Date().toISOString().split('T')[0];


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
      .select('id, medication_id, taken_at, scheduled_time')
      .eq('user_id', userId)
      .eq('date', todayStr)
      .order('taken_at', { ascending: true }),
  ]);

  if (medsResult.error) throw medsResult.error;
  if (logsResult.error) throw logsResult.error;

  // Group all today's logs per medication (supports multiple doses per day)
  const logsMap = new Map();
  for (const log of logsResult.data || []) {
    if (!logsMap.has(log.medication_id)) logsMap.set(log.medication_id, []);
    logsMap.get(log.medication_id).push({
      id: log.id,
      takenAt: log.taken_at,
      scheduledTime: log.scheduled_time,
    });
  }

  return (medsResult.data || []).map((med) => {
    const todayLogs = logsMap.get(med.id) ?? [];
    return {
      ...toCamelCase(med),
      // start_date is intentionally set by the user; fall back to created_at so it's always populated
      startDate: med.start_date ?? med.created_at,
      taken: todayLogs.length > 0,
      takenAt: todayLogs[0]?.takenAt ?? null,
      logs: todayLogs,
    };
  });
}
export async function fetchMedicationHistory(userId, medicationId) {
  const { data, error } = await supabase
    .from('medication_logs')
    .select('date, taken_at')
    .eq('user_id', userId)
    .eq('medication_id', medicationId)
    .order('date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addMedication(userId, med) {
  const { data, error } = await supabase
    .from('medications')
    .insert({
      user_id: userId,
      name: med.name,
      dosage: med.dosage || null,
      frequency: med.frequency || 'Every Day',
      type: med.type || 'tablet',
      prescribed_by: med.prescribedBy || null,
      start_date: med.startDate || null,
      is_active: true,
      time: med.time || null,
      times: med.times ?? [],
      notes: med.notes || null,
      category: med.category || 'Supportive',
      rxcui: med.rxcui || null,
      brand_names: med.brandNames || null,
      reminders: med.reminders ?? [],
      selected_days: med.selectedDays ?? [],
      weekday: med.weekday ?? null,
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
    // Un-take: delete ALL logs for today (including any extra doses)
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

export async function addMedicationLog(userId, medId, scheduledTime = null) {
  const { error } = await supabase
    .from('medication_logs')
    .insert({
      medication_id: medId,
      user_id: userId,
      date: today(),
      taken_at: new Date().toISOString(),
      scheduled_time: scheduledTime,
    });
  if (error) throw error;
}

export async function deleteMedicationLogById(logId) {
  const { error } = await supabase
    .from('medication_logs')
    .delete()
    .eq('id', logId);
  if (error) throw error;
}

export async function deleteLatestMedicationLog(userId, medId) {
  const { data, error: lookupError } = await supabase
    .from('medication_logs')
    .select('id')
    .eq('medication_id', medId)
    .eq('user_id', userId)
    .eq('date', today())
    .order('taken_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (!data) return;
  const { error } = await supabase
    .from('medication_logs')
    .delete()
    .eq('id', data.id);
  if (error) throw error;
}

export async function markGroupTaken(userId, doses) {
  const todayStr = today();
  const now = new Date().toISOString();
  const rows = doses.map(({ medicationId, scheduledTime = null }) => ({
    medication_id: medicationId,
    user_id: userId,
    date: todayStr,
    taken_at: now,
    scheduled_time: scheduledTime,
  }));
  const { error } = await supabase
    .from('medication_logs')
    .insert(rows);
  if (error && error.code !== '23505') throw error;
}
