import { useCallback } from 'react';
import { supabase, signOut as supabaseSignOut } from './supabase';
import { useAuthStore } from './store';
import {
  clearCachedOnboardingStatus,
  readCachedOnboardingMetadata,
} from './profileBootstrap';
import { purgeHealthLogs } from '@/services/local/healthLogRepository';
import { setAuthBootstrapBlocked } from '@/utils/network/connectivity';

// Supabase uses these errors for a refresh token/session that is definitively
// invalid. They are different from fetch failures, DNS errors, and timeouts:
// only these known auth failures are treated as a confirmed sign-out.
export function isConfirmedAuthInvalidation(error) {
  const code = String(error?.code ?? '').toLowerCase();
  const name = String(error?.name ?? '').toLowerCase();
  const message = String(error?.message ?? '').toLowerCase();
  const status = error?.status;
  if (
    code === 'authsessionmissingerror' ||
    name === 'authsessionmissingerror' ||
    code === 'invalid_refresh_token' ||
    code === 'refresh_token_not_found'
  ) {
    return true;
  }
  return (status === 400 || status === 401) && /(refresh|session|token|jwt|auth)/.test(`${code} ${message}`);
}

/**
 * Core auth hook. Provides session hydration via Supabase's built-in
 * AsyncStorage persistence and a reactive onAuthStateChange listener.
 */
export const useAuth = () => {
  const { isReady, auth, authBootstrapError, authBootstrapRetrying } = useAuthStore();

  const hydrateAuthSession = useCallback(async () => {
    useAuthStore.setState({ authBootstrapRetrying: true });
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      const session = data?.session ?? null;
      useAuthStore.setState({
        auth: session ? { session, user: session.user, isOfflineBootstrap: false } : null,
        isReady: true,
        authBootstrapError: null,
        authBootstrapRetrying: false,
      });
      setAuthBootstrapBlocked(false);
      if (!session) {
        try {
          await clearCachedOnboardingStatus();
        } catch {
          // Best-effort metadata cleanup must not affect auth settlement.
        }
      }
      return session;
    } catch (error) {
      // A refresh/network error must not clear an existing session. The
      // caller can keep showing cached local data and retry when online. If
      // this is a cold start, the encrypted routing metadata identifies the
      // prior account without persisting a token or profile fields.
      if (isConfirmedAuthInvalidation(error)) {
        try {
          await clearCachedOnboardingStatus();
        } catch {
          // Best-effort metadata cleanup must not affect auth settlement.
        }
        useAuthStore.setState({
          isReady: true,
          auth: null,
          // A known invalid refresh/session is a confirmed sign-out, not an
          // offline condition; let routing show the normal auth entry point.
          authBootstrapError: null,
          authBootstrapRetrying: false,
        });
        setAuthBootstrapBlocked(false);
        console.warn('[Auth] Session is no longer valid; clearing offline bootstrap metadata.');
        return null;
      }

      let cachedMetadata = null;
      try {
        cachedMetadata = await readCachedOnboardingMetadata();
      } catch {
        // A local metadata read failure must not prevent auth bootstrap from
        // settling and hiding the native splash.
      }
      useAuthStore.setState((state) => ({
        isReady: true,
        auth: state.auth ?? (cachedMetadata ? {
          session: null,
          user: { id: cachedMetadata.userId },
          isOfflineBootstrap: true,
        } : null),
        authBootstrapError: error,
        authBootstrapRetrying: false,
      }));
      if (!useAuthStore.getState().auth?.isOfflineBootstrap) {
        setAuthBootstrapBlocked(false);
      } else {
        setAuthBootstrapBlocked(true);
      }
      console.warn('[Auth] Session bootstrap failed; preserving local auth state:', error?.message ?? error);
      return null;
    }
  }, []);

  const initiate = useCallback(() => {
    // Clear any stale SecureStore key from the old Create.xyz auth system
    // (no-op if not present; import is avoided to keep this dependency-free)
    try {
      const { default: SecureStore } = require('expo-secure-store');
      const oldKey = `${process.env.EXPO_PUBLIC_PROJECT_GROUP_ID}-jwt`;
      SecureStore.deleteItemAsync(oldKey).catch(() => {});
    } catch {
      // SecureStore not available; ignore
    }

    // Hydrate from Supabase's persisted session. The helper always settles,
    // including when the token refresh is rejected while offline.
    hydrateAuthSession();

    // Keep the store in sync reactively
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (!session) return;
        useAuthStore.setState({
          auth: { session, user: session.user, isOfflineBootstrap: false },
          authBootstrapError: null,
          authBootstrapRetrying: false,
        });
        setAuthBootstrapBlocked(false);
      } else if (event === 'SIGNED_OUT') {
        const previousUserId = useAuthStore.getState().auth?.user?.id;
        useAuthStore.setState({
          auth: null,
          authBootstrapError: null,
          authBootstrapRetrying: false,
        });
        setAuthBootstrapBlocked(false);
        clearCachedOnboardingStatus();
        if (previousUserId) {
          purgeHealthLogs(previousUserId).catch((error) => {
            console.warn('[Auth] Could not purge local health logs on sign-out:', error?.code ?? 'purge_failed');
          });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [hydrateAuthSession]);

  const signOut = useCallback(async () => {
    const previousUserId = useAuthStore.getState().auth?.user?.id;
    try {
      await supabaseSignOut();
    } finally {
      // The auth event also performs this as a safety net. Keeping the
      // explicit path here covers clients whose auth listener is delayed.
      if (previousUserId) {
        try {
          await purgeHealthLogs(previousUserId);
        } catch (error) {
          console.warn('[Auth] Could not purge local health logs on sign-out:', error?.code ?? 'purge_failed');
        }
      }
    }
    // onAuthStateChange SIGNED_OUT will clear the store reactively
  }, []);

  return {
    isReady,
    isAuthenticated: isReady ? !!auth : null,
    auth,
    authBootstrapError,
    authBootstrapRetrying,
    initiate,
    retry: hydrateAuthSession,
    signOut,
  };
};

export const useRequireAuth = () => {
  // Placeholder — preserved for callers. No-op now that auth is handled
  // natively by the auth screens and Supabase session persistence.
};

export default useAuth;
