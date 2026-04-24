import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MotiView } from "moti";
import { ArrowLeft, MapPin, Cross } from "lucide-react-native";
import * as Location from "expo-location";
import { usePostHog } from "posthog-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TOTAL_STEPS } from "@/components/OnboardingStep";
import { useAppStore } from "@/store/appStore";

function MapIllustration() {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9, translateY: 12 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      transition={{ type: "spring", damping: 16, stiffness: 80, delay: 80 }}
      style={styles.mapContainer}
    >
      {/* Pulsing rings behind pin */}
      <MotiView
        from={{ scale: 0.7, opacity: 0.5 }}
        animate={{ scale: 1.6, opacity: 0 }}
        transition={{ type: "timing", duration: 2000, loop: true }}
        style={styles.pulseRing}
      />
      <MotiView
        from={{ scale: 0.7, opacity: 0.4 }}
        animate={{ scale: 1.3, opacity: 0 }}
        transition={{ type: "timing", duration: 2000, loop: true, delay: 500 }}
        style={styles.pulseRing}
      />

      {/* Mock map grid */}
      <View style={styles.mapGrid}>
        {/* Road lines */}
        <View style={styles.roadH} />
        <View style={[styles.roadH, { top: "65%" }]} />
        <View style={styles.roadV} />
        <View style={[styles.roadV, { left: "68%" }]} />

        {/* Hospital markers */}
        <View style={[styles.hospitalMarker, { top: "22%", left: "18%" }]}>
          <Cross size={9} color="#FFFFFF" strokeWidth={2.5} />
        </View>
        <View style={[styles.hospitalMarker, { top: "55%", left: "70%" }]}>
          <Cross size={9} color="#FFFFFF" strokeWidth={2.5} />
        </View>
        <View style={[styles.hospitalMarker, { top: "75%", left: "28%" }]}>
          <Cross size={9} color="#FFFFFF" strokeWidth={2.5} />
        </View>

        {/* User location pin (centre) */}
        <View style={styles.pinWrapper}>
          <View style={styles.pinCircle}>
            <MapPin size={22} color="#FFFFFF" strokeWidth={2} fill="#FFFFFF" />
          </View>
          <View style={styles.pinTail} />
        </View>
      </View>
    </MotiView>
  );
}

export default function Step9() {
  const posthog = usePostHog();
  const { setOnboardingField } = useAppStore();
  const insets = useSafeAreaInsets();

  const handleRequestLocation = async () => {
    try {
      const { status: current } =
        await Location.getForegroundPermissionsAsync();
      if (current === "granted") {
        setOnboardingField("locationEnabled", true);
        router.push("/(onboarding)/step-10");
        return;
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      setOnboardingField("locationEnabled", status === "granted");
      router.push("/(onboarding)/step-10");
    } catch {
      setOnboardingField("locationEnabled", false);
      router.push("/(onboarding)/step-10");
    }
  };

  const handleSkip = () => {
    posthog?.capture('onboarding_step_skipped', { step: 9 });
    setOnboardingField("locationEnabled", false);
    router.push("/(onboarding)/step-10");
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
          <ArrowLeft size={20} color="#09332C" strokeWidth={2} />
        </Pressable>
        <View style={styles.dotsRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === 8
                  ? styles.dotCurrent
                  : i < 8
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

      {/* Middle: map illustration + heading */}
      <View style={styles.middle}>
        <MapIllustration />

        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "spring", damping: 16, stiffness: 80, delay: 320 }}
          style={styles.headingBlock}
        >
          <Text style={styles.title}>Find care near you</Text>
          <Text style={styles.subtitle}>
            We use your location to surface nearby hospitals and specialist
            centres when you need them.
          </Text>
        </MotiView>
      </View>

      {/* Bottom: CTA + skip */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "spring", damping: 16, stiffness: 80, delay: 420 }}
        style={[styles.bottomArea, { paddingBottom: insets.bottom + 28 }]}
      >
        <Pressable
          style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.85 }]}
          onPress={handleRequestLocation}
        >
          <Text style={styles.ctaBtnText}>Enable Location</Text>
        </Pressable>
        <Pressable onPress={handleSkip} hitSlop={12}>
          <Text style={styles.notNowText}>Not right now</Text>
        </Pressable>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8F4F0" },
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
    backgroundColor: "rgba(9,51,44,0.08)",
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
  dotCurrent: { width: 22, backgroundColor: "#A9334D" },
  dotPast: { width: 6, backgroundColor: "#A9334D", opacity: 0.4 },
  dotFuture: { width: 6, backgroundColor: "rgba(9,51,44,0.14)" },
  skipBtn: { width: 44, alignItems: "flex-end" },
  skipText: { fontFamily: "Geist_500Medium", fontSize: 14, color: "rgba(9,51,44,0.4)" },
  middle: { flex: 1, paddingHorizontal: 24, justifyContent: "center", gap: 36 },
  headingBlock: { gap: 10, alignItems: "center" },
  title: {
    fontFamily: "Geist_700Bold",
    fontSize: 30,
    color: "#09332C",
    letterSpacing: -0.9,
    lineHeight: 36,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Geist_400Regular",
    fontSize: 15,
    color: "rgba(9,51,44,0.55)",
    lineHeight: 22,
    textAlign: "center",
  },
  bottomArea: { paddingHorizontal: 24, paddingTop: 12, gap: 14, alignItems: "center" },
  ctaBtn: {
    width: "100%",
    backgroundColor: "#A9334D",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
  },
  ctaBtnText: { fontFamily: "Geist_700Bold", fontSize: 17, color: "#FFFFFF", letterSpacing: 0.2 },
  notNowText: { fontFamily: "Geist_500Medium", fontSize: 15, color: "rgba(9,51,44,0.4)" },

  // Map illustration
  mapContainer: {
    alignSelf: "center",
    width: "100%",
    height: 220,
    backgroundColor: "rgba(9,51,44,0.035)",
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: "rgba(9,51,44,0.07)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 5,
  },
  mapGrid: { flex: 1, position: "relative" },
  roadH: {
    position: "absolute",
    top: "40%",
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: "rgba(9,51,44,0.06)",
  },
  roadV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "42%",
    width: 6,
    backgroundColor: "rgba(9,51,44,0.06)",
  },
  hospitalMarker: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: "#09332C",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.55,
  },
  pulseRing: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 60,
    height: 60,
    marginTop: -30,
    marginLeft: -30,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#A9334D",
    zIndex: 1,
  },
  pinWrapper: {
    position: "absolute",
    top: "50%",
    left: "50%",
    alignItems: "center",
    marginTop: -38,
    marginLeft: -20,
    zIndex: 2,
  },
  pinCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#A9334D",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#A9334D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#A9334D",
    marginTop: -2,
  },
});
