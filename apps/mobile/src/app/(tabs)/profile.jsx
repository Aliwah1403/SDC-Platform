import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Switch,
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
  if (!cm) return "Not set";
  return `${cm} cm`;
}

function formatWeight(kg) {
  if (!kg) return "Not set";
  return `${kg} kg`;
}

function formatDob(dob) {
  if (!dob) return "Not set";
  const d = new Date(dob);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function formatAge(dob) {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

// ─── primitive components ────────────────────────────────────────────────────

function Divider() {
  return <View style={{ height: 1, backgroundColor: "#F8E9E7", marginLeft: 54 }} />;
}

function SettingRow({ icon: Icon, iconColor = "#A9334D", label, value, rightElement, onPress, isLast }) {
  const content = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 13,
        paddingHorizontal: 16,
      }}
    >
      {/* icon bubble */}
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          backgroundColor: `${iconColor}18`,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Icon size={18} color={iconColor} />
      </View>

      {/* label */}
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

      {/* right side */}
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

  if (onPress) {
    return <TouchableOpacity onPress={onPress} activeOpacity={0.6}>{content}</TouchableOpacity>;
  }
  return content;
}

function SettingRowToggle({ icon: Icon, iconColor = "#A9334D", label, value, onChange }) {
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
          backgroundColor: `${iconColor}18`,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Icon size={18} color={iconColor} />
      </View>
      <Text style={{ fontFamily: fonts.medium, fontSize: 15, color: "#09332C", flex: 1 }}>
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
        { text: "Export", onPress: () => Alert.alert("Success", "Health data export initiated!") },
      ],
    );
  };

  const handleShareSummary = async () => {
    try {
      const summary = `Hemo — Health Summary\nPatient: ${currentUser?.name}\nAge: ${age}\nSCD Type: ${scdType}\nHealth Streak: ${healthStreak} days\nDate: ${new Date().toLocaleDateString()}\n\nGenerated by Hemo.`.trim();
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
        onPress: () => Alert.alert("Signed Out", "You have been signed out successfully."),
      },
    ]);
  };

  const comingSoon = (feature) =>
    Alert.alert(feature, `${feature} is coming soon.`);

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
            paddingTop: insets.top + 16,
            paddingBottom: 20,
            paddingHorizontal: 20,
            borderBottomWidth: 1,
            borderBottomColor: "#F0E4E1",
            marginBottom: 24,
          }}
        >
          {/* Avatar + name + email */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            {/* Initials circle */}
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: "#09332C",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 14,
              }}
            >
              <Text style={{ fontFamily: fonts.bold, fontSize: 22, color: "#F8E9E7" }}>
                {initials}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 20, color: "#09332C", marginBottom: 2 }}>
                {currentUser?.name ?? "—"}
              </Text>
              <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: "#9CA3AF", marginBottom: 6 }}>
                {currentUser?.email ?? "—"}
              </Text>
              {/* SCD type badge */}
              {scdType ? (
                <View
                  style={{
                    alignSelf: "flex-start",
                    backgroundColor: "#A9334D",
                    borderRadius: 20,
                    paddingHorizontal: 10,
                    paddingVertical: 3,
                  }}
                >
                  <Text style={{ fontFamily: fonts.semibold, fontSize: 11, color: "#ffffff" }}>
                    {scdType}
                  </Text>
                </View>
              ) : null}
            </View>

            <TouchableOpacity
              onPress={() => comingSoon("Edit Profile")}
              style={{
                backgroundColor: "#F8F4F0",
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderWidth: 1,
                borderColor: "#F0E4E1",
              }}
            >
              <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: "#09332C" }}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Stats strip */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "#F8F4F0",
              borderRadius: 12,
              paddingVertical: 12,
            }}
          >
            {[
              { label: "Day Streak", value: healthStreak ?? 0 },
              { label: "Total Logs", value: currentUser?.totalLogs ?? 0 },
              { label: "Days Active", value: currentUser?.joinedDays ?? 0 },
            ].map((stat, i) => (
              <View key={stat.label} style={{ flex: 1, alignItems: "center" }}>
                {i > 0 && (
                  <View
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 4,
                      bottom: 4,
                      width: 1,
                      backgroundColor: "#F0E4E1",
                    }}
                  />
                )}
                <Text style={{ fontFamily: fonts.bold, fontSize: 20, color: "#09332C" }}>
                  {stat.value}
                </Text>
                <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Content ── */}
        <View style={{ paddingHorizontal: 16 }}>

          {/* My Health */}
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
              value={onboardingData?.dob ? formatDob(onboardingData.dob) : age ? `Age ${age}` : "Not set"}
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

          {/* Medical */}
          <SectionCard title="Medical">
            <SettingRow
              icon={Pill}
              iconColor="#A9334D"
              label="Medications"
              value={medicationsCount > 0 ? `${medicationsCount} active` : "None added"}
              rightElement="chevron"
              onPress={() => router.push("/(tabs)/care/medications")}
            />
            <SettingRow
              icon={Phone}
              iconColor="#DC2626"
              label="Emergency Contacts"
              value={emergencyCount > 0 ? `${emergencyCount} contacts` : "None added"}
              rightElement="chevron"
              onPress={() => comingSoon("Emergency Contacts")}
            />
          </SectionCard>

          {/* Reminders */}
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

          {/* Data & Reports */}
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

          {/* Account */}
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

          {/* Support */}
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

          {/* Sign Out */}
          <SectionCard>
            <SettingRow
              icon={LogOut}
              iconColor="#DC2626"
              label="Sign Out"
              onPress={handleSignOut}
            />
          </SectionCard>

          {/* Footer */}
          <View style={{ alignItems: "center", marginTop: 4 }}>
            <Text style={{ fontFamily: fonts.semibold, fontSize: 12, color: "#A9334D", marginBottom: 2 }}>
              Hemo
            </Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: "#C4A8A4" }}>
              Your sickle cell companion
            </Text>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}
