import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Circle, Path, Rect, Svg } from "react-native-svg";
import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Check,
  Fingerprint,
  Lock,
  ShieldCheck,
} from "lucide-react-native";
import { useAppStore } from "@/store/appStore";
import { fonts } from "@/utils/fonts";

const TIMEOUT_OPTIONS = [
  { label: "Immediately", value: 0 },
  { label: "After 1 minute", value: 1 },
  { label: "After 5 minutes", value: 5 },
  { label: "After 15 minutes", value: 15 },
  { label: "After 1 hour", value: 60 },
];

export default function AppLockSetupScreen() {
  const insets = useSafeAreaInsets();
  const {
    appLockEnabled,
    appLockTimeout,
    setAppLockEnabled,
    setAppLockTimeout,
  } = useAppStore();

  const [step, setStep] = useState(appLockEnabled ? "config" : "intro");
  const [selectedTimeout, setSelectedTimeout] = useState(appLockTimeout);
  const [loading, setLoading] = useState(false);

  const handleGetStarted = async () => {
    setLoading(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Verify your identity to enable App Lock",
        fallbackLabel: "Use Passcode",
        disableDeviceFallback: false,
      });
      if (result.success) {
        setStep("config");
      } else {
        Alert.alert(
          "Authentication failed",
          "Please try again to enable App Lock.",
        );
      }
    } catch {
      Alert.alert(
        "Error",
        "Biometric authentication is not available on this device.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    await AsyncStorage.setItem("appLockEnabled", "true");
    await AsyncStorage.setItem("appLockTimeout", String(selectedTimeout));
    setAppLockEnabled(true);
    setAppLockTimeout(selectedTimeout);
    router.back();
  };

  const handleDisable = () => {
    Alert.alert(
      "Disable App Lock",
      "Your health data will no longer be protected when you leave the app.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disable",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.setItem("appLockEnabled", "false");
            setAppLockEnabled(false);
            router.back();
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={22} color="#09332C" strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>App Lock</Text>
        <View style={{ width: 40 }} />
      </View>

      {step === "intro" ? (
        <IntroStep
          loading={loading}
          onGetStarted={handleGetStarted}
          insets={insets}
        />
      ) : (
        <ConfigStep
          selectedTimeout={selectedTimeout}
          onSelectTimeout={setSelectedTimeout}
          onSave={handleSave}
          onDisable={handleDisable}
          isExisting={appLockEnabled}
          insets={insets}
        />
      )}
    </View>
  );
}

function IntroStep({ loading, onGetStarted, insets }) {
  return (
    <View style={{ flex: 1, paddingHorizontal: 28 }}>
      {/* Illustration */}
      <View style={styles.illustrationWrap}>
        {/* Outer ring */}
        <View style={styles.outerRing}>
          {/* Inner ring */}
          <View style={styles.innerRing} />

          {/* Custom lock SVG */}
          <View style={styles.svgWrap}>
            <Svg width={58} height={66} viewBox="0 0 58 66" fill="none">
              {/* Shackle */}
              <Path
                d="M14 28V20C14 12.268 20.268 6 28 6h2C37.732 6 44 12.268 44 20v8"
                stroke="#09332C"
                strokeWidth={4}
                strokeLinecap="round"
              />
              {/* Lock body */}
              <Rect x={7} y={28} width={44} height={32} rx={8} fill="#09332C" />
              {/* Keyhole circle */}
              <Circle cx={29} cy={42} r={5} fill="#F2EEE8" opacity={0.9} />
              {/* Keyhole stem */}
              <Rect
                x={27}
                y={45}
                width={4}
                height={7}
                rx={2}
                fill="#F2EEE8"
                opacity={0.9}
              />
            </Svg>
          </View>
        </View>
      </View>

      {/* <View style={styles.illustrationContainer}>
        <View style={styles.illustrationCircle}>
          <Lock size={52} color="#09332C" strokeWidth={1.5} />
        </View>
        <View style={styles.badgeRight}>
          <Fingerprint size={22} color="#ffffff" strokeWidth={1.8} />
        </View>
        <View style={styles.badgeBottom}>
          <ShieldCheck size={22} color="#ffffff" strokeWidth={1.8} />
        </View>
      </View> */}

      <Text style={styles.title}>Protect your Hemo account</Text>
      <Text style={styles.body}>
        Add Face ID, Touch ID, or your device passcode so only you can access
        your health data — even if someone else picks up your phone.
      </Text>

      <View style={styles.featureList}>
        {[
          "Locks automatically when you leave the app",
          "Biometric or passcode to unlock",
          "Your data stays fully encrypted",
        ].map((item) => (
          <View key={item} style={styles.featureRow}>
            <View style={styles.featureCheck}>
              <Check size={12} color="#ffffff" strokeWidth={2.5} />
            </View>
            <Text style={styles.featureText}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={{ flex: 1 }} />

      <Pressable
        style={({ pressed }) => [
          styles.primaryBtn,
          pressed && { opacity: 0.85 },
          loading && { opacity: 0.7 },
          { marginBottom: insets.bottom + 24 },
        ]}
        onPress={onGetStarted}
        disabled={loading}
      >
        <Text style={styles.primaryBtnText}>Get started</Text>
      </Pressable>
    </View>
  );
}

function ConfigStep({
  selectedTimeout,
  onSelectTimeout,
  onSave,
  onDisable,
  isExisting,
  insets,
}) {
  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingBottom: insets.bottom + 24,
      }}
    >
      {isExisting && (
        <View style={styles.enabledBadge}>
          <ShieldCheck size={16} color="#059669" strokeWidth={2} />
          <Text style={styles.enabledBadgeText}>App Lock is enabled</Text>
        </View>
      )}

      <Text style={styles.sectionLabel}>LOCK AFTER</Text>
      <View style={styles.optionsCard}>
        {TIMEOUT_OPTIONS.map((opt, i) => (
          <View key={opt.value}>
            <Pressable
              style={({ pressed }) => [
                styles.optionRow,
                pressed && { backgroundColor: "#F8F4F0" },
              ]}
              onPress={() => onSelectTimeout(opt.value)}
            >
              <Text style={styles.optionLabel}>{opt.label}</Text>
              {selectedTimeout === opt.value && (
                <Check size={18} color="#A9334D" strokeWidth={2.5} />
              )}
            </Pressable>
            {i < TIMEOUT_OPTIONS.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>

      <Text style={styles.sectionHint}>
        The app will lock automatically after the selected period of inactivity.
      </Text>

      <Pressable
        style={({ pressed }) => [
          styles.primaryBtn,
          pressed && { opacity: 0.85 },
          { marginTop: 24 },
        ]}
        onPress={onSave}
      >
        <Text style={styles.primaryBtnText}>
          {isExisting ? "Save changes" : "Enable App Lock"}
        </Text>
      </Pressable>

      {isExisting && (
        <Pressable
          style={({ pressed }) => [
            styles.destructiveBtn,
            pressed && { opacity: 0.7 },
          ]}
          onPress={onDisable}
        >
          <Text style={styles.destructiveBtnText}>Disable App Lock</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F4F0",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F8F4F0",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(9,51,44,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: "#09332C",
  },
  illustrationWrap: {
    alignItems: "center",
    marginBottom: 32,
  },
  outerRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#09332C",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.09,
        shadowRadius: 20,
      },
      android: { elevation: 3 },
    }),
  },
  innerRing: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  svgWrap: {
    ...Platform.select({
      ios: {
        shadowColor: "#09332C",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 6,
      },
    }),
  },
  illustrationContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    marginBottom: 36,
    height: 160,
  },
  illustrationCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#F0E4E1",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeRight: {
    position: "absolute",
    right: 20,
    top: 10,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#A9334D",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  badgeBottom: {
    position: "absolute",
    right: 16,
    bottom: 0,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#09332C",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 26,
    color: "#09332C",
    letterSpacing: -0.8,
    textAlign: "center",
    marginBottom: 12,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: "rgba(9,51,44,0.6)",
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 28,
  },
  featureList: {
    gap: 16,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#A9334D",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  featureText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: "#09332C",
    flex: 1,
  },
  enabledBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#D1FAE5",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 28,
    marginTop: 8,
  },
  enabledBadgeText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: "#059669",
  },
  sectionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: "#9CA3AF",
    letterSpacing: 0.8,
    marginBottom: 6,
    marginLeft: 4,
  },
  sectionHint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 8,
    marginLeft: 4,
    lineHeight: 17,
  },
  optionsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F0E4E1",
    overflow: "hidden",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
  },
  optionLabel: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: "#09332C",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0E4E1",
    marginLeft: 16,
  },
  primaryBtn: {
    backgroundColor: "#A9334D",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#A9334D",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
    }),
  },
  primaryBtnText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: "#ffffff",
    letterSpacing: 0.2,
  },
  destructiveBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
  },
  destructiveBtnText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: "#DC2626",
  },
});
