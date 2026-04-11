import { View, Text, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { fonts } from "@/utils/fonts";
import {
  Pill,
  Calendar,
  Users,
  FileText,
  MapPin,
  Phone,
  Bell,
  User,
  ChevronRight,
} from "lucide-react-native";

const HEMO_GRADIENT = ["#D09F9A", "#A9334D", "#781D11"];
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HALF_CARD = (SCREEN_WIDTH - 40 - 12) / 2;

const MOCK = {
  meds: { taken: 3, total: 5 },
  appointment: { doctor: "Dr. Mensah", when: "Tomorrow" }, // set to null if none
  careTeam: { count: 4, initials: ["AM", "JK", "LO"] },
  crisisPlan: { ready: true },
  clinics: { saved: 4 },
};

const AVATAR_COLORS = ["#A9334D", "#059669", "#2563EB", "#7C3AED"];

const CARD_SHADOW = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 3,
};

function EmergencyButton({ onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        borderRadius: 20,
        marginBottom: 16,
        overflow: "visible",
        shadowColor: "#DC2626",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 8,
      }}
    >
      {/* Outer pulse ring */}
      <MotiView
        from={{ scale: 1, opacity: 0.22 }}
        animate={{ scale: 1.06, opacity: 0 }}
        transition={{ type: "timing", duration: 2000, loop: true }}
        style={{
          position: "absolute",
          top: -6,
          bottom: -6,
          left: -6,
          right: -6,
          borderRadius: 26,
          backgroundColor: "#DC2626",
        }}
      />
      {/* Inner pulse ring */}
      <MotiView
        from={{ scale: 1, opacity: 0.16 }}
        animate={{ scale: 1.03, opacity: 0 }}
        transition={{ type: "timing", duration: 2000, loop: true, delay: 400 }}
        style={{
          position: "absolute",
          top: -3,
          bottom: -3,
          left: -3,
          right: -3,
          borderRadius: 23,
          backgroundColor: "#A9334D",
        }}
      />

      <LinearGradient
        colors={["#DC2626", "#A9334D", "#781D11"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 20, padding: 20, overflow: "hidden" }}
      >
        {/* Decorative shapes */}
        <View
          style={{
            position: "absolute",
            width: 130,
            height: 130,
            borderRadius: 999,
            backgroundColor: "#D09F9A",
            opacity: 0.15,
            top: -40,
            right: 30,
          }}
        />
        <View
          style={{
            position: "absolute",
            width: 80,
            height: 80,
            borderRadius: 999,
            backgroundColor: "#781D11",
            opacity: 0.2,
            bottom: -24,
            left: -20,
          }}
        />

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: "rgba(255,255,255,0.22)",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 16,
            }}
          >
            <Phone size={26} color="#FFFFFF" strokeWidth={2.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: fonts.extrabold,
                fontSize: 20,
                color: "#FFFFFF",
                marginBottom: 3,
              }}
            >
              Emergency Help
            </Text>
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 13,
                color: "rgba(255,255,255,0.85)",
                lineHeight: 18,
              }}
            >
              Tap to access SOS & emergency contacts
            </Text>
          </View>
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: "rgba(255,255,255,0.2)",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: 12,
            }}
          >
            <ChevronRight size={18} color="#FFFFFF" strokeWidth={2.5} />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function MedsCard({ onPress }) {
  const pct = MOCK.meds.taken / MOCK.meds.total;
  const due = MOCK.meds.total - MOCK.meds.taken;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 18,
        marginBottom: 14,
        ...CARD_SHADOW,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        <View style={{ width: 36, alignItems: "center", justifyContent: "center", marginRight: 14, marginTop: 2 }}>
          <Pill size={26} color="#A9334D" strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 2,
            }}
          >
            <Text style={{ fontFamily: fonts.bold, fontSize: 17, color: "#09332C" }}>
              Medications
            </Text>
            {due > 0 && (
              <View
                style={{
                  backgroundColor: "#FEE2E2",
                  borderRadius: 20,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                }}
              >
                <Text style={{ fontFamily: fonts.semibold, fontSize: 11, color: "#DC2626" }}>
                  {due} due
                </Text>
              </View>
            )}
          </View>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: "#9CA3AF", marginBottom: 12 }}>
            {MOCK.meds.taken} of {MOCK.meds.total} taken today
          </Text>
          {/* Progress bar */}
          <View
            style={{
              height: 6,
              backgroundColor: "#F3F4F6",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                width: `${pct * 100}%`,
                backgroundColor: "#A9334D",
                borderRadius: 3,
              }}
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function AppointmentsCard({ onPress }) {
  const appt = MOCK.appointment;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 18,
        marginBottom: 14,
        ...CARD_SHADOW,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ width: 36, alignItems: "center", justifyContent: "center", marginRight: 14 }}>
          <Calendar size={26} color="#09332C" strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 17, color: "#09332C", marginBottom: 3 }}>
            Appointments
          </Text>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 13,
              color: appt ? "#09332C" : "#9CA3AF",
            }}
          >
            {appt ? `${appt.doctor}` : "No upcoming appointments"}
          </Text>
        </View>
        {appt && (
          <View
            style={{
              backgroundColor: "#E6F0EF",
              borderRadius: 20,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <Text style={{ fontFamily: fonts.semibold, fontSize: 11, color: "#09332C" }}>
              {appt.when}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function CareTeamCard({ onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        width: HALF_CARD,
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 16,
        minHeight: 148,
        justifyContent: "space-between",
        ...CARD_SHADOW,
      }}
    >
      <View style={{ marginBottom: 12 }}>
        <Users size={24} color="#059669" strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: "#09332C", marginBottom: 8 }}>
          Care Team
        </Text>
        {/* Overlapping avatar initials */}
        <View style={{ flexDirection: "row", marginBottom: 8 }}>
          {MOCK.careTeam.initials.map((initial, index) => (
            <View
              key={index}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
                alignItems: "center",
                justifyContent: "center",
                marginLeft: index === 0 ? 0 : -8,
                zIndex: MOCK.careTeam.initials.length - index,
                borderWidth: 2,
                borderColor: "#FFFFFF",
              }}
            >
              <Text style={{ fontFamily: fonts.bold, fontSize: 9, color: "#FFFFFF" }}>
                {initial}
              </Text>
            </View>
          ))}
        </View>
        <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "#9CA3AF" }}>
          {MOCK.careTeam.count} contacts
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function CrisisPlanCard({ onPress }) {
  const ready = MOCK.crisisPlan.ready;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        width: HALF_CARD,
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 16,
        minHeight: 148,
        justifyContent: "space-between",
        ...CARD_SHADOW,
      }}
    >
      <View style={{ marginBottom: 12 }}>
        <FileText size={24} color="#DC2626" strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: "#09332C", marginBottom: 8 }}>
          Crisis Plan
        </Text>
        <View
          style={{
            alignSelf: "flex-start",
            backgroundColor: ready ? "#D1FAE5" : "#FEF3C7",
            borderRadius: 20,
            paddingHorizontal: 10,
            paddingVertical: 4,
            marginBottom: 6,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.semibold,
              fontSize: 11,
              color: ready ? "#059669" : "#D97706",
            }}
          >
            {ready ? "Plan ready" : "Not set up"}
          </Text>
        </View>
        <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "#9CA3AF" }}>
          View your personalized plan
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function ClinicsCard({ onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 18,
        marginBottom: 14,
        ...CARD_SHADOW,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ width: 36, alignItems: "center", justifyContent: "center", marginRight: 14 }}>
          <MapPin size={26} color="#F0531C" strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 17, color: "#09332C", marginBottom: 3 }}>
            Clinics & Hospitals
          </Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: "#9CA3AF" }}>
            {MOCK.clinics.saved} saved nearby
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#FEF0EB",
            borderRadius: 20,
            paddingHorizontal: 10,
            paddingVertical: 4,
            gap: 4,
          }}
        >
          <MapPin size={12} color="#F0531C" strokeWidth={2.5} />
          <Text style={{ fontFamily: fonts.semibold, fontSize: 11, color: "#F0531C" }}>
            {MOCK.clinics.saved}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function CareMenuScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const dueMeds = MOCK.meds.total - MOCK.meds.taken;
  const summaryLine = [
    dueMeds > 0 ? `${dueMeds} med${dueMeds > 1 ? "s" : ""} due today` : "All meds taken",
    MOCK.appointment ? "1 appt this week" : "No upcoming appts",
  ].join("  ·  ");

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F4F0" }}>
      <StatusBar style="light" />

      {/* Header */}
      <LinearGradient
        colors={HEMO_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: insets.top + 12,
          paddingBottom: 24,
          paddingHorizontal: 20,
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <View
          style={{
            position: "absolute",
            width: 180,
            height: 180,
            borderRadius: 999,
            backgroundColor: "#D09F9A",
            opacity: 0.15,
            top: -60,
            right: -40,
          }}
        />
        <View
          style={{
            position: "absolute",
            width: 120,
            height: 120,
            borderRadius: 999,
            backgroundColor: "#781D11",
            opacity: 0.15,
            bottom: -20,
            left: -30,
          }}
        />

        {/* Row 1: title + actions */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ fontFamily: fonts.bold, fontSize: 24, color: "#F8E9E7" }}>
            Care
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TouchableOpacity
              onPress={() => router.push("/notifications")}
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                borderRadius: 20,
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
              }}
              activeOpacity={0.7}
            >
              <Bell size={20} color="#F8E9E7" strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/profile")}
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                borderRadius: 20,
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
              }}
              activeOpacity={0.7}
            >
              <User size={20} color="#F8E9E7" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Row 2: contextual status summary */}
        <View style={{ marginTop: 18 }}>
          <Text
            style={{
              fontFamily: fonts.semibold,
              fontSize: 11,
              color: "rgba(248,233,231,0.65)",
              textTransform: "uppercase",
              letterSpacing: 0.9,
              marginBottom: 5,
            }}
          >
            Your care, at a glance
          </Text>
          <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: "#F8E9E7" }}>
            {summaryLine}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 20,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 100,
        }}
      >
        {/* Emergency Help */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 320, delay: 0 }}
        >
          <EmergencyButton onPress={() => router.push("/(tabs)/care/emergency")} />
        </MotiView>

        {/* Medications */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 320, delay: 80 }}
        >
          <MedsCard onPress={() => router.push("/(tabs)/care/medications")} />
        </MotiView>

        {/* Appointments */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 320, delay: 160 }}
        >
          <AppointmentsCard onPress={() => router.push("/(tabs)/care/appointments")} />
        </MotiView>

        {/* Care Team + Crisis Plan — 2-column grid */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 320, delay: 240 }}
          style={{ flexDirection: "row", gap: 12, marginBottom: 14 }}
        >
          <CareTeamCard onPress={() => router.push("/(tabs)/care/care-team")} />
          <CrisisPlanCard onPress={() => router.push("/(tabs)/care/crisis-plan")} />
        </MotiView>

        {/* Clinics & Hospitals */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 320, delay: 320 }}
        >
          <ClinicsCard onPress={() => router.push("/(tabs)/care/facilities")} />
        </MotiView>
      </ScrollView>
    </View>
  );
}
