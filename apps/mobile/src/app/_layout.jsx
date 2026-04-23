import { useAuth } from "@/utils/auth/useAuth";
import { useAuthStore } from "@/utils/auth/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/store/appStore";
import { registerPushToken } from "@/services/novuService";
import { setupBackgroundDelivery, checkExistingHKAuthorization, fetchHealthKitRange } from "@/services/healthKitService";
import { fetchProfile } from "@/services/supabaseQueries";
import { scheduleCheckInReminders } from "@/utils/checkInNotifications";
import '@/utils/backgroundNotificationRefresh';
import { registerNotificationRefreshTask } from "@/utils/backgroundNotificationRefresh";
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
import Constants from "expo-constants";
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
  const { healthKitConnected, healthKitPreferences, setHealthKitConnected, setHealthKitRange, mergeHealthKitDay, setExpoPushToken, appLockEnabled, appLockTimeout, setAppLockEnabled, setAppLockTimeout } = useAppStore();
  const userId = useAuthStore((s) => s.auth?.user?.id);
  const [splashDone, setSplashDone] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState("Unlock Hemo");
  const backgroundedAt = useRef(null);
  const isAuthenticating = useRef(false);
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

  // Load persisted App Lock settings on startup
  useEffect(() => {
    AsyncStorage.multiGet(['appLockEnabled', 'appLockTimeout'])
      .then((pairs) => {
        const enabled = pairs[0][1];
        const timeout = pairs[1][1];
        const raw = timeout !== null ? parseInt(timeout, 10) : 0;
        const parsedTimeout = Number.isFinite(raw) && raw >= 0 ? raw : 0;
        if (enabled === 'true') setAppLockEnabled(true);
        if (timeout !== null) setAppLockTimeout(parsedTimeout);
        // Lock immediately on cold start when appLock is on and timeout is 0 (lock immediately)
        if (enabled === 'true' && parsedTimeout === 0) {
          setIsLocked(true);
          authenticateToUnlock();
        }
      })
      .catch((err) => console.error('[AppLock] Failed to load lock settings:', err));
  }, []);

  // Detect available biometric type to label the unlock button correctly
  useEffect(() => {
    LocalAuthentication.supportedAuthenticationTypesAsync().then((types) => {
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricLabel("Unlock with Face ID");
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricLabel("Unlock with Touch ID");
      }
      // else falls back to the default "Unlock Hemo" (passcode-only devices)
    });
  }, []);

  // App Lock — watch AppState and lock when returning from background.
  // We skip transitions caused by our own Face ID sheet (isAuthenticating guard)
  // to prevent an infinite re-lock loop.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        // Don't record background time if the transition was caused by our own Face ID sheet
        if (!isAuthenticating.current) {
          backgroundedAt.current = Date.now();
        }
      } else if (nextState === 'active') {
        // Always capture and clear — prevents stale timestamp firing on subsequent active events
        const wasBackgrounded = backgroundedAt.current;
        backgroundedAt.current = null;

        if (!isAuthenticating.current && appLockEnabled && wasBackgrounded) {
          const elapsedMinutes = (Date.now() - wasBackgrounded) / 1000 / 60;
          if (appLockTimeout === 0 || elapsedMinutes >= appLockTimeout) {
            setIsLocked(true);
            authenticateToUnlock();
          }
        }
      }
    });
    return () => sub.remove();
  }, [appLockEnabled, appLockTimeout]);

  const authenticateToUnlock = async () => {
    if (isAuthenticating.current) return;
    isAuthenticating.current = true;
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Hemo',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      });
      if (result.success) setIsLocked(false);
    } catch {
      // keep locked, user can tap button to retry
    } finally {
      isAuthenticating.current = false;
    }
  };

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
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.error("[PushToken] eas.projectId missing from app config — skipping token registration");
      return;
    }
    Notifications.getExpoPushTokenAsync({ projectId })
      .then(({ data: token }) => {
        setExpoPushToken(token);
        registerPushToken(token, Platform.OS);
      })
      .catch((err) => {
        console.error("[PushToken] Failed to register push token:", err);
      });
  }, [userId]);

  // Re-schedule check-in reminders on every launch for users with notifications enabled.
  // iOS can silently clear scheduled local notifications after restores/reinstalls.
  // Also register the background task so the OS can reschedule even when the app is closed.
  useEffect(() => {
    if (!userId) return;
    fetchProfile(userId)
      .then((profile) => {
        if (profile?.notificationsEnabled) {
          scheduleCheckInReminders(profile.checkInFrequency ?? 2);
        }
      })
      .catch(() => {});
    registerNotificationRefreshTask().catch(() => {});
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
            name="app-lock-setup"
            options={{ presentation: "card" }}
          />
          <Stack.Screen
            name="crisis-mode"
            options={{ presentation: "modal", gestureEnabled: false }}
          />
        </Stack>

        {/* App Lock overlay — rendered above everything */}
        {isLocked && (
          <View style={lockStyles.overlay}>
            <View style={lockStyles.iconCircle}>
              <Text style={lockStyles.lockEmoji}>🔒</Text>
            </View>
            <Text style={lockStyles.appName}>Hemo</Text>
            <Text style={lockStyles.tagline}>Your sickle cell companion</Text>
            <Pressable
              style={({ pressed }) => [lockStyles.unlockBtn, pressed && { opacity: 0.85 }]}
              onPress={authenticateToUnlock}
            >
              <Text style={lockStyles.unlockBtnText}>{biometricLabel}</Text>
            </Pressable>
          </View>
        )}
        </KeyboardProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

const lockStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#09332C',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(248,233,231,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  lockEmoji: {
    fontSize: 40,
  },
  appName: {
    fontFamily: 'Geist_700Bold',
    fontSize: 32,
    color: '#F8E9E7',
    letterSpacing: -1,
    marginBottom: 6,
  },
  tagline: {
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    color: 'rgba(248,233,231,0.45)',
    marginBottom: 56,
  },
  unlockBtn: {
    backgroundColor: '#F0531C',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  unlockBtnText: {
    fontFamily: 'Geist_700Bold',
    fontSize: 16,
    color: '#ffffff',
    letterSpacing: 0.2,
  },
});
