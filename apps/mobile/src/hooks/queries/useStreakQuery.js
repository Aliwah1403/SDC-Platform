import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/utils/auth/store';
import { fetchStreak, repairStreak, updateClaimedBadges } from '@/services/supabaseQueries';

function useUserId() {
  return useAuthStore((s) => s.auth?.user?.id);
}

export function useStreakQuery() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['streak', userId],
    queryFn: () => fetchStreak(userId),
    enabled: !!userId,
    select: (data) => {
      if (!data?.lastLogDate) return data;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastLog = new Date(data.lastLogDate);
      lastLog.setHours(0, 0, 0, 0);
      const daysSince = Math.floor((today - lastLog) / (1000 * 60 * 60 * 24));
      // Streak is still alive if logged today or yesterday
      if (daysSince <= 1) return data;
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

  if (!streak?.lastLogDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastLog = new Date(streak.lastLogDate);
  lastLog.setHours(0, 0, 0, 0);

  const daysSince = Math.floor((today - lastLog) / (1000 * 60 * 60 * 24));

  if (daysSince <= 1) return null; // logged yesterday or today — streak alive
  if (daysSince > 3) return null;  // gap too large — show lost streak screen instead

  // Only offer repair if the user had a streak worth saving
  const previousStreak = streak.previousStreak ?? 0;
  if (previousStreak < 3) return null;

  const missedDate = new Date(lastLog);
  missedDate.setDate(missedDate.getDate() + 1);

  return {
    date: missedDate,
    dateString: missedDate.toISOString().split('T')[0],
    formattedDate: missedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }),
    daysAgo: daysSince - 1,
  };
}

/**
 * Detects a fully lost streak (gap > 3 days, had a meaningful streak).
 * Used to show the "You lost your streak" screen instead of the repair sheet.
 */
export function useStreakLost() {
  const { data: streak } = useStreakQuery();

  if (!streak?.lastLogDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastLog = new Date(streak.lastLogDate);
  lastLog.setHours(0, 0, 0, 0);
  const daysSince = Math.floor((today - lastLog) / (1000 * 60 * 60 * 24));

  if (daysSince <= 3) return null; // still in repair window or alive
  const previousStreak = streak.previousStreak ?? 0;
  if (previousStreak < 3) return null; // not meaningful enough to mourn

  return { lostStreak: previousStreak };
}

export function useStreakRepairMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => repairStreak(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streak', userId] });
    },
  });
}

export function useClaimBadgeMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (badgeIds) => updateClaimedBadges(userId, badgeIds),
    onMutate: async (badgeIds) => {
      await queryClient.cancelQueries({ queryKey: ['streak', userId] });
      const previous = queryClient.getQueryData(['streak', userId]);
      queryClient.setQueryData(['streak', userId], (old) => ({
        ...old,
        claimedBadges: badgeIds,
      }));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['streak', userId], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['streak', userId] });
    },
  });
}
