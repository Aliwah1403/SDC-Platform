import React, { useState, useEffect } from "react";
import { usePostHog } from "posthog-react-native";
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
  Modal,
  Pressable,
  Image,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
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
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import MedicationBottle from "@/components/MedicationBottle";
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
import MedicationIcon, { normalizeDoseForm, MED_TYPE_IMAGES } from "@/components/MedicationIcon";
import { useDrugSearch } from "@/hooks/useDrugSearch";
import { fetchDoseForm } from "@/services/supabaseQueries";
import { Sentry } from "@/utils/sentry";
import {
  scheduleMedicationNotifications,
  cancelMedicationNotifications,
} from "@/utils/medicationNotifications";

const AnimatedSvgPath = Animated.createAnimatedComponent(Path);

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

const SCHEDULE_OPTIONS = [
  {
    value: "Every Day",
    label: "Every Day",
    description: "Take one or more doses daily",
  },
  {
    value: "Specific Days",
    label: "On Specific Days",
    description: "Choose which days of the week",
  },
  {
    value: "As Needed",
    label: "As Needed",
    description: "Take only when required",
  },
];

const UNITS = ["mg", "mcg", "g", "ml", "tablets", "units", "IU"];
const REMINDER_MINS = [5, 10, 15, 30];

// Sunday = 1 per expo-notifications weekly trigger convention
const WEEKDAYS = [
  { label: "Mon", value: 2 },
  { label: "Tue", value: 3 },
  { label: "Wed", value: 4 },
  { label: "Thu", value: 5 },
  { label: "Fri", value: 6 },
  { label: "Sat", value: 7 },
  { label: "Sun", value: 1 },
];

const STEP_LABELS = [
  "",
  "Find Drug",
  "Medication Type",
  "Dosage",
  "Schedule",
  "Review",
];

const MED_TYPES = [
  { key: "tablet",       label: "Tablet",       image: MED_TYPE_IMAGES.tablet },
  { key: "capsule",      label: "Capsule",      image: null },
  { key: "softgel",      label: "Softgel",      image: null },
  { key: "liquid",       label: "Liquid",       image: MED_TYPE_IMAGES.liquid },
  { key: "ointment",     label: "Ointment",     image: MED_TYPE_IMAGES.ointment },
  { key: "inhaler",      label: "Inhaler",      image: null },
  { key: "injection",    label: "Injection",    image: MED_TYPE_IMAGES.injection },
  { key: "chewable",     label: "Chewable",     image: MED_TYPE_IMAGES.chewable },
  { key: "drops",        label: "Drops",        image: MED_TYPE_IMAGES.drops },
  { key: "effervescent", label: "Effervescent", image: MED_TYPE_IMAGES.effervescent },
  { key: "enema",        label: "Enema",        image: MED_TYPE_IMAGES.enema },
  { key: "lozenge",      label: "Lozenge",      image: MED_TYPE_IMAGES.lozenge },
  { key: "mouthwash",    label: "Mouthwash",    image: MED_TYPE_IMAGES.mouthwash },
  { key: "nasal-spray",  label: "Nasal Spray",  image: MED_TYPE_IMAGES["nasal-spray"] },
  { key: "patch",        label: "Patch",        image: MED_TYPE_IMAGES.patch },
  { key: "powder",       label: "Powder",       image: MED_TYPE_IMAGES.powder },
  { key: "spray",        label: "Spray",        image: MED_TYPE_IMAGES.spray },
];

// ─── Animated checkbox (adapted from animated-checkbox) ──────────────────────
const CHECKBOX_BOX_PATH =
  "M24 0.5H40C48.5809 0.5 54.4147 2.18067 58.117 5.88299C61.8193 9.58532 63.5 15.4191 63.5 24V40C63.5 48.5809 61.8193 54.4147 58.117 58.117C54.4147 61.8193 48.5809 63.5 40 63.5H24C15.4191 63.5 9.58532 61.8193 5.88299 58.117C2.18067 54.4147 0.5 48.5809 0.5 40V24C0.5 15.4191 2.18067 9.58532 5.88299 5.88299C9.58532 2.18067 15.4191 0.5 24 0.5Z";
const CHECKBOX_TICK_PATH = "M20 32L28 40L44 24";
const CHECKBOX_PADDING = 10;
const CHECKBOX_VIEWPORT = 64 + CHECKBOX_PADDING;
// Pre-calculated total length of the tick path
const TICK_LENGTH = 34;

