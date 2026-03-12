import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Ellipse } from "react-native-svg";
import { ChartColumnIncreasing, Pill, ShieldAlert } from "lucide-react-native";

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={["#781D11", "#4A1309", "#0D0D0D", "#0A0A0A"]}
      style={StyleSheet.absoluteFill}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
    >
      {/* Decorative abstract shapes */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg style={StyleSheet.absoluteFill}>
          <Circle cx="330" cy="80" r="140" fill="#A9334D" fillOpacity={0.18} />
          <Circle cx="-40" cy="200" r="110" fill="#781D11" fillOpacity={0.22} />
          <Ellipse
            cx="200"
            cy="720"
            rx="200"
            ry="140"
            fill="#D09F9A"
            fillOpacity={0.07}
          />
          <Circle cx="360" cy="600" r="90" fill="#A9334D" fillOpacity={0.1} />
        </Svg>
      </View>

      <View
        style={[
          styles.container,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 },
        ]}
      >
        {/* Logo section */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            type: "spring",
            damping: 18,
            stiffness: 80,
            delay: 100,
          }}
          style={styles.logoSection}
        >
          <View style={styles.logoMark}>
            <View style={styles.logoMarkDot} />
          </View>
          <Text style={styles.logo}>Hemo</Text>
          <Text style={styles.tagline}>Your sickle cell companion</Text>
        </MotiView>

        {/* Feature highlights */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500, delay: 400 }}
          style={styles.highlights}
        >
          {[
            {
              icon: <ChartColumnIncreasing size={20} color="rgba(248, 233, 231, 0.75)" strokeWidth={1.75} />,
              text: "Track symptoms & health metrics daily",
            },
            {
              icon: <Pill size={20} color="rgba(248, 233, 231, 0.75)" strokeWidth={1.75} />,
              text: "Manage medications & care team",
            },
            {
              icon: <ShieldAlert size={20} color="rgba(248, 233, 231, 0.75)" strokeWidth={1.75} />,
              text: "Emergency SOS at your fingertips",
            },
          ].map(({ icon, text }) => (
            <View key={text} style={styles.highlightRow}>
              <View style={styles.highlightIcon}>{icon}</View>
              <Text style={styles.highlightText}>{text}</Text>
            </View>
          ))}
        </MotiView>

        {/* CTA Buttons */}
        <MotiView
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            type: "spring",
            damping: 20,
            stiffness: 80,
            delay: 600,
          }}
          style={styles.ctaContainer}
        >
          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && styles.pressed,
            ]}
            onPress={() => router.push("/(auth)/signup")}
          >
            <Text style={styles.primaryBtnText}>Create Account</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryBtn,
              pressed && styles.pressed,
            ]}
            onPress={() => router.push("/(auth)/signin")}
          >
            <Text style={styles.secondaryBtnText}>
              I already have an account
            </Text>
          </Pressable>

          <Text style={styles.legalText}>
            By continuing, you agree to our{" "}
            <Text style={styles.legalLink}>Terms of Service</Text>
            {" & "}
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </Text>
        </MotiView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "space-between",
  },
  logoSection: {
    alignItems: "flex-start",
    paddingTop: 40,
  },
  logoMark: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(248, 233, 231, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(248, 233, 231, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  logoMarkDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#F0531C",
  },
  logo: {
    fontFamily: "Geist_800ExtraBold",
    fontSize: 52,
    color: "#F8E9E7",
    letterSpacing: -2.5,
    lineHeight: 56,
  },
  tagline: {
    fontFamily: "Geist_400Regular",
    fontSize: 16,
    color: "rgba(248, 233, 231, 0.55)",
    marginTop: 8,
    letterSpacing: 0.2,
  },
  highlights: {
    gap: 16,
    paddingVertical: 20,
  },
  highlightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  highlightIcon: {
    width: 25,
    alignItems: "center",
  },
  highlightText: {
    fontFamily: "Geist_400Regular",
    fontSize: 15,
    color: "rgba(248, 233, 231, 0.75)",
    flex: 1,
    lineHeight: 22,
  },
  ctaContainer: {
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: "#F0531C",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryBtnText: {
    fontFamily: "Geist_700Bold",
    fontSize: 16,
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    backgroundColor: "rgba(248, 233, 231, 0.1)",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(248, 233, 231, 0.18)",
  },
  secondaryBtnText: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 16,
    color: "#F8E9E7",
    letterSpacing: 0.1,
  },
  pressed: {
    opacity: 0.75,
  },
  legalText: {
    fontFamily: "Geist_400Regular",
    fontSize: 12,
    color: "rgba(248, 233, 231, 0.35)",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 4,
  },
  legalLink: {
    color: "rgba(248, 233, 231, 0.55)",
    textDecorationLine: "underline",
  },
});
