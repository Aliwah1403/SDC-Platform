import { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import Slider from "@react-native-community/slider";
import { useAppStore } from "@/store/appStore";
import { ChevronLeft, X, Check } from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const TOTAL_STEPS = 7; // 0-6, with 6 = summary

const BODY_LOCATIONS = [
  "Head", "Neck", "Chest", "Back", "Arms",
  "Hands", "Abdomen", "Legs", "Feet", "Joints", "Muscles",
];

const SCD_SYMPTOMS = [
  "Fatigue", "Shortness of breath", "Jaundice", "Dizziness",
  "Headache", "Nausea", "Fever", "Swelling", "Vision changes", "Chest tightness",
];

const MOOD_VALUES = ["terrible", "poor", "fair", "good", "excellent"];
const MOOD_LABELS = ["Very Unpleasant", "Unpleasant", "Neutral", "Pleasant", "Very Pleasant"];
const MOOD_EMOJIS = ["😢", "😞", "😐", "🙂", "😄"];

// Pain orb color interpolation
function getPainColor(level) {
  if (level <= 3) {
    const t = level / 3;
    return lerpColor("#10B981", "#FDE047", t);
  } else if (level <= 7) {
    const t = (level - 3) / 4;
    return lerpColor("#FDE047", "#F97316", t);
  } else {
    const t = (level - 7) / 3;
    return lerpColor("#F97316", "#DC2626", t);
  }
}

function lerpColor(a, b, t) {
  const ah = a.replace("#", "");
  const bh = b.replace("#", "");
  const ar = parseInt(ah.substring(0, 2), 16);
  const ag = parseInt(ah.substring(2, 4), 16);
  const ab = parseInt(ah.substring(4, 6), 16);
  const br = parseInt(bh.substring(0, 2), 16);
  const bg = parseInt(bh.substring(2, 4), 16);
  const bb = parseInt(bh.substring(4, 6), 16);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}

// Mood orb colors
const MOOD_ORB_COLORS = ["#6366F1", "#8B5CF6", "#A9334D", "#F59E0B", "#F97316"];

function ProgressDots({ step }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 8 }}>
      {Array.from({ length: TOTAL_STEPS - 1 }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === step ? 20 : 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: i < step ? "#A9334D" : i === step ? "#A9334D" : "#F8E9E7",
            opacity: i < step ? 0.4 : 1,
          }}
        />
      ))}
    </View>
  );
}

// Step 0 — Pain Level
function PainStep({ value, onChange }) {
  const color = getPainColor(value);
  const scale = 0.55 + (value / 10) * 0.85;

  const PAIN_LABELS = [
    "No Pain", "Very Mild", "Mild", "Mild+", "Moderate",
    "Moderate+", "Significant", "Severe", "Intense", "Excruciating", "Worst Possible",
  ];

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "space-between", paddingBottom: 16 }}>
      <View style={{ alignItems: "center" }}>
        <Text style={styles.stepTitle}>How's your pain today?</Text>
        <Text style={styles.stepSubtitle}>Rate from 0 (no pain) to 10 (worst possible)</Text>
      </View>

      {/* Orb */}
      <View style={{ alignItems: "center", justifyContent: "center", flex: 1 }}>
        {/* Outer ring */}
        <MotiView
          animate={{ scale: scale * 1.55, opacity: 0.15 }}
          transition={{ type: "spring", damping: 18, stiffness: 80 }}
          style={{
            position: "absolute",
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: color,
          }}
        />
        {/* Mid ring */}
        <MotiView
          animate={{ scale: scale * 1.28, opacity: 0.3 }}
          transition={{ type: "spring", damping: 18, stiffness: 80 }}
          style={{
            position: "absolute",
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: color,
          }}
        />
        {/* Core orb */}
        <MotiView
          animate={{ scale }}
          transition={{ type: "spring", damping: 18, stiffness: 80 }}
          style={{
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: color,
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 40,
            elevation: 12,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontFamily: "Geist_800ExtraBold", fontSize: 48, color: "#fff" }}>
            {value}
          </Text>
        </MotiView>
      </View>

      {/* Label + Slider */}
      <View style={{ width: "100%", paddingHorizontal: 24 }}>
        <Text style={[styles.valueLabel, { color }]}>{PAIN_LABELS[value]}</Text>
        <Slider
          minimumValue={0}
          maximumValue={10}
          step={1}
          value={value}
          onValueChange={onChange}
          minimumTrackTintColor={color}
          maximumTrackTintColor="#F8E9E7"
          thumbTintColor={color}
          style={{ width: "100%", height: 44 }}
        />
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
          <Text style={styles.sliderEndLabel}>NO PAIN</Text>
          <Text style={styles.sliderEndLabel}>WORST POSSIBLE</Text>
        </View>
      </View>
    </View>
  );
}

