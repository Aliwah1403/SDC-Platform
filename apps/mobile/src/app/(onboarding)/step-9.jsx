import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { MotiView } from 'moti';
import { Fingerprint, ShieldCheck, AlertCircle } from 'lucide-react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import OnboardingStep from '@/components/OnboardingStep';
import { useAppStore } from '@/store/appStore';

async function authenticateAsync() {
  console.log('[BIOMETRICS STUB] authenticateAsync');
  return { success: true };
}

function FaceIdGraphic() {
  return (
    <Svg width={80} height={80} viewBox="0 0 80 80" fill="none">
      <Circle cx="40" cy="40" r="38" stroke="#09332C" strokeWidth="2" strokeOpacity={0.15} />
      <Circle cx="40" cy="40" r="30" stroke="#09332C" strokeWidth="1.5" strokeOpacity={0.1} />
      <Path d="M24 36 C24 26 56 26 56 36 L56 46 C56 56 24 56 24 46 Z" stroke="#09332C" strokeWidth="2" strokeLinecap="round" fill="none" strokeOpacity={0.7} />
      <Circle cx="33" cy="40" r="2.5" fill="#09332C" fillOpacity={0.7} />
      <Circle cx="47" cy="40" r="2.5" fill="#09332C" fillOpacity={0.7} />
      <Path d="M33 48 Q40 53 47 48" stroke="#09332C" strokeWidth="2" strokeLinecap="round" fill="none" strokeOpacity={0.7} />
      <Path d="M24 28 L24 24 L28 24" stroke="#A9334D" strokeWidth="2" strokeLinecap="round" />
      <Path d="M52 28 L52 24 L56 24" stroke="#A9334D" strokeWidth="2" strokeLinecap="round" />
      <Path d="M24 52 L24 56 L28 56" stroke="#A9334D" strokeWidth="2" strokeLinecap="round" />
      <Path d="M52 52 L52 56 L56 56" stroke="#A9334D" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export default function Step9() {
  const { setOnboardingField } = useAppStore();
  const [status, setStatus] = useState('idle');
  const biometricType = Platform.OS === 'ios' ? 'Face ID' : 'Fingerprint';

  const handleEnable = async () => {
    try {
      const result = await authenticateAsync();
      if (result.success) {
        setStatus('success');
        setOnboardingField('biometricsEnabled', true);
      } else {
        setStatus('failed');
      }
    } catch {
      setStatus('unavailable');
    }
  };

  const handleSkip = () => {
    setOnboardingField('biometricsEnabled', false);
    router.push('/(onboarding)/step-10');
  };

  return (
    <OnboardingStep
      step={9}
      title="Secure your account"
      subtitle={`Use ${biometricType} for quick and secure access to your health data.`}
      illustrationIcon={Fingerprint}
      illustrationColor="#A9334D"
      onBack={() => router.back()}
      skippable
      onSkip={handleSkip}
      onCta={status === 'success' ? () => router.push('/(onboarding)/step-10') : handleEnable}
      ctaLabel={status === 'success' ? 'Continue' : `Enable ${biometricType}`}
    >
      <View style={styles.graphicContainer}>
        <MotiView
          from={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 80, delay: 100 }}
          style={styles.graphicWrapper}
        >
          {status === 'success' && (
            <>
              <MotiView from={{ scale: 1, opacity: 0.4 }} animate={{ scale: 1.5, opacity: 0 }} transition={{ type: 'timing', duration: 1500, loop: true }} style={[StyleSheet.absoluteFill, styles.pulseRing]} />
              <MotiView from={{ scale: 1, opacity: 0.3 }} animate={{ scale: 1.3, opacity: 0 }} transition={{ type: 'timing', duration: 1500, loop: true, delay: 300 }} style={[StyleSheet.absoluteFill, styles.pulseRing]} />
            </>
          )}
          <View style={[styles.graphicCircle, status === 'success' && styles.graphicCircleSuccess]}>
            {status === 'success'
              ? <ShieldCheck size={44} color="#A9334D" strokeWidth={1.5} />
              : <FaceIdGraphic />
            }
          </View>
        </MotiView>

        {status === 'success' && (
          <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'spring', damping: 16, stiffness: 80 }}>
            <Text style={styles.successText}>{biometricType} enabled!</Text>
          </MotiView>
        )}
        {status === 'failed' && (
          <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.warningRow}>
            <AlertCircle size={16} color="#F59E0B" strokeWidth={2} />
            <Text style={styles.warningText}>Authentication failed. Try again or skip for now.</Text>
          </MotiView>
        )}
        {status === 'unavailable' && (
          <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.warningRow}>
            <AlertCircle size={16} color="#F59E0B" strokeWidth={2} />
            <Text style={styles.warningText}>{biometricType} is not available on this device. You can enable it later in Settings.</Text>
          </MotiView>
        )}
      </View>

      {status !== 'success' && (
        <View style={styles.bullets}>
          {[
            'Quick access without typing your password',
            'Your health data stays private and secure',
            'Works even in an emergency when time matters',
          ].map((text) => (
            <View key={text} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{text}</Text>
            </View>
          ))}
        </View>
      )}
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  graphicContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
  },
  graphicWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
  },
  pulseRing: {
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#A9334D',
  },
  graphicCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(9,51,44,0.06)',
    borderWidth: 2,
    borderColor: 'rgba(9,51,44,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  graphicCircleSuccess: {
    backgroundColor: 'rgba(169,51,77,0.08)',
    borderColor: 'rgba(169,51,77,0.25)',
  },
  successText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    color: '#A9334D',
    textAlign: 'center',
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 16,
  },
  warningText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: '#B45309',
    flex: 1,
    lineHeight: 18,
  },
  bullets: {
    gap: 12,
    paddingHorizontal: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#A9334D',
    marginTop: 6,
  },
  bulletText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    color: 'rgba(9,51,44,0.65)',
    flex: 1,
    lineHeight: 20,
  },
});
