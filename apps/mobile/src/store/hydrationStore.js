import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
