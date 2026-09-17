jest.mock('@/services/local/healthLogRepository', () => ({
  enqueueHealthLog: jest.fn(),
  listHealthLogRecords: jest.fn(),
  notifyHealthLogRepository: jest.fn(),
  toHealthLogView: jest.fn((record) => ({
    id: record.clientMutationId,
    clientMutationId: record.clientMutationId,
    date: record.capturedLocalDate,
    createdAt: record.createdAt,
    painLevel: record.payload.painLevel,
    hydration: record.payload.hydration ?? 0,
    mood: record.payload.mood ?? 3,
    isPending: true,
    syncStatus: 'pending',
  })),
}));
jest.mock('@/services/supabase/health', () => ({
  fetchDailySummaries: jest.fn(),
  fetchHealthLogs: jest.fn(),
  fetchTriggersInRange: jest.fn(),
  addHydrationQuickly: jest.fn(),
}));
jest.mock('@/utils/analytics', () => ({ posthog: { capture: jest.fn() } }));
jest.mock('@/utils/hydrationReminders', () => ({ maybeSilenceHydrationReminders: jest.fn() }));

import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/queryKeys';
import { applySyncedHealthLog, hydrateLocalHealthLogCaches } from '@/hooks/queries/useHealthDataQuery';

const localRepo = jest.requireMock('@/services/local/healthLogRepository');

describe('local health-log cache hydration', () => {
  let queryClient;

  afterEach(() => queryClient?.clear());

  test('seeds logs and daily summaries when no server query cache exists', async () => {
    queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
    localRepo.listHealthLogRecords.mockResolvedValue([{
      clientMutationId: 'restart-log',
      capturedLocalDate: '2026-09-15',
      createdAt: '2026-09-15T10:00:00.000Z',
      payload: { painLevel: 4, hydration: 750, mood: 4 },
    }]);

    await hydrateLocalHealthLogCaches(queryClient, 'user-a');

    expect(queryClient.getQueryData(queryKeys.healthLogs('user-a', '2026-09-15'))).toEqual([
      expect.objectContaining({ clientMutationId: 'restart-log', painLevel: 4 }),
    ]);
    expect(queryClient.getQueryData(queryKeys.dailySummaries('user-a'))).toEqual([
      expect.objectContaining({ date: '2026-09-15', painLevel: 4, hydration: 750, hasPendingLogs: true }),
    ]);
  });

  test('reconciles the streak returned when an offline log syncs', () => {
    queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
    queryClient.setQueryData(queryKeys.streak('user-a'), {
      currentStreak: 0,
      longestStreak: 0,
      badgeUnlockDates: { first_log: '2026-09-01T00:00:00.000Z' },
    });

    applySyncedHealthLog(
      queryClient,
      'user-a',
      {
        clientMutationId: 'offline-log',
        capturedLocalDate: '2026-09-17',
        createdAt: '2026-09-17T08:43:05.000Z',
        payload: { painLevel: 2 },
      },
      {
        log: { id: 'server-log', client_mutation_id: 'offline-log' },
        streak: { current_streak: 1, longest_streak: 1, last_log_date: '2026-09-17' },
      },
    );

    expect(queryClient.getQueryData(queryKeys.streak('user-a'))).toEqual(expect.objectContaining({
      currentStreak: 1,
      longestStreak: 1,
      lastLogDate: '2026-09-17',
      badgeUnlockDates: { first_log: '2026-09-01T00:00:00.000Z' },
    }));
  });
});
