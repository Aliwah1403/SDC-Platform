import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { ArrowRight } from 'lucide-react-native';
import { useAppStore } from '@/store/appStore';
import { TOTAL_STEPS } from '@/components/OnboardingStep';

const FULL_QUESTION = 'What would you\nlike us to call you?';
const CHAR_DELAY = 42;
const INPUT_APPEAR_DELAY = 550;

export default function Step1() {
  const { setOnboardingField } = useAppStore();
  const insets = useSafeAreaInsets();
  const inputRef = useRef(null);

  const [displayed, setDisplayed] = useState('');
  const [typingDone, setTypingDone] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [nickname, setNickname] = useState('');
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(FULL_QUESTION.slice(0, i));
      if (i >= FULL_QUESTION.length) {
        clearInterval(interval);
        setTypingDone(true);
        setTimeout(() => setShowInput(true), INPUT_APPEAR_DELAY);
      }
    }, CHAR_DELAY);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showInput) setTimeout(() => inputRef.current?.focus(), 300);
  }, [showInput]);

  const canProceed = showInput && nickname.trim().length > 0;

  const handleNext = () => {
    const name = nickname.trim();
    if (name) setOnboardingField('nickname', name);
    router.push('/(onboarding)/meet');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Progress dots */}
      <View style={styles.topBar}>
        <View style={styles.dots}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === 0
                  ? [styles.dotCurrent, { backgroundColor: '#F0531C' }]
                  : styles.dotFuture,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Main content — vertically centered */}
      <View style={styles.content}>
        <Text style={styles.question}>
          {displayed}
          {!typingDone ? <Text style={styles.cursor}>|</Text> : null}
        </Text>

        {showInput && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 75 }}
            style={styles.inputArea}
          >
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={nickname}
              onChangeText={setNickname}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={20}
              returnKeyType="done"
              onSubmitEditing={canProceed ? handleNext : undefined}
            />
            <MotiView
              animate={{ backgroundColor: focused ? '#F0531C' : 'rgba(9,51,44,0.2)' }}
              transition={{ type: 'timing', duration: 200 }}
              style={styles.underline}
            />
          </MotiView>
        )}
      </View>

      {/* Bottom nav */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 14 }]}>
        <View style={styles.navPlaceholder} />
        <Text style={styles.stepCounter}>1 / {TOTAL_STEPS}</Text>
        <View style={styles.navRight}>
          <Pressable
            style={({ pressed }) => [
              styles.nextPill,
              { backgroundColor: canProceed ? '#09332C' : 'rgba(9,51,44,0.2)' },
              pressed && canProceed && { opacity: 0.85 },
            ]}
            onPress={handleNext}
            disabled={!canProceed}
          >
            <Text style={styles.nextPillText}>Next</Text>
            <ArrowRight size={15} color="#FFFFFF" strokeWidth={2.5} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F4F0',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 6,
    minHeight: 44,
  },
  dots: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotCurrent: {
    width: 22,
  },
  dotFuture: {
    width: 6,
    backgroundColor: 'rgba(9,51,44,0.14)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  question: {
    fontFamily: 'Geist_700Bold',
    fontSize: 36,
    color: '#09332C',
    letterSpacing: -1.2,
    lineHeight: 44,
    marginBottom: 36,
  },
  cursor: {
    color: '#F0531C',
    fontFamily: 'Geist_400Regular',
  },
  inputArea: {
    gap: 0,
  },
  input: {
    fontFamily: 'Geist_500Medium',
    fontSize: 28,
    color: '#09332C',
    padding: 0,
    margin: 0,
    letterSpacing: -0.5,
    paddingBottom: 10,
  },
  underline: {
    height: 2,
    borderRadius: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(9,51,44,0.07)',
    backgroundColor: '#F8F4F0',
  },
  navPlaceholder: {
    width: 44,
  },
  stepCounter: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: 'rgba(9,51,44,0.35)',
    letterSpacing: 0.2,
    flex: 1,
    textAlign: 'center',
  },
  navRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  nextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 24,
    minWidth: 100,
    justifyContent: 'center',
  },
  nextPillText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
});
