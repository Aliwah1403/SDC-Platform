import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react-native';
import { resetPassword } from '@/utils/auth/supabase';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setError('');
    setLoading(true);
    try {
      await resetPassword(email.trim().toLowerCase());
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
          <View style={styles.header}>
            <Pressable
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
              onPress={() => router.back()}
            >
              <ArrowLeft size={22} color="#F8E9E7" strokeWidth={2} />
            </Pressable>
          </View>

          {!sent ? (
            <>
              <MotiView
                from={{ opacity: 0, translateY: 16 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'spring', damping: 18, stiffness: 80, delay: 80 }}
              >
                <Text style={styles.title}>Reset password</Text>
                <Text style={styles.subtitle}>
                  Enter your email and we'll send you a link to reset your password.
                </Text>
              </MotiView>

              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'spring', damping: 18, stiffness: 80, delay: 180 }}
                style={styles.form}
              >
                <View style={[styles.inputWrapper, focused && styles.inputFocused]}>
                  <Mail size={18} color={focused ? '#F0531C' : 'rgba(248,233,231,0.4)'} strokeWidth={1.8} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    placeholderTextColor="rgba(248,233,231,0.35)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                  />
                </View>

                {!!error && (
                  <Text style={styles.errorText}>{error}</Text>
                )}

                <Pressable
                  style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }, loading && { opacity: 0.7 }]}
                  onPress={handleReset}
                  disabled={loading}
                >
                  {loading
                    ? <ActivityIndicator color="#FFFFFF" size="small" />
                    : <Text style={styles.primaryBtnText}>Send Reset Link</Text>
                  }
                </Pressable>
              </MotiView>
            </>
          ) : (
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 16, stiffness: 80 }}
              style={styles.successContainer}
            >
              <View style={styles.successIcon}>
                <CheckCircle size={40} color="#059669" strokeWidth={1.5} />
              </View>
              <Text style={styles.successTitle}>Check your email</Text>
              <Text style={styles.successText}>
                We've sent a password reset link to{'\n'}
                <Text style={styles.successEmail}>{email}</Text>
              </Text>
              <Text style={styles.successHint}>
                Didn't receive it? Check your spam folder or{' '}
                <Text style={styles.retryLink} onPress={() => setSent(false)}>
                  try again
                </Text>
                .
              </Text>

              <Pressable
                style={({ pressed }) => [styles.primaryBtn, { marginTop: 32 }, pressed && { opacity: 0.85 }]}
                onPress={() => router.replace('/(auth)/signin')}
              >
                <Text style={styles.primaryBtnText}>Back to Sign In</Text>
              </Pressable>
            </MotiView>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
  header: { marginBottom: 32 },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(248,233,231,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    fontFamily: 'Geist_700Bold', fontSize: 32, color: '#F8E9E7',
    letterSpacing: -1.2, marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Geist_400Regular', fontSize: 15,
    color: 'rgba(248,233,231,0.5)', lineHeight: 22,
  },
  form: { marginTop: 36, gap: 14 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(248,233,231,0.07)',
    borderRadius: 14, borderWidth: 1.5,
    borderColor: 'rgba(248,233,231,0.1)',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  inputFocused: { borderColor: '#F0531C', backgroundColor: 'rgba(240,83,28,0.06)' },
  input: {
    flex: 1, fontFamily: 'Geist_400Regular', fontSize: 15,
    color: '#F8E9E7', padding: 0, margin: 0,
  },
  errorText: { fontFamily: 'Geist_400Regular', fontSize: 13, color: '#EF4444', marginTop: -4 },
  primaryBtn: {
    backgroundColor: '#F0531C', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  primaryBtnText: { fontFamily: 'Geist_700Bold', fontSize: 16, color: '#FFFFFF', letterSpacing: 0.2 },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
  successIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(5,150,105,0.12)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontFamily: 'Geist_700Bold', fontSize: 26,
    color: '#F8E9E7', letterSpacing: -0.8, marginBottom: 12,
  },
  successText: {
    fontFamily: 'Geist_400Regular', fontSize: 15,
    color: 'rgba(248,233,231,0.6)', textAlign: 'center', lineHeight: 22,
  },
  successEmail: { color: '#F8E9E7', fontFamily: 'Geist_500Medium' },
  successHint: {
    fontFamily: 'Geist_400Regular', fontSize: 13,
    color: 'rgba(248,233,231,0.4)', textAlign: 'center',
    lineHeight: 20, marginTop: 16,
  },
  retryLink: { color: '#F0531C' },
});
