import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/utils/auth/store';
import { queryKeys } from '@/hooks/queryKeys';
import { fetchMetricGoals, updateMetricGoal } from '@/services/supabase/goals';

function useUserId() {
  return useAuthStore((s) => s.auth?.user?.id);
}

export function useMetricGoalsQuery() {
  const userId = useUserId();
  return useQuery({
    queryKey: queryKeys.metricGoals(userId),
    queryFn: () => fetchMetricGoals(userId),
    enabled: !!userId,
  });
}

export function useSetGoalMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ metric, value }) => updateMetricGoal(userId, metric, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.metricGoals(userId) });
    },
  });
}
