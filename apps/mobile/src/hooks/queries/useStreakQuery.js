import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/utils/auth/store';
import { fetchStreak, repairStreak } from '@/services/supabaseQueries';

function useUserId() {
  return useAuthStore((s) => s.auth?.user?.id);
}

export function useStreakQuery() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['streak', userId],
    queryFn: () => fetchStreak(userId),
    enabled: !!userId,
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

  if (daysSince <= 1) return null; // logged yesterday or today — no missed day

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

export function useStreakRepairMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (missedDateStr) => repairStreak(userId, missedDateStr),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streak', userId] });
      queryClient.invalidateQueries({ queryKey: ['dailySummaries', userId] });
    },
  });
}
