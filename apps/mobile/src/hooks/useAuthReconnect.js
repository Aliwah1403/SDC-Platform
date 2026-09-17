import { useEffect, useRef } from 'react';

/**
 * Rehydrates a pseudo-auth identity once per definite offline -> online
 * transition. A failed attempt remains recoverable by the next transition or
 * an explicit retry; renders and React Query refetches cannot create loops.
 */
export function useAuthReconnect({ isOnline, isOfflineBootstrap, isRetrying, retry }) {
  const attemptedForOnlinePeriod = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      attemptedForOnlinePeriod.current = false;
      return;
    }
    if (!isOfflineBootstrap || attemptedForOnlinePeriod.current) return;
    // A user-triggered retry already owns this online period. Mark it as
    // attempted so the automatic path never races it.
    if (isRetrying) {
      attemptedForOnlinePeriod.current = true;
      return;
    }

    attemptedForOnlinePeriod.current = true;
    Promise.resolve(retry()).catch(() => {
      // hydrateAuthSession records the failure in the auth store. Keep the
      // gate closed until a new connectivity transition or manual retry.
    });
  }, [isOnline, isOfflineBootstrap, isRetrying, retry]);
}
