import { TextInput, TouchableOpacity, View, Text, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useAnimatedProps,
  useAnimatedReaction,
  useDerivedValue,
  interpolate,
  withTiming,
  runOnJS,
  FadeInUp,
  ReduceMotion,
} from "react-native-reanimated";
import { ArrowUp } from "lucide-react-native";
import { fonts } from "@/utils/fonts";
import { useTheme } from "@/hooks/useTheme";
import { easeInOutStrong } from "@/utils/motion";

// Floating reading-progress pill for the education article screen. Three
// crossfading states driven entirely by the scroll `progress` shared value
// (0..1) the caller owns and updates: collapsed "N min" before any scroll,
// an expanding "NN% + bar" while mid-article, and a collapsed up-arrow once
// the reader hits the bottom (tap to scroll back to top).
// Adapted from Enzo Mangano's "scroll-progress" demo
// (github.com/enzomanuelmangano/demos, src/animations/scroll-progress),
// swapping its ReText/PressableOpacity/AntDesign deps for the standard
// Reanimated useAnimatedProps + TextInput pattern, TouchableOpacity, and
// lucide-react-native's ArrowUp.

const COLLAPSED_WIDTH = 64;
const EXPANDED_WIDTH = 190;

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export function ScrollProgressPill({ progress, readingTime, onReset, bottomOffset }) {
  const t = useTheme();

  const isExpanded = useDerivedValue(
    () => progress.get() > 0 && progress.get() < 1,
  );

  const pillStyle = useAnimatedStyle(() => ({
    width: withTiming(isExpanded.get() ? EXPANDED_WIDTH : COLLAPSED_WIDTH, {
      duration: 300,
      easing: easeInOutStrong,
      reduceMotion: ReduceMotion.System,
    }),
  }));

  const initialStyle = useAnimatedStyle(() => ({
    opacity: withTiming(progress.get() === 0 ? 1 : 0, { duration: 200 }),
  }));

  const expandedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isExpanded.get() ? 1 : 0, { duration: 200 }),
  }));

  const endStyle = useAnimatedStyle(() => ({
    opacity: withTiming(progress.get() === 1 ? 1 : 0, { duration: 200 }),
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progress.get(), [0, 1], [0, 100])}%`,
  }));

  const percentAnimatedProps = useAnimatedProps(() => ({
    text: `${Math.round(progress.get() * 100)}%`,
  }));

  const endHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // One light tap the moment the reader first hits the bottom — rising edge
  // only, so scrolling back up and down again re-arms it but the reset
  // snap (1 → 0) never fires it.
  useAnimatedReaction(
    () => progress.get() >= 1,
    (atEnd, wasAtEnd) => {
      if (atEnd && wasAtEnd === false) {
        runOnJS(endHaptic)();
      }
    },
  );

  const handlePress = () => {
    if (progress.get() === 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onReset?.();
    }
  };

  return (
    <Animated.View
      entering={FadeInUp.duration(220).reduceMotion(ReduceMotion.System)}
      style={[
        {
          position: "absolute",
          bottom: bottomOffset,
          alignSelf: "center",
          zIndex: 100,
          height: 52,
          borderRadius: 26,
          borderCurve: "continuous",
          overflow: "hidden",
          backgroundColor: t.surfaceElevated,
          borderWidth: 1,
          borderColor: t.border,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
          elevation: 6,
        },
        pillStyle,
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.75}
        style={{ flex: 1 }}
      >
        {/* INITIAL — reading time */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.center, initialStyle]}>
          <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: t.textSecondary }}>
            {readingTime} min
          </Text>
        </Animated.View>

        {/* EXPANDED — live percentage + progress bar */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 14,
              gap: 8,
            },
            expandedStyle,
          ]}
        >
          <AnimatedTextInput
            editable={false}
            defaultValue="0%"
            underlineColorAndroid="transparent"
            animatedProps={percentAnimatedProps}
            style={{
              fontFamily: fonts.medium,
              fontSize: 13,
              color: t.textSecondary,
              width: 44,
              textAlign: "center",
              padding: 0,
            }}
          />
          <View
            style={{
              flex: 1,
              height: 5,
              borderRadius: 3,
              backgroundColor: t.divider,
              overflow: "hidden",
            }}
          >
            <Animated.View
              style={[
                { position: "absolute", top: 0, bottom: 0, left: 0, backgroundColor: "#A9334D" },
                fillStyle,
              ]}
            />
          </View>
        </Animated.View>

        {/* END — tap to scroll back to top */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.center, endStyle]}>
          <ArrowUp size={20} color={t.textSecondary} />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
});
