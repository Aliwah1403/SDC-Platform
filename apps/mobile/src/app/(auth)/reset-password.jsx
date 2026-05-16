import { router } from 'expo-router';
import { useState } from 'react';
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
import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react-native';
import { supabase } from '@/utils/auth/supabase';
import { useTheme } from '@/hooks/useTheme';

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
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

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setError(''); setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) { setError(updateError.message || 'Failed to update password. Please try again.'); return; }
      router.replace('/(auth)/signin');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  const isValid = password.length >= 8 && confirm.length >= 8;

  const inputStyle = (field) => [
    styles.inputWrapper,
    { backgroundColor: c.surface, borderColor: focusedField === field ? '#A9334D' : c.border },
    focusedField === field && { backgroundColor: 'rgba(169,51,77,0.06)' },
  ];

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
            <Text style={[styles.title, { color: theme.text }]}>Set new{'\n'}password</Text>
            <Text style={[styles.subtitle, { color: c.textMuted }]}>Choose a strong password for your account.</Text>
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

            <View style={inputStyle('password')}>
              <Lock size={18} color={focusedField === 'password' ? '#A9334D' : c.iconMuted} strokeWidth={1.8} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="New password"
                placeholderTextColor={c.placeholder}
                value={password}
                onChangeText={(t) => { setPassword(t); setError(''); }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
              <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                {showPassword
                  ? <EyeOff size={18} color={c.iconMuted} strokeWidth={1.8} />
                  : <Eye size={18} color={c.iconMuted} strokeWidth={1.8} />
                }
              </Pressable>
            </View>

            <View style={inputStyle('confirm')}>
              <Lock size={18} color={focusedField === 'confirm' ? '#A9334D' : c.iconMuted} strokeWidth={1.8} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Confirm password"
                placeholderTextColor={c.placeholder}
                value={confirm}
                onChangeText={(t) => { setConfirm(t); setError(''); }}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setFocusedField('confirm')}
                onBlur={() => setFocusedField(null)}
              />
              <Pressable onPress={() => setShowConfirm((v) => !v)} hitSlop={8}>
                {showConfirm
                  ? <EyeOff size={18} color={c.iconMuted} strokeWidth={1.8} />
                  : <Eye size={18} color={c.iconMuted} strokeWidth={1.8} />
                }
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                !isValid && styles.primaryBtnDisabled,
                pressed && isValid && { opacity: 0.85 },
                loading && { opacity: 0.7 },
              ]}
              onPress={handleSubmit}
              disabled={!isValid || loading}
            >
              {loading
                ? <ActivityIndicator color="#FFFFFF" size="small" />
                : <Text style={styles.primaryBtnText}>Update Password</Text>
              }
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
  title: { fontFamily: 'Geist_700Bold', fontSize: 32, letterSpacing: -1.2, marginBottom: 8, lineHeight: 40 },
  subtitle: { fontFamily: 'Geist_400Regular', fontSize: 15, lineHeight: 22 },
  form: { marginTop: 36, gap: 14 },
  errorText: { fontFamily: 'Geist_400Regular', fontSize: 13, color: '#EF4444', marginBottom: -4 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1.5,
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  input: { flex: 1, fontFamily: 'Geist_400Regular', fontSize: 15, padding: 0, margin: 0 },
  primaryBtn: { backgroundColor: '#A9334D', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  primaryBtnDisabled: { backgroundColor: 'rgba(169,51,77,0.25)' },
  primaryBtnText: { fontFamily: 'Geist_700Bold', fontSize: 16, color: '#FFFFFF', letterSpacing: 0.2 },
});
