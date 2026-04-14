import { View, Text, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { fonts } from "@/utils/fonts";
import { useAppStore } from "@/store/appStore";
import { useMedicationsQuery } from "@/hooks/queries/useMedicationsQuery";
import { useAppointmentsQuery } from "@/hooks/queries/useAppointmentsQuery";
import { useEmergencyContactsQuery } from "@/hooks/queries/useEmergencyContactsQuery";
import { useSavedFacilitiesQuery } from "@/hooks/queries/useSavedFacilitiesQuery";
import {
  Pill,
  Calendar,
  Users,
  FileText,
  MapPin,
  ShieldAlert,
  Bell,
  User,
  ChevronRight,
} from "lucide-react-native";

const HEMO_GRADIENT = ["#D09F9A", "#A9334D", "#781D11"];
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HALF_CARD = (SCREEN_WIDTH - 40 - 12) / 2;

const CARD_SHADOW = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 3,
};


function formatApptDate(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const apptDate = new Date(dateStr + "T00:00:00");
  const diff = Math.round((apptDate - today) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return apptDate.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function EmergencyButton({ onPress, isActive }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        borderRadius: 20,
        marginBottom: 16,
        overflow: "visible",
        shadowColor: isActive ? "#DC2626" : "#A9334D",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 8,
      }}
    >
      {/* Pulse rings */}
      <MotiView
        from={{ scale: 1, opacity: 0.22 }}
        animate={{ scale: 1.06, opacity: 0 }}
        transition={{ type: "timing", duration: 2000, loop: true }}
        style={{
          position: "absolute",
          top: -6, bottom: -6, left: -6, right: -6,
          borderRadius: 26,
          backgroundColor: isActive ? "#DC2626" : "#A9334D",
        }}
      />
      <MotiView
        from={{ scale: 1, opacity: 0.16 }}
        animate={{ scale: 1.03, opacity: 0 }}
        transition={{ type: "timing", duration: 2000, loop: true, delay: 400 }}
        style={{
          position: "absolute",
          top: -3, bottom: -3, left: -3, right: -3,
          borderRadius: 23,
          backgroundColor: "#781D11",
        }}
      />

      <LinearGradient
        colors={isActive ? ["#DC2626", "#A9334D", "#781D11"] : ["#A9334D", "#781D11", "#0D0D0D"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 20, padding: 20, overflow: "hidden" }}
      >
        <View style={{ position: "absolute", width: 130, height: 130, borderRadius: 999, backgroundColor: "#D09F9A", opacity: 0.12, top: -40, right: 30 }} />
        <View style={{ position: "absolute", width: 80, height: 80, borderRadius: 999, backgroundColor: "#781D11", opacity: 0.2, bottom: -24, left: -20 }} />

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center", marginRight: 16 }}>
            <ShieldAlert size={26} color="#FFFFFF" strokeWidth={2.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.extrabold, fontSize: 20, color: "#FFFFFF", marginBottom: 3 }}>
              {isActive ? "Crisis Mode Active" : "Activate Crisis Mode"}
            </Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 18 }}>
              {isActive ? "Tap to view your active crisis protocol" : "Step-by-step SCD crisis guidance"}
            </Text>
          </View>
          <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginLeft: 12 }}>
            <ChevronRight size={18} color="#FFFFFF" strokeWidth={2.5} />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function MedsCard({ taken, total, onPress }) {
  const pct = total > 0 ? taken / total : 0;
  const due = total - taken;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{ backgroundColor: "#FFFFFF", borderRadius: 18, padding: 18, marginBottom: 14, ...CARD_SHADOW }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        <View style={{ width: 36, alignItems: "center", justifyContent: "center", marginRight: 14, marginTop: 2 }}>
          <Pill size={26} color="#A9334D" strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 17, color: "#09332C" }}>Medications</Text>
            {due > 0 && (
              <View style={{ backgroundColor: "#FEE2E2", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
                <Text style={{ fontFamily: fonts.semibold, fontSize: 11, color: "#DC2626" }}>{due} due</Text>
              </View>
            )}
          </View>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: "#9CA3AF", marginBottom: 12 }}>
            {total > 0 ? `${taken} of ${total} taken today` : "No medications added"}
          </Text>
          <View style={{ height: 6, backgroundColor: "#F3F4F6", borderRadius: 3, overflow: "hidden" }}>
            <View style={{ height: "100%", width: `${pct * 100}%`, backgroundColor: "#A9334D", borderRadius: 3 }} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function AppointmentsCard({ appointment, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{ backgroundColor: "#FFFFFF", borderRadius: 18, padding: 18, marginBottom: 14, ...CARD_SHADOW }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ width: 36, alignItems: "center", justifyContent: "center", marginRight: 14 }}>
          <Calendar size={26} color="#09332C" strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 17, color: "#09332C", marginBottom: 3 }}>Appointments</Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: appointment ? "#09332C" : "#9CA3AF" }}>
            {appointment ? (appointment.doctor || appointment.title) : "No upcoming appointments"}
          </Text>
        </View>
        {appointment && (
          <View style={{ backgroundColor: "#E6F0EF", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontFamily: fonts.semibold, fontSize: 11, color: "#09332C" }}>
              {formatApptDate(appointment.date)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const AVATAR_PLACEHOLDERS = ["#A9334D", "#059669", "#2563EB", "#7C3AED"];

function CareTeamCard({ contactCount, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{ width: HALF_CARD, backgroundColor: "#FFFFFF", borderRadius: 18, padding: 16, minHeight: 148, justifyContent: "space-between", ...CARD_SHADOW }}
    >
      <View style={{ marginBottom: 12 }}>
        <Users size={24} color="#059669" strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: "#09332C", marginBottom: 8 }}>Care Team</Text>
        <View style={{ flexDirection: "row", marginBottom: 8 }}>
          {AVATAR_PLACEHOLDERS.map((color, i) => (
            <View
              key={i}
              style={{
                width: 28, height: 28, borderRadius: 14,
                backgroundColor: color,
                marginLeft: i === 0 ? 0 : -8,
                zIndex: AVATAR_PLACEHOLDERS.length - i,
                borderWidth: 2, borderColor: "#FFFFFF",
              }}
            />
          ))}
        </View>
        <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "#9CA3AF" }}>
          {contactCount} {contactCount === 1 ? "contact" : "contacts"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function CrisisPlanCard({ onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{ width: HALF_CARD, backgroundColor: "#FFFFFF", borderRadius: 18, padding: 16, minHeight: 148, justifyContent: "space-between", ...CARD_SHADOW }}
    >
      <View style={{ marginBottom: 12 }}>
        <FileText size={24} color="#DC2626" strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: "#09332C", marginBottom: 8 }}>Crisis Plan</Text>
        <View style={{ alignSelf: "flex-start", backgroundColor: "#D1FAE5", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 6 }}>
          <Text style={{ fontFamily: fonts.semibold, fontSize: 11, color: "#059669" }}>Plan ready</Text>
        </View>
        <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "#9CA3AF" }}>
          View your personalized plan
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function ClinicsCard({ savedCount, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{ backgroundColor: "#FFFFFF", borderRadius: 18, padding: 18, marginBottom: 14, ...CARD_SHADOW }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ width: 36, alignItems: "center", justifyContent: "center", marginRight: 14 }}>
          <MapPin size={26} color="#F0531C" strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 17, color: "#09332C", marginBottom: 3 }}>Clinics & Hospitals</Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: "#9CA3AF" }}>
            {savedCount > 0 ? `${savedCount} saved nearby` : "Find nearby facilities"}
          </Text>
        </View>
        {savedCount > 0 && (
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#FEF0EB", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, gap: 4 }}>
            <MapPin size={12} color="#F0531C" strokeWidth={2.5} />
            <Text style={{ fontFamily: fonts.semibold, fontSize: 11, color: "#F0531C" }}>{savedCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────

export default function CareMenuScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const crisisMode = useAppStore((s) => s.crisisMode);

  const { data: savedFacilities = [] } = useSavedFacilitiesQuery();
  const { data: medications = [] } = useMedicationsQuery();
  const { data: appointments = [] } = useAppointmentsQuery();
  const { data: contacts = [] } = useEmergencyContactsQuery();

  // Derive medication stats
  const medsTaken = medications.filter((m) => m.taken).length;
  const medsTotal = medications.length;
  const medsDue = medsTotal - medsTaken;

  // Next upcoming appointment
  const todayStr = new Date().toISOString().split("T")[0];
  const nextAppt = appointments
    .filter((a) => a.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;

  // Summary header line
  const summaryLine = [
    medsDue > 0 ? `${medsDue} med${medsDue > 1 ? "s" : ""} due today` : "All meds taken",
    nextAppt ? "1 appt this week" : "No upcoming appts",
  ].join("  ·  ");

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F4F0" }}>
      <StatusBar style="light" />

      {/* Header */}
      <LinearGradient
        colors={HEMO_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top + 12, paddingBottom: 24, paddingHorizontal: 20, overflow: "hidden" }}
      >
        <View style={{ position: "absolute", width: 180, height: 180, borderRadius: 999, backgroundColor: "#D09F9A", opacity: 0.15, top: -60, right: -40 }} />
        <View style={{ position: "absolute", width: 120, height: 120, borderRadius: 999, backgroundColor: "#781D11", opacity: 0.15, bottom: -20, left: -30 }} />

        {/* Row 1: title + actions */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 24, color: "#F8E9E7" }}>Care</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TouchableOpacity
              onPress={() => router.push("/notifications")}
              style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, width: 40, height: 40, alignItems: "center", justifyContent: "center" }}
              activeOpacity={0.7}
            >
              <Bell size={20} color="#F8E9E7" strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/profile")}
              style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, width: 40, height: 40, alignItems: "center", justifyContent: "center" }}
              activeOpacity={0.7}
            >
              <User size={20} color="#F8E9E7" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Row 2: contextual status summary */}
        <View style={{ marginTop: 18 }}>
          <Text style={{ fontFamily: fonts.semibold, fontSize: 11, color: "rgba(248,233,231,0.65)", textTransform: "uppercase", letterSpacing: 0.9, marginBottom: 5 }}>
            Your care, at a glance
          </Text>
          <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: "#F8E9E7" }}>{summaryLine}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 20, paddingHorizontal: 20, paddingBottom: insets.bottom + 100 }}
      >
        <MotiView from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 320, delay: 0 }}>
          <EmergencyButton onPress={() => router.push("/crisis-mode")} isActive={crisisMode.isActive} />
        </MotiView>

        <MotiView from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 320, delay: 80 }}>
          <MedsCard taken={medsTaken} total={medsTotal} onPress={() => router.push("/(tabs)/care/medications")} />
        </MotiView>

        <MotiView from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 320, delay: 160 }}>
          <AppointmentsCard appointment={nextAppt} onPress={() => router.push("/(tabs)/care/appointments")} />
        </MotiView>

        <MotiView from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 320, delay: 240 }} style={{ flexDirection: "row", gap: 12, marginBottom: 14 }}>
          <CareTeamCard contactCount={contacts.length} onPress={() => router.push("/(tabs)/care/care-team")} />
          <CrisisPlanCard onPress={() => router.push("/(tabs)/care/crisis-plan")} />
        </MotiView>

        <MotiView from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 320, delay: 320 }}>
          <ClinicsCard savedCount={savedFacilities.length} onPress={() => router.push("/(tabs)/care/facilities")} />
        </MotiView>
      </ScrollView>
    </View>
  );
}
