import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ChevronLeft,
  Pill,
  Clock,
  Calendar,
  User,
  FileText,
  Check,
  Activity,
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

function InfoRow({ icon: Icon, iconColor, label, value }) {
  if (!value) return null;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 13, paddingHorizontal: 16 }}>
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
      <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: C.muted, flex: 1 }}>{label}</Text>
      <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: C.dark, maxWidth: "55%", textAlign: "right" }}>
        {value}
      </Text>
    </View>
  );
}

function Card({ children }) {
  const validChildren = React.Children.toArray(children).filter(Boolean);
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
      {validChildren.map((child, i) => (
        <React.Fragment key={i}>
          {child}
          {i < validChildren.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </View>
  );
}

export default function MedicationDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { medicationId } = useLocalSearchParams();
  const { medications, toggleMedicationTaken } = useAppStore();

  const med = medications.find((m) => m.id === medicationId);

  if (!med) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontFamily: fonts.medium, fontSize: 16, color: C.muted }}>Medication not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ fontFamily: fonts.medium, fontSize: 15, color: C.accent }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const color = CATEGORY_COLORS[med.category] ?? C.accent;
  const takenTimeLabel = med.takenAt
    ? new Date(med.takenAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

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

        <Text style={{ fontFamily: fonts.bold, fontSize: 20, color: C.dark, flex: 1 }} numberOfLines={1}>
          {med.name}
        </Text>

        <TouchableOpacity
          onPress={() => router.push({ pathname: "/add-medication", params: { medicationId: med.id } })}
          activeOpacity={0.6}
        >
          <Text style={{ fontFamily: fonts.medium, fontSize: 15, color: C.accent }}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity block */}
        <View
          style={{
            backgroundColor: C.card,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: C.border,
            padding: 20,
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundColor: `${color}18`,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 16,
            }}
          >
            <Pill size={26} color={color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 20, color: C.dark, marginBottom: 4 }}>
              {med.name}
            </Text>
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              {med.dosage ? (
                <View style={{ backgroundColor: `${color}18`, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 }}>
                  <Text style={{ fontFamily: fonts.semibold, fontSize: 12, color }}>
                    {med.dosage}
                  </Text>
                </View>
              ) : null}
              {med.category ? (
                <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: C.muted }}>
                  {med.category}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Schedule */}
        <SectionLabel title="Schedule" />
        <Card>
          <InfoRow icon={Clock} iconColor="#F0531C" label="Frequency" value={med.frequency} />
          <InfoRow icon={Clock} iconColor={C.muted} label="Time" value={med.time} />
          <InfoRow icon={Clock} iconColor={C.accent} label="Next dose" value={med.nextDose} />
        </Card>

        {/* Details */}
        <SectionLabel title="Details" />
        <Card>
          <InfoRow icon={User} iconColor="#09332C" label="Prescribed by" value={med.prescribedBy || "Not specified"} />
          <InfoRow
            icon={Calendar}
            iconColor="#781D11"
            label="Start date"
            value={med.startDate ? new Date(med.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "Not set"}
          />
          <InfoRow icon={FileText} iconColor={C.muted} label="Notes" value={med.notes || "None"} />
        </Card>

        {/* Adherence placeholder */}
        <SectionLabel title="Adherence" />
        <View
          style={{
            backgroundColor: C.card,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: C.border,
            padding: 20,
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <Activity size={24} color={C.muted} />
          <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: C.muted, marginTop: 10, textAlign: "center" }}>
            Adherence tracking coming soon
          </Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: C.muted, marginTop: 4, textAlign: "center" }}>
            Your medication history will appear here
          </Text>
        </View>
      </ScrollView>

      {/* Footer — mark as taken */}
      <View
        style={{
          backgroundColor: C.bg,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: insets.bottom + 16,
          borderTopWidth: 1,
          borderTopColor: C.border,
        }}
      >
        {med.taken ? (
          <View
            style={{
              backgroundColor: "#D1FAE5",
              borderRadius: 14,
              paddingVertical: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Check size={18} color={C.success} strokeWidth={2.5} />
            <Text style={{ fontFamily: fonts.semibold, fontSize: 16, color: C.success }}>
              Taken{takenTimeLabel ? ` at ${takenTimeLabel}` : ""}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => toggleMedicationTaken(med.id)}
            activeOpacity={0.8}
            style={{
              backgroundColor: C.success,
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: "center",
            }}
          >
            <Text style={{ fontFamily: fonts.semibold, fontSize: 16, color: "#fff" }}>
              Mark as Taken
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
