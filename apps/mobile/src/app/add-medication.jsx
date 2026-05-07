import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Camera,
} from "lucide-react-native";
import Svg, { Path, Rect, Line, Circle } from "react-native-svg";
import MedicationBottle from "@/components/MedicationBottle";
import { Picker } from "@react-native-picker/picker";
import { MotiView } from "moti";
import {
  useMedicationsQuery,
  useAddMedicationMutation,
  useUpdateMedicationMutation,
  useDeleteMedicationMutation,
} from "@/hooks/queries/useMedicationsQuery";
import { fonts } from "@/utils/fonts";
import { useTheme } from "@/hooks/useTheme";
import { SCD_MEDICATIONS, SCD_CATEGORIES } from "@/utils/scdDrugs";
import MedicationIcon from "@/components/MedicationIcon";
import { useDrugSearch } from "@/hooks/useDrugSearch";
import { normalizeDoseForm } from "@/components/MedicationIcon";
import { fetchDoseForm } from "@/services/supabaseQueries";
import { scheduleMedicationNotifications, cancelMedicationNotifications } from "@/utils/medicationNotifications";

// ─── Design tokens ─────────────────────────────────────────────────────────
const C = {
  accent: "#A9334D",
  success: "#059669",
  danger: "#DC2626",
};

const CATEGORY_COLORS = {
  "Disease-modifying": "#A9334D",
  "Iron chelation": "#F0531C",
  Supportive: "#059669",
};

const FREQUENCIES = [
  "Daily",
  "Twice daily",
  "Three times daily",
  "Weekly",
  "As needed",
];

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
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {options.map((opt) => {
        const val = typeof opt === "object" ? opt.value : opt;
        const label = getLabel
          ? getLabel(opt)
          : typeof opt === "object"
            ? opt.label
            : String(opt);
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
              backgroundColor: active ? C.accent : t.surface,
              borderWidth: 1,
              borderColor: active ? C.accent : t.border,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: 13,
                color: active ? "#fff" : t.text,
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function FieldLabel({ children, optional }) {
  const t = useTheme();
  return (
    <View
      style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}
    >
      <Text
        style={{
          fontFamily: fonts.semibold,
          fontSize: 11,
          color: t.textSecondary,
          textTransform: "uppercase",
          letterSpacing: 0.7,
        }}
      >
        {children}
      </Text>
      {optional && (
        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: 12,
            color: t.textSecondary,
            marginLeft: 6,
          }}
        >
          optional
        </Text>
      )}
    </View>
  );
}

