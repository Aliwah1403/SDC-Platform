import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { CheckCircle, Flame, Heart, Activity } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/utils/auth/store';

const STATS = [
  { icon: Flame, label: 'Streak', value: '1 day', color: '#F0531C' },
  { icon: Heart, label: 'Health score', value: 'Ready', color: '#A9334D' },
  { icon: Activity, label: 'Tracking', value: 'Active', color: '#059669' },
];

export default function OnboardingComplete() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding, onboardingData } = useAppStore();
  const { auth } = useAuthStore();

  const firstName = auth?.user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleGetStarted = () => {
    completeOnboarding();
    router.replace('/(tabs)/home');
  };

  return (
    <LinearGradient
      colors={['#F8E9E7', '#F0E0DA', '#F8E9E7']}
      style={StyleSheet.absoluteFill}
    >
      {/* Decorative top gradient */}
      <LinearGradient
        colors={['rgba(169,51,77,0.15)', 'transparent']}
        style={styles.topGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}>
        {/* Celebration graphic */}
        <View style={styles.graphicArea}>
          {/* Orbiting dots */}
          {[0, 60, 120, 180, 240, 300].map((deg, i) => (
            <MotiView
              key={deg}
              from={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 80, delay: 200 + i * 80 }}
              style={[
                styles.orbitDot,
                {
                  transform: [
                    { rotate: `${deg}deg` },
                    { translateX: 72 },
                    { rotate: `-${deg}deg` },
                  ],
                },
              ]}
            />
          ))}

          {/* Central check */}
          <MotiView
            from={{ scale: 0, opacity: 0, rotate: '-30deg' }}
            animate={{ scale: 1, opacity: 1, rotate: '0deg' }}
            transition={{ type: 'spring', damping: 12, stiffness: 80, delay: 100 }}
            style={styles.checkCircle}
          >
            <CheckCircle size={52} color="#09332C" strokeWidth={1.5} />
          </MotiView>
        </View>

        {/* Heading */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 16, stiffness: 80, delay: 600 }}
          style={styles.headingBlock}
        >
          <Text style={styles.title}>You're all set, {firstName}!</Text>
          <Text style={styles.subtitle}>
            Your profile is ready. Hemo will now personalise your daily experience, track your health, and be by your side every step of the way.
          </Text>
        </MotiView>

        {/* Stats preview */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 16, stiffness: 80, delay: 800 }}
          style={styles.statsRow}
        >
          {STATS.map(({ icon: Icon, label, value, color }, i) => (
            <View key={label} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${color}18` }]}>
                <Icon size={20} color={color} strokeWidth={1.8} />
              </View>
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </MotiView>

        {/* Summary of what was set up */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 400, delay: 1000 }}
          style={styles.summaryCard}
        >
          {onboardingData.scdType && (
            <SummaryRow text={`SCD type: ${onboardingData.scdType}`} />
          )}
          {onboardingData.checkInTime && (
            <SummaryRow text={`Daily reminder: ${onboardingData.checkInTime}`} />
          )}
          {onboardingData.emergencyContacts?.length > 0 && (
            <SummaryRow text={`${onboardingData.emergencyContacts.length} emergency contact${onboardingData.emergencyContacts.length > 1 ? 's' : ''} saved`} />
          )}
          {onboardingData.medications?.length > 0 && (
            <SummaryRow text={`${onboardingData.medications.length} medication${onboardingData.medications.length > 1 ? 's' : ''} added`} />
          )}
        </MotiView>

        {/* CTA */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 16, stiffness: 80, delay: 1100 }}
        >
          <Pressable
            style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.85 }]}
            onPress={handleGetStarted}
          >
            <Text style={styles.ctaBtnText}>Get Started</Text>
          </Pressable>
        </MotiView>
      </View>
    </LinearGradient>
  );
}

function SummaryRow({ text }) {
  return (
    <View style={styles.summaryRow}>
      <View style={styles.summaryDot} />
      <Text style={styles.summaryText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
  },
  graphicArea: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 160,
    marginTop: 20,
  },
  orbitDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#A9334D',
    opacity: 0.5,
  },
  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(9,51,44,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(9,51,44,0.12)',
  },
  headingBlock: {
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontFamily: 'Geist_800ExtraBold',
    fontSize: 30,
    color: '#09332C',
    letterSpacing: -1,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    color: 'rgba(9,51,44,0.6)',
    textAlign: 'center',
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(9,51,44,0.08)',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontFamily: 'Geist_700Bold',
    fontSize: 14,
    color: '#09332C',
    textAlign: 'center',
  },
  statLabel: {
    fontFamily: 'Geist_400Regular',
    fontSize: 11,
    color: 'rgba(9,51,44,0.5)',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(9,51,44,0.08)',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F0531C',
  },
  summaryText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: 'rgba(9,51,44,0.7)',
  },
  ctaBtn: {
    backgroundColor: '#09332C',
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
  },
  ctaBtnText: {
    fontFamily: 'Geist_700Bold',
    fontSize: 17,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
