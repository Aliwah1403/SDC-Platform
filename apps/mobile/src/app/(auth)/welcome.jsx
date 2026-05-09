import { router } from "expo-router";
import { MotiView } from "moti";
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { useTheme } from "@/hooks/useTheme";
import HemoLogo from "../../../assets/images/icon.png";

const { width: W, height: H } = Dimensions.get("window");

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const dark = theme.isDark;

  return (
    <View
      style={[styles.root, { backgroundColor: dark ? "#0D0D0D" : "#F8E9E7" }]}
    >
      {/* Ambient glow orbs */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width={W} height={H}>
          <Defs>
            {/* Secondary orb — offset left, deeper tone */}
            <RadialGradient
              id="orb2"
              cx={W * 0.3}
              cy={H * 0.2}
              r={W * 0.55}
              gradientUnits="userSpaceOnUse"
            >
              <Stop
                offset="0%"
                stopColor={dark ? "#781D11" : "#C4A8A4"}
                stopOpacity={dark ? 0.55 : 0.35}
              />
              <Stop
                offset="100%"
                stopColor={dark ? "#0D0D0D" : "#F8E9E7"}
                stopOpacity={0}
              />
            </RadialGradient>

            {/* Primary orb — warm center, centered horizontally */}
            <RadialGradient
              id="orb1"
              cx={W * 0.52}
              cy={H * 0.29}
              r={W * 0.72}
              gradientUnits="userSpaceOnUse"
            >
              <Stop
                offset="0%"
                stopColor="#F0531C"
                stopOpacity={dark ? 0.82 : 0.5}
              />
              <Stop
                offset="28%"
                stopColor="#A9334D"
                stopOpacity={dark ? 0.65 : 0.45}
              />
              <Stop
                offset="55%"
                stopColor={dark ? "#781D11" : "#D09F9A"}
                stopOpacity={dark ? 0.35 : 0.25}
              />
              <Stop
                offset="100%"
                stopColor={dark ? "#0D0D0D" : "#F8E9E7"}
                stopOpacity={0}
              />
            </RadialGradient>

            {/* Accent orb — small, right side, adds dimension */}
            <RadialGradient
              id="orb3"
              cx={W * 0.78}
              cy={H * 0.15}
              r={W * 0.3}
              gradientUnits="userSpaceOnUse"
            >
              <Stop
                offset="0%"
                stopColor={dark ? "#A9334D" : "#D09F9A"}
                stopOpacity={dark ? 0.3 : 0.2}
              />
              <Stop
                offset="100%"
                stopColor={dark ? "#0D0D0D" : "#F8E9E7"}
                stopOpacity={0}
              />
            </RadialGradient>
          </Defs>

          <Rect x={0} y={0} width={W} height={H} fill="url(#orb2)" />
          <Rect x={0} y={0} width={W} height={H} fill="url(#orb1)" />
          <Rect x={0} y={0} width={W} height={H} fill="url(#orb3)" />
        </Svg>
      </View>

      {/* Content */}
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 28,
          },
        ]}
      >
        {/* Spacer — lets the orb breathe */}
        <View style={{ flex: 1 }} />

        {/* Icon + heading cluster */}
        <MotiView
          from={{ opacity: 0, translateY: 24 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            type: "spring",
            damping: 20,
            stiffness: 80,
            delay: 200,
          }}
          style={styles.headingCluster}
        >
          {dark ? (
              <Image
                source={HemoLogo}
                style={styles.iconImg}
                resizeMode="contain"
              />
          
          ) : (
            <Image
              source={HemoLogo}
              style={[styles.iconImg, { borderRadius: 14 }]}
              resizeMode="contain"
            />
          )}

          <Text style={[styles.title, { color: dark ? "#F8E9E7" : "#1A1A1A" }]}>
            Welcome to Hemo
          </Text>
          <Text
            style={[
              styles.subtitle,
              {
                color: dark
                  ? "rgba(248, 233, 231, 0.55)"
                  : "rgba(26, 26, 26, 0.5)",
              },
            ]}
          >
            Your daily companion for living well with sickle cell.
          </Text>
        </MotiView>

        <View style={{ height: 36 }} />

        {/* CTA area */}
        <MotiView
          from={{ opacity: 0, translateY: 28 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            type: "spring",
            damping: 20,
            stiffness: 80,
            delay: 380,
          }}
          style={styles.ctaArea}
        >
          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              { opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => router.push("/(auth)/signup")}
          >
            <Text style={styles.primaryBtnText}>Get started</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.loginRow,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => router.push("/(auth)/signin")}
          >
            <Text
              style={[
                styles.loginText,
                {
                  color: dark
                    ? "rgba(248, 233, 231, 0.6)"
                    : "rgba(26, 26, 26, 0.55)",
                },
              ]}
            >
              Already have an account?{" "}
              <Text
                style={[
                  styles.loginLink,
                  { color: dark ? "#F8E9E7" : "#1A1A1A" },
                ]}
              >
                Log in
              </Text>
            </Text>
          </Pressable>

          <Text
            style={[
              styles.legalText,
              {
                color: dark
                  ? "rgba(248, 233, 231, 0.28)"
                  : "rgba(26, 26, 26, 0.32)",
              },
            ]}
          >
            By continuing, you agree to our{" "}
            <Text
              style={[
                styles.legalLink,
                {
                  color: dark
                    ? "rgba(248, 233, 231, 0.45)"
                    : "rgba(26, 26, 26, 0.5)",
                },
              ]}
            >
              Terms
            </Text>
            {" and "}
            <Text
              style={[
                styles.legalLink,
                {
                  color: dark
                    ? "rgba(248, 233, 231, 0.45)"
                    : "rgba(26, 26, 26, 0.5)",
                },
              ]}
            >
              Privacy Policy
            </Text>
            .
          </Text>
        </MotiView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
  },
  headingCluster: {
    alignItems: "center",
  },
  iconCard: {
    width: 68,
    height: 68,
    borderRadius: 16,
    backgroundColor: "#F8E9E7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    overflow: "hidden",
  },
  iconImg: {
    width: 68,
    height: 68,
    marginBottom: 24,
  },
  title: {
    fontFamily: "Geist_800ExtraBold",
    fontSize: 34,
    letterSpacing: -1,
    textAlign: "center",
    lineHeight: 40,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: "Geist_400Regular",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    paddingHorizontal: 12,
  },
  ctaArea: {
    gap: 14,
  },
  primaryBtn: {
    backgroundColor: "#A9334D",
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
  },
  primaryBtnText: {
    fontFamily: "Geist_700Bold",
    fontSize: 16,
    color: "#FFFFFF",
    letterSpacing: 0.1,
  },
  loginRow: {
    alignItems: "center",
    paddingVertical: 2,
  },
  loginText: {
    fontFamily: "Geist_400Regular",
    fontSize: 15,
  },
  loginLink: {
    fontFamily: "Geist_700Bold",
  },
  legalText: {
    fontFamily: "Geist_400Regular",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 2,
  },
  legalLink: {
    textDecorationLine: "underline",
  },
});
