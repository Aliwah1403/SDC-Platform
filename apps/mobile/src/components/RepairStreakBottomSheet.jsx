import React, { useCallback, useEffect, useRef } from "react";
import { View, Text } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { X, Shield, Wrench } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { fonts } from "@/utils/fonts";
import { usePostHog } from "posthog-react-native";
import { useTheme } from "@/hooks/useTheme";
import { PressableScale } from "@/components/PressableScale";

const HEMO = {
  dark: "#781D11",
  wine: "#A9334D",
  rose: "#D09F9A",
  blush: "#F8E9E7",
};

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);

export default function RepairStreakBottomSheet({ isVisible, receipt, onClose }) {
  const t = useTheme();
  const posthog = usePostHog();
  const reducedMotion = useReducedMotion();
  const bottomSheetRef = useRef(null);
  const shieldOpacity = useSharedValue(0);
  const shieldScale = useSharedValue(0.95);
  const tokenOpacity = useSharedValue(0);
  const tokenX = useSharedValue(0);
  const tokenScale = useSharedValue(0.95);
  const textOpacity = useSharedValue(0);
  const textY = useSharedValue(8);

  const resetAnimation = useCallback(() => {
    shieldOpacity.set(0);
    shieldScale.set(0.95);
    tokenOpacity.set(0);
    tokenX.set(0);
    tokenScale.set(0.95);
    textOpacity.set(0);
    textY.set(8);
  }, [shieldOpacity, shieldScale, tokenOpacity, tokenX, tokenScale, textOpacity, textY]);

  useEffect(() => {
    if (isVisible && receipt) {
      bottomSheetRef.current?.expand();
      posthog?.capture('streak_repair_auto_applied', {
        repairs_used: receipt.repairsUsed,
        missed_days_repaired: receipt.missedDays,
        repairs_remaining_after: receipt.repairsRemaining,
        restored_streak: receipt.restoredStreak,
      });

      resetAnimation();

      shieldOpacity.set(
        withTiming(1, {
          duration: 180,
          easing: EASE_OUT,
          reduceMotion: ReduceMotion.System,
        }),
      );
      shieldScale.set(
        reducedMotion
          ? withTiming(1, { duration: 180, easing: EASE_OUT, reduceMotion: ReduceMotion.System })
          : withSequence(
              withSpring(1, { duration: 400, dampingRatio: 1, reduceMotion: ReduceMotion.System }),
              withDelay(
                420,
                withSequence(
                  withSpring(1.06, { duration: 220, dampingRatio: 1, reduceMotion: ReduceMotion.System }),
                  withSpring(1, { duration: 300, dampingRatio: 1, reduceMotion: ReduceMotion.System }),
                ),
              ),
            ),
      );

      tokenOpacity.set(
        withDelay(
          140,
          withSequence(
            withTiming(1, { duration: 160, easing: EASE_OUT, reduceMotion: ReduceMotion.System }),
            withDelay(350, withTiming(0, { duration: 140, easing: EASE_OUT, reduceMotion: ReduceMotion.System })),
          ),
        ),
      );
      tokenX.set(
        reducedMotion
          ? 0
          : withDelay(220, withTiming(-48, { duration: 420, easing: EASE_IN_OUT, reduceMotion: ReduceMotion.System })),
      );
      tokenScale.set(
        reducedMotion
          ? withTiming(1, { duration: 180, easing: EASE_OUT, reduceMotion: ReduceMotion.System })
          : withDelay(220, withTiming(0.72, { duration: 420, easing: EASE_IN_OUT, reduceMotion: ReduceMotion.System })),
      );

      textOpacity.set(
        withDelay(820, withTiming(1, { duration: 260, easing: EASE_OUT, reduceMotion: ReduceMotion.System })),
      );
      textY.set(
        reducedMotion
          ? 0
          : withDelay(820, withTiming(0, { duration: 260, easing: EASE_OUT, reduceMotion: ReduceMotion.System })),
      );
    } else {
      bottomSheetRef.current?.close();
      resetAnimation();
    }
  }, [isVisible, receipt, reducedMotion, resetAnimation, shieldOpacity, shieldScale, tokenOpacity, tokenX, tokenScale, textOpacity, textY, posthog]);

  const handleClose = useCallback(() => {
    resetAnimation();
    onClose();
  }, [onClose, resetAnimation]);

  const shieldStyle = useAnimatedStyle(() => ({
    opacity: shieldOpacity.get(),
    transform: [{ scale: shieldScale.get() }],
  }));

  const tokenStyle = useAnimatedStyle(() => ({
    opacity: tokenOpacity.get(),
    transform: [{ translateX: tokenX.get() }, { scale: tokenScale.get() }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.get(),
    transform: [{ translateY: textY.get() }],
  }));

  if (!receipt) return null;

  const repairsLabel = `${receipt.repairsUsed} repair${receipt.repairsUsed !== 1 ? "s" : ""}`;
  const missedDaysLabel = `${receipt.missedDays} day${receipt.missedDays !== 1 ? "s" : ""}`;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={["68%"]}
      enablePanDownToClose
      onClose={handleClose}
      backgroundStyle={{ backgroundColor: t.background, borderRadius: 28 }}
      handleIndicatorStyle={{ backgroundColor: t.border, width: 36 }}
    >
      <BottomSheetView style={{ flex: 1, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 }}>
        <PressableScale
          onPress={handleClose}
          style={{
            alignSelf: "flex-end",
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: t.isDark ? t.surfaceElevated : "#EDE8E3",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 18,
          }}
        >
          <X size={16} color={t.textSecondary} strokeWidth={2.5} />
        </PressableScale>

        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingBottom: 18 }}>
          <View style={{ width: 148, height: 112, alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
            <Animated.View
              style={[
                {
                  position: "absolute",
                  right: 14,
                  top: 35,
                  zIndex: 2,
                },
                tokenStyle,
              ]}
            >
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: HEMO.blush,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: t.background,
                  shadowColor: "#000",
                  shadowOpacity: 0.12,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: 3,
                }}
              >
                <Wrench size={20} color={HEMO.wine} strokeWidth={2.2} />
              </View>
            </Animated.View>

            <Animated.View style={shieldStyle}>
              <LinearGradient
                colors={[HEMO.dark, HEMO.wine]}
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Shield size={46} color={HEMO.blush} strokeWidth={1.8} />
              </LinearGradient>
            </Animated.View>
          </View>

          <Animated.View style={[{ alignItems: "center", width: "100%" }, textStyle]}>
              <Text style={{ fontFamily: fonts.extrabold, fontSize: 29, color: t.text, marginBottom: 12, textAlign: "center" }}>
                Your streak is safe
              </Text>

              <Text style={{ fontFamily: fonts.regular, fontSize: 16, color: t.textSecondary, textAlign: "center", lineHeight: 24, marginBottom: 16 }}>
                Life happens. We used {repairsLabel} to cover the {missedDaysLabel} you missed, so your{" "}
                <Text style={{ fontFamily: fonts.bold, color: t.text }}>
                  {receipt.restoredStreak}-day streak
                </Text>{" "}
                is still here.
              </Text>

              <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.textTertiary, textAlign: "center", lineHeight: 19, marginBottom: 28 }}>
                Repairs keep your streak going, but don’t count as logged days.
              </Text>

              <PressableScale
                onPress={handleClose}
                style={{
                  backgroundColor: HEMO.wine,
                  paddingVertical: 16,
                  paddingHorizontal: 24,
                  borderRadius: 16,
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: "#fff" }}>
                  Continue
                </Text>
              </PressableScale>
          </Animated.View>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}
