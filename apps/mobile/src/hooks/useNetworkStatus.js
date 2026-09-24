import { useEffect, useState } from 'react';
import {
  getConnectivitySnapshot,
  getNetworkState,
  startNetworkMonitoring,
  subscribeNetworkState,
} from '@/utils/network/connectivity';

export function useNetworkStatus() {
  const [snapshot, setSnapshot] = useState(getConnectivitySnapshot);

  useEffect(() => {
    startNetworkMonitoring();
    return subscribeNetworkState((state) => {
      setSnapshot({
        ...state,
        isOffline: state.isConnected === false || state.isInternetReachable === false,
        isOnline: state.isConnected === true && state.isInternetReachable === true,
      });
    });
  }, []);

  return snapshot;
}

export function getCurrentNetworkState() {
  return getNetworkState();
}
