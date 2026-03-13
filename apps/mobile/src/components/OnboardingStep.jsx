import { MotiView } from "moti";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, ArrowRight } from "lucide-react-native";
import Svg, { Circle, Ellipse } from "react-native-svg";

export const TOTAL_STEPS = 9;

/**
 * Shared chrome for all onboarding steps.
 *
 * Props:
 *   step              — current step number (1–8)
 *   title             — step heading
 *   subtitle          — step subheading (optional)
 *   illustrationIcon  — Lucide icon component (e.g. Calendar)
 *   illustrationColor — icon + ring accent color (default '#A9334D')
 *   skippable         — whether to show "Skip" link at top right
 *   onSkip            — called when user taps skip
 *   onBack            — called when back pressed (if omitted, back button is hidden)
 *   ctaLabel          — CTA label (default "Next")
 *   onCta             — called when CTA pressed
 *   ctaDisabled       — disables CTA
 *   loading           — spinner on CTA
 *   children          — step content
 */
export default function OnboardingStep({
  step,
  title,
  subtitle,
  illustrationIcon: IllustIcon,
  illustrationColor = "#A9334D",
  skippable = false,
  onSkip,
  onBack,
  ctaLabel = "Next",
  onCta,
  ctaDisabled = false,
  loading = false,
  children,
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top bar: centered progress dots + optional skip */}
      <View style={styles.topBar}>
        <View style={styles.dotsCenter}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
            const isCurrent = i === step - 1;
            const isPast = i < step - 1;
            return (
              <View
                key={i}
                style={[
                  styles.dot,
                  isCurrent
                    ? [
                        styles.dotCurrent,
                        { backgroundColor: illustrationColor },
                      ]
                    : isPast
                      ? [styles.dotPast, { backgroundColor: illustrationColor }]
                      : styles.dotFuture,
                ]}
              />
            );
          })}
        </View>
        {skippable && onSkip && (
          <Pressable onPress={onSkip} hitSlop={10} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Illustration */}
          {IllustIcon && (
            <MotiView
              from={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                type: "spring",
                damping: 16,
                stiffness: 80,
                delay: 40,
              }}
              style={styles.illustrationArea}
            >
              <Svg style={StyleSheet.absoluteFill} viewBox="0 0 220 180">
                <Circle
                  cx="110"
                  cy="90"
                  r="82"
                  stroke={illustrationColor}
                  strokeWidth="1"
                  strokeOpacity={0.12}
                  fill="none"
                />
                <Circle
                  cx="110"
                  cy="90"
                  r="64"
                  stroke={illustrationColor}
                  strokeWidth="1"
                  strokeOpacity={0.07}
                  fill="none"
                />
                <Ellipse
                  cx="175"
                  cy="28"
                  rx="38"
                  ry="28"
                  fill={illustrationColor}
                  fillOpacity={0.07}
                />
                <Ellipse
                  cx="38"
                  cy="155"
                  rx="28"
                  ry="20"
                  fill={illustrationColor}
                  fillOpacity={0.06}
                />
              </Svg>
              <View
                style={[
                  styles.illustCircle,
                  {
                    backgroundColor: `${illustrationColor}18`,
                    borderColor: `${illustrationColor}22`,
                  },
                ]}
              >
                <View
                  style={[
                    styles.illustInner,
                    { backgroundColor: `${illustrationColor}12` },
                  ]}
                >
                  <IllustIcon
                    size={48}
                    color={illustrationColor}
                    strokeWidth={1.5}
                  />
                </View>
              </View>
            </MotiView>
          )}

          {/* Heading */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              type: "spring",
              damping: 18,
              stiffness: 80,
              delay: IllustIcon ? 120 : 60,
            }}
            style={styles.headingBlock}
          >
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </MotiView>

          {/* Content */}
          <MotiView
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              type: "spring",
              damping: 18,
              stiffness: 80,
              delay: IllustIcon ? 200 : 140,
            }}
          >
            {children}
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom navigation — fixed outside scroll */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 14 }]}>
        <View style={styles.navLeft}>
          {onBack ? (
            <Pressable
              style={({ pressed }) => [
                styles.backCircle,
                pressed && { opacity: 0.6 },
              ]}
              onPress={onBack}
            >
              <ArrowLeft size={20} color="#09332C" strokeWidth={2} />
            </Pressable>
          ) : (
            <View style={styles.navPlaceholder} />
          )}
        </View>

        <View style={styles.navRight}>
          <Pressable
            style={({ pressed }) => [
              styles.nextPill,
              {
                backgroundColor: ctaDisabled ? "rgba(9,51,44,0.2)" : "#09332C",
              },
              pressed && !ctaDisabled && { opacity: 0.85 },
            ]}
            onPress={onCta}
            disabled={ctaDisabled || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.nextPillText}>{ctaLabel}</Text>
                <ArrowRight size={15} color="#FFFFFF" strokeWidth={2.5} />
              </>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F4F0",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 6,
    minHeight: 44,
  },
  dotsCenter: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  skipBtn: {
    position: "absolute",
    right: 24,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotCurrent: {
    width: 22,
  },
  dotPast: {
    width: 6,
    opacity: 0.4,
  },
  dotFuture: {
    width: 6,
    backgroundColor: "rgba(9,51,44,0.14)",
  },
  skipText: {
    fontFamily: "Geist_500Medium",
    fontSize: 14,
    color: "rgba(9,51,44,0.4)",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 20,
    flexGrow: 1,
  },
  illustrationArea: {
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  illustCircle: {
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  illustInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headingBlock: {
    marginBottom: 24,
  },
  title: {
    fontFamily: "Geist_700Bold",
    fontSize: 28,
    color: "#09332C",
    letterSpacing: -0.9,
    lineHeight: 34,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: "Geist_400Regular",
    fontSize: 15,
    color: "rgba(9,51,44,0.55)",
    lineHeight: 22,
  },
  bottomNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(9,51,44,0.07)",
    backgroundColor: "#F8F4F0",
  },
  navLeft: {
    width: 44,
  },
  navRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  navPlaceholder: {
    width: 44,
  },
  backCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(9,51,44,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  nextPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 24,
    minWidth: 100,
    justifyContent: "center",
  },
  nextPillText: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 15,
    color: "#FFFFFF",
    letterSpacing: 0.1,
  },
});
