import { supabase } from '@/utils/auth/supabase';
import { toCamelCase } from '@/utils/caseMapping';


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

  const camel = toCamelCase(data);

  // claimed_badges may be legacy string[] or new { id, unlockedAt }[]
  const badgeUnlockDates = Object.fromEntries(
    (camel.claimedBadges ?? [])
      .filter((b) => typeof b === 'object' && b.id && b.unlockedAt)
      .map((b) => [b.id, b.unlockedAt])
  );

  return { ...camel, badgeUnlockDates };
}
/**
 * Use repairs to cover missed days:
 * - 1 missed day consumes 1 repair
 * - Repairs preserve the streak count, but do not add logged days
 * - If missed days exceed repairs_available, the streak cannot be repaired
 */
export async function acknowledgeStreakLoss(userId) {
  const { error } = await supabase
    .from('streaks')
    .update({ current_streak: 0, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
  if (error) throw error;
}

export async function repairStreak(userId) {
  const { data: streakRow, error: fetchError } = await supabase
    .from('streaks')
    .select('repairs_available, repairs_used, current_streak, last_log_date')
    .eq('user_id', userId)
    .single();
  if (fetchError) throw fetchError;
  if ((streakRow.repairs_available ?? 0) <= 0) {
    throw new Error('No repairs available');
  }
  if ((streakRow.current_streak ?? 0) < 1) {
    throw new Error('No active streak to repair');
  }

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const lastLogDate = streakRow.last_log_date ? new Date(streakRow.last_log_date) : null;
  lastLogDate?.setHours(0, 0, 0, 0);
  const daysSinceLastLog = lastLogDate
    ? Math.floor((todayDate - lastLogDate) / (1000 * 60 * 60 * 24))
    : null;
  const missedDays = daysSinceLastLog ? Math.max(daysSinceLastLog - 1, 0) : 0;

  if (!daysSinceLastLog || daysSinceLastLog <= 1 || missedDays < 1) {
    throw new Error('No missed days to repair');
  }

  if (missedDays > (streakRow.repairs_available ?? 0)) {
    throw new Error('Not enough repairs available');
  }

  // Repairs forgive the entire gap — set last_log_date to yesterday so
  // the streak appears alive again. The current_streak value is preserved
  // (repairs restore it, not extend it). When the user logs today,
  // submitHealthLog sees last_log_date = yesterday → isConsecutive = true
  // → streak increments normally.
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const { error: updateError } = await supabase
    .from('streaks')
    .update({
      repairs_available: (streakRow.repairs_available ?? 0) - missedDays,
      repairs_used: (streakRow.repairs_used ?? 0) + missedDays,
      last_log_date: yesterdayStr,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
  if (updateError) throw updateError;

  return {
    restoredStreak: streakRow.current_streak ?? 0,
    repairsUsed: missedDays,
    repairsRemaining: (streakRow.repairs_available ?? 0) - missedDays,
  };
}

export async function updateClaimedBadges(userId, badges) {
  const { error } = await supabase
    .from('streaks')
    .update({ claimed_badges: badges, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
  if (error) throw error;
}
