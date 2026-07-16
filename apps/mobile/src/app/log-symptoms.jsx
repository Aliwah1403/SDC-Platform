import { useState, useRef, useEffect } from "react";
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
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";
import Svg, { Path, Rect, Defs, ClipPath } from "react-native-svg";
import { useSharedValue, withSpring } from "react-native-reanimated";
import { useAppStore } from "@/store/appStore";
import { writeDailyLog } from "@/services/healthService";
import { useSubmitLogMutation } from "@/hooks/queries/useHealthDataQuery";
import { useHealthLogsQuery } from "@/hooks/queries/useHealthDataQuery";
import { useMetricGoalsQuery } from "@/hooks/queries/useMetricGoalsQuery";
import { mlFromGlasses, glassesFromMl } from "@/utils/hydrationUnits";
import { DEFAULT_SUGGESTED_ML } from "@/utils/hydrationGoal";
import { ChevronLeft, X, Check } from "lucide-react-native";
import { CheckboxChip } from "@/components/LogSymptoms/CheckboxChip";
import { MoodAmbientBackground } from "@/components/LogSymptoms/MoodAmbientBackground";
import { PainOrb } from "@/components/LogSymptoms/PainOrb";
import { usePostHog } from "posthog-react-native";
import { useTheme } from "@/hooks/useTheme";
import { fonts } from "@/utils/fonts";

const AnimatedSvgRect = Animated.createAnimatedComponent(Rect);

const BOTTLE_PATH =
  "M 36 0 L 64 0 Q 68 0 68 4 L 68 14 Q 68 18 64 18 L 60 18 L 60 30 " +
  "C 60 42 84 46 84 52 L 84 186 Q 84 198 72 198 L 28 198 Q 16 198 16 186 " +
  "L 16 52 C 16 46 40 42 40 30 L 40 18 L 36 18 Q 32 18 32 14 L 32 4 " +
  "Q 32 0 36 0 Z";
const BOTTLE_BODY_TOP = 52;
const BOTTLE_BODY_H = 146; // 198 - 52

function WaterBottle({ value, fillColor }) {
  const fillHeightAnim = useRef(
    new Animated.Value(BOTTLE_BODY_H * Math.min(value / 10, 1))
  ).current;

  useEffect(() => {
    Animated.spring(fillHeightAnim, {
      toValue: BOTTLE_BODY_H * Math.min(value / 10, 1),
      useNativeDriver: false,
      damping: 20,
      stiffness: 100,
    }).start();
  }, [value]);

  const fillY = fillHeightAnim.interpolate({
    inputRange: [0, BOTTLE_BODY_H],
    outputRange: [BOTTLE_BODY_TOP + BOTTLE_BODY_H, BOTTLE_BODY_TOP],
  });

  return (
    <Svg width={110} height={220} viewBox="0 0 100 210">
      <Defs>
        <ClipPath id="bottleClip">
          <Path d={BOTTLE_PATH} />
        </ClipPath>
      </Defs>
      <AnimatedSvgRect
        x={0}
        y={fillY}
        width={100}
        height={fillHeightAnim}
        fill={fillColor}
        opacity={0.75}
        clipPath="url(#bottleClip)"
      />
      <Path d={BOTTLE_PATH} fill="none" stroke={fillColor} strokeWidth={3.5} />
    </Svg>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const TOTAL_STEPS = 8; // 0-7, with 7 = summary

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

const MOOD_FACTORS = [
  { emoji: "😴", label: "Sleep" },
  { emoji: "💧", label: "Hydration" },
  { emoji: "😰", label: "Stress" },
  { emoji: "🏃", label: "Activity" },
  { emoji: "👥", label: "Social time" },
  { emoji: "🥶", label: "Cold weather" },
  { emoji: "🍽️", label: "Diet" },
  { emoji: "💊", label: "Medication" },
  { emoji: "💼", label: "Work / School" },
];

function getMoodWhyCopy(moodValue) {
  if (moodValue >= 4) return { title: "What made today feel good?", subtitle: "Tap what helped — or skip" };
  if (moodValue <= 2) return { title: "What weighed on you today?", subtitle: "Tap what contributed — or skip" };
  return { title: "What shaped your day?", subtitle: "Tap what contributed — or skip" };
}

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
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 8 }}>
      {Array.from({ length: TOTAL_STEPS - 1 }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === step ? 20 : 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: i < step ? "#A9334D" : i === step ? "#A9334D" : t.isDark ? t.surfaceElevated : "#F8E9E7",
            opacity: i < step ? 0.4 : 1,
          }}
        />
      ))}
    </View>
  );
}

