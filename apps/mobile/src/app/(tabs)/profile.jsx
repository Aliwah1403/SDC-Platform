import React, { useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Alert,
  Share,
  Switch,
  TextInput,
  Keyboard,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ChevronRight,
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
} from "lucide-react-native";
import { useAppStore } from "../../store/appStore";
import { fonts } from "@/utils/fonts";
import { useRouter } from "expo-router";

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
      {rightElement === "chevron" && <ChevronRight size={18} color="#C4A8A4" />}
    </View>
  );
  if (onPress)
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.6}>
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

  const {
    currentUser,
    healthStreak,
    emergencyContacts,
    onboardingData,
    setOnboardingField,
  } = useAppStore();

  const [notificationsEnabled, setNotificationsEnabled] = useState(
    onboardingData?.notificationsEnabled ?? false,
  );
  const [biometricsEnabled, setBiometricsEnabled] = useState(
    onboardingData?.biometricsEnabled ?? false,
  );
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(null);

  const scdType = onboardingData?.scdType || currentUser?.scdType;
  const age = formatAge(onboardingData?.dob) ?? currentUser?.age;
  const medicationsCount = onboardingData?.medications?.length ?? 0;
  const emergencyCount = emergencyContacts?.length ?? 0;
  const initials = getInitials(currentUser?.name);

  const handleToggleNotifications = (val) => {
    setNotificationsEnabled(val);
    setOnboardingField("notificationsEnabled", val);
  };
  const handleToggleBiometrics = (val) => {
    setBiometricsEnabled(val);
    setOnboardingField("biometricsEnabled", val);
  };
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
        `Hemo — Health Summary\nPatient: ${currentUser?.name}\nAge: ${age}\nSCD Type: ${scdType}\nHealth Streak: ${healthStreak} days\nDate: ${new Date().toLocaleDateString()}\n\nGenerated by Hemo.`.trim();
      await Share.share({ message: summary, title: "Health Summary" });
    } catch {
      Alert.alert("Error", "Unable to share health summary");
    }
  };
  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () =>
          Alert.alert("Signed Out", "You have been signed out successfully."),
      },
    ]);
  };
  const comingSoon = (feature) =>
    Alert.alert(feature, `${feature} is coming soon.`);

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

  // Flat list of all settings items for search
  const allSettings = useMemo(
    () => [
      {
        key: "scd-type",
        label: "SCD Type",
        section: "My Health",
        icon: Dna,
        iconColor: "#A9334D",
        onPress: () => comingSoon("SCD Type"),
      },
      {
        key: "dob",
        label: "Date of Birth",
        section: "My Health",
        icon: Calendar,
        iconColor: "#781D11",
        onPress: () => comingSoon("Date of Birth"),
      },
      {
        key: "height-weight",
        label: "Height & Weight",
        section: "My Health",
        icon: Ruler,
        iconColor: "#059669",
        onPress: () => comingSoon("Height & Weight"),
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
        label: "Daily Check-in Time",
        section: "Reminders",
        icon: Clock,
        iconColor: "#F0531C",
        onPress: () => comingSoon("Check-in Time"),
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
        onPress: () => comingSoon("Apple Health"),
      },
      {
        key: "manage-profile",
        label: "Manage Profile",
        section: "Account",
        icon: User,
        iconColor: "#09332C",
        onPress: () => comingSoon("Manage Profile"),
      },
      {
        key: "password",
        label: "Password & Security",
        section: "Account",
        icon: Lock,
        iconColor: "#6B7280",
        onPress: () => comingSoon("Password & Security"),
      },
      {
        key: "biometrics",
        label: "Biometric Login",
        section: "Account",
        icon: Fingerprint,
        iconColor: "#6B7280",
        onPress: () => comingSoon("Biometric Login"),
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
                  backgroundColor: `${item.iconColor}18`,
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

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile Header ── */}
        <View
          style={{
            backgroundColor: "#ffffff",
            paddingBottom: 20,
            borderBottomWidth: 1,
            borderBottomColor: "#F0E4E1",
            marginBottom: 24,
          }}
        >
          {/* Top bar: Search | QR */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: insets.top + 12,
              paddingHorizontal: 20,
              marginBottom: 20,
            }}
          >
            <TouchableOpacity
              onPress={openSearch}
              activeOpacity={0.6}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "#F8F4F0",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Search size={20} color="#09332C" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  "ED Emergency Card",
                  "Your scannable QR card is coming soon.\n\nED staff will be able to scan it to instantly view your SCD type, medications, allergies, pain plan, and emergency contacts — no login required.",
                )
              }
              activeOpacity={0.6}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "#F8F4F0",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <QrCode size={20} color="#09332C" />
            </TouchableOpacity>
          </View>

          {/* Centered avatar + identity */}
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                backgroundColor: "#09332C",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 32,
                  color: "#F8E9E7",
                }}
              >
                {initials}
              </Text>
            </View>

            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 22,
                color: "#09332C",
                marginBottom: 4,
              }}
            >
              {currentUser?.name ?? "—"}
            </Text>
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 13,
                color: "#9CA3AF",
                marginBottom: 10,
              }}
            >
              {currentUser?.email ?? "—"}
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
              onPress={() => comingSoon("SCD Type")}
            />
            <SettingRow
              icon={Calendar}
              iconColor="#781D11"
              label="Date of Birth"
              value={
                onboardingData?.dob
                  ? formatDob(onboardingData.dob)
                  : age
                    ? `Age ${age}`
                    : "Not set"
              }
              rightElement="chevron"
              onPress={() => comingSoon("Date of Birth")}
            />
            <SettingRow
              icon={Ruler}
              iconColor="#059669"
              label="Height & Weight"
              value={
                onboardingData?.height || onboardingData?.weight
                  ? `${formatHeight(onboardingData.height)} · ${formatWeight(onboardingData.weight)}`
                  : "Not set"
              }
              rightElement="chevron"
              onPress={() => comingSoon("Height & Weight")}
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
            <SettingRow
              icon={Clock}
              iconColor="#F0531C"
              label="Daily Check-in Time"
              value={onboardingData?.checkInTime || "Not set"}
              rightElement="chevron"
              onPress={() => comingSoon("Check-in Time")}
            />
            <SettingRowToggle
              icon={Bell}
              iconColor="#F0531C"
              label="Notifications"
              value={notificationsEnabled}
              onChange={handleToggleNotifications}
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
              label="Connect Apple Health"
              value="Not connected"
              rightElement="chevron"
              onPress={() => comingSoon("Apple Health")}
            />
          </SectionCard>

          <SectionCard title="Account">
            <SettingRow
              icon={User}
              iconColor="#09332C"
              label="Manage Profile"
              rightElement="chevron"
              onPress={() => comingSoon("Manage Profile")}
            />
            <SettingRow
              icon={Lock}
              iconColor="#6B7280"
              label="Password & Security"
              rightElement="chevron"
              onPress={() => comingSoon("Password & Security")}
            />
            <SettingRowToggle
              icon={Fingerprint}
              iconColor="#6B7280"
              label="Biometric Login"
              value={biometricsEnabled}
              onChange={handleToggleBiometrics}
            />
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
      </ScrollView>
    </View>
  );
}
