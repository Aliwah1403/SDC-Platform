import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { fonts } from "@/utils/fonts";

function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}

const TYPE_CONFIG = {
  routine: { label: "Routine", color: "#A9334D", bg: "#F8E9E7" },
  "blood-work": { label: "Lab Work", color: "#D09F9A", bg: "#F0E4E1" },
  "follow-up": { label: "Follow-up", color: "#781D11", bg: "#FFF0ED" },
  specialist: { label: "Specialist", color: "#09332C", bg: "#F8F4F0" },
};

function getTypeConfig(type) {
  return (
    TYPE_CONFIG[type] ?? { label: "Appointment", color: "#9CA3AF", bg: "#F5F5F5" }
  );
}

function AppointmentCard({ appt }) {
  const days = daysUntil(appt.date);
  const dateObj = new Date(appt.date);
  const dayNum = dateObj.getDate();
  const monthStr = dateObj
    .toLocaleDateString("en-US", { month: "short" })
    .toUpperCase();
  const typeConfig = getTypeConfig(appt.type);

  const subLine = appt.doctor || appt.specialty || null;
  const detailLine = [appt.time, appt.facility].filter(Boolean).join(" · ");

  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#F0E4E1",
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
      }}
    >
      {/* Date block */}
      <View
        style={{
          width: 52,
          alignItems: "center",
          backgroundColor: "#F8F4F0",
          borderRadius: 12,
          paddingVertical: 8,
          paddingHorizontal: 4,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.bold,
            fontSize: 24,
            color: "#09332C",
            lineHeight: 28,
          }}
        >
          {dayNum}
        </Text>
        <Text
          style={{
            fontFamily: fonts.medium,
            fontSize: 11,
            color: "#9CA3AF",
            letterSpacing: 0.5,
          }}
        >
          {monthStr}
        </Text>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <View
          style={{
            alignSelf: "flex-start",
            backgroundColor: typeConfig.bg,
            borderRadius: 20,
            paddingHorizontal: 9,
            paddingVertical: 3,
            marginBottom: 5,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.medium,
              fontSize: 11,
              color: typeConfig.color,
            }}
          >
            {typeConfig.label}
          </Text>
        </View>

        <Text
          style={{
            fontFamily: fonts.bold,
            fontSize: 15,
            color: "#09332C",
            marginBottom: 2,
          }}
          numberOfLines={1}
        >
          {appt.title}
        </Text>

        {subLine && (
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 13,
              color: "#9CA3AF",
              marginBottom: 1,
            }}
          >
            {subLine}
          </Text>
        )}

        {detailLine.length > 0 && (
          <Text
            style={{ fontFamily: fonts.regular, fontSize: 12, color: "#9CA3AF" }}
            numberOfLines={1}
          >
            {detailLine}
          </Text>
        )}
      </View>

      {/* Days countdown */}
      <View
        style={{
          width: 52,
          alignItems: "center",
          backgroundColor: "#F8F4F0",
          borderRadius: 12,
          paddingVertical: 8,
          paddingHorizontal: 4,
        }}
      >
        {days === 0 ? (
          <Text
            style={{
              fontFamily: fonts.bold,
              fontSize: 11,
              color: "#A9334D",
              textAlign: "center",
            }}
          >
            Today
          </Text>
        ) : (
          <>
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 22,
                color: "#09332C",
                lineHeight: 26,
              }}
            >
              {days}
            </Text>
            <Text
              style={{ fontFamily: fonts.regular, fontSize: 11, color: "#9CA3AF" }}
            >
              {days === 1 ? "day" : "days"}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

export function AppointmentSection({ appointments }) {
  const router = useRouter();

  const upcoming = appointments
    .filter((a) => daysUntil(a.date) >= 0 && a.status !== "completed")
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  if (upcoming.length === 0) return null;

  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <Text style={{ fontFamily: fonts.bold, fontSize: 17, color: "#09332C" }}>
          Upcoming Appointments
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/care/appointments")}
          activeOpacity={0.7}
        >
          <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: "#A9334D" }}>
            See all →
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ gap: 10 }}>
        {upcoming.map((appt) => (
          <TouchableOpacity
            key={appt.id}
            activeOpacity={0.85}
            onPress={() => router.push("/care/appointments")}
          >
            <AppointmentCard appt={appt} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
