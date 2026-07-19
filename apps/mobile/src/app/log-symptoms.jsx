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
import Svg, { Rect, Defs, ClipPath } from "react-native-svg";
import { useSharedValue, withSpring } from "react-native-reanimated";
import { useAppStore } from "@/store/appStore";
import { writeDailyLog } from "@/services/healthService";
import { useSubmitLogMutation } from "@/hooks/queries/useHealthDataQuery";
import { useHealthLogsQuery, useHealthDataQuery } from "@/hooks/queries/useHealthDataQuery";
import { useMetricGoalsQuery } from "@/hooks/queries/useMetricGoalsQuery";
import { useProfileQuery } from "@/hooks/queries/useProfileQuery";
import { useWeatherData } from "@/hooks/useWeatherData";
import { glassesFromMl, formatHydration, hydrationNumberAndUnit, formatHydrationRemaining } from "@/utils/hydrationUnits";
import { useHydrationStore } from "@/store/hydrationStore";
import { useHydrationContainersQuery, FALLBACK_CONTAINERS } from "@/hooks/queries/useHydrationContainersQuery";
import { DEFAULT_SUGGESTED_ML, GLASS_ML, getHeatBumpMl } from "@/utils/hydrationGoal";
import { ChevronLeft, X, Check } from "lucide-react-native";
import { CheckboxChip } from "@/components/LogSymptoms/CheckboxChip";
import { MoodAmbientBackground } from "@/components/LogSymptoms/MoodAmbientBackground";
import { PainOrb } from "@/components/LogSymptoms/PainOrb";
import { usePostHog } from "posthog-react-native";
import { useTheme } from "@/hooks/useTheme";
import { fonts } from "@/utils/fonts";
import { PressableScale } from "@/components/PressableScale";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { celebrationSpring } from "@/utils/motion";

const AnimatedSvgRect = Animated.createAnimatedComponent(Rect);

const VESSEL_W = 130;
const VESSEL_H = 200;
const VESSEL_R = 20;

