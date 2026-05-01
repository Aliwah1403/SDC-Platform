import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Calendar, Pill } from "lucide-react-native";
import { fonts } from "@/utils/fonts";

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

export function ContextualCards({ appointments = [], medications = [], hasLoggedToday }) {
  const router = useRouter();

  const nextAppt = appointments
    .filter((a) => {
      const days = daysUntil(a.date);
      return days >= 0 && days <= 7;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  const showMedReminder = medications.length > 0 && !hasLoggedToday;

  if (!nextAppt && !showMedReminder) return null;

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

      {showMedReminder && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push("/care/medications")}
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
            borderLeftColor: "#D09F9A",
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
            <Pill size={18} color="#A9334D" strokeWidth={2} />
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
              {medications.length} medication{medications.length !== 1 ? "s" : ""} scheduled today
            </Text>
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 12,
                color: "#6B7280",
              }}
            >
              Tap to view your medication schedule
            </Text>
          </View>
          <Text style={{ fontSize: 16, color: "#D09F9A" }}>›</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
