import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/utils/auth/store';
import { useCompleteOnboardingMutation } from '@/hooks/queries/useProfileQuery';
import { scheduleCheckInReminders } from '@/utils/checkInNotifications';
import { usePostHog } from 'posthog-react-native';
import { useTheme } from '@/hooks/useTheme';

const HEMO_RED = '#B53652';
const ICON = require('../../../assets/images/icon.png');
const HOLD_DURATION = 3000;

const MESSAGES = [
  'Making space for your health',
  'Your care, all in one place',
  'A little more support, every day',
];

export default function OnboardingComplete() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { resetOnboarding, onboardingData } = useAppStore();
  const { auth } = useAuthStore();
  const completeOnboardingMutation = useCompleteOnboardingMutation();
  const posthog = usePostHog();
  const t = useTheme();
  const styles = getStyles(t);
  const firstName = onboardingData.nickname || auth?.user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  const fill = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(1)).current;
  const messageTimer = useRef(null);
  const hapticTimer = useRef(null);
  const holdStartedAt = useRef(0);
  const navigationTimer = useRef(null);
  const [isHolding, setIsHolding] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  const revealOriginY = height * 0.6;
  const maxRadius = Math.max(
    Math.hypot(width / 2, revealOriginY),
    Math.hypot(width / 2, height - revealOriginY),
  );
  const fillScale = fill.interpolate({
    inputRange: [0, 1],
    outputRange: [0.025, maxRadius / 82],
  });
  const contentOpacity = fill.interpolate({
    inputRange: [0, 0.55, 0.78, 1],
    outputRange: [1, 0.95, 0.2, 0],
  });
  const finalContentOpacity = fill.interpolate({
    inputRange: [0.72, 0.9, 1],
    outputRange: [0, 0.4, 1],
  });
  const finalContentTranslate = fill.interpolate({
    inputRange: [0.72, 1],
    outputRange: [18, 0],
  });
  const iconOpacity = fill.interpolate({
    inputRange: [0, 0.82, 1],
    outputRange: [1, 1, 0],
  });

  useEffect(() => () => {
    if (messageTimer.current) clearInterval(messageTimer.current);
    if (hapticTimer.current) clearInterval(hapticTimer.current);
    if (navigationTimer.current) clearTimeout(navigationTimer.current);
  }, []);

  const finishOnboarding = () => {
    const dataWithTimezone = {
      ...onboardingData,
      timezone: onboardingData.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    completeOnboardingMutation.mutate(dataWithTimezone, {
      onSuccess: () => {
        posthog?.capture('onboarding_completed', {
          has_scd_type: Boolean(dataWithTimezone.scdType),
          has_emergency_contacts: (dataWithTimezone.emergencyContacts?.length ?? 0) > 0,
          notifications_enabled: dataWithTimezone.notificationsEnabled,
          biometrics_enabled: dataWithTimezone.biometricsEnabled,
          skipped_hospital: !dataWithTimezone.preferredHospital,
          skipped_medications: !(dataWithTimezone.medications?.length),
        });
        if (auth?.user?.id) {
          posthog?.identify(auth.user.id, {
            notifications_enabled: dataWithTimezone.notificationsEnabled,
          });
        }
        if (dataWithTimezone.notificationsEnabled) scheduleCheckInReminders(2);
        resetOnboarding();
        router.replace('/(tabs)/home');
      },
    });
  };

  const completeReveal = () => {
    setIsComplete(true);
    setIsHolding(false);
    if (messageTimer.current) clearInterval(messageTimer.current);
    if (hapticTimer.current) clearInterval(hapticTimer.current);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigationTimer.current = setTimeout(finishOnboarding, 1450);
  };

  const beginHold = () => {
    if (isComplete || isHolding) return;
    setIsHolding(true);
    holdStartedAt.current = Date.now();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    messageTimer.current = setInterval(() => {
      setMessageIndex((index) => Math.min(index + 1, MESSAGES.length - 1));
    }, 580);
    hapticTimer.current = setInterval(() => {
      const progress = Math.min((Date.now() - holdStartedAt.current) / HOLD_DURATION, 1);
      const style = progress > 0.72
        ? Haptics.ImpactFeedbackStyle.Heavy
        : progress > 0.38
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light;
      Haptics.impactAsync(style);
    }, 180);
    Animated.parallel([
      Animated.timing(fill, {
        toValue: 1,
        duration: HOLD_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(iconScale, {
        toValue: 0.92,
        duration: HOLD_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) completeReveal();
    });
  };

  const cancelHold = () => {
    if (isComplete || !isHolding) return;
    setIsHolding(false);
    if (messageTimer.current) clearInterval(messageTimer.current);
    if (hapticTimer.current) clearInterval(hapticTimer.current);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.spring(fill, { toValue: 0, damping: 18, stiffness: 180, useNativeDriver: true }),
      Animated.spring(iconScale, { toValue: 1, damping: 18, stiffness: 180, useNativeDriver: true }),
    ]).start();
    setMessageIndex(0);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Animated.View style={[styles.redFill, { transform: [{ scale: fillScale }] }]} />

      <Animated.View style={[styles.introContent, { opacity: contentOpacity }]}>
        <Text style={styles.eyebrow}>YOUR HEALTH, YOUR WAY</Text>
        <Text style={styles.title}>One last thing, {firstName}.</Text>
        <Text style={styles.subtitle}>Hold Hemo to step into a calmer, more supported way to care for yourself.</Text>
        <View style={styles.iconSpace} />
      </Animated.View>

      <Animated.View style={[styles.iconLayer, { opacity: iconOpacity, transform: [{ scale: iconScale }] }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Hold Hemo to finish setup"
          accessibilityHint="Keep holding until the screen fills with Hemo red"
          onPressIn={beginHold}
          onPressOut={cancelHold}
          style={styles.iconButton}
        >
          <Image source={ICON} style={styles.icon} resizeMode="contain" />
        </Pressable>
      </Animated.View>

      {!isComplete && (
        <View pointerEvents="none" style={styles.instructionLayer}>
          <Text style={[styles.instruction, isHolding && styles.instructionOnFill]}>
          {isHolding ? MESSAGES[messageIndex] : 'Press and hold the Hemo icon'}
          </Text>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressBar, { transform: [{ scaleX: fill }] }]} />
          </View>
        </View>
      )}

      <Animated.View
        pointerEvents="none"
        style={[styles.welcomeContent, { opacity: finalContentOpacity, transform: [{ translateY: finalContentTranslate }] }]}
      >
        <Image source={ICON} style={styles.welcomeIcon} resizeMode="contain" />
        <Text style={styles.welcomeTitle}>Welcome to Hemo</Text>
        <Text style={styles.welcomeSubtitle}>Your everyday health companion is ready.</Text>
      </Animated.View>

      <Text style={styles.footer}>A more informed you starts here.</Text>
    </View>
  );
}

const getStyles = (t) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: t.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  redFill: {
    position: 'absolute',
    width: 164,
    height: 164,
    borderRadius: 82,
    backgroundColor: HEMO_RED,
    left: '50%',
    top: '60%',
    marginLeft: -82,
    marginTop: -82,
    zIndex: 2,
  },
  introContent: {
    width: '100%',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    gap: 12,
  },
  eyebrow: {
    fontFamily: 'Geist_700Bold',
    fontSize: 11,
    letterSpacing: 2.2,
    color: HEMO_RED,
  },
  title: {
    fontFamily: 'Geist_800ExtraBold',
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -1.4,
    color: t.text,
    textAlign: 'center',
  },
  subtitle: {
    maxWidth: 320,
    fontFamily: 'Geist_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: t.textSecondary,
    textAlign: 'center',
  },
  iconSpace: {
    height: 220,
  },
  iconLayer: {
    position: 'absolute',
    left: '50%',
    top: '60%',
    marginLeft: -63,
    marginTop: -63,
    zIndex: 4,
  },
  iconButton: {
    width: 126,
    height: 126,
    borderRadius: 63,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 120,
    height: 120,
  },
  instructionLayer: {
    position: 'absolute',
    top: '60%',
    left: 0,
    right: 0,
    marginTop: 92,
    alignItems: 'center',
    gap: 12,
    zIndex: 3,
  },
  instruction: {
    minHeight: 22,
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    color: t.textSecondary,
    textAlign: 'center',
  },
  instructionOnFill: {
    color: '#FFFFFF',
  },
  progressTrack: {
    width: 92,
    height: 4,
    overflow: 'hidden',
    borderRadius: 2,
    backgroundColor: 'rgba(181,54,82,0.13)',
  },
  progressBar: {
    flex: 1,
    backgroundColor: HEMO_RED,
    transformOrigin: 'left',
  },
  welcomeContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    zIndex: 5,
  },
  welcomeIcon: {
    width: 98,
    height: 98,
    tintColor: '#FFFFFF',
  },
  welcomeTitle: {
    fontFamily: 'Geist_800ExtraBold',
    fontSize: 34,
    letterSpacing: -1.2,
    color: '#FFFFFF',
  },
  welcomeSubtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    color: 'rgba(255,255,255,0.78)',
  },
  footer: {
    position: 'absolute',
    bottom: 26,
    fontFamily: 'Geist_400Regular',
    fontSize: 12,
    color: t.textTertiary,
  },
});