// Step 1 — Mood
function MoodStep({ value, onChange }) {
  const idx = value - 1; // 1-indexed → 0-indexed
  const color = MOOD_ORB_COLORS[idx] || MOOD_ORB_COLORS[2];
  const scale = 0.55 + ((value - 1) / 4) * 0.85;

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "space-between", paddingBottom: 16 }}>
      <View style={{ alignItems: "center" }}>
        <Text style={styles.stepTitle}>Choose how you've felt{"\n"}overall today</Text>
      </View>

      {/* Orb */}
      <View style={{ alignItems: "center", justifyContent: "center", flex: 1 }}>
        <MotiView
          animate={{ scale: scale * 1.55, opacity: 0.12 }}
          transition={{ type: "spring", damping: 18, stiffness: 80 }}
          style={{ position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: color }}
        />
        <MotiView
          animate={{ scale: scale * 1.28, opacity: 0.25 }}
          transition={{ type: "spring", damping: 18, stiffness: 80 }}
          style={{ position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: color }}
        />
        <MotiView
          animate={{ scale }}
          transition={{ type: "spring", damping: 18, stiffness: 80 }}
          style={{
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: color,
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 40,
            elevation: 12,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 64 }}>{MOOD_EMOJIS[idx]}</Text>
        </MotiView>
      </View>

      {/* Label + Slider */}
      <View style={{ width: "100%", paddingHorizontal: 24 }}>
        <Text style={[styles.valueLabel, { color }]}>{MOOD_LABELS[idx]}</Text>
        <Slider
          minimumValue={1}
          maximumValue={5}
          step={1}
          value={value}
          onValueChange={onChange}
          minimumTrackTintColor={color}
          maximumTrackTintColor="#F8E9E7"
          thumbTintColor={color}
          style={{ width: "100%", height: 44 }}
        />
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
          <Text style={styles.sliderEndLabel}>VERY UNPLEASANT</Text>
          <Text style={styles.sliderEndLabel}>VERY PLEASANT</Text>
        </View>
      </View>
    </View>
  );
}

// Step 2 — Body Locations
function LocationsStep({ selected, onToggle }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.stepTitle}>Where does it hurt?</Text>
      <Text style={styles.stepSubtitle}>Select all that apply — or skip if no pain</Text>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexDirection: "row", flexWrap: "wrap", gap: 10, paddingTop: 24, paddingBottom: 16 }}
      >
        {BODY_LOCATIONS.map((loc) => {
          const active = selected.includes(loc);
          return (
            <MotiView
              key={loc}
              animate={{ scale: active ? 1.05 : 1 }}
              transition={{ type: "spring", damping: 15 }}
            >
              <TouchableOpacity
                onPress={() => onToggle(loc)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{loc}</Text>
              </TouchableOpacity>
            </MotiView>
          );
        })}
      </ScrollView>
    </View>
  );
}

