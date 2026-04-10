import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAppearanceStore = create(
  persist(
    (set) => ({
      // 'light' | 'dark' | 'system'
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'appearance-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
