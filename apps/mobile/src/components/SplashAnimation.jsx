import { MotiView } from 'moti';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function SplashAnimation() {
  return (
    <LinearGradient
      colors={['#781D11', '#3D0E08', '#0A0A0A']}
      style={StyleSheet.absoluteFill}
      start={{ x: 0.3, y: 0 }}
      end={{ x: 0.7, y: 1 }}
    >
      <View style={styles.container}>
        {/* Pulsing glow ring */}
        <MotiView
          from={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1.4, opacity: 0.2 }}
          transition={{ type: 'timing', duration: 1800, loop: true }}
          style={styles.glowRing}
        />
        <MotiView
          from={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1.1, opacity: 0.12 }}
          transition={{ type: 'timing', duration: 1800, loop: true, delay: 300 }}
          style={[styles.glowRing, styles.glowRingInner]}
        />

        {/* Logo */}
        <MotiView
          from={{ scale: 0.82, opacity: 0, translateY: 10 }}
          animate={{ scale: 1, opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 90, delay: 100 }}
          style={styles.logoWrapper}
        >
          <Text style={styles.logo}>hemo</Text>
          <MotiView
            from={{ opacity: 0, translateY: 6 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 500 }}
          >
            <Text style={styles.tagline}>Your sickle cell companion</Text>
          </MotiView>
        </MotiView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#A9334D',
  },
  glowRingInner: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#F8E9E7',
  },
  logoWrapper: {
    alignItems: 'center',
  },
  logo: {
    fontFamily: 'Geist_800ExtraBold',
    fontSize: 62,
    color: '#F8E9E7',
    letterSpacing: -3,
    textAlign: 'center',
  },
  tagline: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    color: 'rgba(248, 233, 231, 0.55)',
    textAlign: 'center',
    marginTop: 10,
    letterSpacing: 0.3,
  },
});
