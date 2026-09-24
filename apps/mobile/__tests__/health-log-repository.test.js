const secureValues = {};
const mmkvValues = {};

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key) => secureValues[key] ?? null),
  setItemAsync: jest.fn(async (key, value) => { secureValues[key] = value; }),
}));

jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn(async (length) => new Uint8Array(length).fill(7)),
  randomUUID: jest.fn(() => `mutation-${Math.random().toString(16).slice(2)}`),
}));

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn(() => ({
    getString: (key) => mmkvValues[key],
    set: (key, value) => { mmkvValues[key] = value; },
  })),
}));

import {
  enqueueHealthLog,
  getHealthLogSyncCounts,
  listHealthLogRecords,
  listPendingHealthLogs,
  markHealthLogAttempt,
  markHealthLogFailure,
  purgeHealthLogs,
  retryHealthLog,
  subscribeHealthLogRepository,
  acknowledgeHealthLog,
  toHealthLogView,
} from '@/services/local/healthLogRepository';
import { toLocalDateStr } from '@/utils/dateUtils';

describe('encrypted local health-log repository', () => {
  beforeEach(() => {
    delete mmkvValues['hemo.health-logs.records.v1'];
  });

  test('persists required metadata and uses the device-local date', async () => {
    const capturedAt = new Date('2026-01-02T00:30:00.000Z');
    const record = await enqueueHealthLog('user-a', { painLevel: 4, mood: 'good' }, {
      clientMutationId: 'mutation-a',
      capturedAt,
    });

    expect(record).toMatchObject({
      clientMutationId: 'mutation-a',
      userId: 'user-a',
      capturedAt: capturedAt.toISOString(),
      capturedLocalDate: toLocalDateStr(capturedAt),
      payload: { painLevel: 4, mood: 'good' },
      attempts: 0,
      status: 'pending',
      lastError: null,
    });
    expect(record.capturedTimezone).toEqual(expect.any(String));
    expect(record.createdAt).toEqual(expect.any(String));
    expect(record.updatedAt).toEqual(expect.any(String));
  });

  test('keeps records isolated by user and survives a repository reload representation', async () => {
    await enqueueHealthLog('user-a', { painLevel: 1 }, { clientMutationId: 'a' });
    await enqueueHealthLog('user-b', { painLevel: 5 }, { clientMutationId: 'b' });

    // A fresh read sees the same encrypted MMKV representation, while a
    // different account cannot enumerate the first account's records.
    expect((await listHealthLogRecords('user-a')).map((r) => r.clientMutationId)).toEqual(['a']);
    expect((await listHealthLogRecords('user-b')).map((r) => r.clientMutationId)).toEqual(['b']);
    expect(toHealthLogView((await listHealthLogRecords('user-a'))[0]).painLevel).toBe(1);

    await purgeHealthLogs('user-a');
    expect(await listHealthLogRecords('user-a')).toEqual([]);
    expect((await listHealthLogRecords('user-b'))[0].clientMutationId).toBe('b');
  });

  test('retains transient failures, exposes counts, and permits explicit retry', async () => {
    const record = await enqueueHealthLog('user-a', { painLevel: 2 }, { clientMutationId: 'retry-me' });
    await markHealthLogFailure(record.clientMutationId, 'user-a', {
      status: 'pending',
      retryable: true,
      lastError: 'network_unavailable',
    });
    expect(await getHealthLogSyncCounts('user-a')).toEqual({ pending: 1, failed: 0 });

    await markHealthLogFailure(record.clientMutationId, 'user-a', {
      status: 'failed',
      retryable: false,
      lastError: 'validation_failed',
    });
    expect(await getHealthLogSyncCounts('user-a')).toEqual({ pending: 0, failed: 1 });
    await retryHealthLog(record.clientMutationId, 'user-a');
    expect((await listHealthLogRecords('user-a'))[0]).toMatchObject({ status: 'pending', retryable: true, lastError: null });
  });

  test('reattempts a record left syncing by a terminated process', async () => {
    const record = await enqueueHealthLog('user-a', { painLevel: 2 }, { clientMutationId: 'interrupted' });
    await markHealthLogAttempt(record.clientMutationId, 'user-a');
    expect((await listPendingHealthLogs('user-a')).map((item) => item.clientMutationId)).toEqual(['interrupted']);
  });

  test('notifies only aggregate observers for lifecycle changes', async () => {
    const listener = jest.fn();
    const unsubscribe = subscribeHealthLogRepository('user-a', listener);
    const record = await enqueueHealthLog('user-a', { painLevel: 2 }, { clientMutationId: 'notify-me' });
    await markHealthLogAttempt(record.clientMutationId, 'user-a');
    await markHealthLogFailure(record.clientMutationId, 'user-a', { status: 'failed', retryable: false });
    await acknowledgeHealthLog(record.clientMutationId, 'user-a');
    unsubscribe();
    await enqueueHealthLog('user-a', { painLevel: 3 }, { clientMutationId: 'after-unsubscribe' });
    expect(listener).toHaveBeenCalledTimes(4);
    expect(listener.mock.calls[0]).toEqual([]);
  });
});