// Step 3 — Symptoms Checklist
function SymptomsStep({ selected, onToggle }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.stepTitle}>Any symptoms today?</Text>
      <Text style={styles.stepSubtitle}>Select all that apply — or skip if none</Text>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexDirection: "row", flexWrap: "wrap", gap: 10, paddingTop: 24, paddingBottom: 16 }}
      >
        {SCD_SYMPTOMS.map((sym) => {
          const active = selected.includes(sym);
          return (
            <MotiView
              key={sym}
              animate={{ scale: active ? 1.05 : 1 }}
              transition={{ type: "spring", damping: 15 }}
            >
              <TouchableOpacity
                onPress={() => onToggle(sym)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{sym}</Text>
              </TouchableOpacity>
            </MotiView>
          );
        })}
      </ScrollView>
    </View>
  );
}

// Step 4 — Hydration
function HydrationStep({ value, onChange }) {
  const pct = Math.min(value / 10, 1);
  const fillColor = value >= 8 ? "#10B981" : value >= 5 ? "#3B82F6" : "#F59E0B";

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "space-between", paddingBottom: 16 }}>
      <View style={{ alignItems: "center" }}>
        <Text style={styles.stepTitle}>How's your hydration?</Text>
        <Text style={styles.stepSubtitle}>How many glasses of water today?</Text>
      </View>

      {/* Water glass visual */}
      <View style={{ alignItems: "center", justifyContent: "center", flex: 1 }}>
        <View
          style={{
            width: 110,
            height: 180,
            borderRadius: 16,
            borderWidth: 3,
            borderColor: fillColor,
            overflow: "hidden",
            justifyContent: "flex-end",
          }}
        >
          <MotiView
            animate={{ height: 180 * pct }}
            transition={{ type: "spring", damping: 20, stiffness: 60 }}
            style={{ width: "100%", backgroundColor: fillColor, opacity: 0.75 }}
          />
        </View>
        <Text style={{ fontFamily: "Geist_800ExtraBold", fontSize: 52, color: fillColor, marginTop: 16 }}>
          {value}
        </Text>
        <Text style={{ fontFamily: "Geist_500Medium", fontSize: 16, color: "#9CA3AF", marginTop: 2 }}>
          glasses
        </Text>
      </View>

      {/* +/- controls */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 32 }}>
        <TouchableOpacity
          onPress={() => onChange(Math.max(0, value - 1))}
          style={[styles.hydBtn, { borderColor: fillColor }]}
        >
          <Text style={{ fontFamily: "Geist_700Bold", fontSize: 28, color: fillColor }}>−</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onChange(Math.min(20, value + 1))}
          style={[styles.hydBtn, { borderColor: fillColor, backgroundColor: fillColor }]}
        >
          <Text style={{ fontFamily: "Geist_700Bold", fontSize: 28, color: "#fff" }}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={{ width: "100%", paddingHorizontal: 24, marginTop: 8 }}>
        <Text style={[styles.sliderEndLabel, { textAlign: "center", color: fillColor }]}>
          {value >= 8 ? "Great hydration!" : value >= 5 ? "Getting there" : "Drink more water"}
        </Text>
      </View>
    </View>
  );
}

