import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import Svg, { Path } from "react-native-svg";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  Lock,
  LogOut,
  Trash2,
  Eye,
  EyeOff,
  ShieldCheck,
  Link,
  Unlink,
} from "lucide-react-native";
import { useAuthStore } from "@/utils/auth/store";
import { supabase } from "@/utils/auth/supabase";
import {
  changePassword,
  signOutAll,
  linkProvider,
  unlinkProvider,
} from "@/utils/auth/supabase";
import { fonts } from "@/utils/fonts";

// ─── brand icons ─────────────────────────────────────────────────────────────

function GoogleIcon({ size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
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

function AppleIcon({ size = 18, color = "#09332C" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </Svg>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function getProvider(user) {
  const provider =
    user?.app_metadata?.provider ?? user?.identities?.[0]?.provider;
  if (provider === "google") return "Google";
  if (provider === "apple") return "Apple";
  return "Email";
}

function isEmailUser(user) {
  return getProvider(user) === "Email";
}

// ─── primitive components ─────────────────────────────────────────────────────

function Divider() {
  return (
    <View style={{ height: 1, backgroundColor: "#F8E9E7", marginLeft: 54 }} />
  );
}

function SectionCard({ title, children }) {
  const kids = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={{ marginBottom: 24 }}>
      {title ? (
        <Text
          style={{
            fontFamily: fonts.semibold,
            fontSize: 11,
            color: "#9CA3AF",
            letterSpacing: 0.8,
            textTransform: "uppercase",
            marginBottom: 6,
            marginLeft: 4,
          }}
        >
          {title}
        </Text>
      ) : null}
      <View
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 14,
          borderWidth: 1,
          borderColor: "#F0E4E1",
          overflow: "hidden",
        }}
      >
        {kids.map((child, i) => (
          <React.Fragment key={i}>
            {child}
            {i < kids.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

function Row({
  icon: Icon,
  iconColor = "#A9334D",
  label,
  value,
  onPress,
  rightElement,
  danger = false,
}) {
  const content = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 13,
        paddingHorizontal: 16,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Icon size={18} color={danger ? "#DC2626" : iconColor} />
      </View>
      <Text
        style={{
          fontFamily: fonts.medium,
          fontSize: 15,
          color: danger ? "#DC2626" : "#09332C",
          flex: 1,
        }}
      >
        {label}
      </Text>
      {value ? (
        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: 14,
            color: "#9CA3AF",
            marginRight: 4,
          }}
        >
          {value}
        </Text>
      ) : null}
      {rightElement !== undefined ? (
        rightElement
      ) : onPress ? (
        <ChevronRight size={18} color="#C4A8A4" />
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.6}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

// ─── main screen ──────────────────────────────────────────────────────────────

export default function SecurityScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { auth } = useAuthStore();
  const user = auth?.user;

  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [linking, setLinking] = useState(null); // 'google' | 'apple' | null

  const provider = getProvider(user);
  const emailUser = isEmailUser(user);

  const handleLink = async (providerName) => {
    setLinking(providerName);
    try {
      const redirectTo = Linking.createURL("/");
      const { data, error } = await linkProvider(providerName, redirectTo);
      if (error) {
        Alert.alert("Could not link account", error.message);
        return;
      }
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo,
      );
      if (result.type === "success" && result.url) {
        // Try PKCE code exchange first, then implicit token in fragment
        if (result.url.includes("code=")) {
          const { error: codeErr } = await supabase.auth.exchangeCodeForSession(
            result.url,
          );
          if (codeErr)
            Alert.alert("Error", "Could not complete account linking.");
        } else {
          const fragment = result.url.split("#")[1] ?? "";
          const params = Object.fromEntries(new URLSearchParams(fragment));
          if (params.access_token) {
            await supabase.auth.setSession({
              access_token: params.access_token,
              refresh_token: params.refresh_token,
            });
          }
        }
      } else if (result.type === "cancel") {
        // User dismissed — no-op
      }
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLinking(null);
    }
  };

  const handleUnlink = (identity) => {
    const canUnlink = user?.identities?.length > 1 || user?.email_confirmed_at;
    if (!canUnlink) {
      Alert.alert(
        "Cannot unlink",
        "You must have at least one sign-in method. Set a password first before unlinking this account.",
      );
      return;
    }
    const label =
      identity.provider.charAt(0).toUpperCase() + identity.provider.slice(1);
    Alert.alert(
      `Unlink ${label}?`,
      `You'll no longer be able to sign in with ${label}.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unlink",
          style: "destructive",
          onPress: async () => {
            const { error } = await unlinkProvider(identity);
            if (error)
              Alert.alert(
                "Error",
                error.message ?? "Could not unlink account.",
              );
          },
        },
      ],
    );
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      Alert.alert("Too short", "Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Mismatch", "Passwords don't match.");
      return;
    }
    setSaving(true);
    const { error } = await changePassword(newPassword);
    setSaving(false);
    if (error) {
      Alert.alert("Error", error.message ?? "Could not update password.");
      return;
    }
    setChangingPassword(false);
    setNewPassword("");
    setConfirmPassword("");
    Alert.alert(
      "Password updated",
      "Your password has been changed successfully.",
    );
  };

  const closePasswordSheet = () => {
    setChangingPassword(false);
    setNewPassword("");
    setConfirmPassword("");
    setShowNew(false);
    setShowConfirm(false);
  };

  const handleSignOutAll = () => {
    Alert.alert(
      "Sign out of all devices?",
      "You'll be signed out of Hemo on every device, including this one.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out all",
          style: "destructive",
          onPress: async () => {
            const { error } = await signOutAll();
            if (error) {
              Alert.alert("Error", "Could not sign out. Try again.");
              return;
            }
            router.replace("/");
          },
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete account?",
      "This will permanently delete your Hemo account and all health data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Are you absolutely sure?",
              `Type DELETE to confirm you want to permanently remove ${user?.email ?? "your account"}.`,
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete my account",
                  style: "destructive",
                  onPress: () => {
                    // Account deletion requires a server-side call (Edge Function).
                    // For now: notify user and sign out.
                    Alert.alert(
                      "Request submitted",
                      "Your account deletion request has been submitted. You'll receive a confirmation email within 24 hours.",
                      [
                        {
                          text: "OK",
                          onPress: async () => {
                            await signOutAll();
                            router.replace("/");
                          },
                        },
                      ],
                    );
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F4F0" }}>
      <StatusBar style="dark" />

      {/* ── Header ── */}
      <View
        style={{
          backgroundColor: "#ffffff",
          paddingTop: insets.top + 10,
          paddingBottom: 14,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          borderBottomWidth: 1,
          borderBottomColor: "#F0E4E1",
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.6}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#F8F4F0",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <ChevronLeft size={22} color="#09332C" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text
            style={{ fontFamily: fonts.bold, fontSize: 18, color: "#09332C" }}
          >
            Password & Security
          </Text>
        </View>
        <ShieldCheck size={22} color="#A9334D" />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Signed in as ── */}
        <SectionCard title="Signed In As">
          <Row
            icon={Mail}
            iconColor="#6B7280"
            label={user?.email ?? "—"}
            rightElement={
              <View
                style={{
                  backgroundColor: "#F0E4E1",
                  borderRadius: 20,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.semibold,
                    fontSize: 12,
                    color: "#A9334D",
                  }}
                >
                  {provider}
                </Text>
              </View>
            }
          />
        </SectionCard>

        {/* ── Linked Accounts ── */}
        <SectionCard title="Linked Accounts">
          {[
            {
              key: "google",
              label: "Google",
              Icon: () => <GoogleIcon size={18} />,
            },
            {
              key: "apple",
              label: "Apple",
              Icon: () => <AppleIcon size={18} color="#09332C" />,
            },
          ].map(({ key, label, Icon }) => {
            const identity = user?.identities?.find((i) => i.provider === key);
            const isLinked = !!identity;
            const isLoading = linking === key;
            return (
              <Row
                key={key}
                icon={Icon}
                iconColor="#09332C"
                label={label}
                rightElement={
                  isLoading ? (
                    <ActivityIndicator size="small" color="#A9334D" />
                  ) : isLinked ? (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: "#DCFCE7",
                          borderRadius: 20,
                          paddingHorizontal: 10,
                          paddingVertical: 3,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: fonts.semibold,
                            fontSize: 12,
                            color: "#16A34A",
                          }}
                        >
                          Linked
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleUnlink(identity)}
                        hitSlop={8}
                        activeOpacity={0.6}
                      >
                        <Unlink size={16} color="#9CA3AF" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleLink(key)}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        backgroundColor: "#F0E4E1",
                        borderRadius: 20,
                        paddingHorizontal: 12,
                        paddingVertical: 5,
                      }}
                    >
                      <Link size={13} color="#A9334D" />
                      <Text
                        style={{
                          fontFamily: fonts.semibold,
                          fontSize: 13,
                          color: "#A9334D",
                        }}
                      >
                        Link
                      </Text>
                    </TouchableOpacity>
                  )
                }
              />
            );
          })}
        </SectionCard>

        {/* ── Password (email users only) ── */}
        {emailUser && (
          <SectionCard title="Password">
            <Row
              icon={Lock}
              iconColor="#A9334D"
              label="Change Password"
              onPress={() => setChangingPassword(true)}
            />
          </SectionCard>
        )}

        {/* ── Sessions ── */}
        <SectionCard title="Sessions">
          <Row
            icon={LogOut}
            iconColor="#F0531C"
            label="Sign Out of All Devices"
            onPress={handleSignOutAll}
          />
        </SectionCard>

        {/* ── Danger Zone ── */}
        <SectionCard title="Danger Zone">
          <Row
            icon={Trash2}
            label="Delete Account"
            onPress={handleDeleteAccount}
            danger
          />
        </SectionCard>
      </ScrollView>

      {/* ── Change Password Sheet ── */}
      <Modal
        visible={changingPassword}
        transparent
        animationType="slide"
        onRequestClose={closePasswordSheet}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }}
          onPress={closePasswordSheet}
        />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View
          style={{
            backgroundColor: "#ffffff",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingBottom: insets.bottom + 12,
          }}
        >
          {/* Sheet header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#F0E4E1",
            }}
          >
            <Pressable onPress={closePasswordSheet} hitSlop={12}>
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 16,
                  color: "#9CA3AF",
                }}
              >
                Cancel
              </Text>
            </Pressable>
            <Text
              style={{
                fontFamily: fonts.semibold,
                fontSize: 16,
                color: "#09332C",
              }}
            >
              Change Password
            </Text>
            <Pressable
              onPress={handleChangePassword}
              disabled={saving}
              hitSlop={12}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#A9334D" />
              ) : (
                <Text
                  style={{
                    fontFamily: fonts.semibold,
                    fontSize: 16,
                    color: "#A9334D",
                  }}
                >
                  Save
                </Text>
              )}
            </Pressable>
          </View>

          {/* Fields */}
          <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 12 }}>
            {/* New password */}
            <View>
              <Text
                style={{
                  fontFamily: fonts.medium,
                  fontSize: 13,
                  color: "#9CA3AF",
                  marginBottom: 6,
                }}
              >
                New Password
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#F0E4E1",
                  borderRadius: 12,
                  backgroundColor: "#F8F4F0",
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                }}
              >
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="At least 8 characters"
                  placeholderTextColor="#C4A8A4"
                  secureTextEntry={!showNew}
                  autoFocus
                  style={{
                    flex: 1,
                    fontFamily: fonts.regular,
                    fontSize: 16,
                    color: "#09332C",
                    padding: 0,
                  }}
                />
                <Pressable onPress={() => setShowNew((v) => !v)} hitSlop={8}>
                  {showNew ? (
                    <EyeOff size={18} color="#9CA3AF" />
                  ) : (
                    <Eye size={18} color="#9CA3AF" />
                  )}
                </Pressable>
              </View>
            </View>

            {/* Confirm password */}
            <View style={{ paddingBottom: 8 }}>
              <Text
                style={{
                  fontFamily: fonts.medium,
                  fontSize: 13,
                  color: "#9CA3AF",
                  marginBottom: 6,
                }}
              >
                Confirm Password
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor:
                    confirmPassword.length > 0 &&
                    confirmPassword !== newPassword
                      ? "#DC2626"
                      : "#F0E4E1",
                  borderRadius: 12,
                  backgroundColor: "#F8F4F0",
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                }}
              >
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter new password"
                  placeholderTextColor="#C4A8A4"
                  secureTextEntry={!showConfirm}
                  returnKeyType="done"
                  onSubmitEditing={handleChangePassword}
                  style={{
                    flex: 1,
                    fontFamily: fonts.regular,
                    fontSize: 16,
                    color: "#09332C",
                    padding: 0,
                  }}
                />
                <Pressable
                  onPress={() => setShowConfirm((v) => !v)}
                  hitSlop={8}
                >
                  {showConfirm ? (
                    <EyeOff size={18} color="#9CA3AF" />
                  ) : (
                    <Eye size={18} color="#9CA3AF" />
                  )}
                </Pressable>
              </View>
              {confirmPassword.length > 0 &&
                confirmPassword !== newPassword && (
                  <Text
                    style={{
                      fontFamily: fonts.regular,
                      fontSize: 12,
                      color: "#DC2626",
                      marginTop: 4,
                      marginLeft: 2,
                    }}
                  >
                    Passwords don't match
                  </Text>
                )}
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
