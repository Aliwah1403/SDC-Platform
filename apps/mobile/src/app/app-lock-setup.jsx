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
  ShieldCheck,
} from "lucide-react-native";
import { useAppStore } from "@/store/appStore";
import { fonts } from "@/utils/fonts";
import { useTheme } from "@/hooks/useTheme";

const TIMEOUT_OPTIONS = [
  { label: "Immediately", value: 0 },
  { label: "After 1 minute", value: 1 },
  { label: "After 5 minutes", value: 5 },
  { label: "After 15 minutes", value: 15 },
  { label: "After 1 hour", value: 60 },
];

export default function AppLockSetupScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(t);
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
          <ArrowLeft size={22} color={t.text} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>App Lock</Text>
        <View style={{ width: 40 }} />
      </View>

      {step === "intro" ? (
        <IntroStep
          loading={loading}
          onGetStarted={handleGetStarted}
          insets={insets}
          t={t}
        />
      ) : (
        <ConfigStep
          selectedTimeout={selectedTimeout}
          onSelectTimeout={setSelectedTimeout}
          onSave={handleSave}
          onDisable={handleDisable}
          isExisting={appLockEnabled}
          insets={insets}
          t={t}
        />
      )}
    </View>
  );
}

function IntroStep({ loading, onGetStarted, insets, t }) {
  const styles = createStyles(t);
  return (
    <View style={{ flex: 1, paddingHorizontal: 28 }}>
      {/* Illustration */}
      <View style={styles.illustrationWrap}>
        <View style={styles.outerRing}>
          <View style={styles.innerRing} />
          <View style={styles.svgWrap}>
            <Svg width={58} height={66} viewBox="0 0 58 66" fill="none">
              <Path
                d="M14 28V20C14 12.268 20.268 6 28 6h2C37.732 6 44 12.268 44 20v8"
                stroke={t.text}
                strokeWidth={4}
                strokeLinecap="round"
              />
              <Rect x={7} y={28} width={44} height={32} rx={8} fill={t.text} />
              <Circle cx={29} cy={42} r={5} fill={t.isDark ? "#2A1A1A" : "#F2EEE8"} opacity={0.9} />
              <Rect
                x={27}
                y={45}
                width={4}
                height={7}
                rx={2}
                fill={t.isDark ? "#2A1A1A" : "#F2EEE8"}
                opacity={0.9}
              />
            </Svg>
          </View>
        </View>
      </View>

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

function ConfigStep({ selectedTimeout, onSelectTimeout, onSave, onDisable, isExisting, insets, t }) {
  const styles = createStyles(t);
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
                pressed && { backgroundColor: t.surfaceElevated },
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

function createStyles(t) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: t.background,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.surfaceElevated,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontFamily: fonts.semibold,
      fontSize: 17,
      color: t.text,
    },
    illustrationWrap: {
      alignItems: "center",
      marginBottom: 32,
    },
    outerRing: {
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: t.isDark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.72)",
      borderWidth: 1,
      borderColor: t.isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.6)",
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
        ios: {
          shadowColor: "#1A1A1A",
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
      backgroundColor: t.isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.45)",
      borderWidth: 1,
      borderColor: t.isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.5)",
    },
    svgWrap: {
      ...Platform.select({
        ios: {
          shadowColor: "#1A1A1A",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.18,
          shadowRadius: 6,
        },
      }),
    },
    title: {
      fontFamily: fonts.bold,
      fontSize: 26,
      color: t.text,
      letterSpacing: -0.8,
      textAlign: "center",
      marginBottom: 12,
    },
    body: {
      fontFamily: fonts.regular,
      fontSize: 15,
      color: t.textSecondary,
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
      color: t.text,
      flex: 1,
    },
    enabledBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: t.isDark ? "rgba(5,150,105,0.15)" : "#D1FAE5",
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
      color: t.textSecondary,
      letterSpacing: 0.8,
      marginBottom: 6,
      marginLeft: 4,
    },
    sectionHint: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: t.textSecondary,
      marginTop: 8,
      marginLeft: 4,
      lineHeight: 17,
    },
    optionsCard: {
      backgroundColor: t.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: t.border,
      overflow: "hidden",
    },
    optionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: t.surface,
    },
    optionLabel: {
      fontFamily: fonts.medium,
      fontSize: 15,
      color: t.text,
    },
    divider: {
      height: 1,
      backgroundColor: t.border,
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
}
