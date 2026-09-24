import { posthog } from '@/utils/analytics';
import { useAuthStore } from '@/utils/auth/store';
import {
  acknowledgeHealthLog,
  getHealthLogSyncCounts,
  listPendingHealthLogs,
  listHealthLogRecords,
  markHealthLogAttempt,
  markHealthLogFailure,
  retryHealthLog,
  subscribeHealthLogRepository,
} from '@/services/local/healthLogRepository';
import { getNetworkState } from '@/utils/network/connectivity';
import { submitHealthLogRemote } from '@/services/supabase/health';

const activeFlushes = new Map();

function hasDefiniteNetwork() {
  const state = getNetworkState();
  return state?.isConnected === true && state?.isInternetReachable === true;
}

function hasRealSession(userId) {
  const auth = useAuthStore.getState().auth;
  return Boolean(auth?.session && auth?.user?.id === userId && !auth.isOfflineBootstrap);
}

export function isPermanentHealthLogError(error) {
  const status = error?.status;
  const code = String(error?.code ?? '');
  if (status === 401 || status === 403 || status === 0) return false;
  if (/network|fetch|timeout|abort/i.test(`${error?.name ?? ''} ${error?.message ?? ''}`)) return false;
  return /^22|^23|^42/.test(code) || status === 400;
}

function isTransientHealthLogError(error) {
  return !isPermanentHealthLogError(error);
}

function safeSyncError(error, permanent) {
  if (error?.status === 401 || error?.status === 403 || String(error?.code ?? '') === '42501') return 'authentication_required';
  if (permanent) return 'validation_failed';
  return 'network_unavailable';
}

async function flushOne(userId, record, onSynced) {
  await markHealthLogAttempt(record.clientMutationId, userId);
  try {
    const result = await submitHealthLogRemote(userId, record);
    // Remove only after the transactional RPC acknowledges the logical write.
    await acknowledgeHealthLog(record.clientMutationId, userId);
    posthog.capture('symptom_log_sync_status', { status: 'synced' });
    try {
      await onSynced?.(record, result);
    } catch {
      // Cache/UI reconciliation is best effort; the durable acknowledgement
      // must not be replayed because a screen callback failed.
    }
    return { status: 'synced', record, result };
  } catch (error) {
    const permanent = isPermanentHealthLogError(error);
    const transient = isTransientHealthLogError(error);
    await markHealthLogFailure(record.clientMutationId, userId, {
      status: transient ? 'pending' : 'failed',
      retryable: transient,
      lastError: safeSyncError(error, permanent),
    });
    posthog.capture('symptom_log_sync_status', { status: permanent ? 'failed' : 'queued' });
    return { status: permanent ? 'failed' : 'queued', record, error };
  }
}

async function flushInternal(userId, options = {}) {
  if (!userId || !hasRealSession(userId) || !hasDefiniteNetwork()) {
    return getHealthLogSyncCounts(userId);
  }
  const records = await listPendingHealthLogs(userId);
  for (const record of records) {
    if (record.status === 'failed' && !record.retryable) continue;
    if (record.nextAttemptAt && new Date(record.nextAttemptAt).getTime() > Date.now()) continue;
    const outcome = await flushOne(userId, record, options.onSynced);
    // A network/auth failure applies to the remaining oldest records too; stop
    // this flush and let reconnect/backoff trigger the next bounded attempt.
    if (outcome.status === 'queued') break;
  }
  return getHealthLogSyncCounts(userId);
}

export function flushHealthLogQueue(userId, options = {}) {
  if (!userId) return Promise.resolve({ pending: 0, failed: 0 });
  const existing = activeFlushes.get(userId);
  if (existing) return existing;
  const activeFlush = flushInternal(userId, options)
    .catch((error) => {
      // Storage/auth/network errors leave records untouched and are retried by
      // the next explicit lifecycle or connectivity trigger.
      console.warn('[HealthLogSync] Flush deferred:', error?.code ?? 'sync_error');
      return getHealthLogSyncCounts(userId);
    })
    .finally(() => {
      if (activeFlushes.get(userId) === activeFlush) activeFlushes.delete(userId);
    });
  activeFlushes.set(userId, activeFlush);
  return activeFlush;
}

export async function getHealthLogSyncStatus(userId) {
  return getHealthLogSyncCounts(userId);
}

/** Reset failed records for the active account. The caller may then flush
 * only when a real Supabase session and definite connectivity are present. */
export async function retryAllFailedHealthLogs(userId) {
  if (!userId) return { pending: 0, failed: 0 };
  const records = await listHealthLogRecords(userId);
  for (const record of records) {
    if (record.status === 'failed') await retryHealthLog(record.clientMutationId, userId);
  }
  if (hasRealSession(userId) && hasDefiniteNetwork()) {
    return flushHealthLogQueue(userId);
  }
  return getHealthLogSyncCounts(userId);
}
