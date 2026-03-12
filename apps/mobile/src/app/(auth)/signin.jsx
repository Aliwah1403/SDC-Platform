import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { ArrowLeft, Eye, EyeOff, Mail, Lock } from 'lucide-react-native';
import { signIn } from '@/utils/auth/supabase';
import { useAuthStore } from '@/utils/auth/store';

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState(null);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data, error: authError } = await signIn(email.trim().toLowerCase(), password);
      if (authError) {
        setError(authError.message || 'Sign in failed. Please try again.');
        return;
      }
      setAuth({ token: data.session.access_token, user: data.user });
      router.replace('/');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
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
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
              onPress={() => router.back()}
            >
              <ArrowLeft size={22} color="#F8E9E7" strokeWidth={2} />
            </Pressable>
          </View>

          <MotiView
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 80, delay: 80 }}
          >
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue tracking your health</Text>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 80, delay: 180 }}
            style={styles.form}
          >
            {/* Email */}
            <View style={[styles.inputWrapper, focusedField === 'email' && styles.inputFocused]}>
              <Mail size={18} color={focusedField === 'email' ? '#F0531C' : 'rgba(248,233,231,0.4)'} strokeWidth={1.8} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor="rgba(248,233,231,0.35)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Password */}
            <View style={[styles.inputWrapper, focusedField === 'password' && styles.inputFocused]}>
              <Lock size={18} color={focusedField === 'password' ? '#F0531C' : 'rgba(248,233,231,0.4)'} strokeWidth={1.8} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Password"
                placeholderTextColor="rgba(248,233,231,0.35)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                {showPassword
                  ? <EyeOff size={18} color="rgba(248,233,231,0.4)" strokeWidth={1.8} />
                  : <Eye size={18} color="rgba(248,233,231,0.4)" strokeWidth={1.8} />
                }
              </Pressable>
            </View>

            {/* Error */}
            {!!error && (
              <MotiView
                from={{ opacity: 0, translateY: -4 }}
                animate={{ opacity: 1, translateY: 0 }}
              >
                <Text style={styles.errorText}>{error}</Text>
              </MotiView>
            )}

            {/* Forgot password */}
            <Pressable
              style={({ pressed }) => [styles.forgotBtn, pressed && { opacity: 0.6 }]}
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>

            {/* Sign In CTA */}
            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }, loading && { opacity: 0.7 }]}
              onPress={handleSignIn}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#FFFFFF" size="small" />
                : <Text style={styles.primaryBtnText}>Sign In</Text>
              }
            </Pressable>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Sign Up link */}
            <Pressable
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.7 }]}
              onPress={() => router.replace('/(auth)/signup')}
            >
              <Text style={styles.secondaryBtnText}>Create a new account</Text>
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
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    color: 'rgba(248,233,231,0.5)',
    lineHeight: 22,
  },
  form: {
    marginTop: 36,
    gap: 14,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248,233,231,0.07)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(248,233,231,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  inputFocused: {
    borderColor: '#F0531C',
    backgroundColor: 'rgba(240,83,28,0.06)',
  },
  input: {
    flex: 1,
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    color: '#F8E9E7',
    padding: 0,
    margin: 0,
  },
  errorText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: '#EF4444',
    marginTop: -4,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -2,
  },
  forgotText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: '#F0531C',
  },
  primaryBtn: {
    backgroundColor: '#F0531C',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: {
    fontFamily: 'Geist_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(248,233,231,0.1)',
  },
  dividerText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: 'rgba(248,233,231,0.3)',
  },
  secondaryBtn: {
    backgroundColor: 'rgba(248,233,231,0.08)',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(248,233,231,0.12)',
  },
  secondaryBtnText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    color: '#F8E9E7',
    letterSpacing: 0.1,
  },
});
