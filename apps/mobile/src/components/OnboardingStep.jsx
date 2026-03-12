import { MotiView } from 'moti';
import { useEffect, useRef } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

const TOTAL_STEPS = 8;

/**
 * Shared chrome for all onboarding steps.
 *
 * Props:
 *   step        — current step number (1–8)
 *   title       — step heading
 *   subtitle    — step subheading (optional)
 *   skippable   — whether to show "Skip for now" button
 *   onSkip      — called when user taps skip
 *   onBack      — called when user taps back (if omitted, back button is hidden)
 *   ctaLabel    — CTA button label (default "Continue")
 *   onCta       — called when CTA is pressed
 *   ctaDisabled — disables the CTA button
 *   loading     — shows a spinner on the CTA button
 *   children    — step content
 */
export default function OnboardingStep({
  step,
  title,
  subtitle,
  skippable = false,
  onSkip,
  onBack,
  ctaLabel = 'Continue',
  onCta,
  ctaDisabled = false,
  loading = false,
  children,
}) {
  const insets = useSafeAreaInsets();
  const progressAnim = useRef(new Animated.Value((step - 1) / TOTAL_STEPS)).current;

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: step / TOTAL_STEPS,
      tension: 80,
      friction: 12,
      useNativeDriver: false,
    }).start();
  }, [step, progressAnim]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      {/* Top chrome */}
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          {onBack && (
            <Pressable
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
              onPress={onBack}
            >
              <ArrowLeft size={20} color="#09332C" strokeWidth={2} />
            </Pressable>
          )}
        </View>

        <Text style={styles.stepCounter}>Step {step} of {TOTAL_STEPS}</Text>

        <View style={styles.topRight}>
          {skippable && onSkip && (
            <Pressable onPress={onSkip} hitSlop={8}>
              <Text style={styles.skipText}>Skip for now</Text>
            </Pressable>
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Heading */}
          <MotiView
            from={{ opacity: 0, translateY: 14 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 80, delay: 60 }}
            style={styles.headingBlock}
          >
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </MotiView>

          {/* Step content */}
          <MotiView
            from={{ opacity: 0, translateY: 18 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 80, delay: 160 }}
          >
            {children}
          </MotiView>

          {/* CTA */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 80, delay: 260 }}
            style={styles.ctaBlock}
          >
            <Pressable
              style={({ pressed }) => [
                styles.ctaBtn,
                ctaDisabled && styles.ctaBtnDisabled,
                pressed && !ctaDisabled && { opacity: 0.85 },
              ]}
              onPress={onCta}
              disabled={ctaDisabled || loading}
            >
              {loading
                ? <ActivityIndicator color="#FFFFFF" size="small" />
                : <Text style={[styles.ctaBtnText, ctaDisabled && styles.ctaBtnTextDisabled]}>
                    {ctaLabel}
                  </Text>
              }
            </Pressable>
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F4F0',
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(9,51,44,0.1)',
    width: '100%',
  },
  progressFill: {
    height: 3,
    backgroundColor: '#F0531C',
    borderRadius: 2,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  topLeft: {
    width: 80,
  },
  topRight: {
    width: 80,
    alignItems: 'flex-end',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(9,51,44,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCounter: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: 'rgba(9,51,44,0.45)',
    letterSpacing: 0.2,
  },
  skipText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: '#A9334D',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    flexGrow: 1,
  },
  headingBlock: {
    marginBottom: 28,
  },
  title: {
    fontFamily: 'Geist_700Bold',
    fontSize: 26,
    color: '#09332C',
    letterSpacing: -0.8,
    lineHeight: 32,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    color: 'rgba(9,51,44,0.55)',
    lineHeight: 22,
  },
  ctaBlock: {
    marginTop: 28,
  },
  ctaBtn: {
    backgroundColor: '#09332C',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaBtnDisabled: {
    backgroundColor: 'rgba(9,51,44,0.25)',
  },
  ctaBtnText: {
    fontFamily: 'Geist_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  ctaBtnTextDisabled: {
    color: 'rgba(255,255,255,0.5)',
  },
});
