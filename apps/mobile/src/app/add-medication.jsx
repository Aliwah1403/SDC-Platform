import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { X, ChevronLeft, ChevronRight, Search, Camera } from "lucide-react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import { MotiView } from "moti";
import { useAppStore } from "@/store/appStore";
import { fonts } from "@/utils/fonts";
import { SCD_MEDICATIONS, SCD_CATEGORIES } from "@/utils/scdDrugs";
import MedicationIcon from "@/components/MedicationIcon";

// ─── Design tokens ─────────────────────────────────────────────────────────
const C = {
  bg: "#F8F4F0",
  card: "#ffffff",
  border: "#F0E4E1",
  dark: "#09332C",
  muted: "#9CA3AF",
  accent: "#A9334D",
  success: "#059669",
  danger: "#DC2626",
  inputBorder: "#E5E7EB",
  divider: "#F8E9E7",
};

const CATEGORY_COLORS = {
  "Disease-modifying": "#A9334D",
  "Iron chelation": "#F0531C",
  Supportive: "#059669",
};

const FREQUENCIES = ["Daily", "Twice daily", "Three times daily", "Weekly", "As needed"];

const TIME_PRESETS = [
  { label: "Morning", value: "8:00 AM" },
  { label: "Afternoon", value: "12:00 PM" },
  { label: "Evening", value: "6:00 PM" },
  { label: "Night", value: "10:00 PM" },
  { label: "Custom", value: "custom" },
];

const UNITS = ["mg", "ml", "tablets", "units", "IU"];
const REMINDER_MINS = [5, 10, 15, 30];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES_LIST = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

const STEP_LABELS = ["", "Find Drug", "Dosage", "Schedule", "Reminders"];

// ─── Tiny shared components ──────────────────────────────────────────────────
function ChipRow({ options, selected, onSelect, getLabel }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {options.map((opt) => {
        const val = typeof opt === "object" ? opt.value : opt;
        const label = getLabel ? getLabel(opt) : typeof opt === "object" ? opt.label : String(opt);
        const active = selected === val;
        return (
          <TouchableOpacity
            key={String(val)}
            onPress={() => onSelect(val)}
            activeOpacity={0.7}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: active ? C.accent : C.card,
              borderWidth: 1,
              borderColor: active ? C.accent : C.border,
            }}
          >
            <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: active ? "#fff" : C.dark }}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function FieldLabel({ children, optional }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
      <Text style={{ fontFamily: fonts.semibold, fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 0.7 }}>
        {children}
      </Text>
      {optional && (
        <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: C.muted, marginLeft: 6 }}>
          optional
        </Text>
      )}
    </View>
  );
}

// ─── Barcode scanner (full-screen) ───────────────────────────────────────────
function BarcodeScannerView({ insets, onScan, onCancel }) {
  const [permission, requestPermission] = useCameraPermissions();
  const scanned = useRef(false);

  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: "#000" }} />;
  }

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center", padding: 32 }}>
        <Camera size={48} color="#fff" />
        <Text style={{ fontFamily: fonts.semibold, fontSize: 18, color: "#fff", textAlign: "center", marginTop: 16, marginBottom: 8 }}>
          Camera access needed
        </Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: "rgba(255,255,255,0.65)", textAlign: "center", marginBottom: 32 }}>
          Allow camera access to scan your medication barcode
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          activeOpacity={0.8}
          style={{ backgroundColor: C.accent, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, marginBottom: 14 }}
        >
          <Text style={{ fontFamily: fonts.semibold, fontSize: 15, color: "#fff" }}>Allow Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onCancel} activeOpacity={0.7}>
          <Text style={{ fontFamily: fonts.medium, fontSize: 15, color: "rgba(255,255,255,0.55)" }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <CameraView
        style={StyleSheet.absoluteFill}
        onBarcodeScanned={({ data }) => {
          if (!scanned.current) {
            scanned.current = true;
            onScan(data);
          }
        }}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "ean13", "ean8", "code128", "upc_a", "upc_e"],
        }}
      />
      {/* Scanning frame overlay */}
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <View style={{ width: 240, height: 140, borderRadius: 16, borderWidth: 2.5, borderColor: "#fff", opacity: 0.9 }} />
        <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: "#fff", marginTop: 18, opacity: 0.85 }}>
          Point at medication barcode
        </Text>
      </View>
      <TouchableOpacity
        onPress={onCancel}
        style={{
          position: "absolute",
          top: insets.top + 12,
          right: 20,
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: "rgba(0,0,0,0.5)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <X size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// ─── AI identifying loader ────────────────────────────────────────────────────
function IdentifyingView() {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: "center", alignItems: "center", padding: 32 }}>
      <ActivityIndicator size="large" color={C.accent} />
      <Text style={{ fontFamily: fonts.semibold, fontSize: 17, color: C.dark, marginTop: 20 }}>
        Identifying medication…
      </Text>
      <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: C.muted, marginTop: 6, textAlign: "center" }}>
        Analysing your photo
      </Text>
    </View>
  );
}

