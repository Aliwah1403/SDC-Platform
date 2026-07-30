import { View } from "react-native";
import { MotiView, AnimatePresence } from "moti";
import { Text } from "react-native";
import { enterTiming, exitTiming } from "@/utils/motion";

export function AnimatedStreakCount({ value, textStyle }) {
  // Old and new digits are both mounted during the ~220ms crossfade, so they
  // need a fixed-height, absolutely-positioned slot to overlap in place —
  // otherwise they stack in normal flow and the pill briefly doubles in height.
  //
  // Width is NOT hardcoded from a char-count/fontSize guess (that clipped
  // digits, and didn't account for margins in textStyle). Instead an
  // invisible Text with the same style sits in normal flow and sizes the
  // wrapper to the real, measured width of the current value.
  const fontSize = textStyle?.fontSize ?? 14;
  const height = Math.ceil(fontSize * 1.3);

  return (
    <View style={{ height, overflow: "hidden" }}>
      <Text style={[textStyle, { opacity: 0 }]}>{value}</Text>
      <AnimatePresence>
        <MotiView
          key={value}
          from={{ translateY: 8, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          exit={{ translateY: -8, opacity: 0 }}
          transition={enterTiming}
          exitTransition={exitTiming}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          <Text style={textStyle}>{value}</Text>
        </MotiView>
      </AnimatePresence>
    </View>
  );
}