const PAIN_LABELS = [
  "No Pain", "Very Mild", "Mild", "Mild+", "Moderate",
  "Moderate+", "Significant", "Severe", "Intense", "Excruciating", "Worst Possible",
];

// Escalating haptic — the higher the pain, the firmer the tick.
function painHaptic(v) {
  const style =
    v >= 8 ? Haptics.ImpactFeedbackStyle.Heavy
    : v >= 4 ? Haptics.ImpactFeedbackStyle.Medium
    : Haptics.ImpactFeedbackStyle.Light;
  Haptics.impactAsync(style);
}

// Gentle support prompt shown when pain is high (≥ 8).
function HighPainSupport({ onOpenCrisisPlan, onOpenCareTeam }) {
  const t = useTheme();
  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 300 }}
      style={{ width: "100%", paddingHorizontal: 24, marginTop: 16 }}
    >
      <View
        style={{
          backgroundColor: t.isDark ? "rgba(169,51,77,0.20)" : "#A9334D14",
          borderRadius: 16,
          padding: 16,
        }}
      >
        <Text style={{ fontFamily: "Geist_600SemiBold", fontSize: 15, color: t.isDark ? t.text : "#781D11" }}>
          That sounds really tough.
        </Text>
        <Text style={{ fontFamily: "Geist_400Regular", fontSize: 13.5, color: t.textSecondary, marginTop: 3, lineHeight: 19 }}>
          You don't have to manage this alone — your plan and care team are here.
        </Text>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
          <TouchableOpacity
            onPress={onOpenCrisisPlan}
            style={{ flex: 1, backgroundColor: "#A9334D", borderRadius: 12, paddingVertical: 11, alignItems: "center" }}
          >
            <Text style={{ fontFamily: "Geist_600SemiBold", fontSize: 13.5, color: "#fff" }}>Crisis plan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onOpenCareTeam}
            style={{ flex: 1, borderWidth: 1.5, borderColor: "#A9334D", borderRadius: 12, paddingVertical: 9.5, alignItems: "center" }}
          >
            <Text style={{ fontFamily: "Geist_600SemiBold", fontSize: 13.5, color: "#A9334D" }}>Care team</Text>
          </TouchableOpacity>
        </View>
      </View>
    </MotiView>
  );
}

// Step 0 — Pain Level
function PainStep({ value, progress, onChange, onOpenCrisisPlan, onOpenCareTeam }) {
  const t = useTheme();
  const color = getPainColor(value);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "space-between", paddingBottom: 16 }}>
      <View style={{ alignItems: "center" }}>
        <Text style={[styles.stepTitle, { color: t.isDark ? t.text : "#781D11" }]}>How's your pain today?</Text>
        <Text style={styles.stepSubtitle}>Rate from 0 (no pain) to 10 (worst possible)</Text>
      </View>

      {/* Breathing pain orb + number, with support prompt at high pain */}
      <View style={{ alignItems: "center", justifyContent: "center", flex: 1 }}>
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          <PainOrb progress={progress} value={value} isDark={t.isDark} />
          <Text
            style={{
              position: "absolute",
              fontFamily: "Geist_800ExtraBold",
              fontSize: 48,
              color: "#fff",
              textShadowColor: "rgba(0,0,0,0.22)",
              textShadowRadius: 10,
            }}
          >
            {value}
          </Text>
        </View>
        {value >= 8 && (
          <HighPainSupport onOpenCrisisPlan={onOpenCrisisPlan} onOpenCareTeam={onOpenCareTeam} />
        )}
      </View>

      {/* Label + Slider */}
      <View style={{ width: "100%", paddingHorizontal: 24 }}>
        <Text style={[styles.valueLabel, { color }]}>{PAIN_LABELS[value]}</Text>
        <Slider
          minimumValue={0}
          maximumValue={10}
          step={1}
          value={value}
          onValueChange={(v) => {
            if (v !== value) {
              painHaptic(v);
              onChange(v);
            }
          }}
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

