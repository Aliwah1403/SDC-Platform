import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  StyleSheet,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { Image } from "react-native";
import {
  ChevronLeft,
  Activity,
  Heart,
  Waves,
  Thermometer,
  Wind,
  Moon,
  Droplets,
  AlertCircle,
  Smile,
} from "lucide-react-native";
import { useAppStore } from "@/store/appStore";
import { fonts } from "@/utils/fonts";
import { useTheme } from "@/hooks/useTheme";

const READ_ITEMS = [
  {
    key: "readSteps",
    label: "Steps",
    description: "Daily step count from iPhone or Apple Watch",
    icon: Activity,
    iconColor: "#059669",
  },
  {
    key: "readHeartRate",
    label: "Heart Rate",
    description: "Resting heart rate — SCD patients typically 80–100 bpm",
    icon: Heart,
    iconColor: "#EF4444",
  },
  {
    key: "readSpO2",
    label: "Blood Oxygen (SpO2)",
    description: "Oxygen saturation — requires Apple Watch Series 6+",
    icon: Waves,
    iconColor: "#0EA5E9",
  },
  {
    key: "readTemperature",
    label: "Body Temperature",
    description: "Fever ≥38°C triggers an urgent alert — requires Apple Watch",
    icon: Thermometer,
    iconColor: "#F59E0B",
  },
  {
    key: "readRespiratoryRate",
    label: "Respiratory Rate",
    description: "Elevated rate may indicate Acute Chest Syndrome",
    icon: Wind,
    iconColor: "#8B5CF6",
  },
  {
    key: "readSleep",
    label: "Sleep",
    description: "Nightly sleep duration from iPhone or Apple Watch",
    icon: Moon,
    iconColor: "#6366F1",
  },
];

const WRITE_ITEMS = [
  {
    key: "writeHydration",
    label: "Water Intake",
    description: "Saves your logged glasses to Apple Health",
    icon: Droplets,
    iconColor: "#3B82F6",
  },
  {
    key: "writeSymptoms",
    label: "Symptoms",
    description: "Logs fatigue, shortness of breath, fever and others",
    icon: AlertCircle,
    iconColor: "#A9334D",
  },
  {
    key: "writeMood",
    label: "Mood",
    description: "Saves mood check-ins as mindful sessions",
    icon: Smile,
    iconColor: "#7C3AED",
  },
];

function SectionHeader({ title }) {
  const t = useTheme();
  const styles = createStyles(t);
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function Divider() {
  const t = useTheme();
  const styles = createStyles(t);
  return <View style={styles.divider} />;
}

function PreferenceRow({ icon: Icon, iconColor, label, description, value, onChange }) {
  const t = useTheme();
  const styles = createStyles(t);
  return (
    <View style={styles.row}>
      <View style={[styles.iconBubble, { backgroundColor: `${iconColor}18` }]}>
        <Icon size={17} color={iconColor} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {description ? <Text style={styles.rowDesc}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: t.border, true: "#A9334D" }}
        thumbColor="#ffffff"
        ios_backgroundColor={t.border}
      />
    </View>
  );
}

