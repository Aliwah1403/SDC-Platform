import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Upload, Watch } from "lucide-react-native";
import { fonts } from "@/utils/fonts";
import { requestHKAuthorization, fetchHealthKitRange, setupBackgroundDelivery } from "@/services/healthKitService";
import { useAppStore } from "@/store/appStore";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Bouncy slide-up spring
const SLIDE_SPRING = { damping: 15, stiffness: 170, mass: 0.95 };

export default function AppleHealthModal({ visible, onClose, onContinue }) {
  const [connecting, setConnecting] = useState(false);
  const { setHealthKitConnected, setHealthKitRange, mergeHealthKitDay, healthKitPreferences } = useAppStore();
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

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={StyleSheet.absoluteFill}>
        {/* Backdrop */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Card — anchored to bottom, slides up */}
        <Animated.View
          style={[styles.card, { paddingBottom: Math.max(insets.bottom + 8, 24) }, cardStyle]}
        >
          {/* Apple Health icon — official Apple-provided PNG, no alterations */}
          <View style={styles.iconRow}>
            <Image
              source={require("../../assets/images/icon-apple-health.png")}
              style={styles.ahIcon}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>Apple Health Sync</Text>

          <Text style={styles.subtitle}>
            Connect with Apple Health to sync your health data with Hemo.
          </Text>

          <View style={styles.bullets}>
            <View style={styles.bulletRow}>
              <Upload size={17} color="#8E8E93" />
              <Text style={styles.bulletText}>
                Health data logged in Hemo will save to Apple Health.
              </Text>
            </View>
            <View style={styles.bulletRow}>
              <Watch size={17} color="#8E8E93" />
              <Text style={styles.bulletText}>
                Steps, heart rate and sleep from Apple Watch will appear in Hemo.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.82}
            disabled={connecting}
            onPress={async () => {
              setConnecting(true);
              try {
                const granted = await requestHKAuthorization();
                if (granted) {
                  setHealthKitConnected(true);
                  const rangeData = await fetchHealthKitRange(30, healthKitPreferences);
                  setHealthKitRange(rangeData);
                  await setupBackgroundDelivery((date, metrics) => mergeHealthKitDay(date, metrics), healthKitPreferences);
                }
              } catch {}
              setConnecting(false);
              onContinue ? onContinue() : onClose();
            }}
          >
            {connecting
              ? <ActivityIndicator color="#ffffff" />
              : <Text style={styles.buttonText}>Continue</Text>
            }
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
  // Apple Health icon — no borders, shadows, or overlays per Apple guidelines
  ahIcon: {
    width: 64,
    height: 64,
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
  },
  buttonText: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 16,
    color: "#ffffff",
  },
});
