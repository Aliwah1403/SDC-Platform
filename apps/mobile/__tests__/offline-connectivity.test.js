import {
  isNetworkAvailable,
  isOfflineNetworkState,
} from '@/utils/network/connectivity';

describe('offline connectivity semantics', () => {
  test('treats an explicit unreachable probe as offline', () => {
    expect(isNetworkAvailable({ isConnected: true, isInternetReachable: false })).toBe(false);
    expect(isOfflineNetworkState({ isConnected: true, isInternetReachable: false })).toBe(true);
  });

  test('treats a disconnected transport as offline', () => {
    expect(isNetworkAvailable({ isConnected: false, isInternetReachable: true })).toBe(false);
    expect(isOfflineNetworkState({ isConnected: false, isInternetReachable: true })).toBe(true);
  });

  test('keeps unknown reachability optimistic during initial probing', () => {
    expect(isNetworkAvailable({ isConnected: true, isInternetReachable: null })).toBe(true);
    expect(isOfflineNetworkState({ isConnected: true, isInternetReachable: null })).toBe(false);
  });
});
