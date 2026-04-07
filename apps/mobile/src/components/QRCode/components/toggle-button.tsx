import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ScanLine, QrCode } from 'lucide-react-native';
import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface ToggleButtonProps {
  progress: SharedValue<number>;
  onPress: () => void;
}

export const ToggleButton = ({ progress, onPress }: ToggleButtonProps) => {
  const scanIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.25], [1, 0], Extrapolation.CLAMP),
  }));

  const qrIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.2, 0.45], [0, 1], Extrapolation.CLAMP),
  }));

  const labelConnectStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.2], [1, 0], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(progress.value, [0, 0.2], [0, 8], Extrapolation.CLAMP) },
    ],
  }));

  const labelShareStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.25, 0.5], [0, 1], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(progress.value, [0.25, 0.5], [8, 0], Extrapolation.CLAMP) },
    ],
  }));

  const buttonPulseStyle = useAnimatedStyle(() => {
    const pulse =
      progress.value > 0.95
        ? withRepeat(
            withSequence(
              withTiming(1.05, { duration: 1000 }),
              withTiming(1, { duration: 1000 }),
            ),
            -1,
            true,
          )
        : withTiming(1, { duration: 300 });
    return { transform: [{ scale: pulse }] };
  });

  return (
    <View style={styles.buttonContainer}>
      <Animated.View style={buttonPulseStyle}>
        <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.8}>
          <Animated.View style={[styles.iconContainer, scanIconStyle]}>
            <ScanLine size={28} color="#09332C" strokeWidth={1.8} />
          </Animated.View>
          <Animated.View style={[styles.iconContainer, qrIconStyle]}>
            <QrCode size={28} color="#09332C" strokeWidth={1.8} />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.labelContainer}>
        <Animated.Text style={[styles.label, labelConnectStyle]}>Connect</Animated.Text>
        <Animated.Text style={[styles.label, styles.labelAbsolute, labelShareStyle]}>Share</Animated.Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: 'rgba(9, 51, 44, 0.08)',
    borderRadius: 32,
    borderWidth: 1,
    shadowColor: '#09332C',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  buttonContainer: {
    alignItems: 'center',
    alignSelf: 'center',
    bottom: 50,
    position: 'absolute',
  },
  iconContainer: {
    position: 'absolute',
  },
  label: {
    color: '#09332C',
    fontFamily: 'Geist_600SemiBold',
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  labelAbsolute: {
    position: 'absolute',
  },
  labelContainer: {
    alignItems: 'center',
    height: 20,
    justifyContent: 'center',
    marginTop: 12,
  },
});
