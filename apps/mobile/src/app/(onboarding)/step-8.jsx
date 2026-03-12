import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { MotiView } from 'moti';
import { CheckCircle, Activity } from 'lucide-react-native';
import OnboardingStep from '@/components/OnboardingStep';
import { useAppStore } from '@/store/appStore';

const HEALTH_PLATFORMS = [
  {
    key: 'apple',
    name: 'Apple Health',
    description: 'Sync steps, heart rate, and sleep data automatically.',
    color: '#09332C',
    available: Platform.OS === 'ios',
  },
  {
    key: 'google',
    name: 'Google Health',
    description: 'Connect with Google Fit or Health Connect on Android.',
    color: '#4285F4',
    available: Platform.OS === 'android',
  },
  {
    key: 'samsung',
    name: 'Samsung Health',
    description: 'Import data from your Samsung wearable and Galaxy phone.',
    color: '#1428A0',
    available: Platform.OS === 'android',
  },
];

function HealthLogo({ platform }) {
  // Visual placeholder logos using styled text
  const logos = {
    apple: { symbol: '⌚', bg: '#09332C' },
    google: { symbol: 'G', bg: '#EA4335' },
    samsung: { symbol: 'S', bg: '#1428A0' },
  };
  const logo = logos[platform];
  return (
    <View style={[styles.logoBox, { backgroundColor: logo.bg }]}>
      <Text style={styles.logoSymbol}>{logo.symbol}</Text>
    </View>
  );
}

export default function Step8() {
  const { setOnboardingField } = useAppStore();
  const [connected, setConnected] = useState([]);
  const [connecting, setConnecting] = useState(null);

  const availablePlatforms = HEALTH_PLATFORMS.filter((p) => p.available);
  // Show all platforms on simulators (where neither iOS nor Android might show correctly)
  const displayPlatforms = availablePlatforms.length > 0 ? availablePlatforms : HEALTH_PLATFORMS;

  const handleConnect = async (key) => {
    if (connected.includes(key)) {
      setConnected((prev) => prev.filter((k) => k !== key));
      return;
    }
    setConnecting(key);
    // TODO: Request actual platform permissions
    // For now, stub a brief delay for UX realism
    await new Promise((r) => setTimeout(r, 800));
    setConnected((prev) => [...prev, key]);
    setConnecting(null);
  };

  const handleSkip = () => router.push('/(onboarding)/complete');

  const handleContinue = () => {
    setOnboardingField('healthDataConnected', connected);
    router.push('/(onboarding)/complete');
  };

  return (
    <OnboardingStep
      step={8}
      title="Health data"
      subtitle="Connect your health platform to automatically track steps, heart rate, and sleep — no manual entry needed."
      onBack={() => router.back()}
      skippable
      onSkip={handleSkip}
      onCta={handleContinue}
      ctaLabel={connected.length > 0 ? 'Connect & Continue' : 'Skip'}
    >
      <View style={styles.platforms}>
        {displayPlatforms.map((platform, i) => {
          const isConnected = connected.includes(platform.key);
          const isConnecting = connecting === platform.key;
          return (
            <MotiView
              key={platform.key}
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 16, stiffness: 80, delay: i * 80 }}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.platformCard,
                  isConnected && styles.platformCardConnected,
                  pressed && { opacity: 0.85 },
                ]}
                onPress={() => handleConnect(platform.key)}
                disabled={isConnecting}
              >
                <HealthLogo platform={platform.key} />

                <View style={styles.platformInfo}>
                  <Text style={styles.platformName}>{platform.name}</Text>
                  <Text style={styles.platformDesc} numberOfLines={2}>
                    {platform.description}
                  </Text>
                </View>

                <View style={styles.platformAction}>
                  {isConnecting ? (
                    <MotiView
                      from={{ rotate: '0deg' }}
                      animate={{ rotate: '360deg' }}
                      transition={{ type: 'timing', duration: 800, loop: true }}
                    >
                      <Activity size={20} color="#09332C" strokeWidth={2} />
                    </MotiView>
                  ) : isConnected ? (
                    <MotiView
                      from={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', damping: 12, stiffness: 100 }}
                    >
                      <CheckCircle size={22} color="#059669" strokeWidth={2} />
                    </MotiView>
                  ) : (
                    <View style={styles.connectBtn}>
                      <Text style={styles.connectBtnText}>Connect</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            </MotiView>
          );
        })}
      </View>

      {connected.length > 0 && (
        <MotiView
          from={{ opacity: 0, translateY: 4 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={styles.connectedBanner}
        >
          <CheckCircle size={16} color="#059669" strokeWidth={2} />
          <Text style={styles.connectedText}>
            {connected.length} platform{connected.length > 1 ? 's' : ''} connected — your stats will sync automatically.
          </Text>
        </MotiView>
      )}

      <Text style={styles.footnote}>
        You can connect or disconnect health platforms at any time from your Profile.
      </Text>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  platforms: {
    gap: 10,
    marginBottom: 12,
  },
  platformCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(9,51,44,0.08)',
    gap: 12,
  },
  platformCardConnected: {
    borderColor: 'rgba(5,150,105,0.3)',
    backgroundColor: 'rgba(5,150,105,0.04)',
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSymbol: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: 'Geist_700Bold',
  },
  platformInfo: {
    flex: 1,
    gap: 2,
  },
  platformName: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: '#09332C',
  },
  platformDesc: {
    fontFamily: 'Geist_400Regular',
    fontSize: 12,
    color: 'rgba(9,51,44,0.5)',
    lineHeight: 16,
  },
  platformAction: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
  },
  connectBtn: {
    backgroundColor: '#09332C',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  connectBtnText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  connectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(5,150,105,0.08)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  connectedText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: '#065F46',
    flex: 1,
    lineHeight: 18,
  },
  footnote: {
    fontFamily: 'Geist_400Regular',
    fontSize: 12,
    color: 'rgba(9,51,44,0.4)',
    textAlign: 'center',
    lineHeight: 17,
  },
});
