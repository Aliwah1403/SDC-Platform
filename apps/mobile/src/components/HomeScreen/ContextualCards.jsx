import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Calendar } from "lucide-react-native";
import { fonts } from "@/utils/fonts";
import { MedicationCard } from "./MedicationCard";

function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}

function formatApptDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function ContextualCards({ appointments = [], medications = [] }) {
  const router = useRouter();

  const nextAppt = appointments
    .filter((a) => {
      const days = daysUntil(a.date);
      return days >= 0 && days <= 7;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  const hasMedications = medications.length > 0;

  if (!nextAppt && !hasMedications) return null;

  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 16, gap: 10 }}>
      {nextAppt && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push("/care/appointments")}
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
            borderLeftWidth: 3,
            borderLeftColor: "#A9334D",
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
            }}
          >
            <Calendar size={18} color="#A9334D" strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: fonts.semibold,
                fontSize: 13,
                color: "#781D11",
                marginBottom: 2,
              }}
            >
              {nextAppt.title || "Upcoming appointment"}
            </Text>
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 12,
                color: "#6B7280",
              }}
            >
              {formatApptDate(nextAppt.date)}
              {daysUntil(nextAppt.date) === 0
                ? " · Today"
                : daysUntil(nextAppt.date) === 1
                ? " · Tomorrow"
                : ` · In ${daysUntil(nextAppt.date)} days`}
            </Text>
          </View>
          <Text style={{ fontSize: 16, color: "#D09F9A" }}>›</Text>
        </TouchableOpacity>
      )}

      {hasMedications && <MedicationCard medications={medications} />}
    </View>
  );
}
