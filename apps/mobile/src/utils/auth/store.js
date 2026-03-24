import { create } from 'zustand';

/**
 * Manages authentication state. Session persistence is handled by the
 * Supabase client internally via AsyncStorage. This store holds the
 * current session and user for UI consumption.
 */
export const useAuthStore = create((set) => ({
  isReady: false,
  auth: null,
  isNewUser: false,
  setAuth: (session, user) => {
    set({ auth: session ? { session, user } : null });
  },
  setIsNewUser: (isNewUser) => set({ isNewUser }),
}));
