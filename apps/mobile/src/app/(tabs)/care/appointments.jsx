import { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  Plus,
  Clock,
  MapPin,
  User,
  Calendar,
  CalendarCheck,
  MoreHorizontal,
  FileText,
  Pencil,
  Trash2,
} from "lucide-react-native";
import { useAppointmentsQuery, useDeleteAppointmentMutation } from "@/hooks/queries/useAppointmentsQuery";
import { usePostHog } from "posthog-react-native";
import { removeFromDeviceCalendar, cancelReminders } from "@/utils/appointmentUtils";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";

const TYPE_COLORS = {
  "routine":     { bg: "#F8F4F0", text: "#374151" },
  "follow-up":   { bg: "#FBE9ED", text: "#A9334D" },
  "urgent":      { bg: "#FEF2F2", text: "#DC2626" },
  "blood-work":  { bg: "#FEF0EB", text: "#F0531C" },
  "transfusion": { bg: "#F9E8E6", text: "#781D11" },
  "specialist":  { bg: "#F8E9E7", text: "#374151" },
};

const TYPE_LABELS = {
  "routine":     "Routine",
  "follow-up":   "Follow-up",
  "urgent":      "Urgent",
  "blood-work":  "Blood Work",
  "transfusion": "Transfusion",
  "specialist":  "Specialist",
};

function formatApptDate(dateStr) {
  const d = parseISO(dateStr);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "EEE, d MMM yyyy");
}

