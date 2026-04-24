import { useCallback } from 'react';
import { supabase, signOut as supabaseSignOut } from './supabase';
import { useAuthStore } from './store';

/**
 * Core auth hook. Provides session hydration via Supabase's built-in
 * AsyncStorage persistence and a reactive onAuthStateChange listener.
 */
export const useAuth = () => {
  const { isReady, auth } = useAuthStore();

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

    // Hydrate from Supabase's persisted session
    supabase.auth.getSession().then(({ data: { session } }) => {
      useAuthStore.setState({
        auth: session ? { session, user: session.user } : null,
        isReady: true,
      });
    });

    // Keep the store in sync reactively
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        useAuthStore.setState({ auth: { session, user: session.user } });
      } else if (event === 'SIGNED_OUT') {
        useAuthStore.setState({ auth: null });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    await supabaseSignOut();
    // onAuthStateChange SIGNED_OUT will clear the store reactively
  }, []);

  return {
    isReady,
    isAuthenticated: isReady ? !!auth : null,
    auth,
    initiate,
    signOut,
  };
};

export const useRequireAuth = () => {
  // Placeholder — preserved for callers. No-op now that auth is handled
  // natively by the auth screens and Supabase session persistence.
};

export default useAuth;