// Single hydration identity color everywhere — no amber/green threshold swap.
function HydrationVessel({ valueMl, goalMl }) {
  const progress = Math.min(valueMl / Math.max(goalMl, 1), 1);
  const fillHeightAnim = useRef(new Animated.Value(VESSEL_H * progress)).current;

  useEffect(() => {
    Animated.spring(fillHeightAnim, {
      toValue: VESSEL_H * progress,
      useNativeDriver: false,
      damping: 20,
      stiffness: 100,
    }).start();
  }, [progress]);

  const fillY = fillHeightAnim.interpolate({
    inputRange: [0, VESSEL_H],
    outputRange: [VESSEL_H, 0],
  });

  return (
    <Svg width={VESSEL_W} height={VESSEL_H}>
      <Defs>
        <ClipPath id="vesselClip">
          <Rect x={0} y={0} width={VESSEL_W} height={VESSEL_H} rx={VESSEL_R} ry={VESSEL_R} />
        </ClipPath>
      </Defs>
      <Rect x={0} y={0} width={VESSEL_W} height={VESSEL_H} rx={VESSEL_R} ry={VESSEL_R} fill="rgba(59,130,246,0.08)" />
      <AnimatedSvgRect
        x={0}
        y={fillY}
        width={VESSEL_W}
        height={fillHeightAnim}
        fill="#3B82F6"
        opacity={0.85}
        clipPath="url(#vesselClip)"
      />
      <Rect
        x={1.25}
        y={1.25}
        width={VESSEL_W - 2.5}
        height={VESSEL_H - 2.5}
        rx={VESSEL_R - 1}
        ry={VESSEL_R - 1}
        fill="none"
        stroke="#3B82F6"
        strokeWidth={2.5}
      />
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
function PainStep({ value, progress, onChange, onOpenCrisisPlan, onOpenCareTeam, relog }) {
  const t = useTheme();
  const reducedMotion = useReducedMotion();
  const color = getPainColor(value);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "space-between", paddingBottom: 16 }}>
      <View style={{ alignItems: "center" }}>
        <Text style={[styles.stepTitle, { color: t.isDark ? t.text : "#781D11" }]}>{relog ? "How's your pain right now?" : "How's your pain today?"}</Text>
        <Text style={styles.stepSubtitle}>Rate from 0 (no pain) to 10 (worst possible)</Text>
      </View>

      {/* Breathing pain orb + number, with support prompt at high pain */}
      <View style={{ alignItems: "center", justifyContent: "center", flex: 1 }}>
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          <PainOrb progress={progress} value={value} isDark={t.isDark} reducedMotion={reducedMotion} />
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
function MoodStep({ value, progress, onChange, relog }) {
  const t = useTheme();
  const idx = value - 1; // 1-indexed → 0-indexed
  const labelColor = t.isDark ? t.text : "#781D11";
  const lastMoodRef = useRef(value); // for haptic ticks as the value snaps

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "space-between", paddingBottom: 16 }}>
      <View style={{ alignItems: "center" }}>
        <Text style={[styles.stepTitle, { color: labelColor }]}>
          {relog ? "How are you feeling now?" : "How have you felt\noverall today?"}
        </Text>
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
function SymptomsStep({ selected, onToggle, relog }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <Text style={[styles.stepTitle, { color: t.isDark ? t.text : "#781D11" }]}>{relog ? "Any symptoms right now?" : "Any symptoms today?"}</Text>
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
const HYDRATION_MAX_ML = 5000;

function HydrationStep({ value, onChange, goalMl, heatBumpMl, tempC, displayUnit, containers }) {
  const t = useTheme();
  // Default container renders first and filled; the rest stay outlined.
  const orderedContainers = [...containers].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
  const { number, unitLabel } = hydrationNumberAndUnit(value, displayUnit);
  const goalParts = hydrationNumberAndUnit(goalMl, displayUnit);
  const goalReached = value >= goalMl;
  const remainingText = formatHydrationRemaining(goalMl - value, displayUnit);

  const addDrink = (ml) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(Math.min(HYDRATION_MAX_ML, value + ml));
  };

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "space-between", paddingBottom: 16 }}>
      <View style={{ alignItems: "center" }}>
        <Text style={[styles.stepTitle, { color: t.isDark ? t.text : "#781D11" }]}>How's your hydration?</Text>
        <Text style={styles.stepSubtitle}>Log today's water intake</Text>
      </View>

      {/* Vessel visual */}
      <View style={{ alignItems: "center", justifyContent: "center", flex: 1 }}>
        <HydrationVessel valueMl={value} goalMl={goalMl} />
        <Text style={{ marginTop: 14 }}>
          <Text style={{ fontFamily: fonts.extrabold, fontSize: 32, color: "#3B82F6" }}>{number} {unitLabel}</Text>
          <Text style={{ fontFamily: fonts.medium, fontSize: 18, color: t.textSecondary }}> of {goalParts.number} {goalParts.unitLabel}</Text>
        </Text>
        {heatBumpMl > 0 && tempC != null && (
          <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: t.textTertiary, marginTop: 6 }}>
            +{formatHydration(heatBumpMl, displayUnit)} suggested today — it's {Math.round(tempC)}°
          </Text>
        )}
      </View>

      {/* Container quick add */}
      <View style={{ alignItems: "center", marginBottom: 16 }}>
        <Text style={[styles.sliderEndLabel, { marginBottom: 10 }]}>ADD A DRINK</Text>
        <View
          style={{
            width: SCREEN_WIDTH - 48,
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 10,
          }}
        >
          {orderedContainers.map((c) => (
            <PressableScale
              key={c.id}
              onPress={() => addDrink(c.ml)}
              style={{
                width: (SCREEN_WIDTH - 48 - 10) / 2,
                alignItems: "center",
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 24,
                borderWidth: 2,
                borderColor: "#3B82F6",
                backgroundColor: c.isDefault ? "#3B82F6" : "transparent",
              }}
            >
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: 14,
                  color: c.isDefault ? "#fff" : "#3B82F6",
                }}
              >
                {c.emoji} {c.name} +{formatHydration(c.ml, displayUnit)}
              </Text>
            </PressableScale>
          ))}
        </View>
      </View>

      {/* +/- fine adjust (250 ml steps) */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 32 }}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onChange(Math.max(0, value - GLASS_ML));
          }}
          style={[styles.hydBtn, { borderColor: "#3B82F6" }]}
        >
          <Text style={{ fontFamily: fonts.bold, fontSize: 28, color: "#3B82F6" }}>−</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onChange(Math.min(HYDRATION_MAX_ML, value + GLASS_ML));
          }}
          style={[styles.hydBtn, { borderColor: "#3B82F6", backgroundColor: "#3B82F6" }]}
        >
          <Text style={{ fontFamily: fonts.bold, fontSize: 28, color: "#fff" }}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={{ width: "100%", paddingHorizontal: 24, marginTop: 8 }}>
        <Text style={[styles.sliderEndLabel, { textAlign: "center", color: "#3B82F6" }]}>
          {goalReached ? "Goal reached" : remainingText}
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
function SummaryStep({ log, onSubmit, isLoading, hydrationDisplayUnit, relog, showSaveSuccess }) {
  const t = useTheme();
  const moodIdx = MOOD_VALUES.indexOf(log.mood);
  const moodLabel = MOOD_LABELS[moodIdx] ?? "Neutral";

  const rows = [
    { label: "Pain Level", value: `${log.painLevel}/10`, color: getPainColor(log.painLevel) },
    { label: "Mood", value: `${MOOD_EMOJIS[moodIdx]} ${moodLabel}`, color: MOOD_ORB_COLORS[moodIdx] ?? "#A9334D" },
    { label: "What contributed", value: log.triggers.length ? log.triggers.join(", ") : "—", color: "#8B5CF6" },
    { label: "Body Locations", value: log.bodyLocations.length ? log.bodyLocations.join(", ") : "None", color: "#A9334D" },
    { label: "Symptoms", value: log.symptoms.length ? log.symptoms.join(", ") : "None reported", color: "#781D11" },
    { label: "Hydration", value: formatHydration(log.hydration, hydrationDisplayUnit), color: "#3B82F6" },
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
            transition={{ delay: i * 40, type: "timing", duration: 300 }}
            style={[styles.summaryRow, { backgroundColor: t.isDark ? t.surface : "#F8E9E7" }]}
          >
            <View style={[styles.summaryDot, { backgroundColor: row.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryLabel}>{row.label}</Text>
              <Text style={[styles.summaryValue, { color: t.isDark ? t.text : "#781D11" }]} numberOfLines={2}>{row.value}</Text>
            </View>
          </MotiView>
        ))}
        {relog && (
          <Text style={{ fontFamily: "Geist_400Regular", fontSize: 12.5, color: t.textSecondary, textAlign: "center", marginTop: 4, marginBottom: 4 }}>
            Updates today's summary — highest pain, latest mood.
          </Text>
        )}
      </ScrollView>

      <PressableScale onPress={onSubmit} disabled={isLoading} style={[styles.submitBtn, isLoading && { opacity: 0.7 }]}>
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : showSaveSuccess ? (
          <MotiView
            from={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={celebrationSpring}
          >
            <Check color="#fff" size={20} strokeWidth={2.5} />
          </MotiView>
        ) : (
          <Check color="#fff" size={20} strokeWidth={2.5} />
        )}
        <Text style={styles.submitBtnText}>{isLoading ? "Saving..." : showSaveSuccess ? "Saved!" : "Save log"}</Text>
      </PressableScale>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

const STEP_NAMES = ['pain_level', 'body_locations', 'symptoms', 'mood', 'mood_why', 'hydration', 'notes', 'summary'];

export default function LogSymptomsScreen() {
  const router = useRouter();
  const posthog = usePostHog();
  const t = useTheme();
  const reducedMotion = useReducedMotion();
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
  const { displayUnit: hydrationDisplayUnit } = useHydrationStore();
  const { data: containersData } = useHydrationContainersQuery();
  const containers = containersData?.length ? containersData : FALLBACK_CONTAINERS;
  const { data: dailySummaries } = useHealthDataQuery();

  const { data: profile } = useProfileQuery();
  const { weather } = useWeatherData(profile?.locationEnabled ?? false);
  const tempC = weather?.temp ?? null;
  const heatBumpMl = getHeatBumpMl(tempC);

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
  // Once the user has touched hydration (a fresh in-progress log with a real
  // value, or an on-screen edit below), the running-total prefill below must
  // not clobber it.
  const hydrationTouchedRef = useRef(!!currentSymptomLog.hydration);
  const setHydrationTouched = (val) => {
    hydrationTouchedRef.current = true;
    setHydration(val);
  };
  // Seeds the vessel from today's real running total (home quick-adds +
  // any earlier check-in today) so a second check-in confirms/adjusts that
  // total instead of starting at 0 and silently discarding it — daily_summaries
  // aggregates hydration via MAX(...), so re-entering a lower number would
  // otherwise be lost.
  useEffect(() => {
    if (hydrationTouchedRef.current) return;
    const todaySummary = dailySummaries?.find((d) => d.date === todayStr);
    if (todaySummary?.hydration) {
      setHydration((h) => Math.max(h, todaySummary.hydration));
    }
  }, [dailySummaries]);
  const [notes, setNotes] = useState(currentSymptomLog.notes || "");
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

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
      hydration, // canonical ml
      notes,
    };
    updateSymptomLog(logData);

    submitLogMutation.mutate(logData, {
      onSuccess: () => {
        const logDuration = Math.round((Date.now() - openedAtRef.current) / 1000);
        posthog?.capture('symptom_log_submitted', {
          pain_level: painLevel,
          hydration_level: Math.round(glassesFromMl(hydration)),
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
          amount_glasses: Math.round(glassesFromMl(hydration)),
          amount_ml: hydration,
          goal_ml: hydrationGoalMl,
          goal_met: hydration >= hydrationGoalMl,
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
          writeDailyLog({ hydrationMl: hydration, symptoms, mood: MOOD_VALUES[moodValue - 1], painLevel, prefs: healthPreferences });
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowSaveSuccess(true);
        setTimeout(() => router.back(), 350);
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
          <MoodAmbientBackground progress={moodAnim} isDark={t.isDark} reducedMotion={reducedMotion} />
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

      {/* Already logged today notice — quiet line, same idiom as the hydration heat-bump note */}
      {hasLoggedToday && step === 0 && (
        <Text style={{
          marginHorizontal: 24,
          marginBottom: 8,
          fontSize: 13,
          color: t.textTertiary,
          fontFamily: fonts.regular,
          textAlign: "center",
        }}>
          Checking in again — tell us how things are now
        </Text>
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
            relog={hasLoggedToday}
          />
        )}
        {step === 1 && (
          <LocationsStep selected={bodyLocations} onToggle={toggleLocation} />
        )}
        {step === 2 && (
          <SymptomsStep selected={symptoms} onToggle={toggleSymptom} relog={hasLoggedToday} />
        )}
        {step === 3 && (
          <MoodStep value={moodValue} progress={moodAnim} onChange={setMoodValue} relog={hasLoggedToday} />
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
          <HydrationStep value={hydration} onChange={setHydrationTouched} goalMl={hydrationGoalMl} heatBumpMl={heatBumpMl} tempC={tempC} displayUnit={hydrationDisplayUnit} containers={containers} />
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
          <SummaryStep log={logSnapshot} onSubmit={handleSubmit} isLoading={submitLogMutation.isPending} hydrationDisplayUnit={hydrationDisplayUnit} relog={hasLoggedToday} showSaveSuccess={showSaveSuccess} />
        )}
      </View>

      {/* Next button (not on summary — summary has its own submit) */}
      {!isSummary && (
        <View style={{ paddingHorizontal: 24, paddingBottom: 8, paddingTop: 4 }}>
          <PressableScale onPress={handleNext} style={styles.nextBtn}>
            <Text style={styles.nextBtnText}>Next</Text>
          </PressableScale>
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