// ─── Scan illustration ───────────────────────────────────────────────────────
function ScanIllustration() {
  const t = useTheme();
  const lineColor = t.isDark ? "#C8A8B0" : "#2A1A1E";
  const bgFill = t.isDark ? "rgba(169,51,77,0.12)" : "#F9EFF1";
  return (
    <Svg width={82} height={82} viewBox="0 0 80 80">
      <Circle cx="40" cy="40" r="36" fill={bgFill} />
      <Line x1="16" y1="24" x2="16" y2="56" stroke={lineColor} strokeWidth="3" strokeOpacity="0.9" />
      <Line x1="21" y1="24" x2="21" y2="56" stroke={lineColor} strokeWidth="1.5" strokeOpacity="0.55" />
      <Line x1="25" y1="24" x2="25" y2="56" stroke={lineColor} strokeWidth="2.5" strokeOpacity="0.85" />
      <Line x1="30" y1="24" x2="30" y2="56" stroke={lineColor} strokeWidth="1.5" strokeOpacity="0.55" />
      <Line x1="34" y1="24" x2="34" y2="56" stroke={lineColor} strokeWidth="3" strokeOpacity="0.9" />
      <Line x1="39" y1="24" x2="39" y2="56" stroke={lineColor} strokeWidth="1.5" strokeOpacity="0.55" />
      <Line x1="43" y1="24" x2="43" y2="56" stroke={lineColor} strokeWidth="2.5" strokeOpacity="0.85" />
      <Line x1="48" y1="24" x2="48" y2="56" stroke={lineColor} strokeWidth="1.5" strokeOpacity="0.55" />
      <Line x1="52" y1="24" x2="52" y2="56" stroke={lineColor} strokeWidth="3" strokeOpacity="0.9" />
      <Line x1="57" y1="24" x2="57" y2="56" stroke={lineColor} strokeWidth="2" strokeOpacity="0.7" />
      <Line x1="61" y1="24" x2="61" y2="56" stroke={lineColor} strokeWidth="1.5" strokeOpacity="0.55" />
      <Line x1="64" y1="24" x2="64" y2="56" stroke={lineColor} strokeWidth="2.5" strokeOpacity="0.8" />
      <Rect x="12" y="37.5" width="56" height="3" rx="1.5" fill="#F0531C" opacity="0.9" />
      <Rect x="12" y="36" width="56" height="6" rx="3" fill="#F0531C" opacity="0.15" />
      <Path d="M11 28 L11 20 L19 20" stroke="#A9334D" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M69 28 L69 20 L61 20" stroke="#A9334D" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M11 52 L11 60 L19 60" stroke="#A9334D" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M69 52 L69 60 L61 60" stroke="#A9334D" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Helper: parse existing time string ──────────────────────────────────────
function parseTimeStr(timeStr) {
  const match = (timeStr ?? "").match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return { h: 8, m: 0, p: "AM" };
  return {
    h: parseInt(match[1], 10),
    m: parseInt(match[2], 10),
    p: match[3].toUpperCase(),
  };
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function AddMedicationScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { medicationId, prefillName, prefillCategory, prefillDosage } =
    useLocalSearchParams();
  const { data: medications = [] } = useMedicationsQuery();
  const addMed = useAddMedicationMutation();
  const updateMed = useUpdateMedicationMutation();
  const deleteMed = useDeleteMedicationMutation();

  const existing = medicationId
    ? medications.find((m) => m.id === medicationId)
    : null;
  const isEditing = !!existing;

  // Parse existing dosage "500 mg" → parts
  const [existingAmount, existingUnit] = (existing?.dosage ?? "").split(" ");
  const existingTimeParsed = parseTimeStr(existing?.time);
  const existingTimeIsPreset = TIME_PRESETS.some(
    (p) => p.value !== "custom" && p.value === existing?.time,
  );

  // Parse prefill dosage "500mg" or "500 mg" → { amount, unit }
  const prefillParsed = (() => {
    if (!prefillDosage) return { amount: "", unit: "mg" };
    const m = String(prefillDosage).match(/^([\d.]+)\s*([a-zA-Z]+)?/);
    if (!m) return { amount: "", unit: "mg" };
    const u = (m[2] ?? "").toLowerCase();
    const unit = UNITS.find((x) => x.toLowerCase() === u) ?? "mg";
    return { amount: m[1], unit };
  })();

  // ── Navigation state
  const [step, setStep] = useState(isEditing ? 2 : prefillName ? 2 : 0);

  // ── Step 1: Drug
  const [name, setName] = useState(existing?.name ?? prefillName ?? "");
  const [category, setCategory] = useState(
    existing?.category ?? prefillCategory ?? "Supportive",
  );
  const [rxcui, setRxcui] = useState(existing?.rxcui ?? null);
  const [medType, setMedType] = useState(existing?.type ?? "tablet");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customNameInput, setCustomNameInput] = useState("");

  // ── Step 2: Dosage
  const [dosageAmount, setDosageAmount] = useState(
    existingAmount ?? prefillParsed.amount,
  );
  const [dosageUnit, setDosageUnit] = useState(
    existingUnit ?? prefillParsed.unit,
  );

  // ── Step 3: Schedule
  const [frequency, setFrequency] = useState(existing?.frequency ?? "Daily");
  const [time, setTime] = useState(
    isEditing && !existingTimeIsPreset
      ? "custom"
      : (existing?.time ?? "8:00 AM"),
  );
  const [customHour, setCustomHour] = useState(existingTimeParsed.h);
  const [customMinute, setCustomMinute] = useState(existingTimeParsed.m);
  const [customPeriod, setCustomPeriod] = useState(existingTimeParsed.p);

  // ── Step 4: Reminders + Notes
  const existingBefore = existing?.reminders?.find((r) => r.direction === "before");
  const existingAfter = existing?.reminders?.find((r) => r.direction === "after");
  const [remindBefore, setRemindBefore] = useState(!!existingBefore);
  const [remindBeforeMin, setRemindBeforeMin] = useState(existingBefore?.offsetMinutes ?? 10);
  const [remindAfter, setRemindAfter] = useState(!!existingAfter);
  const [remindAfterMin, setRemindAfterMin] = useState(existingAfter?.offsetMinutes ?? 5);
  const [notes, setNotes] = useState(existing?.notes ?? "");

  // ── Step 1: Live drug search (saved medications + RxNorm API)
  const {
    results: drugResults,
    isLoading: drugLoading,
    error: drugError,
  } = useDrugSearch(searchQuery);

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

  const handleSave = () => {
    const dosage = dosageAmount.trim()
      ? `${dosageAmount.trim()} ${dosageUnit}`
      : "";
    const reminders = [];
    if (remindBefore)
      reminders.push({ offsetMinutes: remindBeforeMin, direction: "before" });
    if (remindAfter)
      reminders.push({ offsetMinutes: remindAfterMin, direction: "after" });

    // Sunday = 1 for expo-notifications weekly triggers.
    // Persist weekday for weekly meds so rescheduling does not drift by current date.
    const fallbackWeekday = new Date().getDay() + 1;
    const persistedWeekday =
      Number.isInteger(existing?.weekday) &&
      existing.weekday >= 1 &&
      existing.weekday <= 7
        ? existing.weekday
        : fallbackWeekday;

    const med = {
      name: name.trim(),
      category,
      dosage,
      frequency,
      time: computedTime,
      reminders,
      notes,
      rxcui: rxcui || null,
      type: medType,
      ...(frequency === "Weekly" ? { weekday: persistedWeekday } : { weekday: null }),
    };

    if (isEditing) {
      updateMed.mutate(
        { id: medicationId, updates: med },
        {
          onSuccess: async () => {
            try {
              await scheduleMedicationNotifications({ ...med, id: medicationId });
            } catch (error) {
              console.error("Failed to schedule medication notifications:", error);
            }
            router.back();
          },
        },
      );
    } else {
      addMed.mutate(med, {
        onSuccess: async (savedMed) => {
          try {
            await scheduleMedicationNotifications({ ...med, id: savedMed.id });
          } catch (error) {
            console.error("Failed to schedule medication notifications:", error);
          }
          router.back();
        },
      });
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Medication", `Remove ${name} from your medications?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await cancelMedicationNotifications(medicationId);
          } catch (error) {
            console.error("Failed to cancel medication notifications:", error);
          }
          try {
            await deleteMed.mutateAsync(medicationId);
            router.back();
          } catch (error) {
            console.error("Failed to delete medication:", error);
          }
        },
      },
    ]);
  };

  const catColor = CATEGORY_COLORS[category] ?? C.accent;

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      {/* ── Header ── */}
      <View
        style={{
          backgroundColor: t.surface,
          paddingTop: insets.top + 12,
          paddingBottom: 14,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: t.border,
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
            backgroundColor: t.background,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {step === 0 ? (
            <X size={18} color={t.text} />
          ) : (
            <ChevronLeft size={20} color={t.text} />
          )}
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: fonts.bold,
            fontSize: 20,
            color: t.text,
            flex: 1,
          }}
        >
          {isEditing
            ? "Edit Medication"
            : step === 0
              ? "Add Medication"
              : STEP_LABELS[step]}
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
            backgroundColor: t.surface,
            borderBottomWidth: 1,
            borderBottomColor: t.border,
          }}
        >
          {[1, 2, 3, 4].map((s) => (
            <View
              key={s}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                backgroundColor: s <= step ? C.accent : t.border,
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
              <View style={{ gap: 20, marginTop: 4 }}>
                <Text
                  style={{
                    fontFamily: fonts.regular,
                    fontSize: 15,
                    color: t.textSecondary,
                  }}
                >
                  How would you like to add your medication?
                </Text>

                <View style={{ flexDirection: "row", gap: 12 }}>
                  {/* Search card */}
                  <TouchableOpacity
                    onPress={() => setStep(1)}
                    activeOpacity={0.8}
                    style={{
                      flex: 1,
                      backgroundColor: t.surface,
                      borderRadius: 20,
                      borderWidth: 1.5,
                      borderColor: t.border,
                      alignItems: "center",
                      paddingTop: 28,
                      paddingBottom: 22,
                      paddingHorizontal: 8,
                      gap: 14,
                    }}
                  >
                    <View style={{ height: 100, alignItems: "center", justifyContent: "center" }}>
                      <MedicationBottle type="tablet" color={C.accent} drugName="" size={100} />
                    </View>
                    <View style={{ alignItems: "center", gap: 4 }}>
                      <Text
                        style={{
                          fontFamily: fonts.semibold,
                          fontSize: 14,
                          color: t.text,
                          textAlign: "center",
                        }}
                      >
                        Search drug
                      </Text>
                      <Text
                        style={{
                          fontFamily: fonts.regular,
                          fontSize: 12,
                          color: t.textSecondary,
                          textAlign: "center",
                          lineHeight: 16,
                        }}
                      >
                        Find by name
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Scan card */}
                  <TouchableOpacity
                    onPress={() => router.push("/medication-scan")}
                    activeOpacity={0.8}
                    style={{
                      flex: 1,
                      backgroundColor: t.surface,
                      borderRadius: 20,
                      borderWidth: 1.5,
                      borderColor: t.border,
                      alignItems: "center",
                      paddingTop: 28,
                      paddingBottom: 22,
                      paddingHorizontal: 8,
                      gap: 14,
                    }}
                  >
                    <View style={{ height: 100, alignItems: "center", justifyContent: "center" }}>
                      <ScanIllustration />
                    </View>
                    <View style={{ alignItems: "center", gap: 4 }}>
                      <Text
                        style={{
                          fontFamily: fonts.semibold,
                          fontSize: 14,
                          color: t.text,
                          textAlign: "center",
                        }}
                      >
                        Scan Pill
                      </Text>
                      <Text
                        style={{
                          fontFamily: fonts.regular,
                          fontSize: 12,
                          color: t.textSecondary,
                          textAlign: "center",
                          lineHeight: 16,
                        }}
                      >
                        Barcode or AI photo
                      </Text>
                    </View>
                  </TouchableOpacity>
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
                    backgroundColor: t.surface,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: drugLoading ? C.accent : t.border,
                    paddingHorizontal: 14,
                    marginBottom: 16,
                    gap: 10,
                  }}
                >
                  {drugLoading ? (
                    <ActivityIndicator size="small" color={C.accent} />
                  ) : (
                    <Search size={16} color={t.textSecondary} />
                  )}
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search any medication…"
                    placeholderTextColor={t.textSecondary}
                    autoFocus
                    style={{
                      flex: 1,
                      fontFamily: fonts.regular,
                      fontSize: 15,
                      color: t.text,
                      paddingVertical: 12,
                    }}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSearchQuery("")}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X size={16} color={t.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* API error banner */}
                {drugError && (
                  <View
                    style={{
                      backgroundColor: t.isDark ? "rgba(245,158,11,0.15)" : "#FEF3C7",
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      marginBottom: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: fonts.regular,
                        fontSize: 12,
                        color: t.isDark ? "#D97706" : "#92400E",
                      }}
                    >
                      {drugError}
                    </Text>
                  </View>
                )}

                {/* ── Autocomplete results (query ≥ 2 chars) ── */}
                {searchQuery.trim().length >= 2 && (
                  <>
                    {drugResults.length > 0 && (
                      <View
                        style={{
                          backgroundColor: t.surface,
                          borderRadius: 14,
                          borderWidth: 1,
                          borderColor: t.border,
                          overflow: "hidden",
                          marginBottom: 16,
                        }}
                      >
                        {drugResults.map((drug, i) => (
                          <React.Fragment key={`${drug.name}-${i}`}>
                            <TouchableOpacity
                              onPress={async () => {
                                setName(drug.name);
                                setCategory(drug.category);
                                if (drug.rxcui) {
                                  setRxcui(drug.rxcui);
                                  const form = await fetchDoseForm(drug.rxcui);
                                  if (form) setMedType(normalizeDoseForm(form));
                                }
                                setStep(2);
                              }}
                              activeOpacity={0.7}
                              style={{
                                paddingVertical: 13,
                                paddingHorizontal: 16,
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 10,
                              }}
                            >
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={{
                                    fontFamily: fonts.medium,
                                    fontSize: 15,
                                    color: t.text,
                                  }}
                                >
                                  {drug.name}
                                </Text>
                                {drug.subtitle && (
                                  <Text
                                    style={{
                                      fontFamily: fonts.regular,
                                      fontSize: 12,
                                      color: t.textSecondary,
                                      marginTop: 1,
                                    }}
                                  >
                                    {drug.subtitle}
                                  </Text>
                                )}
                              </View>
                              {/* Source badge */}
                              {drug.source === "saved" && (
                                <View
                                  style={{
                                    backgroundColor: t.isDark ? "rgba(5,150,105,0.15)" : "#EBF5F0",
                                    borderRadius: 6,
                                    paddingHorizontal: 7,
                                    paddingVertical: 2,
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontFamily: fonts.medium,
                                      fontSize: 10,
                                      color: C.success,
                                    }}
                                  >
                                    Saved
                                  </Text>
                                </View>
                              )}
                              {drug.source === "scd" && (
                                <View
                                  style={{
                                    backgroundColor: t.isDark ? "rgba(169,51,77,0.15)" : "#F5EBF0",
                                    borderRadius: 6,
                                    paddingHorizontal: 7,
                                    paddingVertical: 2,
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontFamily: fonts.medium,
                                      fontSize: 10,
                                      color: C.accent,
                                    }}
                                  >
                                    SCD
                                  </Text>
                                </View>
                              )}
                              <ChevronRight size={16} color={t.textSecondary} />
                            </TouchableOpacity>
                            {i < drugResults.length - 1 && (
                              <View
                                style={{
                                  height: 1,
                                  backgroundColor: t.divider,
                                  marginLeft: 16,
                                }}
                              />
                            )}
                          </React.Fragment>
                        ))}
                      </View>
                    )}

                    {/* Loading */}
                    {drugLoading && drugResults.length === 0 && (
                      <View
                        style={{ alignItems: "center", paddingVertical: 32 }}
                      >
                        <ActivityIndicator color={C.accent} />
                        <Text
                          style={{
                            fontFamily: fonts.regular,
                            fontSize: 13,
                            color: t.textSecondary,
                            marginTop: 10,
                          }}
                        >
                          Searching drug database…
                        </Text>
                      </View>
                    )}

                    {/* No results */}
                    {!drugLoading && drugResults.length === 0 && !drugError && (
                      <View
                        style={{ alignItems: "center", paddingVertical: 28 }}
                      >
                        <Text
                          style={{
                            fontFamily: fonts.medium,
                            fontSize: 14,
                            color: t.text,
                          }}
                        >
                          No results for "{searchQuery.trim()}"
                        </Text>
                        <Text
                          style={{
                            fontFamily: fonts.regular,
                            fontSize: 13,
                            color: t.textSecondary,
                            marginTop: 4,
                          }}
                        >
                          Try a different spelling or add it manually
                        </Text>
                      </View>
                    )}

                    {/* Not found + manual entry */}
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
                          borderColor: t.border,
                          borderStyle: "dashed",
                          gap: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: fonts.medium,
                            fontSize: 14,
                            color: t.textSecondary,
                          }}
                        >
                          Can't find it? Add manually
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View
                        style={{
                          backgroundColor: t.surface,
                          borderRadius: 14,
                          borderWidth: 1,
                          borderColor: t.border,
                          padding: 16,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: fonts.medium,
                            fontSize: 13,
                            color: t.text,
                            marginBottom: 10,
                          }}
                        >
                          Enter medication name
                        </Text>
                        <TextInput
                          value={customNameInput}
                          onChangeText={setCustomNameInput}
                          placeholder={searchQuery || "e.g. Ibuprofen"}
                          placeholderTextColor={t.textSecondary}
                          autoFocus
                          style={{
                            backgroundColor: t.background,
                            borderWidth: 1,
                            borderColor: t.border,
                            borderRadius: 10,
                            padding: 12,
                            fontFamily: fonts.regular,
                            fontSize: 15,
                            color: t.text,
                            marginBottom: 12,
                          }}
                        />
                        <TouchableOpacity
                          onPress={() => {
                            const n =
                              customNameInput.trim() || searchQuery.trim();
                            if (!n) return;
                            setName(n);
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
                          <Text
                            style={{
                              fontFamily: fonts.semibold,
                              fontSize: 14,
                              color: "#fff",
                            }}
                          >
                            Continue
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}

                {/* ── Quick picks (empty query) ── */}
                {searchQuery.trim().length < 2 && (
                  <>
                    <Text
                      style={{
                        fontFamily: fonts.semibold,
                        fontSize: 11,
                        color: t.textSecondary,
                        textTransform: "uppercase",
                        letterSpacing: 0.7,
                        marginBottom: 10,
                        marginLeft: 2,
                      }}
                    >
                      Common SCD medications
                    </Text>
                    {SCD_CATEGORIES.map((cat) => {
                      const drugs = SCD_MEDICATIONS.filter(
                        (d) => d.category === cat,
                      );
                      const cc = CATEGORY_COLORS[cat] ?? C.accent;
                      return (
                        <View key={cat} style={{ marginBottom: 18 }}>
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
                              backgroundColor: t.surface,
                              borderRadius: 14,
                              borderWidth: 1,
                              borderColor: t.border,
                              overflow: "hidden",
                            }}
                          >
                            {drugs.map((drug, i) => (
                              <React.Fragment key={drug.id}>
                                <TouchableOpacity
                                  onPress={async () => {
                                    setName(drug.name);
                                    setCategory(drug.category);
                                    if (drug.rxcui) {
                                      setRxcui(drug.rxcui);
                                      const form = await fetchDoseForm(
                                        drug.rxcui,
                                      );
                                      if (form)
                                        setMedType(normalizeDoseForm(form));
                                    }
                                    setStep(2);
                                  }}
                                  activeOpacity={0.7}
                                  style={{
                                    paddingVertical: 13,
                                    paddingHorizontal: 16,
                                    flexDirection: "row",
                                    alignItems: "center",
                                  }}
                                >
                                  <View style={{ flex: 1 }}>
                                    <Text
                                      style={{
                                        fontFamily: fonts.medium,
                                        fontSize: 15,
                                        color: t.text,
                                      }}
                                    >
                                      {drug.name}
                                    </Text>
                                    {drug.subtitle && (
                                      <Text
                                        style={{
                                          fontFamily: fonts.regular,
                                          fontSize: 12,
                                          color: t.textSecondary,
                                          marginTop: 1,
                                        }}
                                      >
                                        {drug.subtitle}
                                      </Text>
                                    )}
                                  </View>
                                  <View
                                    style={{
                                      backgroundColor: t.isDark ? "rgba(169,51,77,0.15)" : "#F5EBF0",
                                      borderRadius: 6,
                                      paddingHorizontal: 7,
                                      paddingVertical: 2,
                                      marginRight: 8,
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontFamily: fonts.medium,
                                        fontSize: 10,
                                        color: C.accent,
                                      }}
                                    >
                                      SCD
                                    </Text>
                                  </View>
                                  <ChevronRight size={16} color={t.textSecondary} />
                                </TouchableOpacity>
                                {i < drugs.length - 1 && (
                                  <View
                                    style={{
                                      height: 1,
                                      backgroundColor: t.divider,
                                      marginLeft: 16,
                                    }}
                                  />
                                )}
                              </React.Fragment>
                            ))}
                          </View>
                        </View>
                      );
                    })}
                  </>
                )}
              </View>
            )}

            {/* ━━ Step 2: Dosage ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {step === 2 && (
              <View>
                {/* Drug confirmation pill */}
                <View
                  style={{
                    backgroundColor: t.surface,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: t.border,
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
                    <Text
                      style={{
                        fontFamily: fonts.semibold,
                        fontSize: 17,
                        color: t.text,
                      }}
                    >
                      {name}
                    </Text>
                    <Text
                      style={{
                        fontFamily: fonts.regular,
                        fontSize: 13,
                        color: t.textSecondary,
                        marginTop: 2,
                      }}
                    >
                      {category}
                    </Text>
                  </View>
                </View>

                <FieldLabel optional>Dosage amount</FieldLabel>
                <TextInput
                  value={dosageAmount}
                  onChangeText={setDosageAmount}
                  placeholder="e.g. 500"
                  placeholderTextColor={t.textSecondary}
                  keyboardType="numeric"
                  style={{
                    backgroundColor: t.surface,
                    borderWidth: 1,
                    borderColor: t.border,
                    borderRadius: 12,
                    padding: 14,
                    fontFamily: fonts.regular,
                    fontSize: 24,
                    color: t.text,
                    marginBottom: 16,
                    textAlign: "center",
                  }}
                />

                <FieldLabel>Unit</FieldLabel>
                <ChipRow
                  options={UNITS}
                  selected={dosageUnit}
                  onSelect={setDosageUnit}
                />

                {dosageAmount.trim().length > 0 && (
                  <View
                    style={{
                      marginTop: 20,
                      backgroundColor: t.isDark ? "rgba(5,150,105,0.12)" : "#F0F9F5",
                      borderRadius: 10,
                      padding: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: fonts.semibold,
                        fontSize: 16,
                        color: C.success,
                      }}
                    >
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
                  <ChipRow
                    options={FREQUENCIES}
                    selected={frequency}
                    onSelect={setFrequency}
                  />
                </View>

                <FieldLabel>Time of day</FieldLabel>
                <ChipRow
                  options={TIME_PRESETS}
                  selected={time}
                  onSelect={setTime}
                />

                {/* Custom time drum-roll */}
                {time === "custom" && (
                  <View
                    style={{
                      backgroundColor: t.surface,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: t.border,
                      marginTop: 14,
                      overflow: "hidden",
                    }}
                  >
                    <View style={{ flexDirection: "row" }}>
                      <Picker
                        selectedValue={customHour}
                        onValueChange={setCustomHour}
                        style={{ flex: 1 }}
                        itemStyle={{
                          fontFamily: fonts.regular,
                          color: t.text,
                          fontSize: 18,
                        }}
                      >
                        {HOURS.map((h) => (
                          <Picker.Item key={h} label={String(h)} value={h} />
                        ))}
                      </Picker>
                      <Picker
                        selectedValue={customMinute}
                        onValueChange={setCustomMinute}
                        style={{ flex: 1 }}
                        itemStyle={{
                          fontFamily: fonts.regular,
                          color: t.text,
                          fontSize: 18,
                        }}
                      >
                        {MINUTES_LIST.map((m) => (
                          <Picker.Item
                            key={m}
                            label={String(m).padStart(2, "0")}
                            value={m}
                          />
                        ))}
                      </Picker>
                      <Picker
                        selectedValue={customPeriod}
                        onValueChange={setCustomPeriod}
                        style={{ flex: 1 }}
                        itemStyle={{
                          fontFamily: fonts.regular,
                          color: t.text,
                          fontSize: 18,
                        }}
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
                    backgroundColor: t.isDark ? "rgba(5,150,105,0.12)" : "#F0F9F5",
                    borderRadius: 10,
                    padding: 12,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: fonts.semibold,
                      fontSize: 14,
                      color: C.success,
                    }}
                  >
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
                    backgroundColor: t.surface,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: t.border,
                    padding: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 24,
                  }}
                >
                  <MedicationIcon type="tablet" color={catColor} size={28} />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: fonts.semibold,
                        fontSize: 14,
                        color: t.text,
                      }}
                    >
                      {name}
                    </Text>
                    <Text
                      style={{
                        fontFamily: fonts.regular,
                        fontSize: 12,
                        color: t.textSecondary,
                      }}
                    >
                      {frequency} · {computedTime}
                    </Text>
                  </View>
                </View>

                {/* Remind before */}
                <View
                  style={{
                    backgroundColor: t.surface,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: t.border,
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
                      <Text
                        style={{
                          fontFamily: fonts.semibold,
                          fontSize: 14,
                          color: t.text,
                        }}
                      >
                        Remind me before
                      </Text>
                      <Text
                        style={{
                          fontFamily: fonts.regular,
                          fontSize: 12,
                          color: t.textSecondary,
                          marginTop: 2,
                        }}
                      >
                        Get a heads-up before it's time
                      </Text>
                    </View>
                    <Switch
                      value={remindBefore}
                      onValueChange={setRemindBefore}
                      trackColor={{ false: t.border, true: `${C.accent}80` }}
                      thumbColor={remindBefore ? C.accent : t.textSecondary}
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
                    backgroundColor: t.surface,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: t.border,
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
                      <Text
                        style={{
                          fontFamily: fonts.semibold,
                          fontSize: 14,
                          color: t.text,
                        }}
                      >
                        Remind if missed
                      </Text>
                      <Text
                        style={{
                          fontFamily: fonts.regular,
                          fontSize: 12,
                          color: t.textSecondary,
                          marginTop: 2,
                        }}
                      >
                        Nudge me after the time passes
                      </Text>
                    </View>
                    <Switch
                      value={remindAfter}
                      onValueChange={setRemindAfter}
                      trackColor={{ false: t.border, true: `${C.accent}80` }}
                      thumbColor={remindAfter ? C.accent : t.textSecondary}
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
                  placeholderTextColor={t.textSecondary}
                  multiline
                  numberOfLines={3}
                  style={{
                    backgroundColor: t.surface,
                    borderWidth: 1,
                    borderColor: t.border,
                    borderRadius: 12,
                    padding: 14,
                    fontFamily: fonts.regular,
                    fontSize: 15,
                    color: t.text,
                    minHeight: 80,
                    textAlignVertical: "top",
                  }}
                />

                {isEditing && (
                  <TouchableOpacity
                    onPress={handleDelete}
                    activeOpacity={0.7}
                    style={{
                      alignItems: "center",
                      paddingVertical: 20,
                      marginTop: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: fonts.medium,
                        fontSize: 15,
                        color: C.danger,
                      }}
                    >
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
              backgroundColor: t.background,
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: insets.bottom + 16,
              borderTopWidth: 1,
              borderTopColor: t.border,
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
              <Text
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: 16,
                  color: "#fff",
                }}
              >
                {step === 4
                  ? isEditing
                    ? "Save Changes"
                    : "Save Medication"
                  : "Next"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}