// Step 3 — Mood
// The full-bleed ambient background is rendered at the screen level (see
// MoodAmbientBackground); this step keeps a light emoji centerpiece and a
// continuous slider that drives that background via `progress`.
function MoodStep({ value, progress, onChange }) {
  const t = useTheme();
  const idx = value - 1; // 1-indexed → 0-indexed
  const labelColor = t.isDark ? t.text : "#781D11";
  const lastMoodRef = useRef(value); // for haptic ticks as the value snaps

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "space-between", paddingBottom: 16 }}>
      <View style={{ alignItems: "center" }}>
        <Text style={[styles.stepTitle, { color: labelColor }]}>How have you felt{"\n"}overall today?</Text>
      </View>

      {/* Emoji centerpiece (blob lives in the ambient background behind it) */}
      <View style={{ alignItems: "center", justifyContent: "center", flex: 1 }}>
        <MotiView
          animate={{ scale: 0.9 + ((value - 1) / 4) * 0.28 }}
          transition={{ type: "spring", damping: 16, stiffness: 90 }}
          style={{
            width: 150,
            height: 150,
            borderRadius: 75,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: t.isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.30)",
          }}
        >
          <Text style={{ fontSize: 72, textShadowColor: "rgba(0,0,0,0.14)", textShadowRadius: 14 }}>
            {MOOD_EMOJIS[idx]}
          </Text>
        </MotiView>
      </View>

      {/* Label + Slider */}
      <View style={{ width: "100%", paddingHorizontal: 24 }}>
        <Text style={[styles.valueLabel, { color: labelColor }]}>{MOOD_LABELS[idx]}</Text>
        <Slider
          minimumValue={1}
          maximumValue={5}
          step={0}
          value={value}
          onValueChange={(v) => {
            progress.value = v;
            const rounded = Math.round(v);
            if (rounded !== lastMoodRef.current) {
              lastMoodRef.current = rounded;
              Haptics.selectionAsync();
              onChange(rounded);
            }
          }}
          minimumTrackTintColor={t.isDark ? "rgba(255,255,255,0.85)" : "#781D11"}
          maximumTrackTintColor={t.isDark ? "rgba(255,255,255,0.22)" : "rgba(120,29,17,0.22)"}
          thumbTintColor="#FFFFFF"
          style={{ width: "100%", height: 44 }}
        />
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
          <Text style={[styles.sliderEndLabel, { color: labelColor, opacity: 0.7 }]}>VERY UNPLEASANT</Text>
          <Text style={[styles.sliderEndLabel, { color: labelColor, opacity: 0.7 }]}>VERY PLEASANT</Text>
        </View>
      </View>
    </View>
  );
}

