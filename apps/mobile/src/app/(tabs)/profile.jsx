import React, { useEffect, useState, useRef, useMemo } from "react";
import { usePostHog } from "posthog-react-native";
import * as Notifications from "expo-notifications";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Share,
  Switch,
  TextInput,
  Keyboard,
  ActivityIndicator,
  Modal,
  Pressable,
  Image,
  Platform,
  StyleSheet,
  Linking,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ChevronRight,
  Check,
  Dna,
  Calendar,
  Ruler,
  Pill,
  Phone,
  Bell,
  Clock,
  Download,
  Share as ShareIcon,
  Heart,
  User,
  Lock,
  HelpCircle,
  Info,
  LogOut,
  Fingerprint,
  Search,
  QrCode,
  Star,
  Camera,
  Palette,
  Globe,
  AtSign,
  PenLine,
  Images,
  Trash2,
} from "lucide-react-native";
import Svg, { Path } from "react-native-svg";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useAppStore } from "../../store/appStore";
import {
  useProfileQuery,
  useUpdateProfileMutation,
} from "@/hooks/queries/useProfileQuery";
import { useQueryClient } from "@tanstack/react-query";
import { useStreakQuery } from "@/hooks/queries/useStreakQuery";
import { useEmergencyContactsQuery } from "@/hooks/queries/useEmergencyContactsQuery";
import { useMedicationsQuery } from "@/hooks/queries/useMedicationsQuery";
import { useAuthStore } from "@/utils/auth/store";
import { useAppearanceStore } from "@/store/appearanceStore";
import { fonts } from "@/utils/fonts";
import { useRouter } from "expo-router";
import {
  signOut,
  supabase,
  linkGoogle,
  linkApple,
  unlinkProvider,
} from "@/utils/auth/supabase";
import { uploadAvatar } from "@/services/supabaseQueries";
import { WebView } from "react-native-webview";
import { USERJOT_FEEDBACK_URL } from "@/constants/feedback";
import AppleHealthModal from "@/components/AppleHealthModal";
import { scheduleCheckInReminders, cancelCheckInReminders } from "@/utils/checkInNotifications";

// ─── helpers ────────────────────────────────────────────────────────────────

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatHeight(cm) {
  return cm ? `${cm} cm` : "Not set";
}

function formatWeight(kg) {
  return kg ? `${kg} kg` : "Not set";
}

function formatDob(dob) {
  if (!dob) return "Not set";
  return new Date(dob).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const FREQUENCY_OPTIONS = [
  { label: "Twice a day", value: 2 },
  { label: "3 times a day", value: 3 },
  { label: "5 times a day", value: 5 },
];

function formatFrequency(val) {
  if (!val) return "Not set";
  return FREQUENCY_OPTIONS.find((o) => o.value === val)?.label ?? "Not set";
}

function formatAge(dob) {
  if (!dob) return null;
  return Math.floor(
    (Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
  );
}

// ─── primitive components ────────────────────────────────────────────────────

function Divider() {
  return (
    <View style={{ height: 1, backgroundColor: "#F8E9E7", marginLeft: 54 }} />
  );
}

function SettingRow({
  icon: Icon,
  iconColor = "#A9334D",
  label,
  value,
  rightElement,
  onPress,
  disabled = false,
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
          // backgroundColor: `${iconColor}18`,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Icon size={18} color={iconColor} />
      </View>
      <Text
        style={{
          fontFamily: fonts.medium,
          fontSize: 15,
          color: "#09332C",
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
            marginRight: rightElement === "chevron" ? 4 : 0,
          }}
        >
          {value}
        </Text>
      ) : null}
      {rightElement === "chevron" ? (
        <ChevronRight size={18} color="#C4A8A4" />
      ) : (
        rightElement || null
      )}
    </View>
  );
  if (onPress)
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.6}
        disabled={disabled}
        style={disabled ? { opacity: 0.65 } : undefined}
      >
        {content}
      </TouchableOpacity>
    );
  return content;
}

function SettingRowToggle({
  icon: Icon,
  iconColor = "#A9334D",
  label,
  value,
  onChange,
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 11,
        paddingHorizontal: 16,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          // backgroundColor: `${iconColor}18`,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Icon size={18} color={iconColor} />
      </View>
      <Text
        style={{
          fontFamily: fonts.medium,
          fontSize: 15,
          color: "#09332C",
          flex: 1,
        }}
      >
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#E5E7EB", true: "#A9334D" }}
        thumbColor="#ffffff"
        ios_backgroundColor="#E5E7EB"
      />
    </View>
  );
}

function SectionCard({ title, children }) {
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
        {React.Children.map(children, (child, i) => {
          if (!child) return null;
          const isLast = i === React.Children.count(children) - 1;
          return (
            <>
              {child}
              {!isLast && <Divider />}
            </>
          );
        })}
      </View>
    </View>
  );
}

