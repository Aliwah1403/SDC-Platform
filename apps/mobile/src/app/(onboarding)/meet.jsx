import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MotiView } from 'moti';
import { useAppStore } from '@/store/appStore';

const AUTO_ADVANCE_MS = 2800;

export default function Meet() {
  const { onboardingData } = useAppStore();
  const name = onboardingData.nickname || 'there';

  useEffect(() => {
    const t = setTimeout(() => router.replace('/(onboarding)/step-2'), AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.centerContent}>
        {/* "Nice to meet you," slides up */}
        <MotiView
          from={{ opacity: 0, translateY: 24 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 70, delay: 150 }}
        >
          <Text style={styles.intro}>Nice to meet you,</Text>
        </MotiView>

        {/* Name pops in with scale */}
        <MotiView
          from={{ opacity: 0, scale: 0.75 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 100, delay: 700 }}
        >
          <Text style={styles.name}>{name}.</Text>
        </MotiView>

        {/* Orange accent line fades up */}
        <MotiView
          from={{ opacity: 0, translateY: 4 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 1350 }}
          style={styles.accentLine}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F4F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    alignItems: 'flex-start',
    paddingHorizontal: 32,
    width: '100%',
  },
  intro: {
    fontFamily: 'Geist_400Regular',
    fontSize: 22,
    color: 'rgba(9,51,44,0.45)',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  name: {
    fontFamily: 'Geist_700Bold',
    fontSize: 56,
    color: '#09332C',
    letterSpacing: -2.5,
    lineHeight: 64,
    marginBottom: 18,
  },
  accentLine: {
    height: 3,
    width: 52,
    borderRadius: 2,
    backgroundColor: '#A9334D',
  },
});