// Step 4 — Mood contributors ("why")
function MoodWhyStep({ moodValue, selected, onToggle, onSkip }) {
  const t = useTheme();
  const { title, subtitle } = getMoodWhyCopy(moodValue);
  return (
    <View style={{ flex: 1 }}>
      <Text style={[styles.stepTitle, { color: t.isDark ? t.text : "#781D11" }]}>{title}</Text>
      <Text style={styles.stepSubtitle}>{subtitle}</Text>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexDirection: "row", flexWrap: "wrap", gap: 10, paddingTop: 24, paddingBottom: 16 }}
      >
        {MOOD_FACTORS.map(({ emoji, label }) => (
          <CheckboxChip
            key={label}
            label={`${emoji} ${label}`}
            checked={selected.includes(label)}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onToggle(label);
            }}
          />
        ))}
      </ScrollView>
      <TouchableOpacity onPress={onSkip} style={{ alignItems: "center", marginTop: 16 }}>
        <Text style={{ fontFamily: "Geist_500Medium", fontSize: 15, color: t.textSecondary }}>
          Skip this step →
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// Step 1 — Body Locations
function LocationsStep({ selected, onToggle }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <Text style={[styles.stepTitle, { color: t.isDark ? t.text : "#781D11" }]}>Where does it hurt?</Text>
      <Text style={styles.stepSubtitle}>Select all that apply — or skip if no pain</Text>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexDirection: "row", flexWrap: "wrap", gap: 10, paddingTop: 24, paddingBottom: 16 }}
      >
        {BODY_LOCATIONS.map((loc) => (
          <CheckboxChip
            key={loc}
            label={loc}
            checked={selected.includes(loc)}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onToggle(loc);
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// Step 2 — Symptoms Checklist
function SymptomsStep({ selected, onToggle }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <Text style={[styles.stepTitle, { color: t.isDark ? t.text : "#781D11" }]}>Any symptoms today?</Text>
      <Text style={styles.stepSubtitle}>Select all that apply — or skip if none</Text>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexDirection: "row", flexWrap: "wrap", gap: 10, paddingTop: 24, paddingBottom: 16 }}
      >
        {SCD_SYMPTOMS.map((sym) => (
          <CheckboxChip
            key={sym}
            label={sym}
            checked={selected.includes(sym)}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onToggle(sym);
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// Step 5 — Hydration
const HYDRATION_PRESETS = [4, 8, 12];

function HydrationStep({ value, onChange, goalGlasses }) {
  const t = useTheme();
  const midThreshold = Math.round(goalGlasses * 0.625);
  const fillColor = value >= goalGlasses ? "#10B981" : value >= midThreshold ? "#3B82F6" : "#F59E0B";

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "space-between", paddingBottom: 16 }}>
      <View style={{ alignItems: "center" }}>
        <Text style={[styles.stepTitle, { color: t.isDark ? t.text : "#781D11" }]}>How's your hydration?</Text>
        <Text style={styles.stepSubtitle}>How many glasses of water today?</Text>
      </View>

      {/* Water bottle visual */}
      <View style={{ alignItems: "center", justifyContent: "center", flex: 1 }}>
        <WaterBottle value={value} fillColor={fillColor} />
        <Text style={{ fontFamily: "Geist_800ExtraBold", fontSize: 52, color: fillColor, marginTop: 8 }}>
          {value}
        </Text>
        <Text style={{ fontFamily: "Geist_500Medium", fontSize: 16, color: t.textSecondary, marginTop: 2 }}>
          glasses
        </Text>
      </View>

      {/* Quick presets */}
      <View style={{ alignItems: "center", marginBottom: 16 }}>
        <Text style={[styles.sliderEndLabel, { marginBottom: 10 }]}>QUICK SELECT</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {HYDRATION_PRESETS.map((preset) => {
            const active = value === preset;
            return (
              <TouchableOpacity
                key={preset}
                onPress={() => onChange(preset)}
                style={{
                  paddingHorizontal: 22,
                  paddingVertical: 10,
                  borderRadius: 24,
                  borderWidth: 2,
                  borderColor: active ? fillColor : "#E8D5D2",
                  backgroundColor: active ? fillColor : "transparent",
                }}
              >
                <Text style={{
                  fontFamily: "Geist_600SemiBold",
                  fontSize: 15,
                  color: active ? "#fff" : fillColor,
                }}>
                  {preset}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
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
          {value >= goalGlasses ? "Great hydration!" : value >= midThreshold ? "Getting there" : "Drink more water"}
        </Text>
      </View>
    </View>
  );
}

// Step 6 — Notes
function NotesStep({ value, onChange, onSkip }) {
  const t = useTheme();
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.stepTitle, { color: t.isDark ? t.text : "#781D11" }]}>Anything to note?</Text>
        <Text style={styles.stepSubtitle}>Optional — triggers, activities, how your day went</Text>
        <View style={{ marginTop: 24, flex: 1 }}>
          <TextInput
            value={value}
            onChangeText={onChange}
            multiline
            placeholder="e.g. Stressed at work, slept poorly, went for a short walk..."
            placeholderTextColor="#C4A8A4"
            keyboardAppearance={t.isDark ? "dark" : "light"}
            style={{
              backgroundColor: t.isDark ? t.surface : "#F8E9E7",
              borderRadius: 16,
              padding: 16,
              fontFamily: "Geist_400Regular",
              fontSize: 15,
              color: t.isDark ? t.text : "#781D11",
              minHeight: 140,
              textAlignVertical: "top",
            }}
          />
        </View>
        <TouchableOpacity onPress={onSkip} style={{ alignItems: "center", marginTop: 16 }}>
          <Text style={{ fontFamily: "Geist_500Medium", fontSize: 15, color: t.textSecondary }}>
            Skip this step →
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// Step 7 — Summary
function SummaryStep({ log, onSubmit, isLoading, hydrationGoalGlasses }) {
  const t = useTheme();
  const moodIdx = MOOD_VALUES.indexOf(log.mood);
  const moodLabel = MOOD_LABELS[moodIdx] ?? "Neutral";

  const rows = [
    { label: "Pain Level", value: `${log.painLevel}/10`, color: getPainColor(log.painLevel) },
    { label: "Mood", value: `${MOOD_EMOJIS[moodIdx]} ${moodLabel}`, color: MOOD_ORB_COLORS[moodIdx] ?? "#A9334D" },
    { label: "What contributed", value: log.triggers.length ? log.triggers.join(", ") : "—", color: "#8B5CF6" },
    { label: "Body Locations", value: log.bodyLocations.length ? log.bodyLocations.join(", ") : "None", color: "#A9334D" },
    { label: "Symptoms", value: log.symptoms.length ? log.symptoms.join(", ") : "None reported", color: "#781D11" },
    { label: "Hydration", value: `${log.hydration} glasses`, color: log.hydration >= hydrationGoalGlasses ? "#10B981" : "#3B82F6" },
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
            style={[styles.summaryRow, { backgroundColor: t.isDark ? t.surface : "#F8E9E7" }]}
          >
            <View style={[styles.summaryDot, { backgroundColor: row.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryLabel}>{row.label}</Text>
              <Text style={[styles.summaryValue, { color: t.isDark ? t.text : "#781D11" }]} numberOfLines={2}>{row.value}</Text>
            </View>
          </MotiView>
        ))}
      </ScrollView>

      <TouchableOpacity onPress={onSubmit} disabled={isLoading} style={[styles.submitBtn, isLoading && { opacity: 0.7 }]}>
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Check color="#fff" size={20} strokeWidth={2.5} />
        )}
        <Text style={styles.submitBtnText}>{isLoading ? "Saving..." : "Save log"}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

const STEP_NAMES = ['pain_level', 'body_locations', 'symptoms', 'mood', 'mood_why', 'hydration', 'notes', 'summary'];

export default function LogSymptomsScreen() {
  const router = useRouter();
  const posthog = usePostHog();
  const t = useTheme();
  const {
    currentSymptomLog, updateSymptomLog, resetSymptomLog,
    healthKitConnected, healthKitPreferences,
    healthConnectConnected, healthConnectPreferences,
  } = useAppStore();
  const isHealthConnected = Platform.OS === "ios" ? healthKitConnected : healthConnectConnected;
  const healthPreferences = Platform.OS === "ios" ? healthKitPreferences : healthConnectPreferences;
  const submitLogMutation = useSubmitLogMutation();
  const openedAtRef = useRef(Date.now());

  const todayStr = new Date().toISOString().split("T")[0];
  const { data: todayLogs = [] } = useHealthLogsQuery(todayStr);
  const hasLoggedToday = todayLogs.length > 0;

  const { data: metricGoals } = useMetricGoalsQuery();
  const hydrationGoalMl = metricGoals?.hydration ?? DEFAULT_SUGGESTED_ML;
  const hydrationGoalGlasses = Math.max(1, Math.round(glassesFromMl(hydrationGoalMl)));

  const [step, setStep] = useState(0);

  // Local state mirrors (avoid calling updateSymptomLog on every slider tick)
  const [painLevel, setPainLevel] = useState(currentSymptomLog.painLevel);
  // Springs between integer pain scores so the orb transitions smoothly.
  const painAnim = useSharedValue(currentSymptomLog.painLevel);
  const [moodValue, setMoodValue] = useState(
    Math.max(1, MOOD_VALUES.indexOf(currentSymptomLog.mood) + 1) || 3
  );
  // Continuous mirror of the mood slider (1..5) that drives the ambient
  // background smoothly while the logged `moodValue` snaps to an integer.
  const moodAnim = useSharedValue(moodValue);
  const [moodContributors, setMoodContributors] = useState([...currentSymptomLog.triggers]);
  const [bodyLocations, setBodyLocations] = useState([...currentSymptomLog.bodyLocations]);
  const [symptoms, setSymptoms] = useState([...currentSymptomLog.symptoms]);
  const [hydration, setHydration] = useState(currentSymptomLog.hydration || 0);
  const [notes, setNotes] = useState(currentSymptomLog.notes || "");

  const STEP_COUNT = 8; // steps 0-6 + summary (7)

  // Track opened once on mount
  useEffect(() => {
    posthog?.capture('daily_check_in_started', { checkin_type: 'symptom_log' });
  }, []);

  // Track each step as it becomes active
  useEffect(() => {
    posthog?.capture('symptom_log_step_viewed', { step, step_name: STEP_NAMES[step] });
  }, [step]);

  // Smoothly follow the (integer) pain score for the animated orb.
  useEffect(() => {
    painAnim.value = withSpring(painLevel, { damping: 15, stiffness: 130 });
  }, [painLevel]);

  // Track already-logged notice shown (fires once when hasLoggedToday is known)
  useEffect(() => {
    if (hasLoggedToday) {
      posthog?.capture('already_logged_today_notice_shown', {});
    }
  }, [hasLoggedToday]);

  function flushToStore() {
    updateSymptomLog({
      painLevel,
      mood: MOOD_VALUES[moodValue - 1],
      triggers: moodContributors,
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
        {
          text: "Discard", style: "destructive", onPress: () => {
            posthog?.capture('symptom_log_abandoned', { at_step: step });
            router.back();
          }
        },
      ]);
    } else {
      setStep((s) => s - 1);
    }
  }

  function handleCancel() {
    Alert.alert("Discard log?", "Your entries will not be saved.", [
      { text: "Keep editing", style: "cancel" },
      {
        text: "Discard", style: "destructive", onPress: () => {
          posthog?.capture('symptom_log_abandoned', { at_step: step });
          router.back();
        }
      },
    ]);
  }

  function handleSubmit() {
    const logData = {
      painLevel,
      mood: MOOD_VALUES[moodValue - 1],
      triggers: moodContributors,
      bodyLocations,
      symptoms,
      hydration, // glasses — ephemeral local/store representation, Phase 1 keeps this UI unchanged
      notes,
    };
    updateSymptomLog(logData);

    const hydrationMl = mlFromGlasses(hydration);
    submitLogMutation.mutate({ ...logData, hydration: hydrationMl }, {
      onSuccess: () => {
        const logDuration = Math.round((Date.now() - openedAtRef.current) / 1000);
        posthog?.capture('symptom_log_submitted', {
          pain_level: painLevel,
          hydration_level: hydration,
          mood: MOOD_VALUES[moodValue - 1],
          contributor_count: moodContributors.length,
          symptoms_selected: symptoms,
          location_count: bodyLocations.length,
          symptom_count: symptoms.length,
          has_notes: notes.trim().length > 0,
          log_duration_seconds: logDuration,
        });
        posthog?.capture('pain_logged', {
          pain_score: painLevel,
          pain_location: bodyLocations[0] ?? null,
          crisis_step: null,
        });
        posthog?.capture('hydration_logged', {
          amount_glasses: hydration,
          amount_ml: hydrationMl,
          goal_ml: hydrationGoalMl,
          goal_met: hydrationMl >= hydrationGoalMl,
        });
        if (!hasLoggedToday) {
          posthog?.capture('streak_saved', {
            trigger_type: 'organic',
            days_since_last_log: 1,
          });
        }
        resetSymptomLog();
        // Mirror to health platform on the first log of the day only — re-logs would
        // append duplicate water samples. Android skips symptoms/mood (HC has no symptom types).
        if (isHealthConnected && !hasLoggedToday) {
          writeDailyLog({ hydrationMl, symptoms, mood: MOOD_VALUES[moodValue - 1], painLevel, prefs: healthPreferences });
        }
        router.back();
      },
    });
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

  function toggleMoodContributor(label) {
    setMoodContributors((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  }

  const isSummary = step === STEP_COUNT - 1;

  // Build a snapshot for summary
  const logSnapshot = {
    painLevel,
    mood: MOOD_VALUES[moodValue - 1],
    triggers: moodContributors,
    bodyLocations,
    symptoms,
    hydration,
    notes,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }} edges={["top", "bottom"]}>
      {/* Full-bleed ambient mood background (mood step only) */}
      {step === 3 && (
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "timing", duration: 400 }}
          pointerEvents="none"
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <MoodAmbientBackground progress={moodAnim} isDark={t.isDark} />
        </MotiView>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerBtn}>
          <ChevronLeft color={t.accent} size={24} strokeWidth={2} />
          <Text style={[styles.headerBtnText, { color: t.accent }]}>Back</Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: t.text }]}>
          {isSummary ? "Summary" : `Step ${step + 1} of ${STEP_COUNT - 1}`}
        </Text>

        {!isSummary ? (
          <TouchableOpacity onPress={handleCancel} style={styles.headerBtn}>
            <Text style={[styles.headerBtnText, { color: t.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerBtn} />
        )}
      </View>

      {/* Progress dots (not on summary) */}
      {!isSummary && <ProgressDots step={step} />}

      {/* Already logged today notice */}
      {hasLoggedToday && step === 0 && (
        <View style={{
          marginHorizontal: 24,
          marginBottom: 8,
          paddingVertical: 8,
          paddingHorizontal: 14,
          backgroundColor: "#A9334D18",
          borderRadius: 10,
          flexDirection: "row",
          alignItems: "center",
        }}>
          <Text style={{ fontSize: 13, color: "#A9334D", fontFamily: fonts.medium }}>
            You've already logged today — adding a new entry
          </Text>
        </View>
      )}

      {/* Step content */}
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 8 }}>
        {step === 0 && (
          <PainStep
            value={painLevel}
            progress={painAnim}
            onChange={setPainLevel}
            onOpenCrisisPlan={() => router.push("/(tabs)/care/crisis-plan")}
            onOpenCareTeam={() => router.push("/(tabs)/care/care-team")}
          />
        )}
        {step === 1 && (
          <LocationsStep selected={bodyLocations} onToggle={toggleLocation} />
        )}
        {step === 2 && (
          <SymptomsStep selected={symptoms} onToggle={toggleSymptom} />
        )}
        {step === 3 && (
          <MoodStep value={moodValue} progress={moodAnim} onChange={setMoodValue} />
        )}
        {step === 4 && (
          <MoodWhyStep
            moodValue={moodValue}
            selected={moodContributors}
            onToggle={toggleMoodContributor}
            onSkip={() => {
              posthog?.capture('symptom_log_step_skipped', { step: 4, step_name: 'mood_why' });
              handleNext();
            }}
          />
        )}
        {step === 5 && (
          <HydrationStep value={hydration} onChange={setHydration} goalGlasses={hydrationGoalGlasses} />
        )}
        {step === 6 && (
          <NotesStep
            value={notes}
            onChange={setNotes}
            onSkip={() => {
              posthog?.capture('symptom_log_step_skipped', { step: 6, step_name: 'notes' });
              handleNext();
            }}
          />
        )}
        {step === 7 && (
          <SummaryStep log={logSnapshot} onSubmit={handleSubmit} isLoading={submitLogMutation.isPending} hydrationGoalGlasses={hydrationGoalGlasses} />
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