const UNIT_LABELS = {
  mg: "Milligrams",
  mcg: "Micrograms",
  g: "Grams",
  ml: "Millilitres",
  tablets: "Tablets",
  units: "Units",
  IU: "Intl. Units",
};

function AnimatedCheckbox({ checked, color, size = 22 }) {
  const animValue = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    animValue.value = withTiming(checked ? 1 : 0, {
      duration: checked ? 280 : 200,
      easing: checked
        ? Easing.bezier(0.4, 0, 0.2, 1)
        : Easing.bezier(0.4, 0, 0.6, 1),
    });
  }, [checked]);

  const animatedTickProps = useAnimatedProps(() => ({
    strokeDashoffset: TICK_LENGTH - TICK_LENGTH * animValue.value,
    opacity: animValue.value > 0 ? 1 : 0,
  }));

  const viewBox = `${-CHECKBOX_PADDING} ${-CHECKBOX_PADDING} ${CHECKBOX_VIEWPORT + CHECKBOX_PADDING} ${CHECKBOX_VIEWPORT + CHECKBOX_PADDING}`;

  return (
    <Svg width={size} height={size} viewBox={viewBox}>
      <Path
        d={CHECKBOX_BOX_PATH}
        stroke={color}
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <AnimatedSvgPath
        d={CHECKBOX_TICK_PATH}
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={TICK_LENGTH}
        animatedProps={animatedTickProps}
      />
    </Svg>
  );
}

