import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/utils/auth/store';
import { queryKeys } from '@/hooks/queryKeys';
import { fetchStreak, repairStreak, acknowledgeStreakLoss, updateClaimedBadges } from '@/services/supabase/streak';

function useUserId() {
  return useAuthStore((s) => s.auth?.user?.id);
}

function getStreakGap(streak) {
  if (!streak?.lastLogDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastLog = new Date(streak.lastLogDate);
  lastLog.setHours(0, 0, 0, 0);

  const daysSinceLastLog = Math.floor((today - lastLog) / (1000 * 60 * 60 * 24));
  const missedDays = Math.max(daysSinceLastLog - 1, 0);

  return { today, lastLog, daysSinceLastLog, missedDays };
}

export function useStreakQuery() {
  const userId = useUserId();
  return useQuery({
    queryKey: queryKeys.streak(userId),
    queryFn: () => fetchStreak(userId),
    enabled: !!userId,
    select: (data) => {
      const gap = getStreakGap(data);
      if (!gap) return data;
      // Streak is still alive if logged today or yesterday
      if (gap.daysSinceLastLog <= 1) return data;
      // Broken streak — zero out currentStreak but preserve previousStreak for display
      // (submitHealthLog will reset to 1 on the next real log)
      return { ...data, currentStreak: 0, previousStreak: data.currentStreak };
    },
  });
}

/**
 * Compute missed day from streak data — replaces the old Zustand detectMissedDay action.
 * Returns null if no missed day, or an object with date info.
 */
export function useMissedDay() {
  const { data: streak } = useStreakQuery();

  const gap = getStreakGap(streak);
  if (!gap) return null;

  if (gap.daysSinceLastLog <= 1) return null; // logged yesterday or today — streak alive

  // Treat a streak as real from day 1. The first log should count, while
  // milestone celebrations can still start at higher thresholds.
  const previousStreak = streak.previousStreak ?? 0;
  if (previousStreak < 1) return null;

  const repairsAvailable = streak.repairsAvailable ?? 0;
  if (gap.missedDays > repairsAvailable) return null;

  const missedDate = new Date(gap.lastLog);
  missedDate.setDate(missedDate.getDate() + 1);

  const lastMissedDate = new Date(gap.today);
  lastMissedDate.setDate(lastMissedDate.getDate() - 1);

  const formatDate = (date) =>
    date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

  return {
    date: missedDate,
    dateString: missedDate.toISOString().split('T')[0],
    formattedDate: formatDate(missedDate),
    lastMissedDate,
    lastMissedDateString: lastMissedDate.toISOString().split('T')[0],
    formattedLastMissedDate: formatDate(lastMissedDate),
    missedDays: gap.missedDays,
    repairsRequired: gap.missedDays,
    daysAgo: gap.daysSinceLastLog - 1,
  };
}

/**
 * Detects a fully lost streak (gap > 3 days, had a streak).
 * Used to show the "You lost your streak" screen instead of the repair sheet.
 */
export function useStreakLost() {
  const { data: streak } = useStreakQuery();

  const gap = getStreakGap(streak);
  if (!gap) return null;

  if (gap.daysSinceLastLog <= 1) return null; // still alive
  const previousStreak = streak.previousStreak ?? 0;
  if (previousStreak < 1) return null;

  const repairsAvailable = streak.repairsAvailable ?? 0;
  if (gap.missedDays <= repairsAvailable) return null;

  return {
    lostStreak: previousStreak,
    missedDays: gap.missedDays,
    repairsAvailable,
  };
}

export function useAcknowledgeStreakLossMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => acknowledgeStreakLoss(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.streak(userId) });
    },
  });
}

export function useStreakRepairMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => repairStreak(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.streak(userId) });
    },
  });
}

export function useClaimBadgeMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (badges) => updateClaimedBadges(userId, badges),
    onMutate: async (badges) => {
      const previous = queryClient.getQueryData(queryKeys.streak(userId));
      queryClient.setQueryData(queryKeys.streak(userId), (old) => ({
        ...old,
        claimedBadges: badges,
      }));
      await queryClient.cancelQueries({ queryKey: queryKeys.streak(userId) });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(queryKeys.streak(userId), context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.streak(userId) });
    },
  });
}
