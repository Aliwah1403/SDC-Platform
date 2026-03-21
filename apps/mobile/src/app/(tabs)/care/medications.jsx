import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from "react-native";

const CARD_WIDTH = (Dimensions.get("window").width - 32 - 12) / 2;
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  Plus,
  Pill,
  Check,
  ChevronRight,
  Camera,
} from "lucide-react-native";
import { MotiView } from "moti";
import { useAppStore } from "@/store/appStore";
import { fonts } from "@/utils/fonts";
import MedicationIcon from "@/components/MedicationIcon";

const C = {
  bg: "#F8F4F0",
  card: "#ffffff",
  border: "#F0E4E1",
  divider: "#F8E9E7",
  dark: "#09332C",
  muted: "#9CA3AF",
  accent: "#A9334D",
  success: "#059669",
  warning: "#DC2626",
};

const CATEGORY_COLORS = {
  "Disease-modifying": "#A9334D",
  "Iron chelation": "#F0531C",
  Supportive: "#059669",
};

// Time-of-day groups
const TIME_GROUPS = [
  { key: "morning",   label: "Morning",   emoji: "🌅", hours: [5, 11] },
  { key: "afternoon", label: "Afternoon", emoji: "☀️", hours: [12, 16] },
  { key: "evening",   label: "Evening",   emoji: "🌆", hours: [17, 20] },
  { key: "night",     label: "Night",     emoji: "🌙", hours: [21, 4] },
];

function parseHour(timeStr = "") {
  // e.g. "8:00 AM" → 8, "12:00 PM" → 12, "6:00 PM" → 18
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 8;
  let h = parseInt(match[1], 10);
  const period = match[3].toUpperCase();
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return h;
}

function getGroupKey(timeStr) {
  const h = parseHour(timeStr);
  for (const g of TIME_GROUPS) {
    const [start, end] = g.hours;
    if (start <= end) {
      if (h >= start && h <= end) return g.key;
    } else {
      // wraps midnight (night group)
      if (h >= start || h <= end) return g.key;
    }
  }
  return "morning";
}

function buildGroups(meds) {
  const map = {};
  for (const g of TIME_GROUPS) map[g.key] = [];
  for (const m of meds) {
    const key = getGroupKey(m.time);
    map[key].push(m);
  }
  return TIME_GROUPS
    .filter((g) => map[g.key].length > 0)
    .map((g) => ({ ...g, meds: map[g.key] }));
}

function SectionLabel({ title }) {
  return (
    <Text
      style={{
        fontFamily: fonts.semibold,
        fontSize: 11,
        color: C.muted,
        letterSpacing: 0.8,
        textTransform: "uppercase",
        marginBottom: 6,
        marginLeft: 4,
      }}
    >
      {title}
    </Text>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: C.divider, marginLeft: 76 }} />;
}

function GroupHeader({ group, onLogAll, allTaken }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 10,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: "#F8E9E7",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 10,
        }}
      >
        <Text style={{ fontSize: 18 }}>{group.emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.semibold, fontSize: 15, color: C.dark }}>
          {group.label}
        </Text>
        {group.meds[0]?.time ? (
          <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: C.muted, marginTop: 1 }}>
            {group.meds[0].time} reminder
          </Text>
        ) : null}
      </View>
      <TouchableOpacity
        onPress={onLogAll}
        disabled={allTaken}
        activeOpacity={0.7}
        style={{
          borderWidth: 1,
          borderColor: allTaken ? C.divider : C.border,
          borderRadius: 20,
          paddingHorizontal: 14,
          paddingVertical: 6,
          backgroundColor: allTaken ? C.bg : C.card,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.medium,
            fontSize: 13,
            color: allTaken ? C.muted : C.dark,
          }}
        >
          {allTaken ? "All done ✓" : "Log all"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function MedicationScheduleRow({ medication, onToggle, onPress, index }) {
  const color = CATEGORY_COLORS[medication.category] ?? C.accent;
  return (
    <MotiView
      from={{ opacity: 0, translateY: 6 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 280, delay: index * 60 }}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.6}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 12,
          paddingHorizontal: 16,
        }}
      >
        {/* Medication type icon */}
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            backgroundColor: `${color}12`,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <MedicationIcon type={medication.type ?? "tablet"} color={color} size={40} />
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: fonts.semibold,
              fontSize: 15,
              color: medication.taken ? C.muted : C.dark,
              textDecorationLine: medication.taken ? "line-through" : "none",
            }}
          >
            {medication.name}
          </Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: C.muted, marginTop: 2 }}>
            {[medication.dosage, medication.category].filter(Boolean).join(" · ")}
          </Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: C.muted, marginTop: 1, opacity: 0.75 }}>
            {medication.frequency}
          </Text>
        </View>

        {/* Taken toggle */}
        <TouchableOpacity
          onPress={onToggle}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            borderWidth: medication.taken ? 0 : 1.5,
            borderColor: medication.taken ? "transparent" : "#D1D5DB",
            backgroundColor: medication.taken ? C.success : "transparent",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {medication.taken ? (
            <Check size={16} color="#fff" strokeWidth={2.5} />
          ) : (
            <Plus size={16} color={C.muted} strokeWidth={2} />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </MotiView>
  );
}