// ─── main screen ─────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const posthog = usePostHog();

  const { auth } = useAuthStore();
  const { data: profile } = useProfileQuery();
  const { data: streak } = useStreakQuery();
  const { data: emergencyContacts = [] } = useEmergencyContactsQuery();
  const { data: medications = [] } = useMedicationsQuery();
  const updateProfile = useUpdateProfileMutation();
  const queryClient = useQueryClient();
  const {
    onboardingData,
    appLockEnabled,
    appLockTimeout,
    healthKitConnected: appleHealthConnected,
  } = useAppStore();
  const { theme, setTheme } = useAppearanceStore();

  const [notificationsEnabled, setNotificationsEnabled] = useState(
    profile?.notificationsEnabled ??
      onboardingData?.notificationsEnabled ??
      false,
  );
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFeedbackInitializing, setIsFeedbackInitializing] = useState(false);
  const [shouldPreloadFeedback, setShouldPreloadFeedback] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [appleHealthModalVisible, setAppleHealthModalVisible] = useState(false);
  const [linkingProvider, setLinkingProvider] = useState(null);

  const identities = auth?.user?.identities ?? [];
  const linkedProviders = identities.map((i) => i.provider);
  const isGoogleLinked = linkedProviders.includes("google");
  const isAppleLinked = linkedProviders.includes("apple");
  const canUnlink = identities.length > 1;

  useEffect(() => {
    posthog?.capture('profile_viewed', {});
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const currentSession = useAuthStore.getState().auth?.session;
        useAuthStore.getState().setAuth(currentSession, user);
      }
    });
  }, []);

  // Edit sheet state
  const [editingScd, setEditingScd] = useState(false);
  const [editingDob, setEditingDob] = useState(false);
  const [editingFrequency, setEditingFrequency] = useState(false);
  const [editingFullName, setEditingFullName] = useState(false);
  const [editingNickname, setEditingNickname] = useState(false);
  const [editingAppearance, setEditingAppearance] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState(false);
  const [tempFullName, setTempFullName] = useState("");
  const [tempNickname, setTempNickname] = useState("");
  const [tempDay, setTempDay] = useState(1);
  const [tempMonth, setTempMonth] = useState(0);
  const [tempYear, setTempYear] = useState(2000);
  const searchInputRef = useRef(null);
  const feedbackOpenedRef = useRef(false);
  const photoSheetRef = useRef(null);

  // ── Scroll-driven header animation ──────────────────────────────────────────
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  // Background + border fade in over first 80–120px of scroll
  const headerBgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [60, 110], [0, 1], Extrapolation.CLAMP),
  }));

  // Nickname rises up and fades in as the profile card's name disappears behind the header
  const nicknameAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [100, 150],
      [0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [100, 150],
          [10, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const scdType = profile?.scdType;
  const age = formatAge(profile?.dob);
  const medicationsCount = medications.filter((m) => m.isActive).length;
  const emergencyCount = emergencyContacts.length;
  // Full name used only in official contexts (reports, health summary share, etc.)
  const fullName =
    profile?.fullName ?? auth?.user?.user_metadata?.full_name ?? "—";
  // Nickname is the primary identity throughout the app
  const displayNickname = profile?.nickname || "—";
  const userEmail = auth?.user?.email ?? "—";
  const initials = getInitials(profile?.nickname || fullName);
  const healthStreak = streak?.currentStreak ?? 0;

  const handleToggleNotifications = async (val) => {
    if (val) {
      const { status } = await Notifications.getPermissionsAsync();
      if (status === "denied") {
        // iOS won't re-prompt after denial — send user to Settings
        Alert.alert(
          "Enable Notifications",
          "Notifications are blocked. Open Settings to turn them on for Hemo.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }
      if (status !== "granted") {
        const { status: newStatus } =
          await Notifications.requestPermissionsAsync({
            ios: { allowAlert: true, allowBadge: true, allowSound: true },
          });
        if (newStatus !== "granted") return;
      }
    }
    posthog?.capture('notifications_toggled', { enabled: val });
    setNotificationsEnabled(val);
    updateProfile.mutate({ notificationsEnabled: val }, {
      onSuccess: () => {
        if (val) {
          scheduleCheckInReminders(profile?.checkInFrequency ?? 2);
        } else {
          cancelCheckInReminders();
        }
      },
    });
  };
  const appLockLabel = appLockEnabled
    ? `On · ${appLockTimeout === 0 ? "Immediately" : appLockTimeout === 1 ? "1 min" : appLockTimeout === 60 ? "1 hour" : `${appLockTimeout} min`}`
    : "Off";
  const handleExportData = () => {
    Alert.alert(
      "Export Health Data",
      "Your health data will be prepared as a comprehensive PDF report.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Export",
          onPress: () =>
            Alert.alert("Success", "Health data export initiated!"),
        },
      ],
    );
  };
  const handleShareSummary = async () => {
    try {
      const summary =
        `Hemo — Health Summary\nPatient: ${fullName}\nAge: ${age}\nSCD Type: ${scdType}\nHealth Streak: ${healthStreak} days\nDate: ${new Date().toLocaleDateString()}\n\nGenerated by Hemo.`.trim();
      await Share.share({ message: summary, title: "Health Summary" });
    } catch {
      Alert.alert("Error", "Unable to share health summary");
    }
  };
  const refreshIdentities = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const currentSession = useAuthStore.getState().auth?.session;
      useAuthStore.getState().setAuth(currentSession, user);
    }
  };

  const handleLinkGoogle = async () => {
    setLinkingProvider("google");
    try {
      const { error } = await linkGoogle();
      if (error) throw error;
      await refreshIdentities();
    } catch (e) {
      if (e.code !== "ERR_REQUEST_CANCELED")
        Alert.alert("Error", "Could not connect Google account.");
    } finally {
      setLinkingProvider(null);
    }
  };

  const handleLinkApple = async () => {
    setLinkingProvider("apple");
    try {
      const { error } = await linkApple();
      if (error) throw error;
      await refreshIdentities();
    } catch (e) {
      if (e.code !== "ERR_REQUEST_CANCELED")
        Alert.alert("Error", "Could not connect Apple account.");
    } finally {
      setLinkingProvider(null);
    }
  };

  const handleUnlink = (provider) => {
    if (!canUnlink) {
      Alert.alert(
        "Cannot unlink",
        "You need at least one login method. Add another before removing this one.",
      );
      return;
    }
    const identity = identities.find((i) => i.provider === provider);
    if (!identity) return;
    Alert.alert(
      `Disconnect ${provider === "google" ? "Google" : "Apple"}`,
      "You will no longer be able to sign in with this account.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            setLinkingProvider(provider);
            try {
              const { error } = await unlinkProvider(identity);
              if (error) throw error;
              await refreshIdentities();
            } catch {
              Alert.alert(
                "Error",
                `Could not disconnect ${provider === "google" ? "Google" : "Apple"} account.`,
              );
            } finally {
              setLinkingProvider(null);
            }
          },
        },
      ],
    );
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          posthog?.capture('sign_out', {});
          await signOut();
          router.replace("/(auth)/welcome");
        },
      },
    ]);
  };
  const comingSoon = (feature) =>
    Alert.alert(feature, `${feature} is coming soon.`);

  const openDobSheet = () => {
    const dob = profile?.dob;
    if (dob) {
      const [y, m, d] = dob.split("-").map(Number);
      setTempYear(y);
      setTempMonth(m - 1);
      setTempDay(d);
    } else {
      setTempYear(2000);
      setTempMonth(0);
      setTempDay(1);
    }
    setEditingDob(true);
  };

  const saveDob = () => {
    const candidate = new Date(tempYear, tempMonth, tempDay);
    const isValidDate =
      candidate.getFullYear() === tempYear &&
      candidate.getMonth() === tempMonth &&
      candidate.getDate() === tempDay;

    if (!isValidDate || candidate > new Date()) {
      Alert.alert("Invalid date", "Please choose a valid date of birth.");
      return;
    }

    const dob = `${tempYear}-${String(tempMonth + 1).padStart(2, "0")}-${String(tempDay).padStart(2, "0")}`;
    updateProfile.mutate({ dob });
    setEditingDob(false);
  };

  const openPhotoSheet = () => photoSheetRef.current?.expand();

  const doUpload = async (uri) => {
    const userId = auth?.user?.id;
    if (!userId) return;
    setUploadingAvatar(true);
    try {
      await uploadAvatar(userId, uri);
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    } catch {
      Alert.alert(
        "Upload failed",
        "Could not update profile photo. Try again.",
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleTakePhoto = async () => {
    photoSheetRef.current?.close();
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow camera access to take a photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (result.canceled || !result.assets?.[0]) return;
    await doUpload(result.assets[0].uri);
  };

  const handleChoosePhoto = async () => {
    photoSheetRef.current?.close();
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Allow photo access to change your profile picture.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (result.canceled || !result.assets?.[0]) return;
    await doUpload(result.assets[0].uri);
  };

  const handleRemovePhoto = () => {
    photoSheetRef.current?.close();
    Alert.alert(
      "Remove photo",
      "Are you sure you want to remove your profile photo?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const userId = auth?.user?.id;
            if (!userId) return;
            const { error } = await supabase.storage
              .from("avatars")
              .remove([`${userId}/avatar.jpg`]);
            if (error) {
              Alert.alert(
                "Remove failed",
                "Could not delete photo. Try again.",
              );
              return;
            }
            updateProfile.mutate({ avatarUrl: null });
          },
        },
      ],
    );
  };

  const openFullNameSheet = () => {
    setTempFullName(
      profile?.fullName ?? auth?.user?.user_metadata?.full_name ?? "",
    );
    setEditingFullName(true);
  };
  const saveFullName = () => {
    const name = tempFullName.trim();
    if (name) updateProfile.mutate({ fullName: name });
    setEditingFullName(false);
  };

  const openNicknameSheet = () => {
    setTempNickname(profile?.nickname ?? "");
    setEditingNickname(true);
  };
  const saveNickname = () => {
    const nick = tempNickname.trim();
    if (nick) updateProfile.mutate({ nickname: nick });
    setEditingNickname(false);
  };

  const openSearch = () => {
    setSearchQuery("");
    setSearchVisible(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };
  const closeSearch = () => {
    Keyboard.dismiss();
    setSearchVisible(false);
    setSearchQuery("");
  };

  const openFeedbackModal = () => {
    if (feedbackOpenedRef.current) return;

    feedbackOpenedRef.current = true;
    setIsFeedbackInitializing(false);
    setShouldPreloadFeedback(false);
    router.push("/feedback-modal");
  };

  const handleStartFeedback = () => {
    if (isFeedbackInitializing) return;

    feedbackOpenedRef.current = false;
    setIsFeedbackInitializing(true);
    setShouldPreloadFeedback(true);
  };

  // Flat list of all settings items for search
  const allSettings = useMemo(
    () => [
      {
        key: "scd-type",
        label: "SCD Type",
        section: "My Health",
        icon: Dna,
        iconColor: "#A9334D",
        onPress: () => setEditingScd(true),
      },
      {
        key: "dob",
        label: "Date of Birth",
        section: "My Health",
        icon: Calendar,
        iconColor: "#781D11",
        onPress: openDobSheet,
      },
      {
        key: "height-weight",
        label: "Height & Weight",
        section: "My Health",
        icon: Ruler,
        iconColor: "#059669",
        onPress: () => router.push("/edit-body-stats"),
      },
      {
        key: "medications",
        label: "Medications",
        section: "Medical",
        icon: Pill,
        iconColor: "#A9334D",
        onPress: () => router.push("/(tabs)/care/medications"),
      },
      {
        key: "emergency",
        label: "Emergency Contacts",
        section: "Medical",
        icon: Phone,
        iconColor: "#DC2626",
        onPress: () => comingSoon("Emergency Contacts"),
      },
      {
        key: "checkin",
        label: "Daily Check-in Frequency",
        section: "Reminders",
        icon: Clock,
        iconColor: "#F0531C",
        onPress: () => setEditingFrequency(true),
      },
      {
        key: "notifications",
        label: "Notifications",
        section: "Reminders",
        icon: Bell,
        iconColor: "#F0531C",
        onPress: () => comingSoon("Notifications"),
      },
      {
        key: "export",
        label: "Export Health Data",
        section: "Data & Reports",
        icon: Download,
        iconColor: "#059669",
        onPress: handleExportData,
      },
      {
        key: "share",
        label: "Share Health Summary",
        section: "Data & Reports",
        icon: ShareIcon,
        iconColor: "#A9334D",
        onPress: handleShareSummary,
      },
      {
        key: "apple-health",
        label: "Connect Apple Health",
        section: "Data & Reports",
        icon: Heart,
        iconColor: "#EF4444",
        onPress: () =>
          appleHealthConnected
            ? router.push("/apple-health-settings")
            : setAppleHealthModalVisible(true),
      },
      {
        key: "photo",
        label: "Profile Photo",
        section: "Profile",
        icon: Camera,
        iconColor: "#A9334D",
        onPress: openPhotoSheet,
      },
      {
        key: "full-name",
        label: "Full Name",
        section: "Profile",
        icon: User,
        iconColor: "#A9334D",
        onPress: openFullNameSheet,
      },
      {
        key: "nickname",
        label: "Nickname",
        section: "Profile",
        icon: AtSign,
        iconColor: "#A9334D",
        onPress: openNicknameSheet,
      },
      {
        key: "appearance",
        label: "Appearance",
        section: "Preferences",
        icon: Palette,
        iconColor: "#6B7280",
        onPress: () => setEditingAppearance(true),
      },
      {
        key: "language",
        label: "Language",
        section: "Preferences",
        icon: Globe,
        iconColor: "#6B7280",
        onPress: () => setEditingLanguage(true),
      },
      {
        key: "password",
        label: "Password & Security",
        section: "Account",
        icon: Lock,
        iconColor: "#6B7280",
        onPress: () => router.push("/security"),
      },
      {
        key: "biometrics",
        label: "App Lock",
        section: "Account",
        icon: Fingerprint,
        iconColor: "#6B7280",
        onPress: () => router.push("/app-lock-setup"),
      },
      {
        key: "help",
        label: "Help Center",
        section: "Support",
        icon: HelpCircle,
        iconColor: "#0EA5E9",
        onPress: () => comingSoon("Help Center"),
      },
      {
        key: "feedback",
        label: "Add Feedback",
        section: "Support",
        icon: Star,
        iconColor: "#F59E0B",
        onPress: () => router.push("/feedback-modal"),
      },
      {
        key: "about",
        label: "About Hemo",
        section: "Support",
        icon: Info,
        iconColor: "#6B7280",
        onPress: () => comingSoon("About Hemo"),
      },
      {
        key: "signout",
        label: "Sign Out",
        section: "",
        icon: LogOut,
        iconColor: "#DC2626",
        onPress: handleSignOut,
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
    ],
    [],
  );

  const filteredSettings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allSettings;
    return allSettings.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.section.toLowerCase().includes(q),
    );
  }, [searchQuery, allSettings]);

  // ── Search Overlay ─────────────────────────────────────────────────────────
  if (searchVisible) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F8F4F0" }}>
        <StatusBar style="dark" />

        {/* Search bar row */}
        <View
          style={{
            backgroundColor: "#ffffff",
            paddingTop: insets.top + 10,
            paddingBottom: 12,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            borderBottomWidth: 1,
            borderBottomColor: "#F0E4E1",
          }}
        >
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#F0EFEF",
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 9,
              gap: 8,
            }}
          >
            <Search size={16} color="#9CA3AF" />
            <TextInput
              ref={searchInputRef}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search"
              placeholderTextColor="#9CA3AF"
              style={{
                flex: 1,
                fontFamily: fonts.regular,
                fontSize: 16,
                color: "#09332C",
                padding: 0,
              }}
              returnKeyType="search"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity onPress={closeSearch} activeOpacity={0.6}>
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: 16,
                color: "#09332C",
              }}
            >
              Cancel
            </Text>
          </TouchableOpacity>
        </View>

        {/* Results */}
        <FlatList
          data={filteredSettings}
          keyExtractor={(item) => item.key}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          ItemSeparatorComponent={() => (
            <View
              style={{ height: 1, backgroundColor: "#F0E4E1", marginLeft: 62 }}
            />
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => {
                closeSearch();
                item.onPress();
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 13,
                paddingHorizontal: 16,
                backgroundColor: "#ffffff",
              }}
            >
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  backgroundColor: "#F2EFEC",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <item.icon size={18} color={item.iconColor} />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: fonts.medium,
                    fontSize: 15,
                    color: "#09332C",
                  }}
                >
                  {item.label}
                </Text>
                {item.section ? (
                  <Text
                    style={{
                      fontFamily: fonts.regular,
                      fontSize: 12,
                      color: "#9CA3AF",
                      marginTop: 1,
                    }}
                  >
                    {item.section}
                  </Text>
                ) : null}
              </View>

              <ChevronRight size={18} color="#C4A8A4" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 60 }}>
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 15,
                  color: "#9CA3AF",
                }}
              >
                No results for "{searchQuery}"
              </Text>
            </View>
          }
        />
      </View>
    );
  }

  // ── Main Profile Screen ────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: "#F8F4F0" }}>
      <StatusBar style="dark" />

      {/* ── Sticky top bar ── */}
      <View style={styles.header}>
        {/* Blur fills in as you scroll — iOS frosted glass, Android solid white */}
        <Animated.View
          style={[StyleSheet.absoluteFill, headerBgStyle]}
          pointerEvents="none"
        >
          {Platform.OS === "ios" ? (
            <BlurView
              intensity={80}
              tint="systemChromeMaterial"
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: "#ffffff" }]}
            />
          )}
          {/* Border fades in with the background */}
          <View style={styles.headerBorder} />
        </Animated.View>

        <View
          style={[
            styles.headerContent,
            { paddingTop: insets.top + 10, backgroundColor: "#ffffff" },
          ]}
        >
          <TouchableOpacity
            onPress={openSearch}
            activeOpacity={0.6}
            style={styles.headerBtn}
          >
            <Search size={20} color="#09332C" />
          </TouchableOpacity>

          <Animated.Text
            style={[styles.headerNickname, nicknameAnimStyle]}
            numberOfLines={1}
          >
            {displayNickname !== "—" ? displayNickname : "Profile"}
          </Animated.Text>

          <TouchableOpacity
            onPress={() => router.push("/qr-code")}
            activeOpacity={0.6}
            style={styles.headerBtn}
          >
            <QrCode size={20} color="#09332C" />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* ── Profile card ── */}
        <View
          style={{
            backgroundColor: "#ffffff",
            paddingBottom: 24,
            paddingTop: 28,
            borderBottomWidth: 1,
            borderBottomColor: "#F0E4E1",
            marginBottom: 24,
          }}
        >
          {/* Centered avatar + identity */}
          <View style={{ alignItems: "center" }}>
            <TouchableOpacity
              onPress={openPhotoSheet}
              activeOpacity={0.8}
              style={{ marginBottom: 14 }}
            >
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  backgroundColor: "#09332C",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {profile?.avatarUrl ? (
                  <Image
                    source={{ uri: profile.avatarUrl }}
                    style={{ width: 96, height: 96, borderRadius: 48 }}
                  />
                ) : (
                  <Text
                    style={{
                      fontFamily: fonts.bold,
                      fontSize: 32,
                      color: "#F8E9E7",
                    }}
                  >
                    {initials}
                  </Text>
                )}
              </View>
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: "#A9334D",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: "#ffffff",
                }}
              >
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Camera size={13} color="#ffffff" />
                )}
              </View>
            </TouchableOpacity>

            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 22,
                color: "#09332C",
                marginBottom: 4,
              }}
            >
              {displayNickname}
            </Text>
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 13,
                color: "#9CA3AF",
                marginBottom: 10,
              }}
            >
              {userEmail}
            </Text>

            {scdType ? (
              <View
                style={{
                  backgroundColor: "#A9334D",
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 4,
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.semibold,
                    fontSize: 12,
                    color: "#ffffff",
                  }}
                >
                  Sickle Cell · {scdType}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ── Settings Sections ── */}
        <View style={{ paddingHorizontal: 16 }}>
          <SectionCard title="My Health">
            <SettingRow
              icon={Dna}
              iconColor="#A9334D"
              label="SCD Type"
              value={scdType || "Not set"}
              rightElement="chevron"
              onPress={() => setEditingScd(true)}
            />
            <SettingRow
              icon={Calendar}
              iconColor="#781D11"
              label="Date of Birth"
              value={
                profile?.dob
                  ? formatDob(profile.dob)
                  : age
                    ? `Age ${age}`
                    : "Not set"
              }
              rightElement="chevron"
              onPress={openDobSheet}
            />
            <SettingRow
              icon={Ruler}
              iconColor="#059669"
              label="Height & Weight"
              value={
                profile?.height || profile?.weight
                  ? `${formatHeight(profile.height)} · ${formatWeight(profile.weight)}`
                  : "Not set"
              }
              rightElement="chevron"
              onPress={() => router.push("/edit-body-stats")}
            />
          </SectionCard>

          <SectionCard title="Medical">
            <SettingRow
              icon={Pill}
              iconColor="#A9334D"
              label="Medications"
              value={
                medicationsCount > 0
                  ? `${medicationsCount} active`
                  : "None added"
              }
              rightElement="chevron"
              onPress={() => router.push("/(tabs)/care/medications")}
            />
            <SettingRow
              icon={Phone}
              iconColor="#DC2626"
              label="Emergency Contacts"
              value={
                emergencyCount > 0 ? `${emergencyCount} contacts` : "None added"
              }
              rightElement="chevron"
              onPress={() => comingSoon("Emergency Contacts")}
            />
          </SectionCard>

          <SectionCard title="Reminders">
            <SettingRowToggle
              icon={Bell}
              iconColor="#F0531C"
              label="Notifications"
              value={notificationsEnabled}
              onChange={handleToggleNotifications}
            />
            <SettingRow
              icon={Clock}
              iconColor="#F0531C"
              label="Check-in Frequency"
              value={formatFrequency(profile?.checkInFrequency)}
              rightElement="chevron"
              onPress={() => setEditingFrequency(true)}
            />
          </SectionCard>

          <SectionCard title="Data & Reports">
            <SettingRow
              icon={Download}
              iconColor="#059669"
              label="Export Health Data"
              rightElement="chevron"
              onPress={handleExportData}
            />
            <SettingRow
              icon={ShareIcon}
              iconColor="#A9334D"
              label="Share Health Summary"
              rightElement="chevron"
              onPress={handleShareSummary}
            />
            <SettingRow
              icon={Heart}
              iconColor="#EF4444"
              label="Apple Health"
              value={appleHealthConnected ? "Connected" : "Not connected"}
              rightElement="chevron"
              onPress={() =>
                appleHealthConnected
                  ? router.push("/apple-health-settings")
                  : setAppleHealthModalVisible(true)
              }
            />
          </SectionCard>

          <SectionCard title="Profile">
            <SettingRow
              icon={User}
              iconColor="#A9334D"
              label="Full Name"
              value={
                profile?.fullName ??
                auth?.user?.user_metadata?.full_name ??
                "Not set"
              }
              rightElement="chevron"
              onPress={openFullNameSheet}
            />
            <SettingRow
              icon={AtSign}
              iconColor="#A9334D"
              label="Nickname"
              value={profile?.nickname || "Not set"}
              rightElement="chevron"
              onPress={openNicknameSheet}
            />
          </SectionCard>

          <SectionCard title="Preferences">
            <SettingRow
              icon={Palette}
              iconColor="#6B7280"
              label="Appearance"
              value={
                theme === "system"
                  ? "System"
                  : theme === "dark"
                    ? "Dark"
                    : "Light"
              }
              rightElement="chevron"
              onPress={() => setEditingAppearance(true)}
            />
            <SettingRow
              icon={Globe}
              iconColor="#6B7280"
              label="Language"
              value="English"
              rightElement="chevron"
              onPress={() => setEditingLanguage(true)}
            />
          </SectionCard>

          <SectionCard title="Account">
            <SettingRow
              icon={Lock}
              iconColor="#6B7280"
              label="Password & Security"
              rightElement="chevron"
              onPress={() => router.push("/security")}
            />
            <SettingRow
              icon={Fingerprint}
              iconColor="#6B7280"
              label="App Lock"
              value={appLockLabel}
              rightElement="chevron"
              onPress={() => router.push("/app-lock-setup")}
            />
          </SectionCard>

          <SectionCard title="Connected Accounts">
            <SettingRow
              icon={() => (
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
              )}
              iconColor="#4285F4"
              label="Google"
              // value={isGoogleLinked && "Connected"}
              rightElement={
                linkingProvider === "google" ? (
                  <ActivityIndicator size="small" color="#A9334D" />
                ) : isGoogleLinked ? (
                  <TouchableOpacity
                    onPress={() => handleUnlink("google")}
                    hitSlop={8}
                    disabled={!canUnlink}
                    style={!canUnlink ? { opacity: 0.4 } : undefined}
                  >
                    <Text
                      style={{
                        fontFamily: fonts.medium,
                        fontSize: 13,
                        color: "#DC2626",
                      }}
                    >
                      Disconnect
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={handleLinkGoogle} hitSlop={8}>
                    <Text
                      style={{
                        fontFamily: fonts.medium,
                        fontSize: 13,
                        color: "#A9334D",
                      }}
                    >
                      Connect
                    </Text>
                  </TouchableOpacity>
                )
              }
            />
            {Platform.OS === "ios" && (
              <SettingRow
                icon={() => (
                  <Svg
                    width={18}
                    height={18}
                    viewBox="0 0 24 24"
                    fill="#09332C"
                  >
                    <Path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </Svg>
                )}
                iconColor="#09332C"
                label="Apple"
                // value={isAppleLinked && "Connected"}
                rightElement={
                  linkingProvider === "apple" ? (
                    <ActivityIndicator size="small" color="#A9334D" />
                  ) : isAppleLinked ? (
                    <TouchableOpacity
                      onPress={() => handleUnlink("apple")}
                      hitSlop={8}
                      disabled={!canUnlink}
                      style={!canUnlink ? { opacity: 0.4 } : undefined}
                    >
                      <Text
                        style={{
                          fontFamily: fonts.medium,
                          fontSize: 13,
                          color: "#DC2626",
                        }}
                      >
                        Disconnect
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={handleLinkApple} hitSlop={8}>
                      <Text
                        style={{
                          fontFamily: fonts.medium,
                          fontSize: 13,
                          color: "#A9334D",
                        }}
                      >
                        Connect
                      </Text>
                    </TouchableOpacity>
                  )
                }
              />
            )}
          </SectionCard>

          <SectionCard title="Support">
            <SettingRow
              icon={HelpCircle}
              iconColor="#0EA5E9"
              label="Help Center"
              rightElement="chevron"
              onPress={() => comingSoon("Help Center")}
            />
            <SettingRow
              icon={Star}
              iconColor="#F59E0B"
              label="Add Feedback"
              rightElement={
                isFeedbackInitializing ? (
                  <ActivityIndicator size="small" color="#A9334D" />
                ) : (
                  "chevron"
                )
              }
              disabled={isFeedbackInitializing}
              onPress={handleStartFeedback}
            />
            <SettingRow
              icon={Info}
              iconColor="#6B7280"
              label="About Hemo"
              value="v1.0.0"
              rightElement="chevron"
              onPress={() => comingSoon("About Hemo")}
            />
          </SectionCard>

          <SectionCard>
            <SettingRow
              icon={LogOut}
              iconColor="#DC2626"
              label="Sign Out"
              onPress={handleSignOut}
            />
          </SectionCard>

          <View style={{ alignItems: "center", marginTop: 4 }}>
            <Text
              style={{
                fontFamily: fonts.semibold,
                fontSize: 12,
                color: "#A9334D",
                marginBottom: 2,
              }}
            >
              Hemo
            </Text>
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 11,
                color: "#C4A8A4",
              }}
            >
              Your sickle cell companion
            </Text>
          </View>
        </View>
      </Animated.ScrollView>

      {/* ── SCD Type Sheet ── */}
      <Modal
        visible={editingScd}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingScd(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }}
          onPress={() => setEditingScd(false)}
        />
        <View
          style={{
            backgroundColor: "#ffffff",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingBottom: insets.bottom + 12,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: "rgba(9,51,44,0.07)",
            }}
          >
            <Pressable onPress={() => setEditingScd(false)} hitSlop={12}>
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 16,
                  color: "rgba(9,51,44,0.45)",
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
              SCD Type
            </Text>
            <View style={{ width: 60 }} />
          </View>
          {["HbSS", "HbSC", "HbS-β⁰", "HbS-β⁺", "HbSD", "HbSE", "Unsure"].map(
            (opt, i, arr) => (
              <React.Fragment key={opt}>
                <Pressable
                  onPress={() => {
                    updateProfile.mutate({
                      scdType: opt === "Unsure" ? null : opt,
                    });
                    setEditingScd(false);
                  }}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    backgroundColor: pressed ? "#F8F4F0" : "#ffffff",
                  })}
                >
                  <Text
                    style={{
                      fontFamily: fonts.medium,
                      fontSize: 16,
                      color: "#09332C",
                      flex: 1,
                    }}
                  >
                    {opt}
                  </Text>
                  {scdType === opt || (!scdType && opt === "Unsure") ? (
                    <Check size={18} color="#A9334D" />
                  ) : null}
                </Pressable>
                {i < arr.length - 1 && (
                  <View
                    style={{
                      height: 1,
                      backgroundColor: "#F0E4E1",
                      marginLeft: 20,
                    }}
                  />
                )}
              </React.Fragment>
            ),
          )}
        </View>
      </Modal>

      {/* ── Date of Birth Sheet ── */}
      <Modal
        visible={editingDob}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingDob(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }}
          onPress={() => setEditingDob(false)}
        />
        <View
          style={{
            backgroundColor: "#ffffff",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingBottom: insets.bottom + 12,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 8,
              borderBottomWidth: 1,
              borderBottomColor: "rgba(9,51,44,0.07)",
            }}
          >
            <Pressable onPress={() => setEditingDob(false)} hitSlop={12}>
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 16,
                  color: "rgba(9,51,44,0.45)",
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
              Date of Birth
            </Text>
            <Pressable onPress={saveDob} hitSlop={12}>
              <Text
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: 16,
                  color: "#A9334D",
                }}
              >
                Done
              </Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: "row", paddingHorizontal: 8 }}>
            <Picker
              selectedValue={tempDay}
              onValueChange={setTempDay}
              style={{ flex: 1, height: 200 }}
              itemStyle={{
                fontFamily: fonts.regular,
                fontSize: 18,
                color: "#09332C",
                height: 200,
              }}
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <Picker.Item key={d} label={String(d)} value={d} />
              ))}
            </Picker>
            <Picker
              selectedValue={tempMonth}
              onValueChange={setTempMonth}
              style={{ flex: 1.6, height: 200 }}
              itemStyle={{
                fontFamily: fonts.regular,
                fontSize: 18,
                color: "#09332C",
                height: 200,
              }}
            >
              {[
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
              ].map((m, i) => (
                <Picker.Item key={m} label={m} value={i} />
              ))}
            </Picker>
            <Picker
              selectedValue={tempYear}
              onValueChange={setTempYear}
              style={{ flex: 1, height: 200 }}
              itemStyle={{
                fontFamily: fonts.regular,
                fontSize: 18,
                color: "#09332C",
                height: 200,
              }}
            >
              {Array.from(
                { length: 100 },
                (_, i) => new Date().getFullYear() - i,
              ).map((y) => (
                <Picker.Item key={y} label={String(y)} value={y} />
              ))}
            </Picker>
          </View>
        </View>
      </Modal>

      {/* ── Check-in Frequency Sheet ── */}
      <Modal
        visible={editingFrequency}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingFrequency(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }}
          onPress={() => setEditingFrequency(false)}
        />
        <View
          style={{
            backgroundColor: "#ffffff",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingBottom: insets.bottom + 12,
          }}
        >
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
            <Pressable onPress={() => setEditingFrequency(false)} hitSlop={12}>
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
              Check-in Frequency
            </Text>
            <View style={{ width: 60 }} />
          </View>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 13,
              color: "#9CA3AF",
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: 4,
            }}
          >
            How many times per day would you like to log your symptoms?
          </Text>
          {FREQUENCY_OPTIONS.map((opt, i, arr) => (
            <React.Fragment key={opt.value}>
              <Pressable
                onPress={() => {
                  posthog?.capture('check_in_frequency_changed', { frequency: opt.value });
                  updateProfile.mutate({ checkInFrequency: opt.value }, {
                    onSuccess: () => notificationsEnabled && scheduleCheckInReminders(opt.value),
                  });
                  setEditingFrequency(false);
                }}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  backgroundColor: pressed ? "#F8F4F0" : "#ffffff",
                })}
              >
                <Text
                  style={{
                    fontFamily: fonts.medium,
                    fontSize: 16,
                    color: "#09332C",
                    flex: 1,
                  }}
                >
                  {opt.label}
                </Text>
                {profile?.checkInFrequency === opt.value && (
                  <Check size={18} color="#A9334D" />
                )}
              </Pressable>
              {i < arr.length - 1 && (
                <View
                  style={{
                    height: 1,
                    backgroundColor: "#F0E4E1",
                    marginLeft: 20,
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </View>
      </Modal>

      {/* ── Full Name Sheet ── */}
      <Modal
        visible={editingFullName}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingFullName(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }}
          onPress={() => setEditingFullName(false)}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            style={{
              backgroundColor: "#ffffff",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingBottom: insets.bottom + 12,
            }}
          >
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
              <Pressable onPress={() => setEditingFullName(false)} hitSlop={12}>
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
                Full Name
              </Text>
              <Pressable onPress={saveFullName} hitSlop={12}>
                <Text
                  style={{
                    fontFamily: fonts.semibold,
                    fontSize: 16,
                    color: "#A9334D",
                  }}
                >
                  Save
                </Text>
              </Pressable>
            </View>
            <View
              style={{
                paddingHorizontal: 20,
                paddingTop: 16,
                paddingBottom: 8,
              }}
            >
              <TextInput
                value={tempFullName}
                onChangeText={setTempFullName}
                placeholder="Your full name"
                placeholderTextColor="#C4A8A4"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={saveFullName}
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 17,
                  color: "#09332C",
                  borderWidth: 1,
                  borderColor: "#F0E4E1",
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  backgroundColor: "#F8F4F0",
                }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Nickname Sheet ── */}
      <Modal
        visible={editingNickname}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingNickname(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }}
          onPress={() => setEditingNickname(false)}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            style={{
              backgroundColor: "#ffffff",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingBottom: insets.bottom + 12,
            }}
          >
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
              <Pressable onPress={() => setEditingNickname(false)} hitSlop={12}>
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
                Nickname
              </Text>
              <Pressable onPress={saveNickname} hitSlop={12}>
                <Text
                  style={{
                    fontFamily: fonts.semibold,
                    fontSize: 16,
                    color: "#A9334D",
                  }}
                >
                  Save
                </Text>
              </Pressable>
            </View>
            <View
              style={{
                paddingHorizontal: 20,
                paddingTop: 16,
                paddingBottom: 8,
              }}
            >
              <TextInput
                value={tempNickname}
                onChangeText={setTempNickname}
                placeholder="e.g. Alex"
                placeholderTextColor="#C4A8A4"
                autoFocus
                maxLength={20}
                returnKeyType="done"
                onSubmitEditing={saveNickname}
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 17,
                  color: "#09332C",
                  borderWidth: 1,
                  borderColor: "#F0E4E1",
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  backgroundColor: "#F8F4F0",
                }}
              />
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 12,
                  color: "#C4A8A4",
                  marginTop: 6,
                  textAlign: "right",
                }}
              >
                {tempNickname.length}/20
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Appearance Sheet ── */}
      <Modal
        visible={editingAppearance}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingAppearance(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }}
          onPress={() => setEditingAppearance(false)}
        />
        <View
          style={{
            backgroundColor: "#ffffff",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingBottom: insets.bottom + 12,
          }}
        >
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
            <Pressable onPress={() => setEditingAppearance(false)} hitSlop={12}>
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
              Appearance
            </Text>
            <View style={{ width: 60 }} />
          </View>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 13,
              color: "#9CA3AF",
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: 4,
            }}
          >
            Choose how Hemo looks on your device.
          </Text>
          {[
            { label: "Light", value: "light" },
            { label: "Dark", value: "dark" },
            { label: "System Default", value: "system" },
          ].map((opt, i, arr) => (
            <React.Fragment key={opt.value}>
              <Pressable
                onPress={() => {
                  setTheme(opt.value);
                  setEditingAppearance(false);
                }}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  backgroundColor: pressed ? "#F8F4F0" : "#ffffff",
                })}
              >
                <Text
                  style={{
                    fontFamily: fonts.medium,
                    fontSize: 16,
                    color: "#09332C",
                    flex: 1,
                  }}
                >
                  {opt.label}
                </Text>
                {theme === opt.value && <Check size={18} color="#A9334D" />}
              </Pressable>
              {i < arr.length - 1 && (
                <View
                  style={{
                    height: 1,
                    backgroundColor: "#F0E4E1",
                    marginLeft: 20,
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </View>
      </Modal>

      {/* ── Language Sheet ── */}
      <Modal
        visible={editingLanguage}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingLanguage(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }}
          onPress={() => setEditingLanguage(false)}
        />
        <View
          style={{
            backgroundColor: "#ffffff",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingBottom: insets.bottom + 12,
          }}
        >
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
            <Pressable onPress={() => setEditingLanguage(false)} hitSlop={12}>
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
              Language
            </Text>
            <View style={{ width: 60 }} />
          </View>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 13,
              color: "#9CA3AF",
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: 4,
            }}
          >
            More languages coming soon.
          </Text>
          <Pressable
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 14,
              paddingHorizontal: 20,
              backgroundColor: pressed ? "#F8F4F0" : "#ffffff",
            })}
          >
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: 16,
                color: "#09332C",
                flex: 1,
              }}
            >
              English
            </Text>
            <Check size={18} color="#A9334D" />
          </Pressable>
        </View>
      </Modal>

      {/* ── Profile Photo Sheet ── */}
      <BottomSheet
        ref={photoSheetRef}
        index={-1}
        snapPoints={profile?.avatarUrl ? ["30%"] : ["22%"]}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: "#fff", borderRadius: 24 }}
        handleIndicatorStyle={{ backgroundColor: "#D1D5DB", width: 36 }}
      >
        <BottomSheetView
          style={{
            paddingHorizontal: 24,
            paddingTop: 4,
            paddingBottom: insets.bottom + 16,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.semibold,
              fontSize: 17,
              color: "#09332C",
              marginBottom: 16,
            }}
          >
            Profile Photo
          </Text>

          {/* Take photo */}
          <TouchableOpacity
            onPress={handleTakePhoto}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              paddingVertical: 13,
              borderTopWidth: 1,
              borderTopColor: "#F3F4F6",
            }}
            activeOpacity={0.6}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: "#F8F4F0",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Camera size={18} color="#A9334D" />
            </View>
            <Text
              style={{
                fontFamily: fonts.semibold,
                fontSize: 16,
                color: "#09332C",
              }}
            >
              Take photo
            </Text>
          </TouchableOpacity>

          {/* Choose from library */}
          <TouchableOpacity
            onPress={handleChoosePhoto}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              paddingVertical: 13,
              borderTopWidth: 1,
              borderTopColor: "#F3F4F6",
            }}
            activeOpacity={0.6}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: "#F8F4F0",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Images size={18} color="#A9334D" />
            </View>
            <Text
              style={{
                fontFamily: fonts.semibold,
                fontSize: 16,
                color: "#09332C",
              }}
            >
              Choose from library
            </Text>
          </TouchableOpacity>

          {/* Remove photo — only shown when one exists */}
          {profile?.avatarUrl ? (
            <TouchableOpacity
              onPress={handleRemovePhoto}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                paddingVertical: 13,
                borderTopWidth: 1,
                borderTopColor: "#F3F4F6",
              }}
              activeOpacity={0.6}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: "#FEF2F2",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Trash2 size={18} color="#DC2626" />
              </View>
              <Text
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: 16,
                  color: "#DC2626",
                }}
              >
                Remove photo
              </Text>
            </TouchableOpacity>
          ) : null}
        </BottomSheetView>
      </BottomSheet>

      <AppleHealthModal
        visible={appleHealthModalVisible}
        onClose={() => setAppleHealthModalVisible(false)}
        onContinue={() => setAppleHealthModalVisible(false)}
      />

      {shouldPreloadFeedback ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: -1000,
            left: -1000,
            width: 1,
            height: 1,
            overflow: "hidden",
          }}
        >
          <WebView
            source={{ uri: USERJOT_FEEDBACK_URL }}
            onLoadEnd={openFeedbackModal}
            onError={() => {
              setIsFeedbackInitializing(false);
              setShouldPreloadFeedback(false);
              Alert.alert(
                "Unable to open feedback",
                "Please check your connection and try again.",
              );
            }}
            style={{
              width: 1,
              height: 1,
              opacity: 0,
              flex: 0,
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // Sticky header — no background of its own, blur fills in on scroll
  header: {
    overflow: "hidden",
  },
  headerContent: {
    paddingBottom: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerNickname: {
    fontFamily: "Geist_700Bold",
    fontSize: 17,
    color: "#09332C",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 8,
  },
  headerBorder: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#D1C8C4",
  },
});
