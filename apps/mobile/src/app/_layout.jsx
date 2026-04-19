import { useAuth } from "@/utils/auth/useAuth";
import { useAuthStore } from "@/utils/auth/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/store/appStore";
import { registerPushToken } from "@/services/novuService";
import { setupBackgroundDelivery, checkExistingHKAuthorization, fetchHealthKitRange } from "@/services/healthKitService";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import {
  useFonts,
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  Geist_800ExtraBold,
} from "@expo-google-fonts/geist";
import SplashAnimation from "@/components/SplashAnimation";

SplashScreen.preventAutoHideAsync();

// Required for notifications to display when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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
  const router = useRouter();
  const { healthKitConnected, healthKitPreferences, setHealthKitConnected, setHealthKitRange, mergeHealthKitDay, setExpoPushToken } = useAppStore();
  const userId = useAuthStore((s) => s.auth?.user?.id);
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
    return initiate(); // returns onAuthStateChange unsubscribe
  }, [initiate]);

  // On every launch: check native HealthKit auth status to restore connected state.
  // This fixes the "shows not connected after reload" bug — the Zustand store is
  // in-memory only, so we ask iOS directly rather than storing a boolean ourselves.
  useEffect(() => {
    checkExistingHKAuthorization().then(async (wasConnected) => {
      if (!wasConnected) return;
      setHealthKitConnected(true);
      const rangeData = await fetchHealthKitRange(30, healthKitPreferences);
      setHealthKitRange(rangeData);
      setupBackgroundDelivery((date, metrics) => mergeHealthKitDay(date, metrics), healthKitPreferences);
    });
  }, []);

  // Register Expo push token with Novu whenever the user is authenticated
  useEffect(() => {
    if (!userId) return;
    Notifications.getExpoPushTokenAsync({ projectId: "97edca88-53f4-4fd5-89ae-800ddc9d7381" })
      .then(({ data: token }) => {
        setExpoPushToken(token);
        registerPushToken(token, Platform.OS);
      })
      .catch(() => {});
  }, [userId]);

  // Route to the correct screen when user taps a remote or local notification
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data ?? {};
      if (data.type === "crisis_checkin" || data.type === "crisis_escalation") {
        router.push("/crisis-mode");
      } else if (data.type === "checkin") {
        router.push("/log-symptoms");
      } else if (data.type === "medication") {
        router.push("/(tabs)/care/medications");
      } else if (data.type === "streak") {
        router.push("/(tabs)/home");
      } else if (data.type === "appointment") {
        router.push("/(tabs)/care/appointments");
      } else if (data.screen === "metric-detail" && data.metric) {
        router.push(`/metric-detail?metric=${data.metric}`);
      }
    });
    return () => sub.remove();
  }, [router]);

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
        <KeyboardProvider>
        <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="streak-modal"
            options={{ presentation: "modal" }}
          />
          <Stack.Screen name="health-insights" />
          <Stack.Screen
            name="streak-repairs"
            options={{ presentation: "modal" }}
          />
          <Stack.Screen
            name="log-symptoms"
            options={{ presentation: "modal", gestureEnabled: false }}
          />
          <Stack.Screen
            name="feedback-modal"
            options={{ presentation: "modal" }}
          />
          <Stack.Screen
            name="metric-detail"
            options={{ presentation: "card" }}
          />
          <Stack.Screen
            name="apple-health-settings"
            options={{ presentation: "card" }}
          />
          <Stack.Screen
            name="metric-goal"
            options={{ presentation: "modal" }}
          />
          <Stack.Screen
            name="add-medication"
            options={{ presentation: "modal" }}
          />
          <Stack.Screen
            name="medication-detail"
            options={{ presentation: "card" }}
          />
          <Stack.Screen
            name="add-contact"
            options={{ presentation: "modal" }}
          />
          <Stack.Screen
            name="contact-detail"
            options={{ presentation: "card" }}
          />
          <Stack.Screen
            name="facility-detail"
            options={{ presentation: "modal" }}
          />
          <Stack.Screen
            name="edit-body-stats"
            options={{ presentation: "modal" }}
          />
          <Stack.Screen
            name="security"
            options={{ presentation: "card" }}
          />
          <Stack.Screen
            name="crisis-mode"
            options={{ presentation: "modal", gestureEnabled: false }}
          />
        </Stack>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
