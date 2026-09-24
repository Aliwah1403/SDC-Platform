jest.mock('@/services/local/healthLogRepository', () => ({
  acknowledgeHealthLog: jest.fn(),
  getHealthLogSyncCounts: jest.fn(),
  listPendingHealthLogs: jest.fn(),
  listHealthLogRecords: jest.fn(),
  markHealthLogAttempt: jest.fn(),
  markHealthLogFailure: jest.fn(),
  retryHealthLog: jest.fn(),
}));
jest.mock('@/utils/network/connectivity', () => ({
  getNetworkState: jest.fn(() => ({ isConnected: true, isInternetReachable: true })),
}));
jest.mock('@/utils/auth/store', () => ({
  useAuthStore: { getState: jest.fn(() => ({ auth: { user: { id: 'sync-user' }, session: { access_token: 'token' } } })) },
}));
jest.mock('@/services/supabase/health', () => ({ submitHealthLogRemote: jest.fn() }));
jest.mock('@/utils/analytics', () => ({ posthog: { capture: jest.fn() } }));

import { flushHealthLogQueue, retryAllFailedHealthLogs } from '@/services/local/healthLogSync';
import { submitHealthLogRemote } from '@/services/supabase/health';

const mockRepo = jest.requireMock('@/services/local/healthLogRepository');
const mockNetwork = jest.requireMock('@/utils/network/connectivity');

describe('health-log sync coordinator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo.getHealthLogSyncCounts.mockResolvedValue({ pending: 0, failed: 0 });
  });

  test('acknowledges a successful RPC and reconciles the UI once', async () => {
    const record = {
      clientMutationId: 'mutation-1',
      userId: 'sync-user',
      capturedLocalDate: '2026-09-16',
      payload: { painLevel: 3 },
      status: 'pending',
    };
    const result = { duplicate: false, log: { id: 'server-id', client_mutation_id: 'mutation-1' } };
    mockRepo.listPendingHealthLogs.mockResolvedValue([record]);
    submitHealthLogRemote.mockResolvedValue(result);
    const onSynced = jest.fn();

    await flushHealthLogQueue('sync-user', { onSynced });

    expect(mockRepo.markHealthLogAttempt).toHaveBeenCalledWith('mutation-1', 'sync-user');
    expect(submitHealthLogRemote).toHaveBeenCalledWith('sync-user', record);
    expect(mockRepo.acknowledgeHealthLog).toHaveBeenCalledWith('mutation-1', 'sync-user');
    expect(onSynced).toHaveBeenCalledWith(record, result);
    expect(mockRepo.markHealthLogFailure).not.toHaveBeenCalled();
  });

  test('keeps network failures pending with retry metadata', async () => {
    const record = { clientMutationId: 'network-1', userId: 'sync-user', status: 'pending' };
    mockRepo.listPendingHealthLogs.mockResolvedValue([record]);
    submitHealthLogRemote.mockRejectedValue(new Error('network request failed'));

    await flushHealthLogQueue('sync-user');

    expect(mockRepo.markHealthLogFailure).toHaveBeenCalledWith('network-1', 'sync-user', expect.objectContaining({
      status: 'pending',
      retryable: true,
      lastError: 'network_unavailable',
    }));
    expect(mockRepo.acknowledgeHealthLog).not.toHaveBeenCalled();
  });

  test('marks permanent validation failures failed and non-retryable', async () => {
    const record = { clientMutationId: 'invalid-1', userId: 'sync-user', status: 'pending' };
    mockRepo.listPendingHealthLogs.mockResolvedValue([record]);
    submitHealthLogRemote.mockRejectedValue({ status: 400, code: '22004', message: 'invalid input' });

    await flushHealthLogQueue('sync-user');

    expect(mockRepo.markHealthLogFailure).toHaveBeenCalledWith('invalid-1', 'sync-user', expect.objectContaining({
      status: 'failed',
      retryable: false,
      lastError: 'validation_failed',
    }));
  });

  test('retry-all resets failed records but does not send while offline', async () => {
    mockNetwork.getNetworkState.mockReturnValue({ isConnected: false, isInternetReachable: false });
    mockRepo.listHealthLogRecords.mockResolvedValue([
      { clientMutationId: 'failed-1', status: 'failed' },
      { clientMutationId: 'pending-1', status: 'pending' },
    ]);

    await retryAllFailedHealthLogs('sync-user');

    expect(mockRepo.retryHealthLog).toHaveBeenCalledWith('failed-1', 'sync-user');
    expect(submitHealthLogRemote).not.toHaveBeenCalled();
  });
});
