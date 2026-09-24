import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';

// NetInfo reports reachability separately from the transport connection. A
// connected device can still be unable to reach Supabase (captive portals,
// DNS failures, etc.), so an explicit false in either field is offline.
// Unknown values stay optimistic until NetInfo has enough information; this
// avoids pausing every query during the short initial probe.
export function isNetworkAvailable(state) {
  return state?.isConnected !== false && state?.isInternetReachable !== false;
}

export function isOfflineNetworkState(state) {
  return state?.isConnected === false || state?.isInternetReachable === false;
}

let currentState = {
  isConnected: null,
  isInternetReachable: null,
  type: 'unknown',
};
let monitorStarted = false;
let authBootstrapBlocked = false;
let setOnlineFromManager = null;
const listeners = new Set();

function publish(nextState) {
  currentState = {
    isConnected: nextState?.isConnected ?? null,
    isInternetReachable: nextState?.isInternetReachable ?? null,
    type: nextState?.type ?? 'unknown',
  };
  listeners.forEach((listener) => listener(currentState));
}

export function getNetworkState() {
  return currentState;
}

export function subscribeNetworkState(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function startNetworkMonitoring() {
  if (monitorStarted) return;
  monitorStarted = true;
  NetInfo.addEventListener(publish);
  // addEventListener normally emits immediately, but fetch is retained for
  // platforms/versions that do not do so until the first reachability probe.
  NetInfo.fetch().then(publish).catch(() => {});
}

// Keep TanStack Query's online state in sync globally. Calling this once at
// module load is safe: onlineManager owns the listener cleanup and this
// module's monitor is idempotent (including Fast Refresh).
export function configureOnlineManager() {
  onlineManager.setEventListener((setOnline) => {
    startNetworkMonitoring();
    setOnlineFromManager = setOnline;
    setOnline(isNetworkAvailable(currentState) && !authBootstrapBlocked);
    return subscribeNetworkState((state) => {
      setOnline(isNetworkAvailable(state) && !authBootstrapBlocked);
    });
  });
}

// A pseudo-auth identity is sufficient to select encrypted local routing
// metadata, but it must never cause server-backed queries to run with no real
// Supabase session. The flag is released as soon as hydration succeeds (or a
// confirmed sign-out is received).
export function setAuthBootstrapBlocked(blocked) {
  authBootstrapBlocked = Boolean(blocked);
  if (setOnlineFromManager) {
    setOnlineFromManager(isNetworkAvailable(currentState) && !authBootstrapBlocked);
  }
}

export function getConnectivitySnapshot() {
  return {
    ...currentState,
    isOffline: isOfflineNetworkState(currentState),
    isOnline: currentState.isConnected === true && currentState.isInternetReachable === true,
  };
}