function AppointmentCard({ appointment, onEdit, onMore }) {
  const typeColor = TYPE_COLORS[appointment.type] ?? { bg: "#F3F4F6", text: "#6B7280" };
  const isPastAppt = isPast(parseISO(appointment.date + "T23:59:59"));

  return (
    <TouchableOpacity
      onPress={onEdit}
      activeOpacity={0.85}
      style={{
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 18,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#F0EDE8",
        opacity: isPastAppt ? 0.75 : 1,
      }}
    >
      {/* Top row: title + ⋯ */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={{ fontSize: 17, fontWeight: "700", color: "#1a1a1a", fontFamily: "Geist-Bold", marginBottom: 3 }}>
            {appointment.title}
          </Text>
          {appointment.doctor ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <User size={13} color="#6B7280" />
              <Text style={{ fontSize: 14, color: "#6B7280", fontFamily: "Geist-Regular" }}>
                Dr. {appointment.doctor}
                {appointment.specialty ? `  ·  ${appointment.specialty}` : ""}
              </Text>
            </View>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={onMore}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          style={{ padding: 4 }}
        >
          <MoreHorizontal size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Type pill */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 8 }}>
        <View style={{ backgroundColor: typeColor.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: typeColor.text, fontFamily: "Geist-SemiBold" }}>
            {TYPE_LABELS[appointment.type] ?? appointment.type}
          </Text>
        </View>
        {appointment.addedToCalendar && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <CalendarCheck size={12} color="#09332C" />
            <Text style={{ fontSize: 12, color: "#09332C", fontFamily: "Geist-Regular" }}>In calendar</Text>
          </View>
        )}
      </View>

      {/* Detail rows */}
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Calendar size={14} color="#A9334D" />
          <Text style={{ fontSize: 14, color: "#374151", fontFamily: "Geist-Regular" }}>
            {formatApptDate(appointment.date)}
          </Text>
          <Clock size={14} color="#A9334D" style={{ marginLeft: 8 }} />
          <Text style={{ fontSize: 14, color: "#374151", fontFamily: "Geist-Regular" }}>
            {appointment.time}
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <MapPin size={14} color="#6B7280" />
          <Text style={{ fontSize: 14, color: "#6B7280", fontFamily: "Geist-Regular", flex: 1 }}>
            {appointment.facility}
          </Text>
        </View>

        {appointment.notes ? (
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 2 }}>
            <FileText size={14} color="#6B7280" style={{ marginTop: 2 }} />
            <Text style={{ fontSize: 13, color: "#9CA3AF", fontFamily: "Geist-Regular", flex: 1 }} numberOfLines={2}>
              {appointment.notes}
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export default function AppointmentsScreen() {
  const posthog = usePostHog();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: appointments = [] } = useAppointmentsQuery();
  const deleteAppt = useDeleteAppointmentMutation();

  const [selectedAppt, setSelectedAppt] = useState(null);
  const sheetRef = useRef(null);

  const today = format(new Date(), "yyyy-MM-dd");

  const upcoming = appointments
    .filter((a) => a.date >= today && a.status !== "cancelled")
    .sort((a, b) => a.date.localeCompare(b.date));

  const past = appointments
    .filter((a) => a.date < today || a.status === "completed")
    .sort((a, b) => b.date.localeCompare(a.date));

  const handleMore = useCallback((appt) => {
    setSelectedAppt(appt);
    sheetRef.current?.expand();
  }, []);

  const handleSheetClose = useCallback(() => {
    sheetRef.current?.close();
    setSelectedAppt(null);
  }, []);

  const handleEdit = useCallback(() => {
    posthog?.capture('appointment_edit_opened', { type: selectedAppt?.type });
    sheetRef.current?.close();
    router.push(`/appointment-form?id=${selectedAppt.id}`);
  }, [selectedAppt]);

  const handleDelete = useCallback(() => {
    sheetRef.current?.close();
    Alert.alert("Delete Appointment", `Remove "${selectedAppt?.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          posthog?.capture('appointment_deleted', { type: selectedAppt?.type });
          if (selectedAppt?.calendarEventId) await removeFromDeviceCalendar(selectedAppt.calendarEventId);
          if (selectedAppt?.reminderIds?.length) await cancelReminders(selectedAppt.reminderIds);
          deleteAppt.mutate(selectedAppt.id);
          setSelectedAppt(null);
        },
      },
    ]);
  }, [selectedAppt]);

  const SectionHeader = ({ label, count }) => (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12, marginTop: 8 }}>
      <Text style={{ fontSize: 16, fontWeight: "700", color: "#09332C", fontFamily: "Geist-Bold" }}>{label}</Text>
      <View style={{ backgroundColor: "#F0EDE8", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 }}>
        <Text style={{ fontSize: 12, fontWeight: "600", color: "#6B7280", fontFamily: "Geist-SemiBold" }}>{count}</Text>
      </View>
    </View>
  );

  const EmptyState = ({ message }) => (
    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 24, alignItems: "center", borderWidth: 1, borderColor: "#F0EDE8", borderStyle: "dashed", marginBottom: 12 }}>
      <Calendar size={32} color="#D09F9A" style={{ marginBottom: 10 }} />
      <Text style={{ fontSize: 14, color: "#9CA3AF", textAlign: "center", fontFamily: "Geist-Regular" }}>{message}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F4F0" }}>
      <StatusBar style="light" />

      {/* Header */}
      <LinearGradient
        colors={["#D09F9A", "#A9334D", "#781D11"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 20, overflow: "hidden" }}
      >
        {/* Abstract shapes */}
        <View style={{ position: "absolute", width: 180, height: 180, borderRadius: 999, backgroundColor: "#D09F9A", opacity: 0.15, top: -60, right: -40 }} />
        <View style={{ position: "absolute", width: 120, height: 120, borderRadius: 999, backgroundColor: "#781D11", opacity: 0.15, bottom: -20, left: -30 }} />

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}
          >
            <ChevronLeft size={24} color="#F8E9E7" />
          </TouchableOpacity>

          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 22, fontWeight: "700", color: "#F8E9E7", fontFamily: "Geist-Bold" }}>
              Appointments
            </Text>
            <Text style={{ fontSize: 13, color: "rgba(248,233,231,0.6)", marginTop: 2, fontFamily: "Geist-Regular" }}>
              {upcoming.length} upcoming
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => { posthog?.capture('appointment_add_tapped'); router.push("/appointment-form"); }}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}
          >
            <Plus size={22} color="#F8E9E7" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Upcoming */}
        <SectionHeader label="Upcoming" count={upcoming.length} />
        {upcoming.length === 0 ? (
          <EmptyState message={"No upcoming appointments.\nTap + to log one."} />
        ) : (
          upcoming.map((appt) => (
            <AppointmentCard
              key={appt.id}
              appointment={appt}
              onEdit={() => router.push(`/appointment-form?id=${appt.id}`)}
              onMore={() => handleMore(appt)}
            />
          ))
        )}

        {/* Past */}
        {past.length > 0 && (
          <>
            <View style={{ height: 16 }} />
            <SectionHeader label="Past" count={past.length} />
            {past.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                onEdit={() => router.push(`/appointment-form?id=${appt.id}`)}
                onMore={() => handleMore(appt)}
              />
            ))}
          </>
        )}
      </ScrollView>

      {/* Actions Bottom Sheet */}
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={["32%"]}
        enablePanDownToClose
        onClose={() => setSelectedAppt(null)}
        backgroundStyle={{ backgroundColor: "#fff", borderRadius: 24 }}
        handleIndicatorStyle={{ backgroundColor: "#D1D5DB", width: 36 }}
      >
        <BottomSheetView style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: insets.bottom + 16 }}>
          {selectedAppt && (
            <>
              {/* Appointment label */}
              <Text style={{ fontSize: 17, fontWeight: "700", color: "#1a1a1a", fontFamily: "Geist-Bold", marginBottom: 4 }}>
                {selectedAppt.title}
              </Text>
              <Text style={{ fontSize: 13, color: "#9CA3AF", fontFamily: "Geist-Regular", marginBottom: 20 }}>
                {formatApptDate(selectedAppt.date)}  ·  {selectedAppt.time}
              </Text>

              {/* Edit */}
              <TouchableOpacity
                onPress={handleEdit}
                style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, borderTopWidth: 1, borderTopColor: "#F3F4F6" }}
              >
                <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: "#F8F4F0", alignItems: "center", justifyContent: "center" }}>
                  <Pencil size={18} color="#A9334D" />
                </View>
                <Text style={{ fontSize: 16, fontWeight: "600", color: "#1a1a1a", fontFamily: "Geist-SemiBold" }}>Edit Appointment</Text>
              </TouchableOpacity>

              {/* Delete */}
              <TouchableOpacity
                onPress={handleDelete}
                style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, borderTopWidth: 1, borderTopColor: "#F3F4F6" }}
              >
                <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: "#FEF2F2", alignItems: "center", justifyContent: "center" }}>
                  <Trash2 size={18} color="#DC2626" />
                </View>
                <Text style={{ fontSize: 16, fontWeight: "600", color: "#DC2626", fontFamily: "Geist-SemiBold" }}>Delete Appointment</Text>
              </TouchableOpacity>
            </>
          )}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}
