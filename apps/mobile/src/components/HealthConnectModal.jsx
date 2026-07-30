import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
  Dimensions,
  Image,
  Alert,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Upload, Activity } from "lucide-react-native";

import {
  requestHKAuthorization,
  fetchHealthKitRange,
  setupBackgroundDelivery,
  getHealthConnectStatus,
  openHealthConnectSettings,
} from "@/services/healthConnectService";
import { useAppStore } from "@/store/appStore";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SLIDE_SPRING = { damping: 15, stiffness: 170, mass: 0.95 };

// Health Connect Play Store link (for Android 9–13 users who need to install it)
const HC_PLAY_STORE_URL = "market://details?id=com.google.android.apps.healthdata";

export default function HealthConnectModal({ visible, onClose, onContinue }) {
  const [connecting, setConnecting] = useState(false);
  const {
    setHealthConnectConnected,
    setHealthConnectRange,
    mergeHealthConnectDay,
    healthConnectPreferences,
  } = useAppStore();
  const insets = useSafeAreaInsets();

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 260 });
      translateY.value = withSpring(0, SLIDE_SPRING);
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withSpring(SCREEN_HEIGHT, { damping: 20, stiffness: 220 });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  const handleConnect = async () => {
    console.log("[HC] Continue tapped — starting connect flow");
    setConnecting(true);
    try {
      // Health Connect is a separate app on Android ≤13 and can be outdated on
      // any version. Check first so we can send the user to the Play Store
      // instead of failing silently (or crashing) inside a permission request.
      const status = await getHealthConnectStatus();
      console.log(`[HC] provider status: ${status}`);
      if (status !== "available") {
        setConnecting(false);
        Alert.alert(
          status === "update_required" ? "Update Health Connect" : "Install Health Connect",
          status === "update_required"
            ? "Your version of Health Connect is out of date. Please update it to sync your health data with Hemo."
            : "Health Connect isn't set up on this device yet. Install it from the Play Store to sync your health data with Hemo.",
          [
            { text: "Not now", style: "cancel" },
            {
              text: status === "update_required" ? "Update" : "Install",
              onPress: () => Linking.openURL(HC_PLAY_STORE_URL).catch(() => {}),
            },
          ]
        );
        return;
      }

      const granted = await requestHKAuthorization();
      console.log(`[HC] authorization granted: ${granted}`);
      if (granted) {
        setHealthConnectConnected(true);
        const rangeData = await fetchHealthKitRange(30, healthConnectPreferences);
        console.log(`[HC] fetched range, ${Object.keys(rangeData).length} day(s) of data`);
        setHealthConnectRange(rangeData);
        setupBackgroundDelivery(
          (date, metrics) => mergeHealthConnectDay(date, metrics),
          healthConnectPreferences
        );
      } else {
        // Health Connect permanently stops showing the permission sheet after
        // a request has been denied or dismissed too many times — it then
        // settles instantly with nothing granted. Closing silently here made
        // the button look dead; instead route the user to HC settings, the
        // only place the permissions can still be granted.
        setConnecting(false);
        Alert.alert(
          "Allow access in Health Connect",
          "Health Connect didn't show the permission screen. This usually means it has stopped asking after earlier requests were dismissed. Grant Hemo access manually in Health Connect settings, then come back and tap Continue.",
          [
            { text: "Not now", style: "cancel" },
            { text: "Open Health Connect", onPress: () => openHealthConnectSettings() },
          ],
        );
        return;
      }
    } catch (e) {
      // Don't fail silently — a swallowed error here is what makes the button
      // look like it "just loads". Surface it and let the user retry.
      console.error("[HC] connect error", e);
      setConnecting(false);
      Alert.alert(
        "Couldn't connect",
        `We couldn't connect to Health Connect. Please make sure it's installed and up to date, then try again.\n\nDetails: ${e?.message ?? String(e)}`,
      );
      return;
    }
    setConnecting(false);
    onContinue ? onContinue() : onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[styles.card, { paddingBottom: Math.max(insets.bottom + 8, 24) }, cardStyle]}
        >
          <View style={styles.iconRow}>
            <Image
              source={require("../../assets/images/health_connect_logo.png")}
              style={{ width: 64, height: 64 }}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>Health Connect</Text>

          <Text style={styles.subtitle}>
            Connect with Health Connect to sync your health data with Hemo.
          </Text>

          <View style={styles.bullets}>
            <View style={styles.bulletRow}>
              <Upload size={17} color="#8E8E93" />
              <Text style={styles.bulletText}>
                Water intake and body measurements logged in Hemo will save to Health Connect.
              </Text>
            </View>
            <View style={styles.bulletRow}>
              <Activity size={17} color="#4285F4" />
              <Text style={styles.bulletText}>
                Steps, heart rate, blood oxygen and sleep from your device will appear in Hemo.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.82}
            disabled={connecting}
            onPress={handleConnect}
          >
            {connecting
              ? <ActivityIndicator color="#ffffff" />
              : <Text style={styles.buttonText}>Continue</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => Linking.openURL(HC_PLAY_STORE_URL).catch(() => {})}
            activeOpacity={0.7}
            style={styles.installRow}
          >
            <Text style={styles.installText}>
              Don't have Health Connect? Install it from the Play Store
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  card: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#F8E9E7",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  iconRow: {
    marginBottom: 24,
  },
  title: {
    fontFamily: "Geist_700Bold",
    fontSize: 22,
    color: "#1C1C1E",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Geist_400Regular",
    fontSize: 14,
    color: "#8E8E93",
    lineHeight: 20,
    marginBottom: 20,
  },
  bullets: {
    gap: 14,
    marginBottom: 32,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  bulletText: {
    fontFamily: "Geist_400Regular",
    fontSize: 14,
    color: "#8E8E93",
    lineHeight: 20,
    flex: 1,
  },
  button: {
    backgroundColor: "#A9334D",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 14,
  },
  buttonText: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 16,
    color: "#ffffff",
  },
  installRow: {
    alignItems: "center",
  },
  installText: {
    fontFamily: "Geist_400Regular",
    fontSize: 12,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 18,
  },
});
