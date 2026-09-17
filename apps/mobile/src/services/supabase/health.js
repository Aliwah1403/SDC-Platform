import { supabase } from '@/utils/auth/supabase';
import { toCamelCase } from '@/utils/caseMapping';
import { toLocalDateStr } from '@/utils/dateUtils';
import { listHealthLogRecords, toHealthLogView } from '@/services/local/healthLogRepository';

const today = () => toLocalDateStr(new Date());

function mergeHealthLogs(serverLogs, localRecords) {
  const server = (serverLogs || []).map(toCamelCase);
  const serverMutationIds = new Set(server.map((log) => log.clientMutationId).filter(Boolean));
  const local = (localRecords || [])
    .filter((record) => !serverMutationIds.has(record.clientMutationId))
    .map(toHealthLogView);
  return [...server, ...local].sort((a, b) => String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? '')));
}

function mergeDailySummaries(serverSummaries, localRecords) {
  const summaries = new Map((serverSummaries || []).map((summary) => [summary.date, { ...summary }]));
  for (const record of localRecords || []) {
    const view = toHealthLogView(record);
    const current = summaries.get(view.date) || { date: view.date, painLevel: 0, hydration: 0, mood: 0 };
    summaries.set(view.date, {
      ...current,
      painLevel: Math.max(current.painLevel ?? 0, view.painLevel ?? 0),
      hydration: Math.max(current.hydration ?? 0, view.hydration ?? 0),
      mood: view.createdAt >= (current.updatedAt ?? '') ? view.mood : current.mood,
      hasPendingLogs: true,
    });
  }
  return [...summaries.values()].sort((a, b) => String(b.date).localeCompare(String(a.date)));
}


/**
 * Fetch daily summaries for the last N days.
 * Default: 90 days back (matches mock data range).
 */
export async function fetchDailySummaries(userId, startDate) {
  const start = startDate || (() => {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return toLocalDateStr(d);
  })();

  const { data, error } = await supabase
    .from('daily_summaries')
    .select('*')
    .eq('user_id', userId)
    .gte('date', start)
    .order('date', { ascending: false });
  if (error) throw error;
  let localRecords = [];
  try {
    localRecords = await listHealthLogRecords(userId);
  } catch (storageError) {
    console.warn('[HealthLog] Local encrypted read unavailable:', storageError?.code ?? 'storage_error');
  }
  return mergeDailySummaries((data || []).map(toCamelCase), localRecords.filter((record) => record.capturedLocalDate >= start));
}
export async function fetchHealthLogs(userId, date) {
  const { data, error } = await supabase
    .from('health_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .order('created_at', { ascending: true });
  if (error) throw error;
  let localRecords = [];
  try {
    localRecords = await listHealthLogRecords(userId, { date });
  } catch (storageError) {
    console.warn('[HealthLog] Local encrypted read unavailable:', storageError?.code ?? 'storage_error');
  }
  return mergeHealthLogs(data || [], localRecords);
}

/**
 * Aggregate trigger/mood-contributor frequency across a date range, for the
 * recap "Your patterns" trigger-frequency insight. `triggers` only lives on
 * individual health_logs rows (not the daily_summaries aggregate), so this
 * queries the raw log table directly and counts client-side.
 */
export async function fetchTriggersInRange(userId, startDate, endDate) {
  let query = supabase
    .from('health_logs')
    .select('triggers, client_mutation_id')
    .eq('user_id', userId)
    .gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);
  const { data, error } = await query;
  if (error) throw error;

  const counts = {};
  const serverMutationIds = new Set((data || []).map((row) => row.client_mutation_id).filter(Boolean));
  (data || []).forEach((row) => {
    (row.triggers || []).forEach((t) => {
      counts[t] = (counts[t] || 0) + 1;
    });
  });
  try {
    const localRecords = await listHealthLogRecords(userId);
    localRecords
      .filter((record) => !serverMutationIds.has(record.clientMutationId))
      .filter((record) => record.capturedLocalDate >= startDate && (!endDate || record.capturedLocalDate <= endDate))
      .forEach((record) => {
        (record.payload?.triggers || []).forEach((trigger) => {
          counts[trigger] = (counts[trigger] || 0) + 1;
        });
      });
  } catch (storageError) {
    console.warn('[HealthLog] Local encrypted read unavailable:', storageError?.code ?? 'storage_error');
  }
  return counts;
}

/** Server acknowledgement for one local record. The SQL RPC is transactional
 * and idempotent by (user_id, client_mutation_id). */
export async function submitHealthLogRemote(userId, record) {
  const payload = record.payload ?? {};
  const mood = payload.mood === 'excellent' ? 5
    : payload.mood === 'good' ? 4
    : payload.mood === 'fair' ? 3
    : payload.mood === 'poor' ? 2
    : typeof payload.mood === 'number' ? payload.mood : 1;
  const { data, error } = await supabase.rpc('submit_health_log', {
    p_client_mutation_id: record.clientMutationId,
    p_captured_at: record.capturedAt,
    p_captured_local_date: record.capturedLocalDate,
    p_captured_timezone: record.capturedTimezone,
    p_pain_level: payload.painLevel ?? 0,
    p_body_locations: payload.bodyLocations ?? [],
    p_symptoms: payload.symptoms ?? [],
    p_mood: mood,
    p_hydration: payload.hydration ?? 0,
    p_notes: payload.notes || null,
    p_triggers: payload.triggers ?? [],
    p_activities: payload.activities ?? [],
  });
  if (error) throw error;
  return data;
}

// Kept as a compatibility name for callers outside the mutation hook. New
// callers should enqueue locally and let the coordinator call the RPC.
export async function submitHealthLog(userId, logData) {
  const record = {
    clientMutationId: logData.clientMutationId,
    capturedAt: logData.capturedAt ?? new Date().toISOString(),
    capturedLocalDate: logData.capturedLocalDate ?? today(),
    capturedTimezone: logData.capturedTimezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    payload: logData,
  };
  return submitHealthLogRemote(userId, record);
}

/**
 * Home-tile "+250 ml" quick-add. Inserts a lightweight health_logs row (carrying
 * forward today's existing pain_level/mood so the MAX-based daily_summaries
 * aggregation in submitHealthLog isn't corrupted by defaults) and bumps
 * daily_summaries.hydration. Does not touch the streak — only the full
 * check-in flow (submitHealthLog) counts as "logged today" for streak purposes.
 */
export async function addHydrationQuickly(userId, addedMl) {
  const todayStr = today();

  const { data: summary, error: summaryFetchError } = await supabase
    .from('daily_summaries')
    .select('hydration, pain_level, mood')
    .eq('user_id', userId)
    .eq('date', todayStr)
    .maybeSingle();
  if (summaryFetchError) throw summaryFetchError;

  const newHydration = (summary?.hydration ?? 0) + addedMl;
  const painLevel = summary?.pain_level ?? 0;
  const mood = summary?.mood ?? 0;

  const { error: logError } = await supabase
    .from('health_logs')
    .insert({
      user_id: userId,
      date: todayStr,
      pain_level: painLevel,
      body_locations: [],
      symptoms: [],
      mood,
      hydration: newHydration,
      notes: null,
      triggers: [],
      activities: [],
    });
  if (logError) throw logError;

  const { error: summaryError } = await supabase
    .from('daily_summaries')
    .upsert(
      {
        user_id: userId,
        date: todayStr,
        pain_level: painLevel,
        hydration: newHydration,
        mood,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,date' }
    );
  if (summaryError) throw summaryError;

  return { hydration: newHydration };
}