export default function AppleHealthSettingsScreen() {
  const t = useTheme();
  const posthog = usePostHog();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = createStyles(t);
  const {
    healthKitPreferences: prefs,
    setHealthKitPreference,
    setHealthKitConnected,
    healthKitData,
    healthKitManualBaselines,
    setHealthKitManualBaseline,
  } = useAppStore();

  function handleDisconnect() {
    Alert.alert(
      "Disconnect Apple Health",
      "Hemo will stop reading and writing data with Apple Health. Your existing health data in Hemo is not affected.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: () => {
            posthog?.capture("healthkit_disconnected");
            setHealthKitConnected(false);
            router.back();
          },
        },
      ],
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.6}
        >
          <ChevronLeft size={20} color={t.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Apple Health</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 16,
          paddingTop: 16,
        }}
      >
        {/* Connected status card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Image
              source={require("../../assets/images/icon-apple-health.png")}
              style={styles.ahIcon}
              resizeMode="contain"
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.statusLabel}>Apple Health</Text>
              <Text style={styles.statusConnected}>Connected</Text>
            </View>
            <TouchableOpacity
              onPress={handleDisconnect}
              activeOpacity={0.7}
              style={styles.disconnectBtn}
            >
              <Text style={styles.disconnectText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Read from Apple Health */}
        <SectionHeader title="Read from Apple Health" />
        <View style={styles.card}>
          {READ_ITEMS.map((item, i) => (
            <View key={item.key}>
              <PreferenceRow
                icon={item.icon}
                iconColor={item.iconColor}
                label={item.label}
                description={item.description}
                value={prefs[item.key] ?? true}
                onChange={(v) => {
                  posthog?.capture("healthkit_pref_changed", { enabled: v });
                  setHealthKitPreference(item.key, v);
                }}
              />
              {i < READ_ITEMS.length - 1 && <Divider />}
            </View>
          ))}
        </View>

        {/* Write to Apple Health */}
        <SectionHeader title="Send to Apple Health" />
        <View style={styles.card}>
          {WRITE_ITEMS.map((item, i) => (
            <View key={item.key}>
              <PreferenceRow
                icon={item.icon}
                iconColor={item.iconColor}
                label={item.label}
                description={item.description}
                value={prefs[item.key] ?? true}
                onChange={(v) => {
                  posthog?.capture("healthkit_pref_changed", { enabled: v });
                  setHealthKitPreference(item.key, v);
                }}
              />
              {i < WRITE_ITEMS.length - 1 && <Divider />}
            </View>
          ))}
        </View>

        {/* Personal Baselines */}
        <SectionHeader title="Personal Baselines" />
        <View style={styles.card}>
          <View style={styles.baselineRow}>
            <View style={styles.baselineText}>
              <Text style={styles.rowLabel}>Resting Blood Oxygen</Text>
              <Text style={styles.rowDesc}>
                Your typical SpO₂ if chronically below 95%
              </Text>
            </View>
            <View style={styles.baselineInputWrap}>
              <TextInput
                style={styles.baselineInput}
                keyboardType="numeric"
                placeholder="—"
                placeholderTextColor={t.textSecondary}
                maxLength={3}
                value={
                  healthKitManualBaselines.spO2 != null
                    ? String(healthKitManualBaselines.spO2)
                    : ""
                }
                onChangeText={(v) => {
                  const n = parseInt(v, 10);
                  setHealthKitManualBaseline(
                    "spO2",
                    v === ""
                      ? null
                      : n >= 50 && n <= 99
                        ? n
                        : healthKitManualBaselines.spO2,
                  );
                }}
              />
              <Text style={styles.baselineUnit}>%</Text>
            </View>
          </View>
          <Divider />
          <View style={styles.baselineRow}>
            <View style={styles.baselineText}>
              <Text style={styles.rowLabel}>Resting Heart Rate</Text>
              <Text style={styles.rowDesc}>
                Your typical HR if outside the standard range
              </Text>
            </View>
            <View style={styles.baselineInputWrap}>
              <TextInput
                style={styles.baselineInput}
                keyboardType="numeric"
                placeholder="—"
                placeholderTextColor={t.textSecondary}
                maxLength={3}
                value={
                  healthKitManualBaselines.heartRate != null
                    ? String(healthKitManualBaselines.heartRate)
                    : ""
                }
                onChangeText={(v) => {
                  const n = parseInt(v, 10);
                  setHealthKitManualBaseline(
                    "heartRate",
                    v === ""
                      ? null
                      : n >= 30 && n <= 200
                        ? n
                        : healthKitManualBaselines.heartRate,
                  );
                }}
              />
              <Text style={styles.baselineUnit}>bpm</Text>
            </View>
          </View>
        </View>
        <Text style={styles.baselineHint}>
          Leave blank to use automatic 7-day averages. Set these if your doctor
          has confirmed your personal baseline differs from typical ranges.
        </Text>

        {/* Help note */}
        <TouchableOpacity style={styles.helpRow} activeOpacity={0.6}>
          <AlertCircle size={15} color={t.textSecondary} />
          <Text style={styles.helpText}>
            Not seeing data? Check permissions in iOS Settings → Privacy &
            Security → Health → Hemo SCD
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function createStyles(t) {
  return StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingBottom: 12,
      backgroundColor: t.background,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: t.surfaceElevated,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontFamily: "Geist_700Bold",
      fontSize: 17,
      color: t.text,
    },
    statusCard: {
      backgroundColor: t.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: t.border,
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    ahIcon: {
      width: 44,
      height: 44,
    },
    statusLabel: {
      fontFamily: "Geist_600SemiBold",
      fontSize: 15,
      color: t.text,
    },
    statusConnected: {
      fontFamily: "Geist_400Regular",
      fontSize: 13,
      color: "#059669",
      marginTop: 1,
    },
    disconnectBtn: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 8,
      backgroundColor: t.isDark ? "rgba(220,38,38,0.12)" : "#FEF2F2",
    },
    disconnectText: {
      fontFamily: "Geist_600SemiBold",
      fontSize: 13,
      color: "#DC2626",
    },
    sectionHeader: {
      fontFamily: "Geist_600SemiBold",
      fontSize: 11,
      color: t.textSecondary,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      marginBottom: 6,
      marginLeft: 4,
    },
    card: {
      backgroundColor: t.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: t.border,
      overflow: "hidden",
      marginBottom: 24,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 13,
      paddingHorizontal: 16,
      gap: 12,
    },
    iconBubble: {
      width: 34,
      height: 34,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    rowText: {
      flex: 1,
    },
    rowLabel: {
      fontFamily: "Geist_500Medium",
      fontSize: 15,
      color: t.text,
    },
    rowDesc: {
      fontFamily: "Geist_400Regular",
      fontSize: 12,
      color: t.textSecondary,
      marginTop: 1,
      lineHeight: 16,
    },
    divider: {
      height: 1,
      backgroundColor: t.divider,
      marginLeft: 62,
    },
    helpRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      paddingHorizontal: 4,
    },
    helpText: {
      fontFamily: "Geist_400Regular",
      fontSize: 12,
      color: t.textSecondary,
      flex: 1,
      lineHeight: 18,
    },
    baselineRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 13,
      paddingHorizontal: 16,
      gap: 12,
    },
    baselineText: {
      flex: 1,
    },
    baselineInputWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    baselineInput: {
      width: 52,
      height: 36,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: t.border,
      backgroundColor: t.surfaceElevated,
      textAlign: "center",
      fontFamily: "Geist_500Medium",
      fontSize: 15,
      color: t.text,
    },
    baselineUnit: {
      fontFamily: "Geist_400Regular",
      fontSize: 13,
      color: t.textSecondary,
      minWidth: 28,
    },
    baselineHint: {
      fontFamily: "Geist_400Regular",
      fontSize: 12,
      color: t.textSecondary,
      lineHeight: 18,
      marginTop: -16,
      marginBottom: 24,
      paddingHorizontal: 4,
    },
  });
}
