import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  FadeInDown,
  LinearTransition,
  ReduceMotion,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePostHog } from "posthog-react-native";

import { useTheme } from "@/hooks/useTheme";
import { fonts } from "@/utils/fonts";

const EDGE_INSET = 10;
const SHEET_RADIUS = 32;
const ROWS_PER_PRESS = 2;
const MAX_BLUR = 36;

const SHEET_SPRING = {
  duration: 300,
  dampingRatio: 0.8,
  reduceMotion: ReduceMotion.System,
};
const DISMISS_SPRING = {
  duration: 300,
  dampingRatio: 1,
  overshootClamping: true,
  reduceMotion: ReduceMotion.System,
};
const CONTENT_LAYOUT = LinearTransition.springify()
  .mass(1)
  .damping(26)
  .stiffness(240)
  .reduceMotion(ReduceMotion.System);

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

function triggerLightHaptic() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

function project(velocity, decelerationRate = 0.998) {
  "worklet";
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

function rubberBand(overshoot, dimension, constant = 0.55) {
  "worklet";
  return (
    (overshoot * dimension * constant) /
    (dimension + constant * Math.abs(overshoot))
  );
}

function IconStack({ providerIcon, providerIconSize = 50, revealed, theme }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(
      withSpring(revealed ? 1 : 0, {
        duration: 320,
        dampingRatio: 0.72,
        reduceMotion: ReduceMotion.System,
      }),
    );
  }, [progress, revealed]);

  const hemoStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(progress.get(), [0, 1], [0, -6])}deg` },
    ],
  }));

  const providerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.get(), [0, 1], [0, 56]) },
      { rotate: `${interpolate(progress.get(), [0, 1], [0, 8])}deg` },
      { scale: interpolate(progress.get(), [0, 1], [0.96, 1]) },
    ],
  }));

  return (
    <View
      style={styles.iconStage}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View style={[styles.iconSlot, providerStyle]}>
        <View style={[styles.providerTile, { borderColor: theme.border }]}>
          <Image
            source={providerIcon}
            style={{ width: providerIconSize, height: providerIconSize }}
            resizeMode="contain"
          />
        </View>
      </Animated.View>
      <Animated.View style={[styles.iconSlot, hemoStyle]}>
        <View
          style={[
            styles.hemoTile,
            {
              backgroundColor: theme.isDark ? "#2A2022" : "#F8E9E7",
              borderColor: theme.border,
            },
          ]}
        >
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.hemoMark}
            resizeMode="contain"
          />
        </View>
      </Animated.View>
    </View>
  );
}

function SyncRow({ row, index, theme }) {
  const Icon = row.icon;
  const entering = useMemo(
    () =>
      FadeInDown.duration(220)
        .delay((index % ROWS_PER_PRESS) * 70)
        .reduceMotion(ReduceMotion.System),
    [index],
  );

  return (
    <Animated.View
      entering={entering}
      layout={CONTENT_LAYOUT}
      style={styles.row}
    >
      <View
        style={[
          styles.rowIcon,
          {
            backgroundColor: theme.isDark ? `${row.color}22` : `${row.color}14`,
          },
        ]}
      >
        <Icon size={18} color={row.color} strokeWidth={2} />
      </View>
      <Text style={[styles.rowText, { color: theme.text }]}>{row.text}</Text>
    </Animated.View>
  );
}

function PrimaryButton({ label, loading, onPress, theme }) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: loading, disabled: loading }}
      disabled={loading}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      pressRetentionOffset={16}
    >
      <Animated.View
        style={[
          styles.button,
          { backgroundColor: theme.accent },
          pressed && styles.buttonPressed,
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>{label}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

export default function HealthSyncSheet({
  visible,
  onDismiss,
  onConnect,
  provider,
  title,
  caption,
  providerIcon,
  providerIconSize,
  rows,
  connectLabel,
  footerAction,
  blurTarget,
}) {
  const theme = useTheme();
  const posthog = usePostHog();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(visible);
  const [visibleRows, setVisibleRows] = useState(0);
  const [connecting, setConnecting] = useState(false);
  const dismissedRef = useRef(false);
  const previousVisibleRef = useRef(false);
  const onDismissRef = useRef(onDismiss);
  const visibleRowsRef = useRef(visibleRows);

  const translateY = useSharedValue(screenHeight);
  const dragStartY = useSharedValue(0);
  const sheetHeight = useSharedValue(1);
  const presented = useSharedValue(false);
  const bottomInset = insets.bottom + EDGE_INSET;
  const allRowsShown = visibleRows >= rows.length;

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    visibleRowsRef.current = visibleRows;
  }, [visibleRows]);

  const finishDismiss = useCallback(
    (reason) => {
      if (dismissedRef.current) return;
      dismissedRef.current = true;
      setMounted(false);
      setVisibleRows(0);
      setConnecting(false);
      if (reason !== "connected") {
        posthog?.capture("health_sync_sheet_dismissed", {
          provider,
          reason,
          rows_seen: visibleRowsRef.current,
        });
      }
      onDismissRef.current();
    },
    [posthog, provider],
  );

  const animateDismiss = useCallback(
    (reason = "button") => {
      if (dismissedRef.current) return;
      presented.set(false);
      if (reducedMotion) {
        translateY.set(
          withTiming(
            sheetHeight.get() + bottomInset + 40,
            { duration: 100 },
            (finished) => {
              if (finished) scheduleOnRN(finishDismiss, reason);
            },
          ),
        );
        return;
      }
      translateY.set(
        withSpring(
          sheetHeight.get() + bottomInset + 40,
          DISMISS_SPRING,
          (finished) => {
            if (finished) scheduleOnRN(finishDismiss, reason);
          },
        ),
      );
    },
    [
      bottomInset,
      finishDismiss,
      presented,
      reducedMotion,
      sheetHeight,
      translateY,
    ],
  );

  useEffect(() => {
    const wasVisible = previousVisibleRef.current;
    previousVisibleRef.current = visible;

    if (visible && !wasVisible) {
      dismissedRef.current = false;
      presented.set(false);
      translateY.set(screenHeight);
      if (!mounted) setMounted(true);
      posthog?.capture("health_sync_sheet_opened", { provider });
      return;
    }
    if (!visible && wasVisible && mounted && !dismissedRef.current) {
      animateDismiss("external");
    }
  }, [
    animateDismiss,
    mounted,
    posthog,
    presented,
    provider,
    screenHeight,
    translateY,
    visible,
  ]);

  const handleLayout = (event) => {
    const height = event.nativeEvent.layout.height;
    sheetHeight.set(height);
    if (!presented.get() && visible) {
      presented.set(true);
      if (reducedMotion) {
        translateY.set(withTiming(0, { duration: 120 }));
      } else {
        translateY.set(height + bottomInset);
        translateY.set(withSpring(0, SHEET_SPRING));
      }
    }
  };

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!connecting)
        .activeOffsetY([-8, 8])
        .onStart(() => {
          dragStartY.set(translateY.get());
        })
        .onUpdate((event) => {
          const next = dragStartY.get() + event.translationY;
          translateY.set(
            next >= 0 ? next : rubberBand(next, Math.max(sheetHeight.get(), 1)),
          );
        })
        .onEnd((event) => {
          const height = Math.max(sheetHeight.get(), 1);
          const projected = translateY.get() + project(event.velocityY);
          if (projected > height * 0.4) {
            presented.set(false);
            translateY.set(
              withSpring(
                height + bottomInset + 40,
                { ...DISMISS_SPRING, velocity: event.velocityY },
                (finished) => {
                  if (finished) scheduleOnRN(finishDismiss, "gesture");
                },
              ),
            );
          } else {
            translateY.set(
              withSpring(0, {
                ...SHEET_SPRING,
                velocity: event.velocityY,
              }),
            );
            scheduleOnRN(triggerLightHaptic);
          }
        }),
    [
      bottomInset,
      connecting,
      dragStartY,
      finishDismiss,
      presented,
      sheetHeight,
      translateY,
    ],
  );

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.get() }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateY.get(),
      [0, Math.max(sheetHeight.get(), 1)],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  const handlePrimaryPress = async () => {
    if (!allRowsShown) {
      const nextCount = Math.min(visibleRows + ROWS_PER_PRESS, rows.length);
      setVisibleRows(nextCount);
      triggerLightHaptic();
      posthog?.capture("health_sync_sheet_advanced", {
        provider,
        rows_visible: nextCount,
      });
      return;
    }

    setConnecting(true);
    triggerLightHaptic();
    posthog?.capture("health_integration_authorization_started", { provider });
    try {
      const shouldClose = await onConnect();
      if (shouldClose !== false) animateDismiss("connected");
    } finally {
      setConnecting(false);
    }
  };

  if (!mounted) return null;

  const androidBlurProps =
    Platform.OS === "android" && blurTarget
      ? {
          blurMethod: "dimezisBlurViewSdk31Plus",
          blurTarget,
        }
      : {};

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={() => animateDismiss("system")}
    >
      <View style={StyleSheet.absoluteFill}>
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel="Close health connection sheet"
          onPress={() => animateDismiss("backdrop")}
          style={[StyleSheet.absoluteFill, backdropStyle]}
        >
          <AnimatedBlurView
            {...androidBlurProps}
            pointerEvents="none"
            intensity={MAX_BLUR}
            tint={theme.isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: theme.isDark
                  ? "rgba(0,0,0,0.38)"
                  : "rgba(31,18,21,0.18)",
              },
            ]}
          />
        </AnimatedPressable>

        <GestureDetector gesture={pan}>
          <Animated.View
            style={[styles.sheetPosition, { bottom: bottomInset }, sheetStyle]}
          >
            <Animated.View
              accessibilityViewIsModal
              onLayout={handleLayout}
              layout={CONTENT_LAYOUT}
              style={[
                styles.sheet,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  maxHeight: screenHeight - insets.top - 24,
                },
              ]}
            >
              <View
                style={[
                  styles.grabber,
                  { backgroundColor: theme.isDark ? "#5A5A5A" : "#C6BCB9" },
                ]}
              />

              <IconStack
                providerIcon={providerIcon}
                providerIconSize={providerIconSize}
                revealed={visibleRows > 0}
                theme={theme}
              />

              <Text
                accessibilityRole="header"
                style={[styles.title, { color: theme.text }]}
              >
                {title}
              </Text>
              <Text style={[styles.caption, { color: theme.textSecondary }]}>
                {caption}
              </Text>

              <Animated.View layout={CONTENT_LAYOUT} style={styles.rows}>
                {rows.slice(0, visibleRows).map((row, index) => (
                  <SyncRow
                    key={row.key}
                    row={row}
                    index={index}
                    theme={theme}
                  />
                ))}
              </Animated.View>

              <PrimaryButton
                label={allRowsShown ? connectLabel : "Continue"}
                loading={connecting}
                onPress={handlePrimaryPress}
                theme={theme}
              />

              {footerAction ? (
                <Pressable
                  accessibilityRole="link"
                  onPress={footerAction.onPress}
                  hitSlop={10}
                  style={styles.footerAction}
                >
                  <Text
                    style={[styles.footerText, { color: theme.textSecondary }]}
                  >
                    {footerAction.label}
                  </Text>
                </Pressable>
              ) : null}
            </Animated.View>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetPosition: {
    position: "absolute",
    left: EDGE_INSET,
    right: EDGE_INSET,
    shadowColor: "#000000",
    shadowOpacity: 0.22,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 12 },
    elevation: 24,
  },
  sheet: {
    borderRadius: SHEET_RADIUS,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    overflow: "hidden",
  },
  grabber: {
    alignSelf: "center",
    width: 38,
    height: 5,
    borderRadius: 2.5,
    marginBottom: 16,
  },
  iconStage: {
    width: 132,
    height: 72,
    justifyContent: "center",
  },
  iconSlot: {
    position: "absolute",
    left: 2,
  },
  hemoTile: {
    width: 64,
    height: 64,
    borderRadius: 16,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  hemoMark: {
    width: 48,
    height: 48,
  },
  providerTile: {
    width: 64,
    height: 64,
    borderRadius: 16,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 23,
    lineHeight: 29,
    marginTop: 8,
  },
  caption: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 21,
    marginTop: 7,
    marginBottom: 16,
  },
  rows: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 19,
  },
  button: {
    minHeight: 52,
    borderRadius: 16,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
    transform: [{ scale: 1 }],
    transitionProperty: "transform",
    transitionDuration: "120ms",
    transitionTimingFunction: "ease-out",
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
  },
  buttonText: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: "#FFFFFF",
  },
  footerAction: {
    alignSelf: "center",
    paddingTop: 13,
    paddingHorizontal: 10,
  },
  footerText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
});
