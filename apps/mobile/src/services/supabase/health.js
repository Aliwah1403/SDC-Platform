import { supabase } from '@/utils/auth/supabase';
import { toCamelCase } from '@/utils/caseMapping';

const today = () => new Date().toISOString().split('T')[0];


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
 * Aggregate trigger/mood-contributor frequency across a date range, for the
 * recap "Your patterns" trigger-frequency insight. `triggers` only lives on
 * individual health_logs rows (not the daily_summaries aggregate), so this
 * queries the raw log table directly and counts client-side.
 */
export async function fetchTriggersInRange(userId, startDate, endDate) {
  let query = supabase
    .from('health_logs')
    .select('triggers')
    .eq('user_id', userId)
    .gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);
  const { data, error } = await query;
  if (error) throw error;

  const counts = {};
  (data || []).forEach((row) => {
    (row.triggers || []).forEach((t) => {
      counts[t] = (counts[t] || 0) + 1;
    });
  });
  return counts;
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
  let rawLogSaved = false;

  const throwSaveError = (error, stage) => {
    const saveError = error instanceof Error
      ? error
      : new Error(error?.message || 'Health log save failed');
    saveError.saveStage = stage;
    saveError.rawLogSaved = rawLogSaved;
    throw saveError;
  };

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
      hydration: logData.hydration ?? 0, // canonical ml — see src/utils/hydrationGoal.js
      notes: logData.notes || null,
      triggers: logData.triggers ?? [],
      activities: logData.activities ?? [],
    });
  if (logError) throwSaveError(logError, 'health_log_insert');
  rawLogSaved = true;

  // 2. Fetch all logs for today to compute aggregate
  const { data: todaysLogs, error: logsError } = await supabase
    .from('health_logs')
    .select('pain_level, hydration, mood')
    .eq('user_id', userId)
    .eq('date', todayStr)
    .order('created_at', { ascending: true });
  if (logsError) throwSaveError(logsError, 'health_logs_refresh');

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
  if (summaryError) throwSaveError(summaryError, 'daily_summary_update');

  // 4. Update streak
  const { data: streakRow, error: streakFetchError } = await supabase
    .from('streaks')
    .select('current_streak, longest_streak, last_log_date, repair_progress, days_until_next_repair, repairs_available, repairs_earned')
    .eq('user_id', userId)
    .single();
  if (streakFetchError) throwSaveError(streakFetchError, 'streak_fetch');

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
    if (streakUpdateError) throwSaveError(streakUpdateError, 'streak_update');

    return { newStreak, isNewDay: true, earnedRepair };
  }

  return { newStreak: streakRow.current_streak ?? 0, isNewDay: false, earnedRepair: false };
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