// ─── Helper: parse existing time string ──────────────────────────────────────
function parseTimeStr(timeStr) {
  const match = (timeStr ?? "").match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return { h: 8, m: 0, p: "AM" };
  return { h: parseInt(match[1], 10), m: parseInt(match[2], 10), p: match[3].toUpperCase() };
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function AddMedicationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { medicationId } = useLocalSearchParams();
  const { medications, addMedication, updateMedication, deleteMedication } = useAppStore();

  const existing = medicationId ? medications.find((m) => m.id === medicationId) : null;
  const isEditing = !!existing;

  // Parse existing dosage "500 mg" → parts
  const [existingAmount, existingUnit] = (existing?.dosage ?? "").split(" ");
  const existingTimeParsed = parseTimeStr(existing?.time);
  const existingTimeIsPreset = TIME_PRESETS.some(
    (p) => p.value !== "custom" && p.value === existing?.time
  );

  // ── Navigation / camera state
  const [step, setStep] = useState(isEditing ? 2 : 0);
  const [cameraMode, setCameraMode] = useState(null); // null | 'barcode'
  const [identifying, setIdentifying] = useState(false);
  const [showCameraOptions, setShowCameraOptions] = useState(false);

  // ── Step 1: Drug
  const [name, setName] = useState(existing?.name ?? "");
  const [category, setCategory] = useState(existing?.category ?? "Supportive");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customNameInput, setCustomNameInput] = useState("");

  // ── Step 2: Dosage
  const [dosageAmount, setDosageAmount] = useState(existingAmount ?? "");
  const [dosageUnit, setDosageUnit] = useState(existingUnit ?? "mg");

  // ── Step 3: Schedule
  const [frequency, setFrequency] = useState(existing?.frequency ?? "Daily");
  const [time, setTime] = useState(isEditing && !existingTimeIsPreset ? "custom" : (existing?.time ?? "8:00 AM"));
  const [customHour, setCustomHour] = useState(existingTimeParsed.h);
  const [customMinute, setCustomMinute] = useState(existingTimeParsed.m);
  const [customPeriod, setCustomPeriod] = useState(existingTimeParsed.p);

  // ── Step 4: Reminders + Notes
  const [remindBefore, setRemindBefore] = useState(false);
  const [remindBeforeMin, setRemindBeforeMin] = useState(10);
  const [remindAfter, setRemindAfter] = useState(false);
  const [remindAfterMin, setRemindAfterMin] = useState(5);
  const [notes, setNotes] = useState(existing?.notes ?? "");

  const computedTime =
    time === "custom"
      ? `${customHour}:${String(customMinute).padStart(2, "0")} ${customPeriod}`
      : time;

  const goBack = () => {
    if (step === 0) {
      router.back();
    } else {
      setStep((s) => s - 1);
    }
  };

  const handleBarcodeScanned = (data) => {
    setCameraMode(null);
    const matched = SCD_MEDICATIONS.find((d) =>
      data.toLowerCase().includes(d.name.toLowerCase())
    );
    if (matched) {
      setName(matched.name);
      setCategory(matched.category);
    } else {
      setName(data.length <= 40 ? data : "Scanned Medication");
      setCategory("Supportive");
    }
    setStep(2);
  };

  const handlePhotoCapture = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Camera access is needed to identify medication.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.8 });
    if (result.canceled) return;
    setIdentifying(true);
    // Stub: simulate AI identification
    setTimeout(() => {
      const stub = SCD_MEDICATIONS[0];
      setName(stub.name);
      setCategory(stub.category);
      setIdentifying(false);
      setStep(2);
    }, 1500);
  };

  const handleSave = () => {
    const dosage = dosageAmount.trim() ? `${dosageAmount.trim()} ${dosageUnit}` : "";
    const reminders = [];
    if (remindBefore) reminders.push({ offsetMinutes: remindBeforeMin, direction: "before" });
    if (remindAfter) reminders.push({ offsetMinutes: remindAfterMin, direction: "after" });

    const med = {
      name: name.trim(),
      category,
      dosage,
      frequency,
      time: computedTime,
      nextDose: computedTime,
      reminders,
      notes,
    };

    if (isEditing) {
      updateMedication(medicationId, med);
    } else {
      addMedication(med);
    }
    router.back();
  };

  const handleDelete = () => {
    Alert.alert("Delete Medication", `Remove ${name} from your medications?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteMedication(medicationId);
          router.back();
        },
      },
    ]);
  };

  const filteredDrugs = searchQuery.trim()
    ? SCD_MEDICATIONS.filter(
        (d) =>
          d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (d.subtitle && d.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : SCD_MEDICATIONS;

  // ── Full-screen overlays
  if (cameraMode === "barcode") {
    return (
      <BarcodeScannerView
        insets={insets}
        onScan={handleBarcodeScanned}
        onCancel={() => setCameraMode(null)}
      />
    );
  }

  if (identifying) {
    return <IdentifyingView />;
  }

  const catColor = CATEGORY_COLORS[category] ?? C.accent;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* ── Header ── */}
      <View
        style={{
          backgroundColor: C.card,
          paddingTop: insets.top + 12,
          paddingBottom: 14,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={goBack}
          activeOpacity={0.6}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: C.bg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {step === 0 ? <X size={18} color={C.dark} /> : <ChevronLeft size={20} color={C.dark} />}
        </TouchableOpacity>
        <Text style={{ fontFamily: fonts.bold, fontSize: 20, color: C.dark, flex: 1 }}>
          {isEditing ? "Edit Medication" : step === 0 ? "Add Medication" : STEP_LABELS[step]}
        </Text>
      </View>

      {/* ── Step progress bar (steps 1–4) ── */}
      {step >= 1 && (
        <View
          style={{
            flexDirection: "row",
            gap: 4,
            paddingHorizontal: 20,
            paddingVertical: 10,
            backgroundColor: C.card,
            borderBottomWidth: 1,
            borderBottomColor: C.border,
          }}
        >
          {[1, 2, 3, 4].map((s) => (
            <View
              key={s}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                backgroundColor: s <= step ? C.accent : "#E5E7EB",
              }}
            />
          ))}
        </View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <MotiView
          key={step}
          from={{ opacity: 0, translateX: 18 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: "timing", duration: 200 }}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ━━ Step 0: Method picker ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {step === 0 && (
              <View style={{ gap: 14, marginTop: 4 }}>
                <Text style={{ fontFamily: fonts.regular, fontSize: 15, color: C.muted, marginBottom: 4 }}>
                  How would you like to add your medication?
                </Text>

                {/* Search card */}
                <TouchableOpacity
                  onPress={() => setStep(1)}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: C.card,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: C.border,
                    padding: 20,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      backgroundColor: "#F5EBF0",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Search size={24} color={C.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.semibold, fontSize: 16, color: C.dark }}>
                      Search & select drug
                    </Text>
                    <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: C.muted, marginTop: 2 }}>
                      From our SCD medication list
                    </Text>
                  </View>
                  <ChevronRight size={18} color={C.muted} />
                </TouchableOpacity>

                {/* Camera card */}
                <View
                  style={{
                    backgroundColor: C.card,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: showCameraOptions ? C.dark : C.border,
                    overflow: "hidden",
                  }}
                >
                  <TouchableOpacity
                    onPress={() => setShowCameraOptions((v) => !v)}
                    activeOpacity={0.8}
                    style={{ padding: 20, flexDirection: "row", alignItems: "center", gap: 16 }}
                  >
                    <View
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 14,
                        backgroundColor: "#EBF0EE",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Camera size={24} color={C.dark} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: fonts.semibold, fontSize: 16, color: C.dark }}>
                        Use camera
                      </Text>
                      <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: C.muted, marginTop: 2 }}>
                        Scan barcode or identify by photo
                      </Text>
                    </View>
                    <ChevronRight
                      size={18}
                      color={C.muted}
                      style={{ transform: [{ rotate: showCameraOptions ? "90deg" : "0deg" }] }}
                    />
                  </TouchableOpacity>

                  {showCameraOptions && (
                    <View style={{ borderTopWidth: 1, borderTopColor: C.divider }}>
                      {/* Scan barcode */}
                      <TouchableOpacity
                        onPress={() => setCameraMode("barcode")}
                        activeOpacity={0.7}
                        style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 16, paddingLeft: 20 }}
                      >
                        <View
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            backgroundColor: C.bg,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text style={{ fontSize: 20 }}>⬛</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: C.dark }}>
                            Scan barcode or QR code
                          </Text>
                          <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: C.muted, marginTop: 1 }}>
                            Works with most medication packaging
                          </Text>
                        </View>
                        <ChevronRight size={16} color={C.muted} />
                      </TouchableOpacity>

                      <View style={{ height: 1, backgroundColor: C.divider, marginLeft: 72 }} />

                      {/* Photo AI */}
                      <TouchableOpacity
                        onPress={handlePhotoCapture}
                        activeOpacity={0.7}
                        style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 16, paddingLeft: 20 }}
                      >
                        <View
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            backgroundColor: C.bg,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Camera size={18} color={C.dark} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: C.dark }}>
                            Take photo for AI identification
                          </Text>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                            <View
                              style={{
                                backgroundColor: "#FEF3C7",
                                borderRadius: 6,
                                paddingHorizontal: 6,
                                paddingVertical: 1,
                              }}
                            >
                              <Text style={{ fontFamily: fonts.medium, fontSize: 10, color: "#92400E" }}>
                                Prototype
                              </Text>
                            </View>
                          </View>
                        </View>
                        <ChevronRight size={16} color={C.muted} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* ━━ Step 1: Drug search ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {step === 1 && (
              <View>
                {/* Search input */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: C.card,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: C.inputBorder,
                    paddingHorizontal: 14,
                    marginBottom: 20,
                    gap: 10,
                  }}
                >
                  <Search size={16} color={C.muted} />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search medications…"
                    placeholderTextColor={C.muted}
                    autoFocus
                    style={{
                      flex: 1,
                      fontFamily: fonts.regular,
                      fontSize: 15,
                      color: C.dark,
                      paddingVertical: 12,
                    }}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <X size={16} color={C.muted} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Category-grouped results */}
                {SCD_CATEGORIES.map((cat) => {
                  const drugs = filteredDrugs.filter((d) => d.category === cat);
                  if (drugs.length === 0) return null;
                  const cc = CATEGORY_COLORS[cat] ?? C.accent;
                  return (
                    <View key={cat} style={{ marginBottom: 20 }}>
                      <Text
                        style={{
                          fontFamily: fonts.semibold,
                          fontSize: 11,
                          color: cc,
                          textTransform: "uppercase",
                          letterSpacing: 0.7,
                          marginBottom: 8,
                          marginLeft: 2,
                        }}
                      >
                        {cat}
                      </Text>
                      <View
                        style={{
                          backgroundColor: C.card,
                          borderRadius: 14,
                          borderWidth: 1,
                          borderColor: C.border,
                          overflow: "hidden",
                        }}
                      >
                        {drugs.map((drug, i) => (
                          <React.Fragment key={drug.id}>
                            <TouchableOpacity
                              onPress={() => {
                                setName(drug.name);
                                setCategory(drug.category);
                                setStep(2);
                              }}
                              activeOpacity={0.7}
                              style={{
                                paddingVertical: 14,
                                paddingHorizontal: 16,
                                flexDirection: "row",
                                alignItems: "center",
                              }}
                            >
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontFamily: fonts.medium, fontSize: 15, color: C.dark }}>
                                  {drug.name}
                                </Text>
                                {drug.subtitle && (
                                  <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: C.muted, marginTop: 1 }}>
                                    {drug.subtitle}
                                  </Text>
                                )}
                              </View>
                              <ChevronRight size={16} color={C.muted} />
                            </TouchableOpacity>
                            {i < drugs.length - 1 && (
                              <View style={{ height: 1, backgroundColor: C.divider, marginLeft: 16 }} />
                            )}
                          </React.Fragment>
                        ))}
                      </View>
                    </View>
                  );
                })}

                {/* Unlisted / custom */}
                {!showCustomInput ? (
                  <TouchableOpacity
                    onPress={() => setShowCustomInput(true)}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 14,
                      paddingVertical: 14,
                      borderWidth: 1.5,
                      borderColor: C.border,
                      borderStyle: "dashed",
                      gap: 8,
                    }}
                  >
                    <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: C.muted }}>
                      + Add unlisted medication
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View
                    style={{
                      backgroundColor: C.card,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: C.inputBorder,
                      padding: 16,
                    }}
                  >
                    <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: C.dark, marginBottom: 10 }}>
                      Enter medication name
                    </Text>
                    <TextInput
                      value={customNameInput}
                      onChangeText={setCustomNameInput}
                      placeholder="e.g. Ibuprofen"
                      placeholderTextColor={C.muted}
                      autoFocus
                      style={{
                        backgroundColor: C.bg,
                        borderWidth: 1,
                        borderColor: C.inputBorder,
                        borderRadius: 10,
                        padding: 12,
                        fontFamily: fonts.regular,
                        fontSize: 15,
                        color: C.dark,
                        marginBottom: 12,
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => {
                        if (!customNameInput.trim()) return;
                        setName(customNameInput.trim());
                        setCategory("Supportive");
                        setStep(2);
                      }}
                      activeOpacity={0.8}
                      style={{
                        backgroundColor: C.accent,
                        borderRadius: 10,
                        paddingVertical: 12,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: "#fff" }}>Continue</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* ━━ Step 2: Dosage ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {step === 2 && (
              <View>
                {/* Drug confirmation pill */}
                <View
                  style={{
                    backgroundColor: C.card,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: C.border,
                    padding: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 14,
                    marginBottom: 28,
                  }}
                >
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      backgroundColor: `${catColor}15`,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MedicationIcon type="tablet" color={catColor} size={36} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.semibold, fontSize: 17, color: C.dark }}>{name}</Text>
                    <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: C.muted, marginTop: 2 }}>
                      {category}
                    </Text>
                  </View>
                </View>

                <FieldLabel optional>Dosage amount</FieldLabel>
                <TextInput
                  value={dosageAmount}
                  onChangeText={setDosageAmount}
                  placeholder="e.g. 500"
                  placeholderTextColor={C.muted}
                  keyboardType="numeric"
                  style={{
                    backgroundColor: C.card,
                    borderWidth: 1,
                    borderColor: C.inputBorder,
                    borderRadius: 12,
                    padding: 14,
                    fontFamily: fonts.regular,
                    fontSize: 24,
                    color: C.dark,
                    marginBottom: 16,
                    textAlign: "center",
                  }}
                />

                <FieldLabel>Unit</FieldLabel>
                <ChipRow options={UNITS} selected={dosageUnit} onSelect={setDosageUnit} />

                {dosageAmount.trim().length > 0 && (
                  <View
                    style={{
                      marginTop: 20,
                      backgroundColor: "#F0F9F5",
                      borderRadius: 10,
                      padding: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontFamily: fonts.semibold, fontSize: 16, color: C.success }}>
                      {dosageAmount.trim()} {dosageUnit}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* ━━ Step 3: Schedule ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {step === 3 && (
              <View>
                <FieldLabel>Frequency</FieldLabel>
                <View style={{ marginBottom: 28 }}>
                  <ChipRow options={FREQUENCIES} selected={frequency} onSelect={setFrequency} />
                </View>

                <FieldLabel>Time of day</FieldLabel>
                <ChipRow options={TIME_PRESETS} selected={time} onSelect={setTime} />

                {/* Custom time drum-roll */}
                {time === "custom" && (
                  <View
                    style={{
                      backgroundColor: C.card,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: C.border,
                      marginTop: 14,
                      overflow: "hidden",
                    }}
                  >
                    <View style={{ flexDirection: "row" }}>
                      <Picker
                        selectedValue={customHour}
                        onValueChange={setCustomHour}
                        style={{ flex: 1 }}
                        itemStyle={{ fontFamily: fonts.regular, color: C.dark, fontSize: 18 }}
                      >
                        {HOURS.map((h) => (
                          <Picker.Item key={h} label={String(h)} value={h} />
                        ))}
                      </Picker>
                      <Picker
                        selectedValue={customMinute}
                        onValueChange={setCustomMinute}
                        style={{ flex: 1 }}
                        itemStyle={{ fontFamily: fonts.regular, color: C.dark, fontSize: 18 }}
                      >
                        {MINUTES_LIST.map((m) => (
                          <Picker.Item key={m} label={String(m).padStart(2, "0")} value={m} />
                        ))}
                      </Picker>
                      <Picker
                        selectedValue={customPeriod}
                        onValueChange={setCustomPeriod}
                        style={{ flex: 1 }}
                        itemStyle={{ fontFamily: fonts.regular, color: C.dark, fontSize: 18 }}
                      >
                        {["AM", "PM"].map((p) => (
                          <Picker.Item key={p} label={p} value={p} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                )}

                {/* Confirmation banner */}
                <View
                  style={{
                    marginTop: 16,
                    backgroundColor: "#F0F9F5",
                    borderRadius: 10,
                    padding: 12,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: C.success }}>
                    Notification at {computedTime}
                  </Text>
                </View>
              </View>
            )}

            {/* ━━ Step 4: Reminders + Notes ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {step === 4 && (
              <View>
                {/* Summary chip */}
                <View
                  style={{
                    backgroundColor: C.card,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: C.border,
                    padding: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 24,
                  }}
                >
                  <MedicationIcon type="tablet" color={catColor} size={28} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: C.dark }}>{name}</Text>
                    <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: C.muted }}>
                      {frequency} · {computedTime}
                    </Text>
                  </View>
                </View>

                {/* Remind before */}
                <View
                  style={{
                    backgroundColor: C.card,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: C.border,
                    padding: 16,
                    marginBottom: 12,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: remindBefore ? 16 : 0,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: C.dark }}>
                        Remind me before
                      </Text>
                      <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: C.muted, marginTop: 2 }}>
                        Get a heads-up before it's time
                      </Text>
                    </View>
                    <Switch
                      value={remindBefore}
                      onValueChange={setRemindBefore}
                      trackColor={{ false: "#E5E7EB", true: `${C.accent}80` }}
                      thumbColor={remindBefore ? C.accent : "#9CA3AF"}
                    />
                  </View>
                  {remindBefore && (
                    <ChipRow
                      options={REMINDER_MINS}
                      selected={remindBeforeMin}
                      onSelect={setRemindBeforeMin}
                      getLabel={(m) => `${m} min`}
                    />
                  )}
                </View>

                {/* Remind after */}
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
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: remindAfter ? 16 : 0,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: C.dark }}>
                        Remind if missed
                      </Text>
                      <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: C.muted, marginTop: 2 }}>
                        Nudge me after the time passes
                      </Text>
                    </View>
                    <Switch
                      value={remindAfter}
                      onValueChange={setRemindAfter}
                      trackColor={{ false: "#E5E7EB", true: `${C.accent}80` }}
                      thumbColor={remindAfter ? C.accent : "#9CA3AF"}
                    />
                  </View>
                  {remindAfter && (
                    <ChipRow
                      options={REMINDER_MINS}
                      selected={remindAfterMin}
                      onSelect={setRemindAfterMin}
                      getLabel={(m) => `${m} min`}
                    />
                  )}
                </View>

                {/* Notes */}
                <FieldLabel optional>Notes</FieldLabel>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="e.g. Take with food, avoid grapefruit…"
                  placeholderTextColor={C.muted}
                  multiline
                  numberOfLines={3}
                  style={{
                    backgroundColor: C.card,
                    borderWidth: 1,
                    borderColor: C.inputBorder,
                    borderRadius: 12,
                    padding: 14,
                    fontFamily: fonts.regular,
                    fontSize: 15,
                    color: C.dark,
                    minHeight: 80,
                    textAlignVertical: "top",
                  }}
                />

                {isEditing && (
                  <TouchableOpacity
                    onPress={handleDelete}
                    activeOpacity={0.7}
                    style={{ alignItems: "center", paddingVertical: 20, marginTop: 4 }}
                  >
                    <Text style={{ fontFamily: fonts.medium, fontSize: 15, color: C.danger }}>
                      Delete Medication
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
        </MotiView>

        {/* ── Footer: Next / Save (steps 2–4) ── */}
        {step >= 2 && (
          <View
            style={{
              backgroundColor: C.bg,
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: insets.bottom + 16,
              borderTopWidth: 1,
              borderTopColor: C.border,
            }}
          >
            <TouchableOpacity
              onPress={step === 4 ? handleSave : () => setStep((s) => s + 1)}
              activeOpacity={0.8}
              style={{
                backgroundColor: C.accent,
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: "center",
              }}
            >
              <Text style={{ fontFamily: fonts.semibold, fontSize: 16, color: "#fff" }}>
                {step === 4 ? (isEditing ? "Save Changes" : "Save Medication") : "Next"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}
