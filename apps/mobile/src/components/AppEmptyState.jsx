import { View, Text } from "react-native";
import { MotiView } from "moti";
import { fonts } from "@/utils/fonts";
import { useTheme } from "@/hooks/useTheme";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { enterTiming, celebrationSpring, STAGGER_MS } from "@/utils/motion";

export default function AppEmptyState({
  Icon,
  title,
  subtitle,
  children,
  style,
  animate = true,
}) {
  const t = useTheme();
  const reducedMotion = useReducedMotion();

  // Pass `animate={false}` where the empty state mounts and unmounts on
  // high-frequency input — e.g. a search ListEmptyComponent that flips to a
  // spinner on every keystroke. An entrance there reads as input lag, not
  // delight. See care/facilities.jsx search results.
  const instant = { type: "timing", duration: 0 };
  const motion = !animate
    ? {
        iconFrom: { opacity: 1, scale: 1 },
        textFrom: { opacity: 1, translateY: 0 },
        iconTransition: instant,
        titleTransition: instant,
        subtitleTransition: instant,
      }
    : reducedMotion
      ? {
          iconFrom: { opacity: 0 },
          textFrom: { opacity: 0 },
          iconTransition: enterTiming,
          titleTransition: enterTiming,
          subtitleTransition: enterTiming,
        }
      : {
          iconFrom: { opacity: 0, scale: 0.8 },
          textFrom: { opacity: 0, translateY: 6 },
          iconTransition: celebrationSpring,
          titleTransition: { ...enterTiming, delay: STAGGER_MS },
          subtitleTransition: { ...enterTiming, delay: STAGGER_MS * 2 },
        };

  return (
    <View
      style={[
        {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 40,
          paddingVertical: 60,
        },
        style,
      ]}
    >
      {Icon ? (
        <MotiView
          from={motion.iconFrom}
          animate={{ opacity: 1, scale: 1 }}
          transition={motion.iconTransition}
          style={{ marginBottom: 20 }}
        >
          <Icon size={56} color={t.textSecondary} strokeWidth={1.5} />
        </MotiView>
      ) : null}
      <MotiView
        from={motion.textFrom}
        animate={{ opacity: 1, translateY: 0 }}
        transition={motion.titleTransition}
      >
        <Text
          style={{
            fontFamily: fonts.bold,
            fontSize: 18,
            color: t.text,
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          {title}
        </Text>
      </MotiView>
      {subtitle ? (
        <MotiView
          from={motion.textFrom}
          animate={{ opacity: 1, translateY: 0 }}
          transition={motion.subtitleTransition}
        >
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 14,
              color: t.textSecondary,
              textAlign: "center",
              lineHeight: 21,
            }}
          >
            {subtitle}
          </Text>
        </MotiView>
      ) : null}
      {children}
    </View>
  );
}
