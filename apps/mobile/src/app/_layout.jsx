import { useAuth } from '@/utils/auth/useAuth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  Geist_800ExtraBold,
} from '@expo-google-fonts/geist';
import SplashAnimation from '@/components/SplashAnimation';

SplashScreen.preventAutoHideAsync();

const MIN_SPLASH_MS = 2000;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const { initiate, isReady } = useAuth();
  const [splashDone, setSplashDone] = useState(false);
  const startTime = useRef(Date.now());

  const [fontsLoaded, fontError] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
    Geist_800ExtraBold,
  });

  useEffect(() => {
    initiate();
  }, [initiate]);

  useEffect(() => {
    if (isReady && (fontsLoaded || fontError)) {
      SplashScreen.hideAsync();
      const elapsed = Date.now() - startTime.current;
      const remaining = Math.max(0, MIN_SPLASH_MS - elapsed);
      const timer = setTimeout(() => setSplashDone(true), remaining);
      return () => clearTimeout(timer);
    }
  }, [isReady, fontsLoaded, fontError]);

  if (!isReady || (!fontsLoaded && !fontError) || !splashDone) {
    return <SplashAnimation />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="streak-modal" options={{ presentation: 'modal' }} />
          <Stack.Screen name="health-insights" />
          <Stack.Screen name="streak-repairs" options={{ presentation: 'modal' }} />
          <Stack.Screen name="log-symptoms" options={{ presentation: 'modal', gestureEnabled: false }} />
          <Stack.Screen name="metric-detail" options={{ presentation: 'card' }} />
          <Stack.Screen name="metric-goal" options={{ presentation: 'modal' }} />
          <Stack.Screen name="add-medication" options={{ presentation: 'modal' }} />
          <Stack.Screen name="medication-detail" options={{ presentation: 'card' }} />
        </Stack>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
