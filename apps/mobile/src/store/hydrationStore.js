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
      // 'off' | 'gentle' | 'regular' — opt-in hydration reminder cadence
      // (Step 10 decision 2). Default 'off', unlike check-in reminders.
      // Device-local: notification prefs were never asked to sync.
      hydrationReminderFrequency: 'off',
      setHydrationReminderFrequency: (hydrationReminderFrequency) => set({ hydrationReminderFrequency }),
    }),
    {
      name: 'hydration-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
