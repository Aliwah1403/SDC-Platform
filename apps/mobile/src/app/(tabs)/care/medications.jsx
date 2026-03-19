import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  Plus,
  Pill,
  Check,
  ChevronRight,
  Camera,
  Clock,
} from "lucide-react-native";
import { useAppStore } from "@/store/appStore";
import { fonts } from "@/utils/fonts";

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

function Divider() {
  return <View style={{ height: 1, backgroundColor: C.divider, marginLeft: 54 }} />;
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

function Card({ children }) {
  return (
    <View
      style={{
        backgroundColor: C.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: C.border,
        overflow: "hidden",
        marginBottom: 24,
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
  );
}

function MedicationScheduleRow({ medication, onToggle, onPress }) {
  const color = CATEGORY_COLORS[medication.category] ?? C.accent;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16 }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          backgroundColor: `${color}18`,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Pill size={18} color={color} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.medium, fontSize: 15, color: C.dark }}>
          {medication.name}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2, gap: 4 }}>
          <Clock size={11} color={C.muted} />
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: C.muted }}>
            {medication.dosage ? `${medication.dosage} · ` : ""}{medication.time}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={onToggle}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          borderWidth: medication.taken ? 0 : 1.5,
          borderColor: medication.taken ? "transparent" : "#D1D5DB",
          backgroundColor: medication.taken ? C.success : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {medication.taken && <Check size={14} color="#fff" strokeWidth={2.5} />}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function MedicationListRow({ medication, onPress }) {
  const color = CATEGORY_COLORS[medication.category] ?? C.accent;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      style={{ flexDirection: "row", alignItems: "center", paddingVertical: 13, paddingHorizontal: 16 }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          backgroundColor: `${color}18`,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Pill size={18} color={color} />
      </View>
      <Text style={{ fontFamily: fonts.medium, fontSize: 15, color: C.dark, flex: 1 }}>
        {medication.name}
      </Text>
      <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: C.muted, marginRight: 4 }}>
        {medication.dosage}
      </Text>
      <ChevronRight size={18} color={C.muted} />
    </TouchableOpacity>
  );
}

export default function MedicationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { medications, toggleMedicationTaken } = useAppStore();

  const active = medications.filter((m) => m.isActive);
  const takenCount = active.filter((m) => m.taken).length;
  const dueCount = active.length - takenCount;
  const progressPct = active.length > 0 ? takenCount / active.length : 0;

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
        {/* Summary card */}
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

        {/* Today's Schedule */}
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
          <Card>
            {active.map((med) => (
              <MedicationScheduleRow
                key={med.id}
                medication={med}
                onToggle={() => toggleMedicationTaken(med.id)}
                onPress={() =>
                  router.push({ pathname: "/medication-detail", params: { medicationId: med.id } })
                }
              />
            ))}
          </Card>
        )}

        {/* All Medications */}
        {medications.length > 0 && (
          <>
            <SectionLabel title="All Medications" />
            <Card>
              {medications.map((med) => (
                <MedicationListRow
                  key={med.id}
                  medication={med}
                  onPress={() =>
                    router.push({ pathname: "/medication-detail", params: { medicationId: med.id } })
                  }
                />
              ))}
            </Card>
          </>
        )}

        {/* Bottom actions */}
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
