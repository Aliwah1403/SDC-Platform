import { router } from "expo-router";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { usePostHog } from "posthog-react-native";
import { MotiView } from "moti";
import { ArrowLeft, Bell } from "lucide-react-native";
import * as Notifications from "expo-notifications";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TOTAL_STEPS } from "@/components/OnboardingStep";
import { useAppStore } from "@/store/appStore";
import { useTheme } from "@/hooks/useTheme";

function PhoneMockup({ name, styles }) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.94, translateY: 12 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      transition={{ type: "spring", damping: 16, stiffness: 80, delay: 80 }}
      style={styles.phoneMockup}
    >
      {/* Status bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusTime}>9:41</Text>
        <View style={styles.statusIcons}>
          {[4, 6, 8, 10].map((h, i) => (
            <View key={i} style={[styles.signalBar, { height: h }]} />
          ))}
          <View style={styles.battery}>
            <View style={styles.batteryFill} />
          </View>
        </View>
      </View>

      {/* Notification card */}
      <MotiView
        from={{ opacity: 0, translateY: -8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "spring", damping: 16, stiffness: 80, delay: 220 }}
        style={styles.mockNotifCard}
      >
        <View style={styles.mockNotifAppIcon}>
          <Bell size={13} color="#FFFFFF" strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.mockNotifTopRow}>
            <Text style={styles.mockNotifApp}>Hemo</Text>
            <Text style={styles.mockNotifTime}>now</Text>
          </View>
          <Text style={styles.mockNotifTitle}>Daily check-in</Text>
          <Text style={styles.mockNotifBody} numberOfLines={1}>
            {`How are you feeling today${name !== "you" ? `, ${name}` : ""}?`}
          </Text>
        </View>
      </MotiView>

      {/* App icon placeholders */}
      <View style={styles.appGrid}>
        {[0, 1].map((row) => (
          <View key={row} style={styles.appRow}>
            {[0, 1, 2, 3].map((col) => (
              <View
                key={col}
                style={[styles.appIcon, { opacity: row === 1 ? 0.45 : 0.75 }]}
              />
            ))}
          </View>
        ))}
        <View style={styles.appRow}>
          {[0, 1, 2, 3].map((col) => (
            <View
              key={col}
              style={[styles.appIcon, { opacity: 0.22, borderRadius: 22 }]}
            />
          ))}
        </View>
      </View>
    </MotiView>
  );
}

export default function Step8() {
  const posthog = usePostHog();
  const { setOnboardingField, setOnboardingStep, onboardingData } = useAppStore();
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const styles = getStyles(t);
  const name = onboardingData.nickname || "you";

  const goNext = () => { setOnboardingStep(8); router.push("/(onboarding)/step-9"); };

  const handleRequestPermission = async () => {
    try {
      const { status: current } = await Notifications.getPermissionsAsync();
      if (current === "granted") {
        setOnboardingField("notificationsEnabled", true);
        goNext();
        return;
      }
      const { status } = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      });
      if (status === 'granted') {
        posthog?.capture('notification_permission_granted', { platform: Platform.OS, prompt_variant: 'onboarding' });
      } else {
        posthog?.capture('notification_permission_denied', { platform: Platform.OS, prompt_variant: 'onboarding' });
      }
      setOnboardingField("notificationsEnabled", status === "granted");
      goNext();
    } catch {
      setOnboardingField("notificationsEnabled", false);
      goNext();
    }
  };

  const handleSkip = () => {
    posthog?.capture('onboarding_step_skipped', {
      step: 8,
      step_name: 'notification_permission',
    });
    setOnboardingField("notificationsEnabled", false);
    goNext();
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable
          style={({ pressed }) => [
            styles.backCircle,
            pressed && { opacity: 0.6 },
          ]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color={t.text} strokeWidth={2} />
        </Pressable>
        <View style={styles.dotsRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === 7
                  ? styles.dotCurrent
                  : i < 7
                    ? styles.dotPast
                    : styles.dotFuture,
              ]}
            />
          ))}
        </View>
        <Pressable onPress={handleSkip} hitSlop={10} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Middle: phone + heading, vertically centered */}
      <View style={styles.middle}>
        <PhoneMockup name={name} styles={styles} />

        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "spring", damping: 16, stiffness: 80, delay: 320 }}
          style={styles.headingBlock}
        >
          <Text style={styles.title}>Never miss a moment</Text>
          <Text style={styles.subtitle}>
            Daily reminders, streak alerts, and health nudges — all in one place.
          </Text>
        </MotiView>
      </View>

      {/* Bottom: full-width CTA + skip link */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "spring", damping: 16, stiffness: 80, delay: 420 }}
        style={[styles.bottomArea, { paddingBottom: insets.bottom + 28 }]}
      >
        <Pressable
          style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.85 }]}
          onPress={handleRequestPermission}
        >
          <Text style={styles.ctaBtnText}>Turn on Notifications</Text>
        </Pressable>
        <Pressable onPress={handleSkip} hitSlop={12}>
          <Text style={styles.notNowText}>Not right now</Text>
        </Pressable>
      </MotiView>
    </View>
  );
}

