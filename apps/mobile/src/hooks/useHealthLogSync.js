import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/utils/auth/store';
import { flushHealthLogQueue } from '@/services/local/healthLogSync';
import { getHealthLogSyncStatus } from '@/services/local/healthLogSync';
import { getNetworkState, subscribeNetworkState } from '@/utils/network/connectivity';
import { subscribeHealthLogRepository } from '@/services/local/healthLogRepository';
import {
  applySyncedHealthLog,
  hydrateLocalHealthLogCaches,
} from '@/hooks/queries/useHealthDataQuery';

function hasDefiniteNetwork(state) {
  return state?.isConnected === true && state?.isInternetReachable === true;
}

export function useHealthLogSync() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.auth?.user?.id);
  const hasRealSession = useAuthStore((state) => Boolean(state.auth?.session && !state.auth?.isOfflineBootstrap));

  useEffect(() => {
    if (!userId) return undefined;
    // Hydration is useful for both a real and an offline-bootstrap account.
    // A storage failure remains recoverable and must not block navigation.
    hydrateLocalHealthLogCaches(queryClient, userId).catch((error) => {
      console.warn('[HealthLogSync] Local cache hydration deferred:', error?.code ?? 'storage_error');
    });
    if (!hasRealSession) return undefined;
    const flush = () => flushHealthLogQueue(userId, {
      onSynced: (record, result) => applySyncedHealthLog(queryClient, userId, record, result),
    });

    if (hasDefiniteNetwork(getNetworkState())) flush();
    const unsubscribeNetwork = subscribeNetworkState((state) => {
      if (hasDefiniteNetwork(state)) flush();
    });
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && hasDefiniteNetwork(getNetworkState())) flush();
    });
    return () => {
      unsubscribeNetwork();
      appStateSubscription.remove();
    };
  }, [userId, hasRealSession, queryClient]);
}

/** Event-driven aggregate status for generic queue UI. */
export function useHealthLogSyncStatus() {
  const userId = useAuthStore((state) => state.auth?.user?.id);
  const [counts, setCounts] = useState({ pending: 0, failed: 0 });

  useEffect(() => {
    let active = true;
    if (!userId) {
      setCounts({ pending: 0, failed: 0 });
      return undefined;
    }
    const refresh = () => {
      getHealthLogSyncStatus(userId)
        .then((next) => { if (active) setCounts(next); })
        .catch(() => { /* storage failure is surfaced by the save action */ });
    };
    refresh();
    const unsubscribe = subscribeHealthLogRepository(userId, refresh);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [userId]);

  return counts;
}
