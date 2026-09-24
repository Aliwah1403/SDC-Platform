jest.mock('@/hooks/useNetworkStatus', () => ({ useNetworkStatus: jest.fn(() => ({ isOffline: false })) }));
jest.mock('@/utils/auth/store', () => ({ useAuthStore: jest.fn(() => ({ id: 'user-a' })) }));
jest.mock('@/services/local/healthLogSync', () => ({ retryAllFailedHealthLogs: jest.fn() }));
jest.mock('@/hooks/useHealthLogSync', () => ({ useHealthLogSyncStatus: jest.fn(() => ({ pending: 0, failed: 0 })) }));
jest.mock('@/components/OfflineStatusSheet', () => () => null);

import { deriveHealthLogBannerState } from '@/components/OfflineBanner';

describe('health-log queue banner state', () => {
  test('uses the compact offline badge while disconnected', () => {
    expect(deriveHealthLogBannerState({ isOffline: true, pending: 1, failed: 0 })).toEqual({
      text: 'Offline',
      kind: 'offline',
      action: null,
    });
  });

  test('reports online pending and prioritizes failed attention', () => {
    expect(deriveHealthLogBannerState({ isOffline: false, pending: 2, failed: 0 })).toEqual({
      text: '2 health logs waiting to sync',
      kind: 'pending',
      action: null,
    });
    expect(deriveHealthLogBannerState({ isOffline: false, pending: 2, failed: 1 })).toEqual({
      text: '1 health log needs attention',
      kind: 'failed',
      action: 'retry',
    });
    expect(deriveHealthLogBannerState({ isOffline: false, pending: 0, failed: 2 }).text).toBe(
      '2 health logs need attention',
    );
  });

  test('hides itself when online with no queued work', () => {
    expect(deriveHealthLogBannerState({ isOffline: false, pending: 0, failed: 0 })).toBeNull();
  });
});
