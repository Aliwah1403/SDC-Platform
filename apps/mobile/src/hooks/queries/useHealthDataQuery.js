import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/utils/auth/store';
import {
  fetchDailySummaries,
  fetchHealthLogs,
  fetchTriggersInRange,
  submitHealthLog,
  addHydrationQuickly,
} from '@/services/supabaseQueries';
import { maybeSilenceHydrationReminders } from '@/utils/hydrationReminders';
import { DEFAULT_SUGGESTED_ML } from '@/utils/hydrationGoal';

function useUserId() {
  return useAuthStore((s) => s.auth?.user?.id);
}

/**
 * Daily summaries for charts and history.
 * startDate defaults to 90 days ago.
 */
export function useHealthDataQuery(startDate) {
  const userId = useUserId();
  return useQuery({
    queryKey: ['dailySummaries', userId, startDate ?? null],
    queryFn: () => fetchDailySummaries(userId, startDate),
    enabled: !!userId,
  });
}

/**
 * Raw health logs for a specific date (used in log-symptoms to show existing entries).
 */
export function useHealthLogsQuery(date) {
  const userId = useUserId();
  return useQuery({
    queryKey: ['healthLogs', userId, date],
    queryFn: () => fetchHealthLogs(userId, date),
    enabled: !!userId && !!date,
  });
}

/**
 * Trigger/mood-contributor frequency counts for a date range — feeds the
 * recap engine's "Your patterns" trigger-frequency insight (Step 5).
 */
export function useTriggersQuery(startDate, endDate) {
  const userId = useUserId();
  return useQuery({
    queryKey: ['triggers', userId, startDate ?? null, endDate ?? null],
    queryFn: () => fetchTriggersInRange(userId, startDate, endDate),
    enabled: !!userId && !!startDate,
  });
}

export function useSubmitLogMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (logData) => submitHealthLog(userId, logData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailySummaries', userId] });
      queryClient.invalidateQueries({ queryKey: ['healthLogs', userId] });
      queryClient.invalidateQueries({ queryKey: ['streak', userId] });
    },
  });
}

/**
 * Home-tile "+250 ml" quick-add — optimistically bumps today's cached hydration
 * total (the `useHealthDataQuery()` cache entry the home screen reads from) so
 * the tile updates instantly, then reconciles with the server on settle.
 */
export function useAddHydrationMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const queryKey = ['dailySummaries', userId, null];

  return useMutation({
    mutationFn: (addedMl) => addHydrationQuickly(userId, addedMl),
    onMutate: async (addedMl) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      const todayStr = new Date().toISOString().split('T')[0];

      queryClient.setQueryData(queryKey, (old = []) => {
        const idx = old.findIndex((d) => d.date === todayStr);
        if (idx === -1) {
          return [{ date: todayStr, hydration: addedMl, painLevel: 0, mood: 0 }, ...old];
        }
        return old.map((d, i) =>
          i === idx ? { ...d, hydration: (d.hydration ?? 0) + addedMl } : d
        );
      });

      return { previous };
    },
    onError: (err, _addedMl, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      console.error('[useAddHydrationMutation] quick-add failed:', err?.message ?? err);
    },
    onSuccess: (result) => {
      // Goal-aware silencing (Step 10 decision 3) — best-effort, uses the
      // BASE goal from the metric-goals cache (never the heat-bumped goal).
      const baseGoalMl = queryClient.getQueryData(['metricGoals', userId])?.hydration ?? DEFAULT_SUGGESTED_ML;
      maybeSilenceHydrationReminders(result?.hydration, baseGoalMl);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dailySummaries', userId] });
    },
  });
}
