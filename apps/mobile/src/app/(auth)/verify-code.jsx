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
import { useTheme } from '@/hooks/useTheme';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 55;

export default function VerifyCodeScreen() {
  const insets = useSafeAreaInsets();
  const { email } = useLocalSearchParams();
  const theme = useTheme();
  const dark = theme.isDark;

  const c = {
    surface: dark ? 'rgba(248,233,231,0.06)' : 'rgba(26,26,26,0.04)',
    surfaceBtn: dark ? 'rgba(248,233,231,0.08)' : 'rgba(26,26,26,0.06)',
    border: dark ? 'rgba(248,233,231,0.15)' : theme.border,
    textFaint: dark ? 'rgba(248,233,231,0.45)' : 'rgba(26,26,26,0.45)',
    textMuted: dark ? 'rgba(248,233,231,0.5)' : 'rgba(26,26,26,0.5)',
    emailHighlight: dark ? 'rgba(248,233,231,0.75)' : 'rgba(26,26,26,0.75)',
    timerText: dark ? 'rgba(248,233,231,0.45)' : 'rgba(26,26,26,0.45)',
  };

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
    for (let i = 0; i < cleaned.length; i++) next[i] = cleaned[i];
    setDigits(next);
    setError('');
  };

  const allFilled = digits.every((d) => d !== '');
  const code = digits.join('');

  const handleVerify = async () => {
    if (!allFilled) return;
    setError(''); setLoading(true);
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
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (secondsLeft > 0 || resending) return;
    setResending(true); setError('');
    setDigits(Array(CODE_LENGTH).fill(''));
    try {
      const { resetPassword } = await import('@/utils/auth/supabase');
      await resetPassword(email);
      startTimer();
      setTimeout(() => hiddenInputRef.current?.focus(), 50);
    } catch {
      setError('Failed to resend. Please try again.');
    } finally { setResending(false); }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
            <Pressable
              style={({ pressed }) => [styles.backBtn, { backgroundColor: c.surfaceBtn }, pressed && { opacity: 0.6 }]}
              onPress={() => router.back()}
            >
              <ArrowLeft size={22} color={theme.text} strokeWidth={2} />
            </Pressable>
          </View>

          <MotiView
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 80, delay: 80 }}
          >
            <Text style={[styles.title, { color: theme.text }]}>Enter verification{'\n'}code</Text>
            <Text style={[styles.subtitle, { color: c.textMuted }]}>
              We sent a 6-digit code to{'\n'}
              <Text style={[styles.emailHighlight, { color: c.emailHighlight }]}>{email || 'your email'}</Text>
            </Text>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 80, delay: 180 }}
            style={styles.form}
          >
            {!!error && (
              <MotiView from={{ opacity: 0, translateY: -4 }} animate={{ opacity: 1, translateY: 0 }}>
                <Text style={styles.errorText}>{error}</Text>
              </MotiView>
            )}

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
                    { backgroundColor: c.surface, borderColor: c.border },
                    digit && { borderColor: '#A9334D', backgroundColor: 'rgba(169,51,77,0.06)' },
                    !!error && { borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.07)' },
                  ]}
                  pointerEvents="none"
                >
                  <Text style={[styles.codeBoxText, { color: theme.text }]}>{digit}</Text>
                </View>
              ))}
            </Pressable>

            <View style={styles.resendRow}>
              {resending ? (
                <ActivityIndicator size="small" color="#A9334D" />
              ) : secondsLeft > 0 ? (
                <Text style={[styles.resendText, { color: c.textFaint }]}>
                  Didn't get a code?{' '}
                  <Text style={[styles.resendTimer, { color: c.timerText }]}>Resend it in {secondsLeft}s</Text>
                </Text>
              ) : (
                <Pressable onPress={handleResend} hitSlop={8}>
                  <Text style={[styles.resendText, { color: c.textFaint }]}>
                    Didn't get a code?{' '}
                    <Text style={styles.resendLink}>Resend it Now</Text>
                  </Text>
                </Pressable>
              )}
            </View>

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

            <Pressable
              style={({ pressed }) => [styles.changeEmailBtn, pressed && { opacity: 0.6 }]}
              onPress={() => router.back()}
            >
              <Text style={[styles.changeEmailText, { color: c.textFaint }]}>Change Email address</Text>
            </Pressable>
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 8, flexGrow: 1 },
  header: { marginBottom: 32 },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'Geist_700Bold', fontSize: 32, letterSpacing: -1.2, marginBottom: 10, lineHeight: 40 },
  subtitle: { fontFamily: 'Geist_400Regular', fontSize: 15, lineHeight: 22 },
  emailHighlight: { fontFamily: 'Geist_500Medium' },
  form: { marginTop: 40, gap: 20 },
  errorText: { fontFamily: 'Geist_400Regular', fontSize: 13, color: '#EF4444', textAlign: 'center', marginBottom: -6 },
  hiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  codeRow: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  codeBox: {
    width: 50, height: 62, borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  codeBoxText: { fontFamily: 'Geist_700Bold', fontSize: 28, textAlign: 'center' },
  resendRow: { alignItems: 'center', marginTop: -4 },
  resendText: { fontFamily: 'Geist_400Regular', fontSize: 13, textAlign: 'center' },
  resendTimer: { fontFamily: 'Geist_500Medium' },
  resendLink: { fontFamily: 'Geist_600SemiBold', color: '#A9334D' },
  primaryBtn: { backgroundColor: '#A9334D', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  primaryBtnDisabled: { backgroundColor: 'rgba(169,51,77,0.25)' },
  primaryBtnText: { fontFamily: 'Geist_700Bold', fontSize: 16, color: '#FFFFFF', letterSpacing: 0.2 },
  changeEmailBtn: { alignItems: 'center', paddingVertical: 4 },
  changeEmailText: { fontFamily: 'Geist_500Medium', fontSize: 14, textDecorationLine: 'underline' },
});
