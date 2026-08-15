import { useAuth } from "@/utils/auth/useAuth";
import { useAuthStore } from "@/utils/auth/store";
import { useTheme } from "@/hooks/useTheme";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PostHogProvider } from "posthog-react-native";
import { posthog, registerSuperProperties } from "@/utils/analytics";
import { initSentry, Sentry } from "@/utils/sentry";

initSentry();
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/store/appStore";
import { registerPushToken } from "@/services/novuService";
import { fetchAndCacheEmergencyNumbers } from "@/services/emergencyNumbersService";
import { setupBackgroundDelivery, checkExistingHKAuthorization, fetchHealthKitRange } from "@/services/healthKitService";
import {
  setupBackgroundDelivery as setupHCBackgroundDelivery,
  checkExistingHKAuthorization as checkExistingHCAuthorization,
  fetchHealthKitRange as fetchHealthConnectRange,
} from "@/services/healthConnectService";
import { fetchProfile, updateProfile } from "@/services/supabase/profile";
import { fetchMedications } from "@/services/supabase/medications";
import { scheduleMedicationNotifications } from "@/utils/medicationNotifications";
import { scheduleCheckInReminders } from "@/utils/checkInNotifications";
import { scheduleHydrationReminders } from "@/utils/hydrationReminders";
import {
  registerNotificationCategories,
  processNotificationResponse,
  HYDRATION_OPEN_ACTION,
} from "@/utils/notificationActions";
import { useHydrationStore } from "@/store/hydrationStore";
import { useHydrationContainersQuery } from "@/hooks/queries/useHydrationContainersQuery";
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
  return (
    <PostHogProvider client={posthog} autocapture={false}>
      <QueryClientProvider client={queryClient}>
        <RootLayoutContent />
      </QueryClientProvider>
    </PostHogProvider>
  );
}

