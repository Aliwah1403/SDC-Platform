import { create } from 'zustand';

/**
 * Manages authentication state. Session persistence is handled by the
 * Supabase client internally via AsyncStorage. This store holds the
 * current session and user for UI consumption.
 */
export const useAuthStore = create((set) => ({
  isReady: false,
  auth: null,
  // A failed session refresh is not proof that the user signed out. Keep the
  // distinction so routing can offer recovery instead of redirecting to auth.
  authBootstrapError: null,
  authBootstrapRetrying: false,
  isNewUser: false,
  setAuth: (session, user) => {
    set({
      auth: session ? { session, user } : null,
      authBootstrapError: null,
      authBootstrapRetrying: false,
    });
  },
  setIsNewUser: (isNewUser) => set({ isNewUser }),
}));