const getStyles = (t) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.background },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 6,
    minHeight: 52,
  },
  backCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: t.isDark ? "rgba(248,233,231,0.10)" : "rgba(9,51,44,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  dotsRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
  dot: { height: 6, borderRadius: 3 },
  dotCurrent: { width: 22, backgroundColor: t.accent },
  dotPast: { width: 6, backgroundColor: t.accent, opacity: 0.4 },
  dotFuture: { width: 6, backgroundColor: t.isDark ? "rgba(248,233,231,0.18)" : "rgba(9,51,44,0.14)" },
  skipBtn: { width: 44, alignItems: "flex-end" },
  skipText: { fontFamily: "Geist_500Medium", fontSize: 14, color: t.textSecondary },
  middle: { flex: 1, paddingHorizontal: 24, justifyContent: "center", gap: 36 },
  headingBlock: { gap: 10, alignItems: "center" },
  title: {
    fontFamily: "Geist_700Bold",
    fontSize: 30,
    color: t.text,
    letterSpacing: -0.9,
    lineHeight: 36,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Geist_400Regular",
    fontSize: 15,
    color: t.textSecondary,
    lineHeight: 22,
    textAlign: "center",
  },
  bottomArea: { paddingHorizontal: 24, paddingTop: 12, gap: 14, alignItems: "center" },
  ctaBtn: {
    width: "100%",
    backgroundColor: t.accent,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
  },
  ctaBtnText: { fontFamily: "Geist_700Bold", fontSize: 17, color: "#FFFFFF", letterSpacing: 0.2 },
  notNowText: { fontFamily: "Geist_500Medium", fontSize: 15, color: t.textSecondary },

  // Phone mockup
  phoneMockup: {
    alignSelf: "center",
    width: "100%",
    backgroundColor: t.isDark ? "rgba(248,233,231,0.06)" : "rgba(9,51,44,0.035)",
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: t.border,
    padding: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 5,
  },
  statusBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 4 },
  statusTime: { fontFamily: "Geist_600SemiBold", fontSize: 13, color: t.textSecondary },
  statusIcons: { flexDirection: "row", alignItems: "flex-end", gap: 3 },
  signalBar: { width: 3, backgroundColor: t.textSecondary, borderRadius: 1 },
  battery: { width: 20, height: 10, borderRadius: 2.5, borderWidth: 1.5, borderColor: t.textSecondary, justifyContent: "center", paddingHorizontal: 2, marginLeft: 4 },
  batteryFill: { height: 5, width: "75%", backgroundColor: t.textSecondary, borderRadius: 1 },
  mockNotifCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: t.surfaceElevated,
    borderRadius: 14,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  mockNotifAppIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: t.accent, alignItems: "center", justifyContent: "center" },
  mockNotifTopRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  mockNotifApp: { fontFamily: "Geist_600SemiBold", fontSize: 11, color: t.textSecondary },
  mockNotifTime: { fontFamily: "Geist_400Regular", fontSize: 11, color: t.textSecondary },
  mockNotifTitle: { fontFamily: "Geist_600SemiBold", fontSize: 13, color: t.text },
  mockNotifBody: { fontFamily: "Geist_400Regular", fontSize: 12, color: t.textSecondary, marginTop: 1 },
  appGrid: { gap: 8, paddingTop: 4 },
  appRow: { flexDirection: "row", gap: 8, justifyContent: "space-between" },
  appIcon: { flex: 1, height: 70, width: 70, borderRadius: 12, backgroundColor: t.isDark ? "rgba(248,233,231,0.10)" : "rgba(9,51,44,0.07)" },
});