// Split out from RootLayout so hooks that need the query client (e.g.
// useHydrationContainersQuery, which calls useQuery internally) have
// QueryClientProvider as an actual ancestor. RootLayout itself renders the
// provider as part of its own JSX, so a hook called directly inside
// RootLayout has no such ancestor yet at render time and would always throw
// "No QueryClient set" — this component is what QueryClientProvider wraps.
function RootLayoutContent() {
  const theme = useTheme();
  const { initiate, isReady } = useAuth();
  const router = useRouter();
  const {
    healthKitConnected, healthKitPreferences, setHealthKitConnected, setHealthKitRange, mergeHealthKitDay,
    healthConnectConnected, healthConnectPreferences, setHealthConnectConnected, setHealthConnectRange, mergeHealthConnectDay,
    setExpoPushToken, appLockEnabled, appLockTimeout, setAppLockEnabled, setAppLockTimeout,
  } = useAppStore();
  const userId = useAuthStore((s) => s.auth?.user?.id);
  const hydrationDisplayUnit = useHydrationStore((s) => s.displayUnit);
  const { data: hydrationContainersData } = useHydrationContainersQuery();
  const [splashExiting, setSplashExiting] = useState(false);
  const [splashGone, setSplashGone] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState("Unlock Hemo");
  const backgroundedAt = useRef(null);
  const isAuthenticating = useRef(false);
  const startTime = useRef(Date.now());
  const sessionStartRef = useRef(Date.now());
  const lastHKFetchAt = useRef(Date.now());

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

  // Track cold start and identify user when auth resolves
  useEffect(() => {
    posthog.capture('app_opened', { cold_start: true, source: 'direct', notification_opened: false });
  }, []);

  useEffect(() => {
    if (!userId) return;
    posthog.identify(userId);
    registerSuperProperties();
    Sentry.setUser({ id: userId });
  }, [userId]);

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
      if (nextState === 'background') {
        if (!isAuthenticating.current) {
          const sessionDuration = Math.round((Date.now() - sessionStartRef.current) / 1000);
          posthog.capture('app_backgrounded', { session_duration_seconds: sessionDuration });
          backgroundedAt.current = Date.now();
        }
      } else if (nextState === 'inactive') {
        // no analytics — inactive is a transient state (e.g. Face ID sheet, notification tray)
      } else if (nextState === 'active') {
        // Always capture and clear — prevents stale timestamp firing on subsequent active events
        const wasBackgrounded = backgroundedAt.current;
        backgroundedAt.current = null;
        sessionStartRef.current = Date.now();

        if (!isAuthenticating.current && appLockEnabled && wasBackgrounded) {
          const elapsedMinutes = (Date.now() - wasBackgrounded) / 1000 / 60;
          if (appLockTimeout === 0 || elapsedMinutes >= appLockTimeout) {
            setIsLocked(true);
            authenticateToUnlock();
          }
        }

        if (wasBackgrounded && healthKitConnected && Platform.OS === "ios") {
          const minutesSinceFetch = (Date.now() - lastHKFetchAt.current) / 1000 / 60;
          if (minutesSinceFetch >= 15) {
            fetchHealthKitRange(30, healthKitPreferences)
              .then((rangeData) => {
                setHealthKitRange(rangeData);
                lastHKFetchAt.current = Date.now();
              })
              .catch((err) => {
                console.error("[HealthKit] Failed to refresh range after background:", err);
              });
          }
        }
        if (wasBackgrounded && healthConnectConnected && Platform.OS === "android") {
          const minutesSinceFetch = (Date.now() - lastHKFetchAt.current) / 1000 / 60;
          if (minutesSinceFetch >= 15) {
            fetchHealthConnectRange(30, healthConnectPreferences)
              .then((rangeData) => {
                setHealthConnectRange(rangeData);
                lastHKFetchAt.current = Date.now();
              })
              .catch((err) => {
                console.error("[HC] Failed to refresh range after background:", err);
              });
          }
        }
      }
    });
    return () => sub.remove();
  }, [appLockEnabled, appLockTimeout, healthKitConnected, healthKitPreferences, healthConnectConnected, healthConnectPreferences]);

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
    if (Platform.OS !== "ios") return;
    checkExistingHKAuthorization().then(async (wasConnected) => {
      if (!wasConnected) return;
      setHealthKitConnected(true);
      const rangeData = await fetchHealthKitRange(30, healthKitPreferences);
      setHealthKitRange(rangeData);
      lastHKFetchAt.current = Date.now();
      setupBackgroundDelivery((date, metrics) => mergeHealthKitDay(date, metrics), healthKitPreferences);
    });
  }, []);

  // Android: restore Health Connect connected state and set up foreground polling.
  useEffect(() => {
    if (Platform.OS !== "android") return;
    checkExistingHCAuthorization().then(async (wasConnected) => {
      if (!wasConnected) return;
      setHealthConnectConnected(true);
      const rangeData = await fetchHealthConnectRange(30, healthConnectPreferences);
      setHealthConnectRange(rangeData);
      lastHKFetchAt.current = Date.now();
      setupHCBackgroundDelivery(
        (date, metrics) => mergeHealthConnectDay(date, metrics),
        healthConnectPreferences
      );
    });
  }, []);

  // Fetch + cache the global emergency-numbers reference table once at startup.
  // Used by useEmergencyNumber to resolve the correct ambulance number for the
  // user's country instead of hardcoding US 911. Safe to call unauthenticated.
  useEffect(() => {
    fetchAndCacheEmergencyNumbers();
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
        // Keep timezone current when user travels (only when auto is on)
        if (profile?.timezoneAuto !== false) {
          updateProfile(userId, { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }).catch(() => {});
        }
      })
      .catch(() => {});
    registerNotificationRefreshTask().catch(() => {});
    // Hydration reminders are opt-in (default 'off') — only reschedule when the
    // user has actually turned them on. Same "iOS clears locals" rationale as above.
    const hydrationFrequency = useHydrationStore.getState().hydrationReminderFrequency;
    if (hydrationFrequency !== 'off') {
      scheduleHydrationReminders(hydrationFrequency).catch((err) => {
        console.error("[HydrationReminders] Failed to reschedule on launch:", err);
      });
    }
  }, [userId]);

  // Re-schedule medication notifications on every launch. Unlike hydration and
  // check-ins, these are otherwise only (re)scheduled when the user adds/edits a
  // med — so any change to how they're scheduled (e.g. adding the "Mark as taken"
  // action category) never reaches meds added before the change, and iOS-cleared
  // locals (after restore/reinstall) never come back. Rescheduling here mirrors
  // the hydration/check-in self-heal. scheduleMedicationNotifications cancels its
  // own med's notifications first, so this is idempotent and safe to re-run; it
  // also no-ops on "As Needed" / time-less meds.
  useEffect(() => {
    if (!userId) return;
    fetchMedications(userId)
      .then((meds) => {
        for (const med of meds ?? []) {
          scheduleMedicationNotifications(med, { trackAnalytics: false }).catch((err) => {
            console.error("[MedicationNotifications] Failed to reschedule on launch:", err);
          });
        }
      })
      .catch((err) => {
        console.error("[MedicationNotifications] Failed to load medications for reschedule:", err);
      });
  }, [userId]);

  // Register both notification categories on start, and again whenever the
  // default container or displayUnit change (Step 10 decision 4) — cheap, and
  // keeps the hydration action's button title from ever going stale.
  useEffect(() => {
    if (!userId) return;
    registerNotificationCategories({ queryClient, userId }).catch((err) => {
      console.error("[Notifications] Failed to register notification categories:", err);
    });
  }, [userId, hydrationContainersData, hydrationDisplayUnit]);

  // Killed-app recovery: expo-notifications may not run the response listener
  // headlessly when the app was fully killed (see POLISH-PLAN.md Step 10 spike
  // note). getLastNotificationResponseAsync() gives us one more chance to catch
  // an action tap on the next cold start — safe to always attempt because
  // processNotificationResponse dedupes by identifier and drops anything not
  // from today. Gated on userId: before auth rehydrates the handler can't
  // apply the tap, and re-running once it resolves is what makes recovery
  // actually land on a cold start.
  useEffect(() => {
    if (!userId) return;
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!response) return;
        if (
          response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER ||
          response.actionIdentifier === HYDRATION_OPEN_ACTION
        ) {
          return; // body taps / foreground-opening actions are handled by normal navigation, not recovery
        }
        processNotificationResponse(response, { queryClient }).catch((err) => {
          console.error("[Notifications] Cold-start recovery failed:", err);
        });
      })
      .catch((err) => {
        console.error("[Notifications] Failed to read last notification response:", err);
      });
  }, [userId]);

  // Route to the correct screen when user taps a remote or local notification
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data ?? {};
      const actionIdentifier = response.actionIdentifier;
      posthog.capture('notification_opened', {
        type: data.type ?? data.screen ?? 'unknown',
        trigger_type: response.notification.request.trigger?.type ?? 'unknown',
        notification_variant: data.variant ?? null,
        action: actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER ? actionIdentifier : null,
      });

      // Silent actions (log hydration / mark medication taken) never navigate —
      // hand off to the shared handler and stop. "Open Hemo" is also a named
      // action, but it opens the app to foreground, so it falls through to the
      // routing switch below just like a body tap.
      if (actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER && actionIdentifier !== HYDRATION_OPEN_ACTION) {
        processNotificationResponse(response, { queryClient }).catch((err) => {
          console.error("[Notifications] Failed to process notification action:", err);
        });
        return;
      }

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
      } else if (data.type === "community" || data.type === "like" || data.type === "comment" || data.type === "reply") {
        router.push(data.postId ? `/community/${data.postId}` : "/community/notifications");
      } else if (data.screen === "metric-detail" && data.metric) {
        router.push(`/metric-detail?metric=${data.metric}`);
      } else if (data.type === "hydration_reminder") {
        router.push("/log-symptoms");
      }
    });
    return () => sub.remove();
  }, [router]);

  useEffect(() => {
    if (isReady && (fontsLoaded || fontError)) {
      SplashScreen.hideAsync();
      const elapsed = Date.now() - startTime.current;
      const remaining = Math.max(0, MIN_SPLASH_MS - elapsed);
      const timer = setTimeout(() => setSplashExiting(true), remaining);
      return () => clearTimeout(timer);
    }
  }, [isReady, fontsLoaded, fontError]);

  if (!isReady || (!fontsLoaded && !fontError)) {
    return <SplashAnimation />;
  }

  return (
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
            name="recap"
            options={{ presentation: "card" }}
          />
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
            name="health-connect-settings"
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
            name="metric-preferences"
            options={{ presentation: "transparentModal" }}
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
            name="medication-scan"
            options={{ presentation: "modal" }}
          />
          <Stack.Screen
            name="crisis-mode"
            options={{ presentation: "modal", gestureEnabled: false }}
          />
          <Stack.Screen
            name="help-center"
            options={{ presentation: "card", headerShown: false }}
          />
          <Stack.Screen
            name="help-center-article"
            options={{ presentation: "card", headerShown: false }}
          />
          <Stack.Screen
            name="education-article"
            options={{ presentation: "card", headerShown: false }}
          />
          <Stack.Screen
            name="education-category"
            options={{ presentation: "card", headerShown: false }}
          />
          <Stack.Screen
            name="legal"
            options={{ presentation: "card", headerShown: false }}
          />
        </Stack>

        <StatusBar style={theme.isDark ? "light" : "dark"} />

        {/* Splash overlay — fades out once ready */}
        {!splashGone && (
          <SplashAnimation
            exiting={splashExiting}
            onExitComplete={() => setSplashGone(true)}
          />
        )}

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
  );
}

const lockStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1A1A1A',
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