function MedicationGridCard({ medication, onPress }) {
  const color = CATEGORY_COLORS[medication.category] ?? C.accent;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        width: CARD_WIDTH,
        backgroundColor: C.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: C.border,
        overflow: "hidden",
      }}
    >
      {/* Icon area */}
      <View
        style={{
          height: 96,
          backgroundColor: `${color}10`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MedicationIcon type={medication.type ?? "tablet"} color={color} size={52} />
      </View>

      {/* Info area */}
      <View style={{ padding: 12 }}>
        <Text
          numberOfLines={1}
          style={{ fontFamily: fonts.semibold, fontSize: 14, color: C.dark, marginBottom: 2 }}
        >
          {medication.name}
        </Text>
        {medication.dosage ? (
          <Text
            numberOfLines={1}
            style={{ fontFamily: fonts.regular, fontSize: 12, color: C.muted, marginBottom: 8 }}
          >
            {medication.dosage}
          </Text>
        ) : (
          <View style={{ marginBottom: 8 }} />
        )}
        <View
          style={{
            alignSelf: "flex-start",
            backgroundColor: `${color}15`,
            borderRadius: 6,
            paddingHorizontal: 7,
            paddingVertical: 3,
          }}
        >
          <Text
            numberOfLines={1}
            style={{ fontFamily: fonts.medium, fontSize: 10, color, textTransform: "uppercase", letterSpacing: 0.3 }}
          >
            {medication.category}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function MedicationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { medications, toggleMedicationTaken, markGroupTaken } = useAppStore();

  const active = medications.filter((m) => m.isActive);
  const takenCount = active.filter((m) => m.taken).length;
  const dueCount = active.length - takenCount;
  const progressPct = active.length > 0 ? takenCount / active.length : 0;

  const groups = buildGroups(active);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: C.card,
          paddingTop: insets.top + 12,
          paddingBottom: 16,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.6}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: C.bg,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <ChevronLeft size={22} color={C.dark} />
        </TouchableOpacity>

        <Text style={{ fontFamily: fonts.bold, fontSize: 22, color: C.dark, flex: 1 }}>
          Medications
        </Text>

        <TouchableOpacity
          onPress={() => router.push("/add-medication")}
          activeOpacity={0.6}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: C.accent,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Today's Progress */}
        <View
          style={{
            backgroundColor: C.card,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: C.border,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text style={{ fontFamily: fonts.semibold, fontSize: 15, color: C.dark }}>
              Today's Progress
            </Text>
            {dueCount > 0 ? (
              <View style={{ backgroundColor: "#FEE2E2", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
                <Text style={{ fontFamily: fonts.semibold, fontSize: 12, color: C.warning }}>
                  {dueCount} due
                </Text>
              </View>
            ) : (
              <View style={{ backgroundColor: "#D1FAE5", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
                <Text style={{ fontFamily: fonts.semibold, fontSize: 12, color: C.success }}>
                  All done
                </Text>
              </View>
            )}
          </View>
          <View style={{ height: 6, backgroundColor: "#F3F4F6", borderRadius: 3, overflow: "hidden" }}>
            <View
              style={{
                height: "100%",
                width: `${progressPct * 100}%`,
                backgroundColor: progressPct === 1 ? C.success : C.accent,
                borderRadius: 3,
              }}
            />
          </View>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: C.muted, marginTop: 8 }}>
            {takenCount} of {active.length} taken today
          </Text>
        </View>

        {/* Today's Schedule — time grouped */}
        <SectionLabel title="Today's Schedule" />
        {active.length === 0 ? (
          <View
            style={{
              backgroundColor: C.card,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: C.border,
              padding: 32,
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <Pill size={28} color={C.muted} />
            <Text style={{ fontFamily: fonts.medium, fontSize: 15, color: C.muted, marginTop: 10, textAlign: "center" }}>
              No medications added yet
            </Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: C.muted, marginTop: 4, textAlign: "center" }}>
              Tap + to add your first medication
            </Text>
          </View>
        ) : (
          groups.map((group, gi) => {
            const allTaken = group.meds.every((m) => m.taken);
            const untakenIds = group.meds.filter((m) => !m.taken).map((m) => m.id);
            return (
              <View
                key={group.key}
                style={{
                  backgroundColor: C.card,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: C.border,
                  overflow: "hidden",
                  marginBottom: 16,
                }}
              >
                <GroupHeader
                  group={group}
                  allTaken={allTaken}
                  onLogAll={() => markGroupTaken(untakenIds)}
                />
                <View style={{ height: 1, backgroundColor: C.divider }} />
                {group.meds.map((med, i) => (
                  <React.Fragment key={med.id}>
                    <MedicationScheduleRow
                      medication={med}
                      index={gi * 4 + i}
                      onToggle={() => toggleMedicationTaken(med.id)}
                      onPress={() =>
                        router.push({ pathname: "/medication-detail", params: { medicationId: med.id } })
                      }
                    />
                    {i < group.meds.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </View>
            );
          })
        )}

        {/* All Medications */}
        {medications.length > 0 && (
          <>
            <SectionLabel title="All Medications" />
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 24,
              }}
            >
              {medications.map((med) => (
                <MedicationGridCard
                  key={med.id}
                  medication={med}
                  onPress={() =>
                    router.push({ pathname: "/medication-detail", params: { medicationId: med.id } })
                  }
                />
              ))}
            </View>
          </>
        )}

        {/* Add Medication */}
        <TouchableOpacity
          onPress={() => router.push("/add-medication")}
          activeOpacity={0.8}
          style={{
            backgroundColor: C.accent,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Text style={{ fontFamily: fonts.semibold, fontSize: 16, color: "#fff" }}>
            Add Medication
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              "Scan Pill",
              "Use your camera to identify a medication by its barcode or photo. Coming soon.",
            )
          }
          activeOpacity={0.7}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 14,
            paddingVertical: 14,
            borderWidth: 1.5,
            borderColor: C.border,
            gap: 8,
          }}
        >
          <Camera size={18} color={C.dark} />
          <Text style={{ fontFamily: fonts.medium, fontSize: 15, color: C.dark }}>
            Scan Pill
          </Text>
          <View style={{ backgroundColor: C.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text style={{ fontFamily: fonts.medium, fontSize: 11, color: C.muted }}>
              Coming soon
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
