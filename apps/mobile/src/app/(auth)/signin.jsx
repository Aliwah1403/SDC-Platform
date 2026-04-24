import { router } from "expo-router";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePostHog } from "posthog-react-native";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotiView } from "moti";
import { ArrowLeft, Eye, EyeOff, Mail, Lock } from "lucide-react-native";
import Svg, { Path } from "react-native-svg";
import {
  signIn,
  signInWithGoogle,
  signInWithApple,
} from "@/utils/auth/supabase";
import { useAuthStore } from "@/utils/auth/store";

function GoogleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

function LastUsedPill() {
  return (
    <View style={{
      backgroundColor: 'rgba(240,83,28,0.12)',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(240,83,28,0.35)',
      paddingHorizontal: 8,
      paddingVertical: 3,
    }}>
      <Text style={{
        fontFamily: 'Geist_500Medium',
        fontSize: 10,
        color: '#F0531C',
        letterSpacing: 0.3,
      }}>Last used</Text>
    </View>
  );
}

function AppleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="#F8E9E7">
      <Path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </Svg>
  );
}

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const posthog = usePostHog();
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState(null);
  const [lastProvider, setLastProvider] = useState(null);

  useEffect(() => {
    posthog?.capture('sign_in_screen_viewed', {});
    AsyncStorage.getItem("lastAuthProvider").then((p) => {
      if (p) setLastProvider(p);
    });
  }, []);

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const { data, error: authError } = await signInWithGoogle();
      if (authError) {
        posthog?.capture('sign_in_failed', { method: 'google', error_type: 'auth_error' });
        setError(authError.message || "Google sign-in failed.");
        return;
      }
      if (!data?.session || !data?.user) {
        posthog?.capture('sign_in_failed', { method: 'google', error_type: 'no_session' });
        setError("Google sign-in failed. Please try again.");
        return;
      }
      posthog?.capture('sign_in_succeeded', { method: 'google' });
      await AsyncStorage.setItem("lastAuthProvider", "google");
      setAuth(data.session, data.user);
      router.replace("/");
    } catch (e) {
      if (e.code !== "ERR_REQUEST_CANCELED") {
        posthog?.capture('sign_in_failed', { method: 'google', error_type: 'network' });
        setError("Google sign-in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const { data, error: authError } = await signInWithApple();
      if (authError) {
        posthog?.capture('sign_in_failed', { method: 'apple', error_type: 'auth_error' });
        setError(authError.message || "Apple sign-in failed.");
        return;
      }
      if (!data?.session || !data?.user) {
        posthog?.capture('sign_in_failed', { method: 'apple', error_type: 'no_session' });
        setError("Apple sign-in failed. Please try again.");
        return;
      }
      posthog?.capture('sign_in_succeeded', { method: 'apple' });
      await AsyncStorage.setItem("lastAuthProvider", "apple");
      setAuth(data.session, data.user);
      router.replace("/");
    } catch (e) {
      if (e.code !== "ERR_REQUEST_CANCELED") {
        posthog?.capture('sign_in_failed', { method: 'apple', error_type: 'network' });
        setError("Apple sign-in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { data, error: authError } = await signIn(
        email.trim().toLowerCase(),
        password,
      );
      if (authError) {
        posthog?.capture('sign_in_failed', { method: 'email', error_type: 'auth_error' });
        setError(authError.message || "Sign in failed. Please try again.");
        return;
      }
      if (!data?.session || !data?.user) {
        posthog?.capture('sign_in_failed', { method: 'email', error_type: 'no_session' });
        setError("Sign in failed. Please try again.");
        return;
      }
      posthog?.capture('sign_in_succeeded', { method: 'email' });
      await AsyncStorage.setItem("lastAuthProvider", "email");
      setAuth(data.session, data.user);
      router.replace("/");
    } catch {
      posthog?.capture('sign_in_failed', { method: 'email', error_type: 'network' });
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              style={({ pressed }) => [
                styles.backBtn,
                pressed && { opacity: 0.6 },
              ]}
              onPress={() => router.back()}
            >
              <ArrowLeft size={22} color="#F8E9E7" strokeWidth={2} />
            </Pressable>
          </View>

          <MotiView
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              type: "spring",
              damping: 18,
              stiffness: 80,
              delay: 80,
            }}
          >
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue tracking your health
            </Text>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              type: "spring",
              damping: 18,
              stiffness: 80,
              delay: 180,
            }}
            style={styles.form}
          >
            {/* Email */}
            <View
              style={[
                styles.inputWrapper,
                focusedField === "email" && styles.inputFocused,
              ]}
            >
              <Mail
                size={18}
                color={
                  focusedField === "email" ? "#F0531C" : "rgba(248,233,231,0.4)"
                }
                strokeWidth={1.8}
              />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor="rgba(248,233,231,0.35)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Password */}
            <View
              style={[
                styles.inputWrapper,
                focusedField === "password" && styles.inputFocused,
              ]}
            >
              <Lock
                size={18}
                color={
                  focusedField === "password"
                    ? "#F0531C"
                    : "rgba(248,233,231,0.4)"
                }
                strokeWidth={1.8}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Password"
                placeholderTextColor="rgba(248,233,231,0.35)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={8}
              >
                {showPassword ? (
                  <EyeOff
                    size={18}
                    color="rgba(248,233,231,0.4)"
                    strokeWidth={1.8}
                  />
                ) : (
                  <Eye
                    size={18}
                    color="rgba(248,233,231,0.4)"
                    strokeWidth={1.8}
                  />
                )}
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
              style={({ pressed }) => [
                styles.forgotBtn,
                pressed && { opacity: 0.6 },
              ]}
              onPress={() => { posthog?.capture('forgot_password_tapped', {}); router.push("/(auth)/forgot-password"); }}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>

            {/* Sign In CTA */}
            <View>
              {lastProvider === 'email' && (
                <View style={{ position: 'absolute', top: -12, right: 0, zIndex: 1 }}>
                  <LastUsedPill />
                </View>
              )}
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
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social auth buttons */}
            <View style={styles.socialRow}>
              <View style={{ flex: 1 }}>
                {lastProvider === 'google' && (
                  <View style={{ position: 'absolute', top: -12, right: 0, zIndex: 1 }}>
                    <LastUsedPill />
                  </View>
                )}
                <Pressable
                  style={({ pressed }) => [styles.socialBtn, pressed && { opacity: 0.7 }, loading && { opacity: 0.5 }]}
                  onPress={handleGoogleSignIn}
                  disabled={loading}
                >
                  <GoogleIcon />
                  <Text style={styles.socialBtnText}>Google</Text>
                </Pressable>
              </View>
              {Platform.OS === 'ios' && (
                <View style={{ flex: 1 }}>
                  {lastProvider === 'apple' && (
                    <View style={{ position: 'absolute', top: -12, right: 0, zIndex: 1 }}>
                      <LastUsedPill />
                    </View>
                  )}
                  <Pressable
                    style={({ pressed }) => [styles.socialBtn, pressed && { opacity: 0.7 }, loading && { opacity: 0.5 }]}
                    onPress={handleAppleSignIn}
                    disabled={loading}
                  >
                    <AppleIcon />
                    <Text style={styles.socialBtnText}>Apple</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Sign Up link */}
            <Pressable
              style={({ pressed }) => [
                styles.switchBtn,
                pressed && { opacity: 0.6 },
              ]}
              onPress={() => router.replace("/(auth)/signup")}
            >
              <Text style={styles.switchText}>
                Don't have an account?{" "}
                <Text style={styles.switchLink}>Sign up</Text>
              </Text>
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
    backgroundColor: "#0D0D0D",
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
    backgroundColor: "rgba(248,233,231,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Geist_700Bold",
    fontSize: 32,
    color: "#F8E9E7",
    letterSpacing: -1.2,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Geist_400Regular",
    fontSize: 15,
    color: "rgba(248,233,231,0.5)",
    lineHeight: 22,
  },
  form: {
    marginTop: 36,
    gap: 14,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(248,233,231,0.07)",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(248,233,231,0.1)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  inputFocused: {
    borderColor: "#F0531C",
    backgroundColor: "rgba(240,83,28,0.06)",
  },
  input: {
    flex: 1,
    fontFamily: "Geist_400Regular",
    fontSize: 15,
    color: "#F8E9E7",
    padding: 0,
    margin: 0,
  },
  errorText: {
    fontFamily: "Geist_400Regular",
    fontSize: 13,
    color: "#EF4444",
    marginTop: -4,
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginTop: -2,
  },
  forgotText: {
    fontFamily: "Geist_500Medium",
    fontSize: 13,
    color: "#F0531C",
  },
  primaryBtn: {
    backgroundColor: "#F0531C",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  primaryBtnText: {
    fontFamily: "Geist_700Bold",
    fontSize: 16,
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(248,233,231,0.1)",
  },
  dividerText: {
    fontFamily: "Geist_400Regular",
    fontSize: 13,
    color: "rgba(248,233,231,0.3)",
  },
  socialRow: {
    flexDirection: "row",
    gap: 10,
  },
  socialBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(248,233,231,0.08)",
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(248,233,231,0.12)",
    gap: 8,
  },
  socialBtnText: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 15,
    color: "#F8E9E7",
  },
  switchBtn: {
    alignItems: "center",
    paddingVertical: 4,
  },
  switchText: {
    fontFamily: "Geist_400Regular",
    fontSize: 14,
    color: "rgba(248,233,231,0.45)",
  },
  switchLink: {
    fontFamily: "Geist_600SemiBold",
    color: "#F0531C",
  },
});
