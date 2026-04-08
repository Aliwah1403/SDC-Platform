import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import DateTimePicker from "@react-native-community/datetimepicker";
import { X, Calendar, Clock, MapPin, User, FileText, Bell, CalendarCheck } from "lucide-react-native";
import { useAppointmentsQuery, useAddAppointmentMutation, useUpdateAppointmentMutation } from "@/hooks/queries/useAppointmentsQuery";
import { addToDeviceCalendar, scheduleReminders } from "@/utils/appointmentUtils";
import { format } from "date-fns";

const TYPES = [
  { key: "routine",   label: "Routine" },
  { key: "follow-up", label: "Follow-up" },
  { key: "urgent",    label: "Urgent" },
  { key: "blood-work",label: "Blood Work" },
  { key: "transfusion", label: "Transfusion" },
  { key: "specialist",label: "Specialist" },
];

const SPECIALTIES = ["Hematologist", "GP", "Oncologist", "Cardiologist", "Neurologist", "Other"];

const REMINDER_OPTIONS = [
  { key: "both", label: "1h & 24h before" },
  { key: "day",  label: "24h before only" },
  { key: "hour", label: "1h before only" },
];

export default function AppointmentForm() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();

  const { data: appointments = [] } = useAppointmentsQuery();
  const addAppt = useAddAppointmentMutation();
  const updateAppt = useUpdateAppointmentMutation();

  const existing = id ? appointments.find((a) => a.id === id) : null;

  // Form state
  const [title, setTitle] = useState(existing?.title ?? "");
  const [doctor, setDoctor] = useState(existing?.doctor ?? "");
  const [specialty, setSpecialty] = useState(existing?.specialty ?? "");
  const [showSpecialtyPicker, setShowSpecialtyPicker] = useState(false);
  const [facility, setFacility] = useState(existing?.facility ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [type, setType] = useState(existing?.type ?? "routine");

  const parseExistingDate = () => {
    if (existing?.date) return new Date(existing.date + "T12:00:00");
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  };

  const [date, setDate] = useState(parseExistingDate());
  const [time, setTime] = useState(() => {
    if (existing?.time) {
      const [t, period] = existing.time.split(" ");
      const [h, m] = t.split(":").map(Number);
      const d = new Date();
      d.setHours(period === "PM" && h !== 12 ? h + 12 : period === "AM" && h === 12 ? 0 : h, m, 0, 0);
      return d;
    }
    const d = new Date();
    d.setHours(10, 0, 0, 0);
    return d;
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [remindersOn, setRemindersOn] = useState(existing ? existing.reminderIds?.length > 0 : true);
  const [reminderOption, setReminderOption] = useState("both");
  const [calendarOn, setCalendarOn] = useState(existing?.addedToCalendar ?? false);
  const [saving, setSaving] = useState(false);

  const formatTime = (d) =>
    d.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit", hour12: true });

  const isValid = title.trim().length > 0 && facility.trim().length > 0;

  const handleSave = async () => {
    if (!isValid) {
      Alert.alert("Missing fields", "Please enter at least a title and facility.");
      return;
    }
    setSaving(true);

    const dateStr = format(date, "yyyy-MM-dd");
    const timeStr = formatTime(time);
    const today = format(new Date(), "yyyy-MM-dd");
    const status = dateStr >= today ? "upcoming" : "completed";

    const apptBase = {
      title: title.trim(),
      doctor: doctor.trim(),
      specialty: specialty.trim(),
      facility: facility.trim(),
      date: dateStr,
      time: timeStr,
      type,
      notes: notes.trim(),
      status,
    };

    // Calendar sync
    let calendarEventId = existing?.calendarEventId ?? null;
    if (calendarOn && !existing?.addedToCalendar) {
      calendarEventId = await addToDeviceCalendar({ ...apptBase, id: existing?.id ?? "new" });
    }

    // Notifications
    let reminderIds = existing?.reminderIds ?? [];
    if (remindersOn && status === "upcoming") {
      const opts = {
        both: { hour: true, day: true },
        day:  { hour: false, day: true },
        hour: { hour: true, day: false },
      }[reminderOption];
      reminderIds = await scheduleReminders({ ...apptBase, id: existing?.id ?? "new" }, opts);
    }

    const afterSave = () => { setSaving(false); router.back(); };
    const onSaveError = () => setSaving(false);
    if (existing) {
      updateAppt.mutate(
        { id: existing.id, changes: { ...apptBase, addedToCalendar: calendarOn, calendarEventId, reminderIds } },
        { onSuccess: afterSave, onError: onSaveError },
      );
    } else {
      addAppt.mutate(
        { ...apptBase, addedToCalendar: calendarOn, calendarEventId, reminderIds },
        { onSuccess: afterSave, onError: onSaveError },
      );
    }
  };

  const SectionLabel = ({ icon: Icon, label }) => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8, marginTop: 20 }}>
      <Icon size={16} color="#09332C" strokeWidth={2} />
      <Text style={{ fontSize: 13, fontWeight: "600", color: "#09332C", textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </Text>
    </View>
  );

  const inputStyle = {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    fontFamily: "Geist-Regular",
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F4F0" }}>
      <StatusBar style="dark" />

      {/* Header */}
      <LinearGradient
        colors={["#D09F9A", "#A9334D", "#781D11"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          overflow: "hidden",
        }}
      >
        <View style={{ position: "absolute", width: 160, height: 160, borderRadius: 999, backgroundColor: "#D09F9A", opacity: 0.15, top: -50, right: -30 }} />
        <View style={{ position: "absolute", width: 100, height: 100, borderRadius: 999, backgroundColor: "#781D11", opacity: 0.15, bottom: -20, left: -20 }} />

        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}
        >
          <X size={20} color="#F8E9E7" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#F8E9E7", fontFamily: "Geist-Bold" }}>
          {existing ? "Edit Appointment" : "New Appointment"}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!isValid || saving}
          style={{
            backgroundColor: isValid ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "600", color: isValid ? "#F8E9E7" : "rgba(255,255,255,0.4)", fontFamily: "Geist-SemiBold" }}>
            {saving ? "Saving…" : "Save"}
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <SectionLabel icon={FileText} label="Appointment Title" />
          <TextInput
            style={inputStyle}
            placeholder="e.g. Routine Check-up, Infusion, Blood Work"
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
          />

          {/* Type chips */}
          <SectionLabel icon={Calendar} label="Type" />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {TYPES.map((t) => (
              <TouchableOpacity
                key={t.key}
                onPress={() => setType(t.key)}
                style={{
                  backgroundColor: type === t.key ? "#A9334D" : "#fff",
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderWidth: 1,
                  borderColor: type === t.key ? "#A9334D" : "#E5E7EB",
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: type === t.key ? "#fff" : "#4B5563", fontFamily: "Geist-SemiBold" }}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Doctor */}
          <SectionLabel icon={User} label="Doctor (optional)" />
          <TextInput
            style={inputStyle}
            placeholder="Dr. Name"
            placeholderTextColor="#9CA3AF"
            value={doctor}
            onChangeText={setDoctor}
            returnKeyType="next"
          />

          {/* Specialty */}
          <View style={{ marginTop: 10 }}>
            <TouchableOpacity
              onPress={() => setShowSpecialtyPicker(!showSpecialtyPicker)}
              style={{ ...inputStyle, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
            >
              <Text style={{ fontSize: 16, color: specialty ? "#1a1a1a" : "#9CA3AF", fontFamily: "Geist-Regular" }}>
                {specialty || "Specialty (optional)"}
              </Text>
              <Text style={{ color: "#9CA3AF", fontSize: 12 }}>{showSpecialtyPicker ? "▲" : "▼"}</Text>
            </TouchableOpacity>
            {showSpecialtyPicker && (
              <View style={{ backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", marginTop: 4, overflow: "hidden" }}>
                {SPECIALTIES.map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => { setSpecialty(s); setShowSpecialtyPicker(false); }}
                    style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" }}
                  >
                    <Text style={{ fontSize: 16, color: specialty === s ? "#A9334D" : "#1a1a1a", fontWeight: specialty === s ? "600" : "400" }}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Facility */}
          <SectionLabel icon={MapPin} label="Facility / Location" />
          <TextInput
            style={inputStyle}
            placeholder="Hospital or clinic name"
            placeholderTextColor="#9CA3AF"
            value={facility}
            onChangeText={setFacility}
            returnKeyType="next"
          />

          {/* Date */}
          <SectionLabel icon={Calendar} label="Date" />
          <TouchableOpacity
            onPress={() => { setShowDatePicker(true); setShowTimePicker(false); }}
            style={{ ...inputStyle, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
          >
            <Text style={{ fontSize: 16, color: "#1a1a1a", fontFamily: "Geist-Regular" }}>
              {format(date, "EEE, d MMMM yyyy")}
            </Text>
            <Calendar size={18} color="#A9334D" />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              minimumDate={new Date(2020, 0, 1)}
              onChange={(_, selected) => {
                setShowDatePicker(Platform.OS === "ios");
                if (selected) setDate(selected);
              }}
            />
          )}

          {/* Time */}
          <SectionLabel icon={Clock} label="Time" />
          <TouchableOpacity
            onPress={() => { setShowTimePicker(true); setShowDatePicker(false); }}
            style={{ ...inputStyle, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
          >
            <Text style={{ fontSize: 16, color: "#1a1a1a", fontFamily: "Geist-Regular" }}>
              {formatTime(time)}
            </Text>
            <Clock size={18} color="#A9334D" />
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={time}
              mode="time"
              onChange={(_, selected) => {
                setShowTimePicker(Platform.OS === "ios");
                if (selected) setTime(selected);
              }}
            />
          )}

          {/* Notes */}
          <SectionLabel icon={FileText} label="Notes (optional)" />
          <TextInput
            style={{ ...inputStyle, height: 96, textAlignVertical: "top" }}
            placeholder="Anything to remember for this appointment…"
            placeholderTextColor="#9CA3AF"
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          {/* Reminders toggle */}
          <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16, marginTop: 24, borderWidth: 1, borderColor: "#E5E7EB" }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: remindersOn ? 16 : 0 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Bell size={20} color="#09332C" />
                <View>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: "#1a1a1a", fontFamily: "Geist-SemiBold" }}>Reminders</Text>
                  <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>Push notification before appointment</Text>
                </View>
              </View>
              <Switch
                value={remindersOn}
                onValueChange={setRemindersOn}
                trackColor={{ false: "#E5E7EB", true: "#A9334D" }}
                thumbColor="#fff"
              />
            </View>
            {remindersOn && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {REMINDER_OPTIONS.map((o) => (
                  <TouchableOpacity
                    key={o.key}
                    onPress={() => setReminderOption(o.key)}
                    style={{
                      backgroundColor: reminderOption === o.key ? "#A9334D" : "#F8F4F0",
                      borderRadius: 20,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderWidth: 1,
                      borderColor: reminderOption === o.key ? "#A9334D" : "#E5E7EB",
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "600", color: reminderOption === o.key ? "#fff" : "#4B5563" }}>
                      {o.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Add to Calendar toggle */}
          <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16, marginTop: 12, borderWidth: 1, borderColor: "#E5E7EB" }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <CalendarCheck size={20} color="#09332C" />
                <View>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: "#1a1a1a", fontFamily: "Geist-SemiBold" }}>Add to Calendar</Text>
                  <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>Sync with your device calendar</Text>
                </View>
              </View>
              <Switch
                value={calendarOn}
                onValueChange={setCalendarOn}
                trackColor={{ false: "#E5E7EB", true: "#A9334D" }}
                thumbColor="#fff"
                disabled={!!existing?.addedToCalendar}
              />
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