// Step 5 — Notes
function NotesStep({ value, onChange, onSkip }) {
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Text style={styles.stepTitle}>Anything to note?</Text>
        <Text style={styles.stepSubtitle}>Optional — triggers, activities, how your day went</Text>
        <View style={{ marginTop: 24, flex: 1 }}>
          <TextInput
            value={value}
            onChangeText={onChange}
            multiline
            placeholder="e.g. Stressed at work, slept poorly, went for a short walk..."
            placeholderTextColor="#C4A8A4"
            style={{
              backgroundColor: "#F8E9E7",
              borderRadius: 16,
              padding: 16,
              fontFamily: "Geist_400Regular",
              fontSize: 15,
              color: "#781D11",
              minHeight: 140,
              textAlignVertical: "top",
            }}
          />
        </View>
        <TouchableOpacity onPress={onSkip} style={{ alignItems: "center", marginTop: 16 }}>
          <Text style={{ fontFamily: "Geist_500Medium", fontSize: 15, color: "#9CA3AF" }}>
            Skip this step →
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// Step 6 — Summary
function SummaryStep({ log, onSubmit }) {
  const moodIdx = MOOD_VALUES.indexOf(log.mood);
  const moodLabel = MOOD_LABELS[moodIdx] ?? "Neutral";

  const rows = [
    { label: "Pain Level", value: `${log.painLevel}/10`, color: getPainColor(log.painLevel) },
    { label: "Mood", value: `${MOOD_EMOJIS[moodIdx]} ${moodLabel}`, color: MOOD_ORB_COLORS[moodIdx] ?? "#A9334D" },
    { label: "Body Locations", value: log.bodyLocations.length ? log.bodyLocations.join(", ") : "None", color: "#A9334D" },
    { label: "Symptoms", value: log.symptoms.length ? log.symptoms.join(", ") : "None reported", color: "#781D11" },
    { label: "Hydration", value: `${log.hydration} glasses`, color: log.hydration >= 8 ? "#10B981" : "#3B82F6" },
    { label: "Notes", value: log.notes || "—", color: "#9CA3AF" },
  ];

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.stepTitle}>Your daily log</Text>
      <Text style={styles.stepSubtitle}>Review and confirm</Text>

      <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 20 }}>
        {rows.map((row, i) => (
          <MotiView
            key={row.label}
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: i * 80, type: "timing", duration: 300 }}
            style={styles.summaryRow}
          >
            <View style={[styles.summaryDot, { backgroundColor: row.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryLabel}>{row.label}</Text>
              <Text style={styles.summaryValue} numberOfLines={2}>{row.value}</Text>
            </View>
          </MotiView>
        ))}
      </ScrollView>

      <TouchableOpacity onPress={onSubmit} style={styles.submitBtn}>
        <Check color="#fff" size={20} strokeWidth={2.5} />
        <Text style={styles.submitBtnText}>Save log</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function LogSymptomsScreen() {
  const router = useRouter();
  const { currentSymptomLog, updateSymptomLog, submitSymptomLog } = useAppStore();

  const [step, setStep] = useState(0);

  // Local state mirrors (avoid calling updateSymptomLog on every slider tick)
  const [painLevel, setPainLevel] = useState(currentSymptomLog.painLevel);
  const [moodValue, setMoodValue] = useState(
    Math.max(1, MOOD_VALUES.indexOf(currentSymptomLog.mood) + 1) || 3
  );
  const [bodyLocations, setBodyLocations] = useState([...currentSymptomLog.bodyLocations]);
  const [symptoms, setSymptoms] = useState([...currentSymptomLog.symptoms]);
  const [hydration, setHydration] = useState(currentSymptomLog.hydration || 0);
  const [notes, setNotes] = useState(currentSymptomLog.notes || "");

  const STEP_COUNT = 7; // steps 0-5 + summary (6)

  function flushToStore() {
    updateSymptomLog({
      painLevel,
      mood: MOOD_VALUES[moodValue - 1],
      bodyLocations,
      symptoms,
      hydration,
      notes,
    });
  }

  function handleNext() {
    if (step < STEP_COUNT - 1) {
      setStep((s) => s + 1);
    }
  }

  function handleBack() {
    if (step === 0) {
      Alert.alert("Discard log?", "Your entries will not be saved.", [
        { text: "Keep editing", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: () => router.back() },
      ]);
    } else {
      setStep((s) => s - 1);
    }
  }

  function handleCancel() {
    Alert.alert("Discard log?", "Your entries will not be saved.", [
      { text: "Keep editing", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: () => router.back() },
    ]);
  }

  function handleSubmit() {
    flushToStore();
    // submitSymptomLog reads from store, but we flush first
    // Use a timeout to let Zustand commit
    setTimeout(() => {
      submitSymptomLog();
      router.back();
    }, 50);
  }

  function toggleLocation(loc) {
    setBodyLocations((prev) =>
      prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]
    );
  }

  function toggleSymptom(sym) {
    setSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  }

  const isSummary = step === STEP_COUNT - 1;

  // Build a snapshot for summary
  const logSnapshot = {
    painLevel,
    mood: MOOD_VALUES[moodValue - 1],
    bodyLocations,
    symptoms,
    hydration,
    notes,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF9F9" }} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerBtn}>
          <ChevronLeft color="#781D11" size={24} strokeWidth={2} />
          <Text style={styles.headerBtnText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {isSummary ? "Summary" : `Step ${step + 1} of ${STEP_COUNT - 1}`}
        </Text>

        {!isSummary ? (
          <TouchableOpacity onPress={handleCancel} style={styles.headerBtn}>
            <Text style={[styles.headerBtnText, { color: "#9CA3AF" }]}>Cancel</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerBtn} />
        )}
      </View>

      {/* Progress dots (not on summary) */}
      {!isSummary && <ProgressDots step={step} />}

      {/* Step content */}
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 8 }}>
        {step === 0 && (
          <PainStep value={painLevel} onChange={setPainLevel} />
        )}
        {step === 1 && (
          <MoodStep value={moodValue} onChange={setMoodValue} />
        )}
        {step === 2 && (
          <LocationsStep selected={bodyLocations} onToggle={toggleLocation} />
        )}
        {step === 3 && (
          <SymptomsStep selected={symptoms} onToggle={toggleSymptom} />
        )}
        {step === 4 && (
          <HydrationStep value={hydration} onChange={setHydration} />
        )}
        {step === 5 && (
          <NotesStep value={notes} onChange={setNotes} onSkip={handleNext} />
        )}
        {step === 6 && (
          <SummaryStep log={logSnapshot} onSubmit={handleSubmit} />
        )}
      </View>

      {/* Next button (not on summary — summary has its own submit) */}
      {!isSummary && (
        <View style={{ paddingHorizontal: 24, paddingBottom: 8, paddingTop: 4 }}>
          <TouchableOpacity onPress={handleNext} style={styles.nextBtn}>
            <Text style={styles.nextBtnText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = {
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBtn: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 70,
  },
  headerBtnText: {
    fontFamily: "Geist_500Medium",
    fontSize: 16,
    color: "#781D11",
  },
  headerTitle: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 16,
    color: "#781D11",
  },
  stepTitle: {
    fontFamily: "Geist_700Bold",
    fontSize: 26,
    color: "#781D11",
    textAlign: "center",
    lineHeight: 34,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontFamily: "Geist_400Regular",
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
  valueLabel: {
    fontFamily: "Geist_700Bold",
    fontSize: 20,
    textAlign: "center",
    marginBottom: 8,
  },
  sliderEndLabel: {
    fontFamily: "Geist_500Medium",
    fontSize: 11,
    color: "#C4A8A4",
    letterSpacing: 0.4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: "#F8E9E7",
    borderWidth: 1.5,
    borderColor: "#F8E9E7",
  },
  chipActive: {
    backgroundColor: "#A9334D",
    borderColor: "#781D11",
  },
  chipText: {
    fontFamily: "Geist_500Medium",
    fontSize: 14,
    color: "#781D11",
  },
  chipTextActive: {
    color: "#fff",
  },
  hydBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#F8E9E7",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  summaryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    flexShrink: 0,
  },
  summaryLabel: {
    fontFamily: "Geist_500Medium",
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 15,
    color: "#781D11",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#A9334D",
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  submitBtnText: {
    fontFamily: "Geist_700Bold",
    fontSize: 17,
    color: "#fff",
  },
  nextBtn: {
    backgroundColor: "#A9334D",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  nextBtnText: {
    fontFamily: "Geist_700Bold",
    fontSize: 17,
    color: "#fff",
  },
};
