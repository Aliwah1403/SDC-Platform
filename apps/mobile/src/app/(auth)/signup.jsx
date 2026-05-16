import { router } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { usePostHog } from 'posthog-react-native';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signUp, signInWithGoogle, signInWithApple } from '@/utils/auth/supabase';
import { useAuthStore } from '@/utils/auth/store';
import { useTheme } from '@/hooks/useTheme';

function GoogleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </Svg>
  );
}

function AppleIcon({ color }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill={color}>
      <Path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </Svg>
  );
}

const STRENGTH_LEVELS = [
  { label: 'Weak', color: '#EF4444' },
  { label: 'Fair', color: '#F59E0B' },
  { label: 'Good', color: '#10B981' },
  { label: 'Strong', color: '#059669' },
];

function getPasswordStrength(password) {
  if (!password) return -1;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score - 1;
}

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const posthog = usePostHog();
  const { setAuth, setIsNewUser } = useAuthStore();
  const theme = useTheme();
  const dark = theme.isDark;

  const c = {
    surface: dark ? 'rgba(248,233,231,0.07)' : 'rgba(26,26,26,0.04)',
    surfaceBtn: dark ? 'rgba(248,233,231,0.08)' : 'rgba(26,26,26,0.06)',
    border: dark ? 'rgba(248,233,231,0.1)' : theme.border,
    borderMid: dark ? 'rgba(248,233,231,0.12)' : theme.border,
    placeholder: dark ? 'rgba(248,233,231,0.35)' : 'rgba(26,26,26,0.32)',
    iconMuted: dark ? 'rgba(248,233,231,0.4)' : 'rgba(26,26,26,0.35)',
    textFaint: dark ? 'rgba(248,233,231,0.45)' : 'rgba(26,26,26,0.45)',
    textMuted: dark ? 'rgba(248,233,231,0.5)' : 'rgba(26,26,26,0.5)',
    divider: dark ? 'rgba(248,233,231,0.1)' : 'rgba(26,26,26,0.1)',
    dividerLabel: dark ? 'rgba(248,233,231,0.3)' : 'rgba(26,26,26,0.3)',
    strengthBg: dark ? 'rgba(248,233,231,0.1)' : 'rgba(26,26,26,0.1)',
  };

  useEffect(() => { posthog?.capture('sign_up_screen_viewed', {}); }, []);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const startedRef = useRef(false);

  const strengthIndex = getPasswordStrength(password);
  const strength = strengthIndex >= 0 ? STRENGTH_LEVELS[strengthIndex] : null;

  const handleGoogleSignUp = async () => {
    setError(''); setLoading(true);
    try {
      const { data, error: authError } = await signInWithGoogle();
      if (authError) { posthog?.capture('sign_up_failed', { method: 'google', error_type: 'auth_error' }); setError(authError.message || 'Google sign-in failed.'); return; }
      if (!data?.session || !data?.user) { posthog?.capture('sign_up_failed', { method: 'google', error_type: 'no_session' }); setError('Google sign-up failed. Please try again.'); return; }
      posthog?.capture('sign_up_succeeded', { method: 'google' });
      AsyncStorage.setItem('lastAuthProvider', 'google').catch((e) => console.error('[signup] AsyncStorage error:', e));
      setAuth(data.session, data.user); setIsNewUser(true);
      router.replace('/(onboarding)/step-1');
    } catch (e) {
      if (e.code !== 'ERR_REQUEST_CANCELED') { posthog?.capture('sign_up_failed', { method: 'google', error_type: 'network' }); setError('Google sign-in failed. Please try again.'); }
    } finally { setLoading(false); }
  };

  const handleAppleSignUp = async () => {
    setError(''); setLoading(true);
    try {
      const { data, error: authError } = await signInWithApple();
      if (authError) { posthog?.capture('sign_up_failed', { method: 'apple', error_type: 'auth_error' }); setError(authError.message || 'Apple sign-in failed.'); return; }
      if (!data?.session || !data?.user) { posthog?.capture('sign_up_failed', { method: 'apple', error_type: 'no_session' }); setError('Apple sign-up failed. Please try again.'); return; }
      posthog?.capture('sign_up_succeeded', { method: 'apple' });
      AsyncStorage.setItem('lastAuthProvider', 'apple').catch((e) => console.error('[signup] AsyncStorage error:', e));
      setAuth(data.session, data.user); setIsNewUser(true);
      router.replace('/(onboarding)/step-1');
    } catch (e) {
      if (e.code !== 'ERR_REQUEST_CANCELED') { posthog?.capture('sign_up_failed', { method: 'apple', error_type: 'network' }); setError('Apple sign-in failed. Please try again.'); }
    } finally { setLoading(false); }
  };

  const handleSignUp = async () => {
    if (!fullName.trim()) { setError('Please enter your full name.'); return; }
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setError(''); setLoading(true);
    try {
      const { data, error: authError } = await signUp(email.trim().toLowerCase(), password, fullName.trim());
      if (authError) { posthog?.capture('sign_up_failed', { method: 'email', error_type: 'auth_error' }); setError(authError.message || 'Sign up failed. Please try again.'); return; }
      if (!data?.session) { posthog?.capture('sign_up_email_verification_required', {}); setError('Account created! Please check your email to confirm before signing in.'); return; }
      if (!data?.user) { posthog?.capture('sign_up_failed', { method: 'email', error_type: 'no_session' }); setError('Sign up failed. Please try again.'); return; }
      posthog?.capture('sign_up_succeeded', { method: 'email' });
      AsyncStorage.setItem('lastAuthProvider', 'email').catch((e) => console.error('[signup] AsyncStorage error:', e));
      setAuth(data.session, data.user); setIsNewUser(true);
      router.replace('/(onboarding)/step-1');
    } catch {
      posthog?.capture('sign_up_failed', { method: 'email', error_type: 'network' });
      setError('Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  const inputStyle = (field) => [
    styles.inputWrapper,
    { backgroundColor: c.surface, borderColor: focusedField === field ? '#A9334D' : c.border },
    focusedField === field && { backgroundColor: 'rgba(169,51,77,0.06)' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAwareScrollView
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
          <Text style={[styles.title, { color: theme.text }]}>Create your account</Text>
          <Text style={[styles.subtitle, { color: c.textMuted }]}>Join thousands managing sickle cell with confidence</Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 80, delay: 180 }}
          style={styles.form}
        >
          <View style={inputStyle('name')}>
            <User size={18} color={focusedField === 'name' ? '#A9334D' : c.iconMuted} strokeWidth={1.8} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Full name"
              placeholderTextColor={c.placeholder}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              onFocus={() => { setFocusedField('name'); if (!startedRef.current) { startedRef.current = true; posthog?.capture('sign_up_started', { method: 'email' }); } }}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          <View style={inputStyle('email')}>
            <Mail size={18} color={focusedField === 'email' ? '#A9334D' : c.iconMuted} strokeWidth={1.8} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Email address"
              placeholderTextColor={c.placeholder}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          <View>
            <View style={inputStyle('password')}>
              <Lock size={18} color={focusedField === 'password' ? '#A9334D' : c.iconMuted} strokeWidth={1.8} />
              <TextInput
                style={[styles.input, { flex: 1, color: theme.text }]}
                placeholder="Password (min. 8 characters)"
                placeholderTextColor={c.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                {showPassword
                  ? <EyeOff size={18} color={c.iconMuted} strokeWidth={1.8} />
                  : <Eye size={18} color={c.iconMuted} strokeWidth={1.8} />
                }
              </Pressable>
            </View>
            {password.length > 0 && (
              <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.strengthContainer}>
                <View style={styles.strengthBars}>
                  {STRENGTH_LEVELS.map((level, i) => (
                    <View
                      key={level.label}
                      style={[styles.strengthBar, { backgroundColor: i <= strengthIndex ? strength?.color : c.strengthBg }]}
                    />
                  ))}
                </View>
                {strength && <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>}
              </MotiView>
            )}
          </View>

          <View style={inputStyle('confirm')}>
            <Lock size={18} color={focusedField === 'confirm' ? '#A9334D' : c.iconMuted} strokeWidth={1.8} />
            <TextInput
              style={[styles.input, { flex: 1, color: theme.text }]}
              placeholder="Confirm password"
              placeholderTextColor={c.placeholder}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
              onFocus={() => setFocusedField('confirm')}
              onBlur={() => setFocusedField(null)}
            />
            <Pressable onPress={() => setShowConfirm(!showConfirm)} hitSlop={8}>
              {showConfirm
                ? <EyeOff size={18} color={c.iconMuted} strokeWidth={1.8} />
                : <Eye size={18} color={c.iconMuted} strokeWidth={1.8} />
              }
            </Pressable>
          </View>

          {!!error && (
            <MotiView from={{ opacity: 0, translateY: -4 }} animate={{ opacity: 1, translateY: 0 }}>
              <Text style={styles.errorText}>{error}</Text>
            </MotiView>
          )}

          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }, loading && { opacity: 0.7 }]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#FFFFFF" size="small" />
              : <Text style={styles.primaryBtnText}>Create Account</Text>
            }
          </Pressable>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: c.divider }]} />
            <Text style={[styles.dividerText, { color: c.dividerLabel }]}>or continue with</Text>
            <View style={[styles.dividerLine, { backgroundColor: c.divider }]} />
          </View>

          <View style={styles.socialRow}>
            <Pressable
              style={({ pressed }) => [styles.socialBtn, { backgroundColor: c.surface, borderColor: c.borderMid }, pressed && { opacity: 0.7 }, loading && { opacity: 0.5 }]}
              onPress={handleGoogleSignUp}
              disabled={loading}
            >
              <GoogleIcon />
              <Text style={[styles.socialBtnText, { color: theme.text }]}>Google</Text>
            </Pressable>
            {Platform.OS === 'ios' && (
              <Pressable
                style={({ pressed }) => [styles.socialBtn, { backgroundColor: c.surface, borderColor: c.borderMid }, pressed && { opacity: 0.7 }, loading && { opacity: 0.5 }]}
                onPress={handleAppleSignUp}
                disabled={loading}
              >
                <AppleIcon color={theme.text} />
                <Text style={[styles.socialBtnText, { color: theme.text }]}>Apple</Text>
              </Pressable>
            )}
          </View>

          <Pressable
            style={({ pressed }) => [styles.switchBtn, pressed && { opacity: 0.6 }]}
            onPress={() => router.replace('/(auth)/signin')}
          >
            <Text style={[styles.switchText, { color: c.textFaint }]}>
              Already have an account? <Text style={styles.switchLink}>Sign in</Text>
            </Text>
          </Pressable>
        </MotiView>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 8, flexGrow: 1 },
  header: { marginBottom: 32 },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'Geist_700Bold', fontSize: 32, letterSpacing: -1.2, marginBottom: 8 },
  subtitle: { fontFamily: 'Geist_400Regular', fontSize: 15, lineHeight: 22 },
  form: { marginTop: 36, gap: 14 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1.5,
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  input: { flex: 1, fontFamily: 'Geist_400Regular', fontSize: 15, padding: 0, margin: 0 },
  strengthContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, paddingHorizontal: 4 },
  strengthBars: { flex: 1, flexDirection: 'row', gap: 4 },
  strengthBar: { flex: 1, height: 3, borderRadius: 2 },
  strengthLabel: { fontFamily: 'Geist_500Medium', fontSize: 12 },
  errorText: { fontFamily: 'Geist_400Regular', fontSize: 13, color: '#EF4444', marginTop: -4 },
  primaryBtn: { backgroundColor: '#A9334D', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  primaryBtnText: { fontFamily: 'Geist_700Bold', fontSize: 16, color: '#FFFFFF', letterSpacing: 0.2 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontFamily: 'Geist_400Regular', fontSize: 13 },
  socialRow: { flexDirection: 'row', gap: 10 },
  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 14, paddingVertical: 14, borderWidth: 1, gap: 8,
  },
  socialBtnText: { fontFamily: 'Geist_600SemiBold', fontSize: 15 },
  switchBtn: { alignItems: 'center', paddingVertical: 4 },
  switchText: { fontFamily: 'Geist_400Regular', fontSize: 14 },
  switchLink: { fontFamily: 'Geist_600SemiBold', color: '#A9334D' },
});
