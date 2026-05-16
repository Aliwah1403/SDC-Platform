import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { usePostHog } from 'posthog-react-native';
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
import { ArrowLeft, Mail } from 'lucide-react-native';
import { resetPassword } from '@/utils/auth/supabase';
import { useTheme } from '@/hooks/useTheme';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const posthog = usePostHog();
  const theme = useTheme();
  const dark = theme.isDark;

  const c = {
    surface: dark ? 'rgba(248,233,231,0.07)' : 'rgba(26,26,26,0.04)',
    surfaceBtn: dark ? 'rgba(248,233,231,0.08)' : 'rgba(26,26,26,0.06)',
    border: dark ? 'rgba(248,233,231,0.1)' : theme.border,
    placeholder: dark ? 'rgba(248,233,231,0.35)' : 'rgba(26,26,26,0.32)',
    iconMuted: dark ? 'rgba(248,233,231,0.4)' : 'rgba(26,26,26,0.35)',
    textMuted: dark ? 'rgba(248,233,231,0.5)' : 'rgba(26,26,26,0.5)',
  };

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);

  useEffect(() => { posthog?.capture('password_reset_screen_viewed', {}); }, []);

  const handleReset = async () => {
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setError(''); setLoading(true);
    try {
      await resetPassword(email.trim().toLowerCase());
      posthog?.capture('password_reset_requested', {});
      router.push({ pathname: '/(auth)/verify-code', params: { email: email.trim().toLowerCase() } });
    } catch {
      posthog?.capture('password_reset_failed', {});
      setError('Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 }]}>
          <View style={styles.header}>
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
            <Text style={[styles.title, { color: theme.text }]}>Reset password</Text>
            <Text style={[styles.subtitle, { color: c.textMuted }]}>
              Enter your email and we'll send you a verification code.
            </Text>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 80, delay: 180 }}
            style={styles.form}
          >
            <View style={[
              styles.inputWrapper,
              { backgroundColor: c.surface, borderColor: focused ? '#A9334D' : c.border },
              focused && { backgroundColor: 'rgba(169,51,77,0.06)' },
            ]}>
              <Mail size={18} color={focused ? '#A9334D' : c.iconMuted} strokeWidth={1.8} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Email address"
                placeholderTextColor={c.placeholder}
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

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }, loading && { opacity: 0.7 }]}
              onPress={handleReset}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#FFFFFF" size="small" />
                : <Text style={styles.primaryBtnText}>Send Code</Text>
              }
            </Pressable>
          </MotiView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24 },
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
  errorText: { fontFamily: 'Geist_400Regular', fontSize: 13, color: '#EF4444', marginTop: -4 },
  primaryBtn: { backgroundColor: '#A9334D', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  primaryBtnText: { fontFamily: 'Geist_700Bold', fontSize: 16, color: '#FFFFFF', letterSpacing: 0.2 },
});
