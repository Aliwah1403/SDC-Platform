import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Containers themselves moved to Supabase (2026-07-19) so they survive
// reinstalls and sync across a user's devices — see
// hooks/queries/useHydrationContainersQuery.js. displayUnit stays a
// device-local display preference; it was never asked to sync.
export const useHydrationStore = create(
  persist(
    (set) => ({
      // 'glasses' | 'ml' | 'L' | 'floz' — display format only, never the storage format.
      displayUnit: 'glasses',
      setDisplayUnit: (displayUnit) => set({ displayUnit }),
    }),
    {
      name: 'hydration-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
