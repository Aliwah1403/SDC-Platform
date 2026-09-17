import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/utils/auth/store';
import { queryKeys } from '@/hooks/queryKeys';
import {
  fetchDailySummaries,
  fetchHealthLogs,
  fetchTriggersInRange,
  addHydrationQuickly,
} from '@/services/supabase/health';
import {
  enqueueHealthLog,
  listHealthLogRecords,
  notifyHealthLogRepository,
  toHealthLogView,
} from '@/services/local/healthLogRepository';
import { flushHealthLogQueue } from '@/services/local/healthLogSync';
import { toCamelCase } from '@/utils/caseMapping';
import { getNetworkState } from '@/utils/network/connectivity';
import { posthog } from '@/utils/analytics';
import { maybeSilenceHydrationReminders } from '@/utils/hydrationReminders';
import { DEFAULT_SUGGESTED_ML } from '@/utils/hydrationGoal';
import { toLocalDateStr } from '@/utils/dateUtils';

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
    queryKey: queryKeys.dailySummaries(userId, startDate),
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
    queryKey: queryKeys.healthLogs(userId, date),
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
    queryKey: queryKeys.triggers(userId, startDate ?? null, endDate ?? null),
    queryFn: () => fetchTriggersInRange(userId, startDate, endDate),
    enabled: !!userId && !!startDate,
  });
}

export function useSubmitLogMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: 'always',
    mutationFn: async (logData) => {
      // The encrypted local write is the commit point for the UI. Network
      // acknowledgement is a separate coordinator concern.
      return enqueueHealthLog(userId, logData);
    },
    onSuccess: (record) => {
      applyLocalHealthLog(queryClient, userId, record);
      posthog.capture('symptom_log_sync_status', { status: 'queued' });
      const network = getNetworkState();
      const auth = useAuthStore.getState().auth;
      if (auth?.session && !auth.isOfflineBootstrap && network?.isConnected === true && network?.isInternetReachable === true) {
        // Start only after the local cache has been updated. This prevents a
        // very fast RPC acknowledgement from being overwritten by the
        // mutation's pending onSuccess reconciliation.
        flushHealthLogQueue(userId, {
          onSynced: (syncedRecord, result) => applySyncedHealthLog(queryClient, userId, syncedRecord, result),
        });
      }
    },
    onSettled: (_data, _error) => {
      // Refetch only when online; local merge keeps the pending entry visible
      // while offline and avoids replacing it with an empty server response.
      const network = getNetworkState();
      if (network?.isConnected === true && network?.isInternetReachable === true) {
        queryClient.invalidateQueries({ queryKey: queryKeys.dailySummariesRoot(userId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.healthLogsRoot(userId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.streak(userId) });
      }
    },
  });
}

function applyLocalHealthLog(queryClient, userId, record) {
  const view = toHealthLogView(record);
  queryClient.setQueryData(queryKeys.healthLogs(userId, record.capturedLocalDate), (old = []) => {
    const withoutSameMutation = old.filter((log) => log.clientMutationId !== record.clientMutationId);
    return [...withoutSameMutation, view].sort((a, b) => String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? '')));
  });
  const updateSummaries = (old) => {
    const summaries = Array.isArray(old) ? old : [];
    const current = summaries.find((summary) => summary.date === view.date) ?? { date: view.date, painLevel: 0, hydration: 0, mood: 0 };
    const next = {
      ...current,
      painLevel: Math.max(current.painLevel ?? 0, view.painLevel ?? 0),
      hydration: Math.max(current.hydration ?? 0, view.hydration ?? 0),
      mood: view.mood,
      hasPendingLogs: true,
    };
    const rest = summaries.filter((summary) => summary.date !== view.date);
    return [next, ...rest].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  };
  const summaryQueries = queryClient.getQueriesData({ queryKey: queryKeys.dailySummariesRoot(userId) });
  if (summaryQueries.length === 0) {
    // setQueriesData only updates existing entries. Seed the default summary
    // cache as well so a cold offline launch still has a visible local day.
    queryClient.setQueryData(queryKeys.dailySummaries(userId), updateSummaries);
  } else {
    queryClient.setQueriesData({ queryKey: queryKeys.dailySummariesRoot(userId) }, updateSummaries);
  }
}

/**
 * Rehydrates every durable local record into the active user's query caches.
 * This is intentionally separate from React Query persistence: only the
 * encrypted, user-scoped health-log repository is read after a restart.
 */
export async function hydrateLocalHealthLogCaches(queryClient, userId) {
  if (!userId) return [];
  const records = await listHealthLogRecords(userId);
  records.forEach((record) => applyLocalHealthLog(queryClient, userId, record));
  notifyHealthLogRepository(userId);
  return records;
}

export function applySyncedHealthLog(queryClient, userId, record, result) {
  const canonical = result?.log ? toCamelCase(result.log) : toHealthLogView(record);
  queryClient.setQueryData(queryKeys.healthLogs(userId, record.capturedLocalDate), (old = []) => {
    const withoutSameMutation = old.filter((log) => log.clientMutationId !== record.clientMutationId);
    const withoutSameId = withoutSameMutation.filter((log) => !canonical.id || log.id !== canonical.id);
    return [...withoutSameId, canonical].sort((a, b) => String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? '')));
  });
  if (result?.summary) {
    const summary = toCamelCase(result.summary);
    const updateSummaries = (old) => {
      const summaries = Array.isArray(old) ? old : [];
      return [summary, ...summaries.filter((item) => item.date !== summary.date)]
        .sort((a, b) => String(b.date).localeCompare(String(a.date)));
    };
    const summaryQueries = queryClient.getQueriesData({ queryKey: queryKeys.dailySummariesRoot(userId) });
    if (summaryQueries.length === 0) queryClient.setQueryData(queryKeys.dailySummaries(userId), updateSummaries);
    else queryClient.setQueriesData({ queryKey: queryKeys.dailySummariesRoot(userId) }, updateSummaries);
  }
  if (result?.streak) {
    const streak = toCamelCase(result.streak);
    // The offline save's mutation settles before connectivity returns, so its
    // normal invalidation cannot refresh the streak. Reconcile the RPC result
    // immediately, then revalidate to restore any fetch-only derived fields.
    queryClient.setQueryData(queryKeys.streak(userId), (old) => ({ ...old, ...streak }));
    queryClient.invalidateQueries({ queryKey: queryKeys.streak(userId) });
  }
}

/**
 * Home-tile "+250 ml" quick-add — optimistically bumps today's cached hydration
 * total (the `useHealthDataQuery()` cache entry the home screen reads from) so
 * the tile updates instantly, then reconciles with the server on settle.
 */
export function useAddHydrationMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const queryKey = queryKeys.dailySummaries(userId);

  return useMutation({
    mutationFn: (addedMl) => addHydrationQuickly(userId, addedMl),
    onMutate: async (addedMl) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      const todayStr = toLocalDateStr(new Date());

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
      const baseGoalMl = queryClient.getQueryData(queryKeys.metricGoals(userId))?.hydration ?? DEFAULT_SUGGESTED_ML;
      maybeSilenceHydrationReminders(result?.hydration, baseGoalMl);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dailySummariesRoot(userId) });
    },
  });
}
