import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/utils/auth/store';
import {
  fetchDailySummaries,
  fetchHealthLogs,
  submitHealthLog,
} from '@/services/supabaseQueries';

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
