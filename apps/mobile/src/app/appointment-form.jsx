import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
  Pressable,
  FlatList,
  Keyboard,
  Modal,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import DateTimePicker from "@react-native-community/datetimepicker";
import { X, Calendar, Clock, MapPin, User, FileText, Bell, CalendarCheck } from "lucide-react-native";
import { useAppointmentsQuery, useAddAppointmentMutation, useUpdateAppointmentMutation } from "@/hooks/queries/useAppointmentsQuery";
import { addToDeviceCalendar, scheduleReminders, cancelReminders } from "@/utils/appointmentUtils";
import { useSavedFacilitiesQuery } from "@/hooks/queries/useSavedFacilitiesQuery";
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
  { label: "At time of event",  minutes: 0 },
  { label: "5 minutes before",  minutes: 5 },
  { label: "15 minutes before", minutes: 15 },
  { label: "30 minutes before", minutes: 30 },
  { label: "1 hour before",     minutes: 60 },
  { label: "2 hours before",    minutes: 120 },
  { label: "1 day before",      minutes: 1440 },
  { label: "2 days before",     minutes: 2880 },
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
  const [facilityFocused, setFacilityFocused] = useState(false);
  const { data: savedFacilities = [] } = useSavedFacilitiesQuery();

  const facilitySuggestions = facilityFocused && facility.length > 0
    ? savedFacilities.filter((f) =>
        f.name.toLowerCase().includes(facility.toLowerCase())
      )
    : [];
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
      // Use regex to handle both regular space and narrow no-break space (U+202F)
      // which iOS 16+ emits between the time and AM/PM in toLocaleTimeString
      const match = existing.time.match(/(\d+):(\d+)\s*([AaPp][Mm])/);
      if (match) {
        let h = parseInt(match[1], 10);
        const m = parseInt(match[2], 10);
        const period = match[3].toUpperCase();
        if (period === "PM" && h !== 12) h += 12;
        if (period === "AM" && h === 12) h = 0;
        const d = new Date();
        d.setHours(h, m, 0, 0);
        return d;
      }
    }
    const d = new Date();
    d.setHours(10, 0, 0, 0);
    return d;
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const savedOffsets = existing?.reminderOffsets ?? [];
  const [remindersOn, setRemindersOn] = useState(existing ? savedOffsets.length > 0 : true);
  const [reminder1, setReminder1] = useState(savedOffsets[0] ?? null);
  const [reminder2, setReminder2] = useState(savedOffsets[1] ?? null);
  const [showReminder1Picker, setShowReminder1Picker] = useState(false);
  const [showReminder2Picker, setShowReminder2Picker] = useState(false);
  const [calendarOn, setCalendarOn] = useState(existing?.addedToCalendar ?? false);
  const [saving, setSaving] = useState(false);

  // Manual formatter — avoids iOS 16+ narrow no-break space (U+202F) in toLocaleTimeString
  const formatTime = (d) => {
    const h = d.getHours();
    const m = d.getMinutes();
    const period = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, "0")} ${period}`;
  };

  const isValid = title.trim().length > 0 && facility.trim().length > 0;

  const handleSave = async () => {
    if (!isValid) {
      Alert.alert("Missing fields", "Please enter at least a title and facility.");
      return;
    }
    setSaving(true);
    try {

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

    // Notifications — cancel stale reminders from a previous save before rescheduling
    const reminderOffsets = remindersOn ? [reminder1, reminder2].filter((m) => m !== null) : [];
    if (existing?.reminderIds?.length) await cancelReminders(existing.reminderIds);
    let reminderIds = [];
    if (remindersOn && status === "upcoming") {
      reminderIds = await scheduleReminders({ ...apptBase, id: existing?.id ?? "new" }, reminderOffsets);
    }

    const navigate = () => router.back();
    const afterSave = () => {
      setSaving(false);
      if (remindersOn && reminderOffsets.length > 0 && reminderIds.length === 0) {
        Alert.alert(
          "Reminders not set",
          "Your selected reminder times have already passed for this appointment. Open the appointment and update the reminders.",
          [{ text: "OK", onPress: navigate }]
        );
      } else {
        navigate();
      }
    };
    const onSaveError = () => setSaving(false);
    if (existing) {
      updateAppt.mutate(
        { id: existing.id, changes: { ...apptBase, addedToCalendar: calendarOn, calendarEventId, reminderIds, reminderOffsets } },
        { onSuccess: afterSave, onError: onSaveError },
      );
    } else {
      addAppt.mutate(
        { ...apptBase, addedToCalendar: calendarOn, calendarEventId, reminderIds, reminderOffsets },
        { onSuccess: afterSave, onError: onSaveError },
      );
    }
    } catch (err) {
      console.error("[AppointmentForm] Save failed:", err);
      setSaving(false);
      Alert.alert("Error", "Something went wrong saving the appointment. Please try again.");
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
        <View
          style={{
            position: "absolute",
            width: 160,
            height: 160,
            borderRadius: 999,
            backgroundColor: "#D09F9A",
            opacity: 0.15,
            top: -50,
            right: -30,
          }}
        />
        <View
          style={{
            position: "absolute",
            width: 100,
            height: 100,
            borderRadius: 999,
            backgroundColor: "#781D11",
            opacity: 0.15,
            bottom: -20,
            left: -20,
          }}
        />

        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "rgba(255,255,255,0.15)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={20} color="#F8E9E7" />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: "#F8E9E7",
            fontFamily: "Geist-Bold",
          }}
        >
          {existing ? "Edit Appointment" : "New Appointment"}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!isValid || saving}
          style={{
            backgroundColor: isValid
              ? "rgba(255,255,255,0.25)"
              : "rgba(255,255,255,0.1)",
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: isValid ? "#F8E9E7" : "rgba(255,255,255,0.4)",
              fontFamily: "Geist-SemiBold",
            }}
          >
            {saving ? "Saving…" : "Save"}
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      <KeyboardAwareScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 40,
        }}
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
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: type === t.key ? "#fff" : "#4B5563",
                  fontFamily: "Geist-SemiBold",
                }}
              >
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
            style={{
              ...inputStyle,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                color: specialty ? "#1a1a1a" : "#9CA3AF",
                fontFamily: "Geist-Regular",
              }}
            >
              {specialty || "Specialty (optional)"}
            </Text>
            <Text style={{ color: "#9CA3AF", fontSize: 12 }}>
              {showSpecialtyPicker ? "▲" : "▼"}
            </Text>
          </TouchableOpacity>
          {showSpecialtyPicker && (
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                marginTop: 4,
                overflow: "hidden",
              }}
            >
              {SPECIALTIES.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => {
                    setSpecialty(s);
                    setShowSpecialtyPicker(false);
                  }}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: "#F3F4F6",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: specialty === s ? "#A9334D" : "#1a1a1a",
                      fontWeight: specialty === s ? "600" : "400",
                    }}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Facility */}
        <SectionLabel icon={MapPin} label="Facility / Location" />
        <View style={{ zIndex: 10 }}>
          <TextInput
            style={inputStyle}
            placeholder="Hospital or clinic name"
            placeholderTextColor="#9CA3AF"
            value={facility}
            onChangeText={setFacility}
            onFocus={() => setFacilityFocused(true)}
            onBlur={() => setTimeout(() => setFacilityFocused(false), 150)}
            returnKeyType="next"
          />
          {facilitySuggestions.length > 0 && (
            <FlatList
              data={facilitySuggestions}
              keyExtractor={(f) => f.placeId ?? f.name}
              scrollEnabled={facilitySuggestions.length > 4}
              style={{
                position: "absolute",
                top: 52,
                left: 0,
                right: 0,
                maxHeight: 4 * 64,
                backgroundColor: "#fff",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 4,
              }}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item, index }) => (
                <>
                  <Pressable
                    onPress={() => {
                      setFacility(item.name);
                      setFacilityFocused(false);
                      Keyboard.dismiss();
                    }}
                    style={({ pressed }) => ({
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      backgroundColor: pressed ? "#F8F4F0" : "#fff",
                      borderTopLeftRadius: index === 0 ? 12 : 0,
                      borderTopRightRadius: index === 0 ? 12 : 0,
                    })}
                  >
                    <Text
                      style={{
                        fontFamily: "Geist_600SemiBold",
                        fontSize: 14,
                        color: "#09332C",
                      }}
                    >
                      {item.name}
                    </Text>
                    {item.address ? (
                      <Text
                        style={{
                          fontFamily: "Geist_400Regular",
                          fontSize: 12,
                          color: "#6B7280",
                          marginTop: 2,
                        }}
                      >
                        {item.address}
                      </Text>
                    ) : null}
                  </Pressable>
                  {index < facilitySuggestions.length - 1 && (
                    <View
                      style={{
                        height: 1,
                        backgroundColor: "#F0E4E1",
                        marginLeft: 16,
                      }}
                    />
                  )}
                </>
              )}
            />
          )}
        </View>

        {/* Date */}
        <SectionLabel icon={Calendar} label="Date" />
        <TouchableOpacity
          onPress={() => {
            setShowDatePicker(true);
            setShowTimePicker(false);
          }}
          style={{
            ...inputStyle,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 16,
              color: "#1a1a1a",
              fontFamily: "Geist-Regular",
            }}
          >
            {format(date, "EEE, d MMMM yyyy")}
          </Text>
          <Calendar size={18} color="#A9334D" />
        </TouchableOpacity>

        {/* Time */}
        <SectionLabel icon={Clock} label="Time" />
        <TouchableOpacity
          onPress={() => {
            setShowTimePicker(true);
            setShowDatePicker(false);
          }}
          style={{
            ...inputStyle,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 16,
              color: "#1a1a1a",
              fontFamily: "Geist-Regular",
            }}
          >
            {formatTime(time)}
          </Text>
          <Clock size={18} color="#A9334D" />
        </TouchableOpacity>

        {/* Date picker — Modal on iOS, native dialog on Android */}
        {Platform.OS === "ios" ? (
          <Modal transparent visible={showDatePicker} animationType="slide">
            <Pressable
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.3)",
                justifyContent: "flex-end",
              }}
              onPress={() => setShowDatePicker(false)}
            >
              <Pressable onPress={() => {}}>
                <View
                  style={{
                    backgroundColor: "#fff",
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    paddingBottom: 32,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingHorizontal: 20,
                      paddingTop: 16,
                      paddingBottom: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "Geist_400Regular",
                        fontSize: 15,
                        color: "#6B7280",
                      }}
                    >
                      Select date
                    </Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text
                        style={{
                          fontFamily: "Geist_600SemiBold",
                          fontSize: 15,
                          color: "#A9334D",
                        }}
                      >
                        Done
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="spinner"
                    themeVariant="light"
                    minimumDate={new Date(2020, 0, 1)}
                    onChange={(_, selected) => {
                      if (selected) setDate(selected);
                    }}
                    style={{ alignSelf: "center" }}
                  />
                </View>
              </Pressable>
            </Pressable>
          </Modal>
        ) : (
          showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              minimumDate={new Date(2020, 0, 1)}
              onChange={(_, selected) => {
                setShowDatePicker(false);
                if (selected) setDate(selected);
              }}
            />
          )
        )}

        {/* Time picker — Modal on iOS, native dialog on Android */}
        {Platform.OS === "ios" ? (
          <Modal transparent visible={showTimePicker} animationType="slide">
            <Pressable
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.3)",
                justifyContent: "flex-end",
              }}
              onPress={() => setShowTimePicker(false)}
            >
              <Pressable onPress={() => {}}>
                <View
                  style={{
                    backgroundColor: "#fff",
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    paddingBottom: 32,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingHorizontal: 20,
                      paddingTop: 16,
                      paddingBottom: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "Geist_400Regular",
                        fontSize: 15,
                        color: "#6B7280",
                      }}
                    >
                      Select time
                    </Text>
                    <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                      <Text
                        style={{
                          fontFamily: "Geist_600SemiBold",
                          fontSize: 15,
                          color: "#A9334D",
                        }}
                      >
                        Done
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={time}
                    mode="time"
                    display="spinner"
                    themeVariant="light"
                    onChange={(_, selected) => {
                      if (selected) setTime(selected);
                    }}
                    style={{ alignSelf: "center" }}
                  />
                </View>
              </Pressable>
            </Pressable>
          </Modal>
        ) : (
          showTimePicker && (
            <DateTimePicker
              value={time}
              mode="time"
              onChange={(_, selected) => {
                setShowTimePicker(false);
                if (selected) setTime(selected);
              }}
            />
          )
        )}

        {/* Reminders */}
        <View style={{ backgroundColor: "#fff", borderRadius: 16, marginTop: 24, borderWidth: 1, borderColor: "#E5E7EB", overflow: "hidden" }}>
          {/* Toggle row */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Bell size={20} color="#09332C" />
              <View>
                <Text style={{ fontSize: 15, fontFamily: "Geist-SemiBold", color: "#1a1a1a" }}>Reminders</Text>
                <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>Push notification before appointment</Text>
              </View>
            </View>
            <Switch
              value={remindersOn}
              onValueChange={(val) => {
                setRemindersOn(val);
                if (!val) { setReminder1(null); setReminder2(null); }
              }}
              trackColor={{ false: "#E5E7EB", true: "#A9334D" }}
              thumbColor="#fff"
            />
          </View>

          {remindersOn && (
            <>
              {/* Divider */}
              <View style={{ height: 1, backgroundColor: "#F0E4E1" }} />

              {/* First reminder row */}
              <TouchableOpacity
                onPress={() => setShowReminder1Picker(true)}
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 }}
              >
                <Text style={{ fontFamily: "Geist-Regular", fontSize: 15, color: "#1a1a1a" }}>Reminder</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ fontFamily: "Geist-Regular", fontSize: 15, color: reminder1 !== null ? "#A9334D" : "#9CA3AF" }}>
                    {reminder1 !== null ? REMINDER_OPTIONS.find((o) => o.minutes === reminder1)?.label ?? "1 hour before" : "None"}
                  </Text>
                  <Text style={{ fontSize: 18, color: "#C0C0C0" }}>›</Text>
                </View>
              </TouchableOpacity>

              {/* Second reminder row — only appears once first is set */}
              {reminder1 !== null && (
                <>
                  <View style={{ height: 1, backgroundColor: "#F0E4E1", marginLeft: 16 }} />
                  <TouchableOpacity
                    onPress={() => setShowReminder2Picker(true)}
                    style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 }}
                  >
                    <Text style={{ fontFamily: "Geist-Regular", fontSize: 15, color: "#1a1a1a" }}>Second Reminder</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={{ fontFamily: "Geist-Regular", fontSize: 15, color: reminder2 !== null ? "#A9334D" : "#9CA3AF" }}>
                        {reminder2 !== null ? REMINDER_OPTIONS.find((o) => o.minutes === reminder2)?.label ?? "1 day before" : "None"}
                      </Text>
                      <Text style={{ fontSize: 18, color: "#C0C0C0" }}>›</Text>
                    </View>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}
        </View>

        {/* Reminder 1 picker modal */}
        <Modal transparent visible={showReminder1Picker} animationType="slide">
          <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "flex-end" }} onPress={() => setShowReminder1Picker(false)}>
            <Pressable onPress={() => {}}>
              <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
                  <Text style={{ fontFamily: "Geist_400Regular", fontSize: 15, color: "#6B7280" }}>Reminder</Text>
                  <TouchableOpacity onPress={() => setShowReminder1Picker(false)}>
                    <Text style={{ fontFamily: "Geist_600SemiBold", fontSize: 15, color: "#A9334D" }}>Done</Text>
                  </TouchableOpacity>
                </View>
                {REMINDER_OPTIONS.map((opt, i) => (
                  <React.Fragment key={opt.minutes}>
                    {i > 0 && <View style={{ height: 1, backgroundColor: "#F0E4E1", marginLeft: 20 }} />}
                    <TouchableOpacity
                      onPress={() => { setReminder1(opt.minutes); setShowReminder1Picker(false); }}
                      style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14 }}
                    >
                      <Text style={{ fontFamily: "Geist_400Regular", fontSize: 16, color: "#1a1a1a" }}>{opt.label}</Text>
                      {reminder1 === opt.minutes && <Text style={{ fontSize: 18, color: "#A9334D" }}>✓</Text>}
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Reminder 2 picker modal */}
        <Modal transparent visible={showReminder2Picker} animationType="slide">
          <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "flex-end" }} onPress={() => setShowReminder2Picker(false)}>
            <Pressable onPress={() => {}}>
              <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
                  <Text style={{ fontFamily: "Geist_400Regular", fontSize: 15, color: "#6B7280" }}>Second Reminder</Text>
                  <TouchableOpacity onPress={() => setShowReminder2Picker(false)}>
                    <Text style={{ fontFamily: "Geist_600SemiBold", fontSize: 15, color: "#A9334D" }}>Done</Text>
                  </TouchableOpacity>
                </View>
                {/* "None" option to clear second reminder */}
                <TouchableOpacity
                  onPress={() => { setReminder2(null); setShowReminder2Picker(false); }}
                  style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14 }}
                >
                  <Text style={{ fontFamily: "Geist_400Regular", fontSize: 16, color: "#1a1a1a" }}>None</Text>
                  {reminder2 === null && <Text style={{ fontSize: 18, color: "#A9334D" }}>✓</Text>}
                </TouchableOpacity>
                {REMINDER_OPTIONS.map((opt, i) => (
                  <React.Fragment key={opt.minutes}>
                    <View style={{ height: 1, backgroundColor: "#F0E4E1", marginLeft: 20 }} />
                    <TouchableOpacity
                      onPress={() => { setReminder2(opt.minutes); setShowReminder2Picker(false); }}
                      style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14 }}
                    >
                      <Text style={{ fontFamily: "Geist_400Regular", fontSize: 16, color: "#1a1a1a" }}>{opt.label}</Text>
                      {reminder2 === opt.minutes && <Text style={{ fontSize: 18, color: "#A9334D" }}>✓</Text>}
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Add to Calendar toggle */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 16,
            marginTop: 12,
            borderWidth: 1,
            borderColor: "#E5E7EB",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <CalendarCheck size={20} color="#09332C" />
              <View>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: "#1a1a1a",
                    fontFamily: "Geist-SemiBold",
                  }}
                >
                  Add to Calendar
                </Text>
                <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
                  Sync with your device calendar
                </Text>
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

        {/* Notes */}
        <SectionLabel icon={FileText} label="Notes (optional)" />
        <TextInput
          style={{ ...inputStyle, height: 230, textAlignVertical: "top" }}
          placeholder="Anything to remember for this appointment…"
          placeholderTextColor="#9CA3AF"
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      </KeyboardAwareScrollView>
    </View>
  );
}
