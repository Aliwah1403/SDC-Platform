import { Pressable } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { pressSpring } from "@/utils/motion";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PressableScale({ style, disabled, onPressIn, onPressOut, children, ...props }) {
  const scale = useSharedValue(1);

  const rStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (e) => {
    scale.value = withSpring(0.97, pressSpring);
    onPressIn?.(e);
  };

  const handlePressOut = (e) => {
    scale.value = withSpring(1, pressSpring);
    onPressOut?.(e);
  };

  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[rStyle, style]}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}
