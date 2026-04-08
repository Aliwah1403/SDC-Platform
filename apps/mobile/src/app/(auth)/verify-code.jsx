import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { ArrowLeft } from 'lucide-react-native';
import { verifyOtp } from '@/utils/auth/supabase';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 55;

export default function VerifyCodeScreen() {
  const insets = useSafeAreaInsets();
  const { email } = useLocalSearchParams();

  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [resending, setResending] = useState(false);

  const hiddenInputRef = useRef(null);
  const timerRef = useRef(null);

  const startTimer = useCallback(() => {
    setSecondsLeft(RESEND_SECONDS);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { clearInterval(timerRef.current); return 0; }
        return s - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startTimer();
    setTimeout(() => hiddenInputRef.current?.focus(), 300);
    return () => clearInterval(timerRef.current);
  }, [startTimer]);

  const handleOtpChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, CODE_LENGTH);
    const next = Array(CODE_LENGTH).fill('');
    for (let i = 0; i < cleaned.length; i++) {
      next[i] = cleaned[i];
    }
    setDigits(next);
    setError('');
  };

  const allFilled = digits.every((d) => d !== '');
  const code = digits.join('');

  const handleVerify = async () => {
    if (!allFilled) return;
    setError('');
    setLoading(true);
    try {
      const { error: verifyError } = await verifyOtp(email, code);
      if (verifyError) {
        setError('Incorrect Code. Please Try Again');
        setDigits(Array(CODE_LENGTH).fill(''));
        setTimeout(() => hiddenInputRef.current?.focus(), 50);
        return;
      }
      router.replace('/(auth)/reset-password');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (secondsLeft > 0 || resending) return;
    setResending(true);
    setError('');
    setDigits(Array(CODE_LENGTH).fill(''));
    try {
      const { resetPassword } = await import('@/utils/auth/supabase');
      await resetPassword(email);
      startTimer();
      setTimeout(() => hiddenInputRef.current?.focus(), 50);
    } catch {
      setError('Failed to resend. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <View style={styles.header}>
            <Pressable
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
              onPress={() => router.back()}
            >
              <ArrowLeft size={22} color="#F8E9E7" strokeWidth={2} />
            </Pressable>
          </View>

          {/* Title */}
          <MotiView
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 80, delay: 80 }}
          >
            <Text style={styles.title}>Enter verification{'\n'}code</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to{'\n'}
              <Text style={styles.emailHighlight}>{email || 'your email'}</Text>
            </Text>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 80, delay: 180 }}
            style={styles.form}
          >
            {/* Error message */}
            {!!error && (
              <MotiView
                from={{ opacity: 0, translateY: -4 }}
                animate={{ opacity: 1, translateY: 0 }}
              >
                <Text style={styles.errorText}>{error}</Text>
              </MotiView>
            )}

            {/* OTP input — hidden TextInput captures full paste/autofill, View boxes show digits */}
            <Pressable onPress={() => hiddenInputRef.current?.focus()} style={styles.codeRow}>
              <TextInput
                ref={hiddenInputRef}
                value={code}
                onChangeText={handleOtpChange}
                keyboardType="number-pad"
                maxLength={CODE_LENGTH}
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                caretHidden
                style={styles.hiddenInput}
              />
              {digits.map((digit, i) => (
                <View
                  key={i}
                  style={[
                    styles.codeBox,
                    digit && styles.codeBoxFilled,
                    !!error && styles.codeBoxError,
                  ]}
                  pointerEvents="none"
                >
                  <Text style={styles.codeBoxText}>{digit}</Text>
                </View>
              ))}
            </Pressable>

            {/* Resend row */}
            <View style={styles.resendRow}>
              {resending ? (
                <ActivityIndicator size="small" color="#F0531C" />
              ) : secondsLeft > 0 ? (
                <Text style={styles.resendText}>
                  Didn't get a code?{' '}
                  <Text style={styles.resendTimer}>
                    Resend it in {secondsLeft}s
                  </Text>
                </Text>
              ) : (
                <Pressable onPress={handleResend} hitSlop={8}>
                  <Text style={styles.resendText}>
                    Didn't get a code?{' '}
                    <Text style={styles.resendLink}>Resend it Now</Text>
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Verify CTA */}
            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                !allFilled && styles.primaryBtnDisabled,
                pressed && allFilled && { opacity: 0.85 },
                loading && { opacity: 0.7 },
              ]}
              onPress={handleVerify}
              disabled={!allFilled || loading}
            >
              {loading
                ? <ActivityIndicator color="#FFFFFF" size="small" />
                : <Text style={styles.primaryBtnText}>Verify</Text>
              }
            </Pressable>

            {/* Change email */}
            <Pressable
              style={({ pressed }) => [styles.changeEmailBtn, pressed && { opacity: 0.6 }]}
              onPress={() => router.back()}
            >
              <Text style={styles.changeEmailText}>Change Email address</Text>
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
    backgroundColor: '#0D0D0D',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    flexGrow: 1,
  },
  header: {
    marginBottom: 32,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(248,233,231,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Geist_700Bold',
    fontSize: 32,
    color: '#F8E9E7',
    letterSpacing: -1.2,
    marginBottom: 10,
    lineHeight: 40,
  },
  subtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    color: 'rgba(248,233,231,0.5)',
    lineHeight: 22,
  },
  emailHighlight: {
    fontFamily: 'Geist_500Medium',
    color: 'rgba(248,233,231,0.75)',
  },
  form: {
    marginTop: 40,
    gap: 20,
  },
  errorText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: -6,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  codeRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  codeBox: {
    width: 50,
    height: 62,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(248,233,231,0.15)',
    backgroundColor: 'rgba(248,233,231,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBoxFilled: {
    borderColor: '#F0531C',
    backgroundColor: 'rgba(240,83,28,0.08)',
  },
  codeBoxError: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239,68,68,0.07)',
  },
  codeBoxText: {
    fontFamily: 'Geist_700Bold',
    fontSize: 28,
    color: '#F8E9E7',
    textAlign: 'center',
  },
  resendRow: {
    alignItems: 'center',
    marginTop: -4,
  },
  resendText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: 'rgba(248,233,231,0.45)',
    textAlign: 'center',
  },
  resendTimer: {
    fontFamily: 'Geist_500Medium',
    color: 'rgba(248,233,231,0.45)',
  },
  resendLink: {
    fontFamily: 'Geist_600SemiBold',
    color: '#F0531C',
  },
  primaryBtn: {
    backgroundColor: '#F0531C',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnDisabled: {
    backgroundColor: 'rgba(248,233,231,0.12)',
  },
  primaryBtnText: {
    fontFamily: 'Geist_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  changeEmailBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  changeEmailText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    color: 'rgba(248,233,231,0.45)',
    textDecorationLine: 'underline',
  },
});