function UnitSelector({ selected, onSelect }) {
  const t = useTheme();
  return (
    <View
      style={{
        borderRadius: 14,
        borderWidth: 1,
        borderColor: t.border,
        overflow: "hidden",
      }}
    >
      {UNITS.map((unit, i) => {
        const isSelected = selected === unit;
        const isLast = i === UNITS.length - 1;
        return (
          <TouchableOpacity
            key={unit}
            onPress={() => onSelect(unit)}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 13,
              paddingHorizontal: 16,
              backgroundColor: isSelected ? `${C.accent}0D` : t.surface,
              borderBottomWidth: isLast ? 0 : 1,
              borderBottomColor: t.border,
              gap: 12,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: 15,
                  color: isSelected ? C.accent : t.text,
                }}
              >
                {unit}
              </Text>
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 12,
                  color: t.textSecondary,
                  marginTop: 1,
                }}
              >
                {UNIT_LABELS[unit]}
              </Text>
            </View>
            <AnimatedCheckbox
              checked={isSelected}
              color={isSelected ? C.accent : t.border}
              size={22}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Tiny shared components ──────────────────────────────────────────────────
function ChipRow({ options, selected, onSelect, getLabel, multiSelect }) {
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
        const active = multiSelect
          ? Array.isArray(selected) && selected.includes(val)
          : selected === val;
        return (
          <TouchableOpacity
            key={String(val)}
            onPress={() => {
              if (multiSelect) {
                onSelect(
                  active
                    ? selected.filter((v) => v !== val)
                    : [...(selected ?? []), val],
                );
              } else {
                onSelect(val);
              }
            }}
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
      <Line
        x1="16"
        y1="24"
        x2="16"
        y2="56"
        stroke={lineColor}
        strokeWidth="3"
        strokeOpacity="0.9"
      />
      <Line
        x1="21"
        y1="24"
        x2="21"
        y2="56"
        stroke={lineColor}
        strokeWidth="1.5"
        strokeOpacity="0.55"
      />
      <Line
        x1="25"
        y1="24"
        x2="25"
        y2="56"
        stroke={lineColor}
        strokeWidth="2.5"
        strokeOpacity="0.85"
      />
      <Line
        x1="30"
        y1="24"
        x2="30"
        y2="56"
        stroke={lineColor}
        strokeWidth="1.5"
        strokeOpacity="0.55"
      />
      <Line
        x1="34"
        y1="24"
        x2="34"
        y2="56"
        stroke={lineColor}
        strokeWidth="3"
        strokeOpacity="0.9"
      />
      <Line
        x1="39"
        y1="24"
        x2="39"
        y2="56"
        stroke={lineColor}
        strokeWidth="1.5"
        strokeOpacity="0.55"
      />
      <Line
        x1="43"
        y1="24"
        x2="43"
        y2="56"
        stroke={lineColor}
        strokeWidth="2.5"
        strokeOpacity="0.85"
      />
      <Line
        x1="48"
        y1="24"
        x2="48"
        y2="56"
        stroke={lineColor}
        strokeWidth="1.5"
        strokeOpacity="0.55"
      />
      <Line
        x1="52"
        y1="24"
        x2="52"
        y2="56"
        stroke={lineColor}
        strokeWidth="3"
        strokeOpacity="0.9"
      />
      <Line
        x1="57"
        y1="24"
        x2="57"
        y2="56"
        stroke={lineColor}
        strokeWidth="2"
        strokeOpacity="0.7"
      />
      <Line
        x1="61"
        y1="24"
        x2="61"
        y2="56"
        stroke={lineColor}
        strokeWidth="1.5"
        strokeOpacity="0.55"
      />
      <Line
        x1="64"
        y1="24"
        x2="64"
        y2="56"
        stroke={lineColor}
        strokeWidth="2.5"
        strokeOpacity="0.8"
      />
      <Rect
        x="12"
        y="37.5"
        width="56"
        height="3"
        rx="1.5"
        fill="#F0531C"
        opacity="0.9"
      />
      <Rect
        x="12"
        y="36"
        width="56"
        height="6"
        rx="3"
        fill="#F0531C"
        opacity="0.15"
      />
      <Path
        d="M11 28 L11 20 L19 20"
        stroke="#A9334D"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M69 28 L69 20 L61 20"
        stroke="#A9334D"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M11 52 L11 60 L19 60"
        stroke="#A9334D"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M69 52 L69 60 L61 60"
        stroke="#A9334D"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Helper: parse existing time string ──────────────────────────────────────
function makeTime(h, m = 0) {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function parseTimeToDate(timeStr) {
  const match = (timeStr ?? "").match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return makeTime(8);
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return makeTime(h, m);
}

function formatTime(d) {
  const h = d.getHours();
  const m = d.getMinutes();
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function migrateFrequency(f) {
  if (!f) return "Every Day";
  if (f === "As needed" || f === "As Needed") return "As Needed";
  if (f === "Weekly" || f === "Specific Days") return "Specific Days";
  return "Every Day";
}

function defaultTimesForFrequency(freq, existingTimeStr) {
  if (freq === "As Needed") return [];
  return [existingTimeStr ? parseTimeToDate(existingTimeStr) : makeTime(8)];
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function AddMedicationScreen() {
  const posthog = usePostHog();
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
  const [step, setStep] = useState(isEditing ? 3 : prefillName ? 3 : 0);

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

  // ── Step 3: Dosage
  const [dosageAmount, setDosageAmount] = useState(
    existingAmount ?? prefillParsed.amount,
  );
  const [dosageUnit, setDosageUnit] = useState(
    existingUnit ?? (prefillDosage ? prefillParsed.unit : null),
  );

  // ── Step 4: Schedule
  const [frequency, setFrequency] = useState(() =>
    migrateFrequency(existing?.frequency),
  );
  const [times, setTimes] = useState(() => {
    if (Array.isArray(existing?.times) && existing.times.length > 0) {
      return existing.times.map(parseTimeToDate);
    }
    return defaultTimesForFrequency(
      migrateFrequency(existing?.frequency),
      existing?.time,
    );
  });
  const [showTimePickerIndex, setShowTimePickerIndex] = useState(null);
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
  const [selectedDays, setSelectedDays] = useState(
    existing?.selectedDays ??
      (existing?.weekday ? [existing.weekday] : [new Date().getDay() + 1]),
  );

  // ── Step 5: Reminders + Notes
  const existingBefore = existing?.reminders?.find(
    (r) => r.direction === "before",
  );
  const existingAfter = existing?.reminders?.find(
    (r) => r.direction === "after",
  );
  const [remindBefore, setRemindBefore] = useState(!!existingBefore);
  const [remindBeforeMin, setRemindBeforeMin] = useState(
    existingBefore?.offsetMinutes ?? 10,
  );
  const [remindAfter, setRemindAfter] = useState(!!existingAfter);
  const [remindAfterMin, setRemindAfterMin] = useState(
    existingAfter?.offsetMinutes ?? 5,
  );
  const [notes, setNotes] = useState(existing?.notes ?? "");

  // ── Step 1: Live drug search (saved medications + RxNorm API)
  const {
    results: drugResults,
    isLoading: drugLoading,
    error: drugError,
  } = useDrugSearch(searchQuery);

  const computedTime = times.length > 0 ? formatTime(times[0]) : "";

  const goBack = () => {
    if (step === 0) {
      router.back();
    } else {
      setStep((s) => s - 1);
    }
  };

  const handleSave = () => {
    const dosage = dosageAmount.trim()
      ? dosageUnit
        ? `${dosageAmount.trim()} ${dosageUnit}`
        : dosageAmount.trim()
      : "";
    const reminders = [];
    if (remindBefore)
      reminders.push({ offsetMinutes: remindBeforeMin, direction: "before" });
    if (remindAfter)
      reminders.push({ offsetMinutes: remindAfterMin, direction: "after" });

    const med = {
      name: name.trim(),
      category,
      dosage,
      frequency,
      time: computedTime,
      times: times.map(formatTime),
      reminders,
      notes,
      rxcui: rxcui || null,
      type: medType,
      ...(frequency === "Specific Days"
        ? { selectedDays, weekday: selectedDays[0] ?? null }
        : { selectedDays: [], weekday: null }),
    };

    const onError = (err) => {
      Alert.alert(
        "Couldn't save medication",
        err?.message ?? "Something went wrong. Please try again.",
      );
    };

    if (isEditing) {
      updateMed.mutate(
        { id: medicationId, updates: med },
        {
          onSuccess: async () => {
            posthog?.capture("medication_updated", {
              medication_category: med.category,
              change_type: "edit",
            });
            try {
              await scheduleMedicationNotifications({
                ...med,
                id: medicationId,
              });
            } catch (error) {
              console.error(
                "Failed to schedule medication notifications:",
                error,
              );
            }
            router.back();
          },
          onError,
        },
      );
    } else {
      addMed.mutate(med, {
        onSuccess: async (savedMed) => {
          posthog?.capture("medication_added", {
            medication_category: med.category,
            frequency: med.frequency,
            has_dosage: Boolean(med.dosage),
            has_reminder: med.reminders.length > 0,
          });
          if (med.time) {
            posthog?.capture("medication_schedule_created", {
              medication_category: med.category,
              dose_times_count: 1,
              schedule_type: med.frequency,
            });
          }
          try {
            await scheduleMedicationNotifications({
              ...med,
              id: savedMed?.id,
            });
          } catch (error) {
            console.error(
              "Failed to schedule medication notifications:",
              error,
            );
          }
          router.back();
        },
        onError,
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
            posthog?.capture("medication_deleted", {
              medication_category: category,
            });
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
          {[1, 2, 3, 4, 5].map((s) => (
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
                    <View
                      style={{
                        height: 100,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <MedicationBottle
                        type="tablet"
                        color={C.accent}
                        drugName=""
                        size={100}
                      />
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
                    <View
                      style={{
                        height: 100,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
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
                      backgroundColor: t.isDark
                        ? "rgba(245,158,11,0.15)"
                        : "#FEF3C7",
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
                                let typeResolved = false;
                                if (drug.rxcui) {
                                  setRxcui(drug.rxcui);
                                  try {
                                    const form = await fetchDoseForm(
                                      drug.rxcui,
                                    );
                                    if (form) {
                                      setMedType(normalizeDoseForm(form));
                                      typeResolved = true;
                                    } else {
                                      posthog?.capture(
                                        "medication_dose_form_unavailable",
                                        {
                                          rxcui: drug.rxcui,
                                          drug_name: drug.name,
                                        },
                                      );
                                    }
                                  } catch (err) {
                                    Sentry.captureException(err);
                                    posthog?.capture(
                                      "medication_dose_form_fetch_failed",
                                      {
                                        rxcui: drug.rxcui,
                                        drug_name: drug.name,
                                        error: err?.message,
                                      },
                                    );
                                  }
                                }
                                setStep(typeResolved ? 3 : 2);
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
                                    backgroundColor: t.isDark
                                      ? "rgba(5,150,105,0.15)"
                                      : "#EBF5F0",
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
                                    backgroundColor: t.isDark
                                      ? "rgba(169,51,77,0.15)"
                                      : "#F5EBF0",
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
                                    let typeResolved = false;
                                    if (drug.rxcui) {
                                      setRxcui(drug.rxcui);
                                      try {
                                        const form = await fetchDoseForm(
                                          drug.rxcui,
                                        );
                                        if (form) {
                                          setMedType(normalizeDoseForm(form));
                                          typeResolved = true;
                                        } else {
                                          posthog?.capture(
                                            "medication_dose_form_unavailable",
                                            {
                                              rxcui: drug.rxcui,
                                              drug_name: drug.name,
                                            },
                                          );
                                        }
                                      } catch (err) {
                                        Sentry.captureException(err);
                                        posthog?.capture(
                                          "medication_dose_form_fetch_failed",
                                          {
                                            rxcui: drug.rxcui,
                                            drug_name: drug.name,
                                            error: err?.message,
                                          },
                                        );
                                      }
                                    }
                                    setStep(typeResolved ? 3 : 2);
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
                                      backgroundColor: t.isDark
                                        ? "rgba(169,51,77,0.15)"
                                        : "#F5EBF0",
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
                                  <ChevronRight
                                    size={16}
                                    color={t.textSecondary}
                                  />
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

            {/* ━━ Step 2: Medication Type Picker ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {step === 2 && (
              <View>
                <Text
                  style={{
                    fontFamily: fonts.semibold,
                    fontSize: 20,
                    color: t.text,
                    marginBottom: 6,
                  }}
                >
                  What kind of medication is this?
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.regular,
                    fontSize: 14,
                    color: t.textSecondary,
                    marginBottom: 28,
                  }}
                >
                  Select the form so we can show the right icon.
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  {MED_TYPES.map(({ key, label, image }) => {
                    const isSelected = medType === key;
                    return (
                      <TouchableOpacity
                        key={key}
                        onPress={() => setMedType(key)}
                        activeOpacity={0.75}
                        style={{
                          width: "47%",
                          backgroundColor: isSelected
                            ? `${C.accent}15`
                            : t.surface,
                          borderRadius: 16,
                          borderWidth: 1.5,
                          borderColor: isSelected ? C.accent : t.border,
                          overflow: "hidden",
                        }}
                      >
                        {image ? (
                          <View
                            style={{
                              width: "100%",
                              height: 120,
                              alignItems: "center",
                              justifyContent: "center",
                              padding: 12,
                            }}
                          >
                            <Image
                              source={image}
                              style={{
                                width: "100%",
                                height: "100%",
                              }}
                              resizeMode="contain"
                            />
                          </View>
                        ) : (
                          <View
                            style={{
                              height: 130,
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: isSelected
                                ? `${C.accent}10`
                                : t.background,
                            }}
                          >
                            <MedicationIcon
                              type={key}
                              color={isSelected ? C.accent : t.textSecondary}
                              size={56}
                            />
                          </View>
                        )}
                        <View
                          style={{
                            paddingVertical: 12,
                            paddingHorizontal: 14,
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: fonts.semibold,
                              fontSize: 13,
                              color: isSelected ? C.accent : t.text,
                            }}
                          >
                            {label}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ━━ Step 3: Dosage ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {step === 3 && (
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
                    <MedicationIcon type={medType} color={catColor} size={36} />
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

                <FieldLabel optional>Dosage strength</FieldLabel>
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

                <FieldLabel optional>Unit</FieldLabel>
                <UnitSelector selected={dosageUnit} onSelect={setDosageUnit} />

                {dosageAmount.trim().length > 0 && (
                  <View
                    style={{
                      marginTop: 20,
                      backgroundColor: t.isDark
                        ? "rgba(5,150,105,0.12)"
                        : "#F0F9F5",
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

            {/* ━━ Step 4: Schedule & Reminders ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {step === 4 && (
              <View>
                {/* When will you take this? */}
                <FieldLabel>When will you take this?</FieldLabel>
                <TouchableOpacity
                  onPress={() => setShowFrequencyPicker(true)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: t.surface,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: t.border,
                    paddingVertical: 15,
                    paddingHorizontal: 16,
                    marginBottom: 28,
                  }}
                >
                  <Text
                    style={{
                      flex: 1,
                      fontFamily: fonts.medium,
                      fontSize: 15,
                      color: t.text,
                    }}
                  >
                    {SCHEDULE_OPTIONS.find((o) => o.value === frequency)
                      ?.label ?? frequency}
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.semibold,
                      fontSize: 14,
                      color: C.accent,
                    }}
                  >
                    Change
                  </Text>
                </TouchableOpacity>

                {/* Specific Days: multi-select day chips */}
                {frequency === "Specific Days" && (
                  <View style={{ marginBottom: 28 }}>
                    <FieldLabel>Days</FieldLabel>
                    <ChipRow
                      options={WEEKDAYS}
                      selected={selectedDays}
                      onSelect={setSelectedDays}
                      multiSelect
                    />
                  </View>
                )}

                {/* As Needed: info card */}
                {frequency === "As Needed" ? (
                  <View
                    style={{
                      backgroundColor: t.surface,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: t.border,
                      padding: 16,
                      marginBottom: 28,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: fonts.regular,
                        fontSize: 14,
                        color: t.textSecondary,
                        lineHeight: 22,
                      }}
                    >
                      Take this medication when required.{"\n"}No scheduled
                      reminder will be set.
                    </Text>
                  </View>
                ) : (
                  <View style={{ marginBottom: 28 }}>
                    <FieldLabel>At what time?</FieldLabel>
                    <View
                      style={{
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: t.border,
                        overflow: "hidden",
                      }}
                    >
                      {times.map((timeDate, i) => {
                        const canRemove = times.length > 1;
                        return (
                          <View
                            key={i}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              backgroundColor: t.surface,
                              borderBottomWidth: 1,
                              borderBottomColor: t.border,
                              paddingVertical: 4,
                              paddingLeft: 8,
                              paddingRight: 16,
                            }}
                          >
                            {/* Minus button */}
                            <TouchableOpacity
                              onPress={() =>
                                setTimes((prev) =>
                                  prev.filter((_, j) => j !== i),
                                )
                              }
                              disabled={!canRemove}
                              activeOpacity={0.7}
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 16,
                                backgroundColor: canRemove
                                  ? C.danger
                                  : t.border,
                                alignItems: "center",
                                justifyContent: "center",
                                marginRight: 12,
                              }}
                            >
                              <Text
                                style={{
                                  color: "#fff",
                                  fontSize: 18,
                                  lineHeight: 20,
                                  fontFamily: fonts.regular,
                                }}
                              >
                                −
                              </Text>
                            </TouchableOpacity>
                            {/* Tappable time */}
                            <TouchableOpacity
                              onPress={() => setShowTimePickerIndex(i)}
                              activeOpacity={0.7}
                              style={{ flex: 1, paddingVertical: 11 }}
                            >
                              <Text
                                style={{
                                  fontFamily: fonts.semibold,
                                  fontSize: 15,
                                  color: C.accent,
                                }}
                              >
                                {formatTime(timeDate)}
                              </Text>
                            </TouchableOpacity>
                            <ChevronRight size={16} color={t.textSecondary} />
                          </View>
                        );
                      })}

                      {/* Add a Time */}
                      {times.length < 6 && (
                        <TouchableOpacity
                          onPress={() =>
                            setTimes((prev) => [...prev, makeTime(12)])
                          }
                          activeOpacity={0.7}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: t.surface,
                            paddingVertical: 4,
                            paddingLeft: 8,
                            paddingRight: 16,
                          }}
                        >
                          <View
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 16,
                              backgroundColor: C.success,
                              alignItems: "center",
                              justifyContent: "center",
                              marginRight: 12,
                            }}
                          >
                            <Text
                              style={{
                                color: "#fff",
                                fontSize: 18,
                                lineHeight: 20,
                                fontFamily: fonts.regular,
                              }}
                            >
                              +
                            </Text>
                          </View>
                          <Text
                            style={{
                              fontFamily: fonts.medium,
                              fontSize: 15,
                              color: C.success,
                              paddingVertical: 11,
                            }}
                          >
                            Add a Time
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}

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
                    marginBottom: 28,
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
              </View>
            )}

            {/* ━━ Step 5: Review ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {step === 5 && (
              <View style={{ gap: 16 }}>
                {/* Medication header */}
                <View
                  style={{
                    backgroundColor: t.surface,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: t.border,
                    padding: 18,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 16,
                      backgroundColor: `${catColor}15`,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MedicationIcon type={medType} color={catColor} size={38} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: fonts.bold,
                        fontSize: 18,
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

                {/* Details card */}
                <View
                  style={{
                    backgroundColor: t.surface,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: t.border,
                    overflow: "hidden",
                  }}
                >
                  {[
                    {
                      label: "Form",
                      value:
                        MED_TYPES.find((m) => m.key === medType)?.label ??
                        medType,
                    },
                    ...(dosageAmount.trim()
                      ? [
                          {
                            label: "Dosage",
                            value: `${dosageAmount.trim()}${dosageUnit ? ` ${dosageUnit}` : ""}`,
                          },
                        ]
                      : []),
                    {
                      label: "Frequency",
                      value:
                        SCHEDULE_OPTIONS.find((o) => o.value === frequency)
                          ?.label ?? frequency,
                    },
                    ...(frequency === "Specific Days"
                      ? [
                          {
                            label: "Days",
                            value:
                              WEEKDAYS.filter((d) =>
                                selectedDays.includes(d.value),
                              )
                                .map((d) => d.label)
                                .join(", ") || "None",
                          },
                        ]
                      : []),
                    ...(frequency !== "As Needed"
                      ? [
                          {
                            label: times.length > 1 ? "Times" : "Time",
                            value: times.map(formatTime).join(" · "),
                          },
                        ]
                      : []),
                  ].map(({ label, value }, i, arr) => (
                    <View
                      key={label}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 13,
                        paddingHorizontal: 16,
                        borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                        borderBottomColor: t.border,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: fonts.regular,
                          fontSize: 14,
                          color: t.textSecondary,
                          flex: 1,
                        }}
                      >
                        {label}
                      </Text>
                      <Text
                        style={{
                          fontFamily: fonts.semibold,
                          fontSize: 14,
                          color: t.text,
                        }}
                      >
                        {value}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Reminders card — only if at least one is on */}
                {(remindBefore || remindAfter) && (
                  <View
                    style={{
                      backgroundColor: t.surface,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: t.border,
                      overflow: "hidden",
                    }}
                  >
                    {[
                      remindBefore && {
                        label: "Before dose",
                        value: `${remindBeforeMin} min before`,
                      },
                      remindAfter && {
                        label: "If missed",
                        value: `${remindAfterMin} min after`,
                      },
                    ]
                      .filter(Boolean)
                      .map(({ label, value }, i, arr) => (
                        <View
                          key={label}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            paddingVertical: 13,
                            paddingHorizontal: 16,
                            borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                            borderBottomColor: t.border,
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: fonts.regular,
                              fontSize: 14,
                              color: t.textSecondary,
                              flex: 1,
                            }}
                          >
                            {label}
                          </Text>
                          <Text
                            style={{
                              fontFamily: fonts.semibold,
                              fontSize: 14,
                              color: t.text,
                            }}
                          >
                            {value}
                          </Text>
                        </View>
                      ))}
                  </View>
                )}

                {/* Notes */}
                <View>
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
                </View>

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

        {/* ── Footer: Next / Save (steps 2–5) ── */}
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
            {(() => {
              const dosageEmpty =
                step === 3 && dosageAmount.trim() === "" && !dosageUnit;
              const noDaysSelected =
                step === 4 &&
                frequency === "Specific Days" &&
                selectedDays.length === 0;
              const isSaving =
                step === 5 && (addMed.isPending || updateMed.isPending);
              const nextDisabled = dosageEmpty || noDaysSelected || isSaving;
              return (
                <>
                  <TouchableOpacity
                    onPress={
                      nextDisabled
                        ? undefined
                        : step === 5
                          ? handleSave
                          : () => setStep((s) => s + 1)
                    }
                    activeOpacity={nextDisabled ? 1 : 0.8}
                    style={{
                      backgroundColor: nextDisabled
                        ? t.isDark
                          ? "#3A3A3A"
                          : "#E0D8D5"
                        : C.accent,
                      borderRadius: 14,
                      paddingVertical: 16,
                      alignItems: "center",
                    }}
                  >
                    {isSaving ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text
                        style={{
                          fontFamily: fonts.semibold,
                          fontSize: 16,
                          color: nextDisabled ? t.textSecondary : "#fff",
                        }}
                      >
                        {step === 5
                          ? isEditing
                            ? "Save Changes"
                            : "Save Medication"
                          : "Next"}
                      </Text>
                    )}
                  </TouchableOpacity>
                  {step === 3 && (
                    <TouchableOpacity
                      onPress={() => {
                        setDosageAmount("");
                        setDosageUnit(null);
                        setStep(4);
                      }}
                      activeOpacity={0.7}
                      style={{
                        marginTop: 10,
                        borderRadius: 14,
                        paddingVertical: 14,
                        alignItems: "center",
                        borderWidth: 1.5,
                        borderColor: t.border,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: fonts.medium,
                          fontSize: 15,
                          color: t.textSecondary,
                        }}
                      >
                        Skip
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              );
            })()}
          </View>
        )}
      </KeyboardAvoidingView>

      {/* ── Time picker modal ── */}
      {Platform.OS === "ios" && showTimePickerIndex !== null && (
        <Modal transparent animationType="slide" visible>
          <Pressable
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.35)",
              justifyContent: "flex-end",
            }}
            onPress={() => setShowTimePickerIndex(null)}
          >
            <Pressable>
              <View
                style={{
                  backgroundColor: t.surface,
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  paddingBottom: insets.bottom + 16,
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
                      fontFamily: fonts.regular,
                      fontSize: 15,
                      color: t.textSecondary,
                    }}
                  >
                    {times.length > 1
                      ? `Dose ${(showTimePickerIndex ?? 0) + 1}`
                      : "Dose time"}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowTimePickerIndex(null)}
                  >
                    <Text
                      style={{
                        fontFamily: fonts.semibold,
                        fontSize: 15,
                        color: C.accent,
                      }}
                    >
                      Done
                    </Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={times[showTimePickerIndex] ?? makeTime(8)}
                  mode="time"
                  display="spinner"
                  themeVariant={t.isDark ? "dark" : "light"}
                  onChange={(_, selected) => {
                    if (selected) {
                      setTimes((prev) => {
                        const next = [...prev];
                        next[showTimePickerIndex] = selected;
                        return next;
                      });
                    }
                  }}
                  style={{ alignSelf: "center" }}
                />
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}
      {Platform.OS === "android" && showTimePickerIndex !== null && (
        <DateTimePicker
          value={times[showTimePickerIndex] ?? makeTime(8)}
          mode="time"
          onChange={(_, selected) => {
            setShowTimePickerIndex(null);
            if (selected) {
              setTimes((prev) => {
                const next = [...prev];
                next[showTimePickerIndex] = selected;
                return next;
              });
            }
          }}
        />
      )}

      {/* ── Frequency picker bottom sheet ── */}
      <Modal
        transparent
        animationType="slide"
        visible={showFrequencyPicker}
        onRequestClose={() => setShowFrequencyPicker(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.35)",
            justifyContent: "flex-end",
          }}
          onPress={() => setShowFrequencyPicker(false)}
        >
          <Pressable>
            <View
              style={{
                backgroundColor: t.surface,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingBottom: insets.bottom + 16,
              }}
            >
              {/* Header */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingHorizontal: 20,
                  paddingTop: 16,
                  paddingBottom: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: t.border,
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.semibold,
                    fontSize: 15,
                    color: t.text,
                  }}
                >
                  Schedule Options
                </Text>
                <TouchableOpacity
                  onPress={() => setShowFrequencyPicker(false)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text
                    style={{
                      fontFamily: fonts.semibold,
                      fontSize: 15,
                      color: C.accent,
                    }}
                  >
                    Done
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Options */}
              {SCHEDULE_OPTIONS.map((opt, i) => {
                const isSelected = frequency === opt.value;
                const isLast = i === SCHEDULE_OPTIONS.length - 1;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => {
                      setFrequency(opt.value);
                      setTimes(
                        opt.value === "As Needed"
                          ? []
                          : times.length > 0
                            ? times
                            : defaultTimesForFrequency(opt.value, null),
                      );
                      setShowFrequencyPicker(false);
                    }}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 16,
                      paddingHorizontal: 20,
                      borderBottomWidth: isLast ? 0 : 1,
                      borderBottomColor: t.border,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: fonts.semibold,
                          fontSize: 15,
                          color: isSelected ? C.accent : t.text,
                        }}
                      >
                        {opt.label}
                      </Text>
                      <Text
                        style={{
                          fontFamily: fonts.regular,
                          fontSize: 13,
                          color: t.textSecondary,
                          marginTop: 2,
                        }}
                      >
                        {opt.description}
                      </Text>
                    </View>
                    {isSelected && (
                      <Svg width={20} height={20} viewBox="0 0 20 20">
                        <Path
                          d="M4 10L8.5 14.5L16 7"
                          stroke={C.accent}
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      </Svg>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
