import { TouchableOpacity } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Check } from "lucide-react-native";
import { transparentize } from "color2k";

const SPRING = LinearTransition.springify().mass(1).damping(30).stiffness(250);
const ENTER = FadeIn.duration(150).easing(
  Easing.bezier(0.895, 0.03, 0.685, 0.22).factory()
);
const EXIT = FadeOut.duration(150).easing(
  Easing.bezier(0.895, 0.03, 0.685, 0.22).factory()
);

const ACTIVE_COLOR = "#A9334D";
const INACTIVE_COLOR = "#C4A8A4";

const fadedActive = transparentize(ACTIVE_COLOR, 0.88);
const fadedInactive = transparentize(INACTIVE_COLOR, 0.88);

export function CheckboxChip({ label, checked, onPress }) {
  const rContainerStyle = useAnimatedStyle(
    () => ({
      paddingRight: checked ? 10 : 20,
      backgroundColor: checked ? fadedActive : "transparent",
      borderColor: checked ? fadedActive : fadedInactive,
    }),
    [checked]
  );

  const rTextStyle = useAnimatedStyle(
    () => ({
      color: checked ? ACTIVE_COLOR : INACTIVE_COLOR,
    }),
    [checked]
  );

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Animated.View layout={SPRING} style={[styles.container, rContainerStyle]}>
        <Animated.Text style={[styles.label, rTextStyle]}>{label}</Animated.Text>
        {checked && (
          <Animated.View
            layout={SPRING}
            entering={ENTER}
            exiting={EXIT}
            style={{ marginLeft: 8 }}
          >
            <Check size={16} color={ACTIVE_COLOR} strokeWidth={2.5} />
          </Animated.View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = {
  container: {
    alignItems: "center",
    borderRadius: 36,
    borderWidth: 1.5,
    flexDirection: "row",
    justifyContent: "center",
    paddingLeft: 20,
    paddingVertical: 10,
  },
  label: {
    fontFamily: "Geist_500Medium",
    fontSize: 14,
  },
};
