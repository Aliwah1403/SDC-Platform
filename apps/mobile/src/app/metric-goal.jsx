import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { X, Minus, Plus, Droplets, Moon, Activity, TriangleAlert } from "lucide-react-native";
import { useMetricGoalsQuery, useSetGoalMutation } from "@/hooks/queries/useMetricGoalsQuery";
import { fonts } from "@/utils/fonts";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SLIDER_WIDTH = SCREEN_WIDTH - 48;

const GOAL_META = {
  hydration: {
    goalLabel: "Hydration Goal",
    subtitle: "Set your daily water intake target",
    unit: "glasses",
    min: 1,
    max: 16,
    step: 1,
    recommended: { min: 8, max: 10 },
    recommendedLabel: "RECOMMENDED: 8 – 10 GLASSES PER DAY",
    setter: "stepper",
    presets: [4, 6, 8, 10, 12],
    tip: "Staying hydrated is one of the most effective ways to prevent sickle cell pain crises. Aim for at least 8 glasses daily — more during activity or hot weather.",
    icon: Droplets,
    color: "#3B82F6",
  },
  sleep: {
    goalLabel: "Sleep Goal",
    subtitle: "Set how many hours of sleep you need per night",
    unit: "h",
    min: 4,
    max: 12,
    step: 0.1,
    recommended: { min: 7, max: 9 },
    recommendedLabel: "RECOMMENDED FOR ADULTS  7 – 9 HOURS",
    setter: "slider",
    tip: "To support your health, doctors generally recommend 7 to 9 hours of sleep each night. Quality sleep helps your body recover and reduces the risk of pain episodes.",
    icon: Moon,
    color: "#6366F1",
  },
  steps: {
    goalLabel: "Step Goal",
    subtitle: "Set your daily step count target",
    unit: "steps",
    min: 1000,
    max: 20000,
    step: 500,
    recommended: { min: 7000, max: 10000 },
    recommendedLabel: "RECOMMENDED: 7,000 – 10,000 STEPS",
    setter: "slider",
    tip: "Light to moderate activity is beneficial for circulation with SCD. Find a sustainable step count that keeps you active without overexertion — your safe range is unique to you.",
    icon: Activity,
    color: "#059669",
  },
};

// ─── Icon with sparkle decoration ─────────────────────────────────────────────

function MetricIcon({ icon: Icon, color }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", width: 120, height: 120 }}>
      {/* Sparkle diamonds */}
      <View style={{ position: "absolute", width: 12, height: 12, borderRadius: 2, backgroundColor: color, opacity: 0.5, top: 8, left: 22, transform: [{ rotate: "45deg" }] }} />
      <View style={{ position: "absolute", width: 8, height: 8, borderRadius: 1.5, backgroundColor: color, opacity: 0.35, top: 14, right: 14, transform: [{ rotate: "45deg" }] }} />
      <View style={{ position: "absolute", width: 6, height: 6, borderRadius: 1.5, backgroundColor: color, opacity: 0.4, bottom: 12, right: 20, transform: [{ rotate: "45deg" }] }} />
      <View style={{ position: "absolute", width: 10, height: 10, borderRadius: 2, backgroundColor: color, opacity: 0.3, bottom: 18, left: 12, transform: [{ rotate: "45deg" }] }} />
      <Icon size={42} color={color} strokeWidth={1.5} />
    </View>
  );
}

// ─── Recommended range bar (below slider) ─────────────────────────────────────

function RangeBar({ min, max, recMin, recMax, color }) {
  const leftFrac = (recMin - min) / (max - min);
  const widthFrac = (recMax - recMin) / (max - min);
  const leftPx = leftFrac * SLIDER_WIDTH;
  const widthPx = widthFrac * SLIDER_WIDTH;

  return (
    <View style={{ width: SLIDER_WIDTH, marginTop: 8 }}>
      {/* Full track */}
      <View style={{ height: 3, backgroundColor: "#E5E7EB", borderRadius: 2 }}>
        {/* Highlighted recommended segment */}
        <View style={{
          position: "absolute",
          left: leftPx,
          width: widthPx,
          height: 3,
          backgroundColor: color,
          opacity: 0.35,
          borderRadius: 2,
        }} />
      </View>
    </View>
  );
}

// ─── Stepper for hydration ────────────────────────────────────────────────────

function HydrationSetter({ value, onChange, meta }) {
  const hapticAndChange = (v) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(v);
  };

  return (
    <View style={{ width: "100%", alignItems: "center" }}>
      {/* Preset pills */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 28 }}>
        {meta.presets.map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => hapticAndChange(p)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 20,
              backgroundColor: value === p ? meta.color : "#F3F4F6",
              borderWidth: 1.5,
              borderColor: value === p ? meta.color : "transparent",
            }}
          >
            <Text style={{
              fontFamily: fonts.semibold,
              fontSize: 14,
              color: value === p ? "#fff" : "#6B7280",
            }}>
              {p}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* +/- fine control */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 28 }}>
        <TouchableOpacity
          onPress={() => hapticAndChange(Math.max(meta.min, value - 1))}
          style={{
            width: 48, height: 48, borderRadius: 24,
            borderWidth: 2, borderColor: "#E5E7EB",
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Minus size={20} color="#6B7280" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: "#9CA3AF" }}>
          Fine adjust
        </Text>
        <TouchableOpacity
          onPress={() => hapticAndChange(Math.min(meta.max, value + 1))}
          style={{
            width: 48, height: 48, borderRadius: 24,
            backgroundColor: meta.color,
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Plus size={20} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MetricGoalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { metric } = useLocalSearchParams();
  const { data: metricGoals } = useMetricGoalsQuery();
  const setGoalMutation = useSetGoalMutation();

  const meta = GOAL_META[metric];
  const defaultValue = meta?.recommended?.min ?? meta?.min ?? 8;
  const [value, setValue] = useState(defaultValue);
  const initialized = useRef(false);
  const lastHapticValue = useRef(null);

  useEffect(() => {
    if (metricGoals && !initialized.current) {
      initialized.current = true;
      setValue(metricGoals[metric] ?? defaultValue);
    }
  }, [metricGoals]);

  if (!meta) {
    router.back();
    return null;
  }

  const handleSliderChange = (v) => {
    // Fire haptic only when the rounded step value actually changes
    const rounded = Math.round(v / meta.step) * meta.step;
    if (lastHapticValue.current !== rounded) {
      lastHapticValue.current = rounded;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setValue(v);
  };

  const handleSave = () => {
    setGoalMutation.mutate({ metric, value }, { onSuccess: () => router.back() });
  };

  const isBelowRecommended = value < meta.recommended.min;

  // Format display value
  let displayValue;
  if (metric === "steps") {
    displayValue = value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);
  } else if (metric === "sleep") {
    displayValue = Number.isInteger(value) ? `${value}h` : `${Math.floor(value)}h ${Math.round((value % 1) * 60)}m`;
  } else {
    displayValue = String(value);
  }

  const IconComp = meta.icon;

  return (
    <View style={{ flex: 1, backgroundColor: "#F9F9F7" }}>
      {/* Handle bar */}
      <View style={{ alignItems: "center", paddingTop: 12 }}>
        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "#D1D5DB" }} />
      </View>

      {/* Close button */}
      <View style={{ position: "absolute", top: 20, right: 20, zIndex: 10 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 34, height: 34, borderRadius: 17,
            backgroundColor: "#EFEFED",
            alignItems: "center", justifyContent: "center",
          }}
        >
          <X size={17} color="#6B7280" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 24, paddingBottom: insets.bottom + 16 }}>
        {/* Icon section */}
        <View style={{ alignItems: "center", marginTop: 24, marginBottom: 16 }}>
          <MetricIcon icon={IconComp} color={meta.color} />
        </View>

        {/* Header */}
        <Text style={{
          fontFamily: fonts.bold,
          fontSize: 26,
          color: "#1F2937",
          textAlign: "center",
          marginBottom: 8,
        }}>
          {meta.goalLabel}
        </Text>
        <Text style={{
          fontFamily: fonts.regular,
          fontSize: 14,
          color: "#9CA3AF",
          textAlign: "center",
          lineHeight: 20,
          marginBottom: 32,
        }}>
          {meta.subtitle}
        </Text>

        {/* Large value display */}
        <View style={{ alignItems: "center", marginBottom: 28 }}>
          <Text style={{
            fontFamily: fonts.bold,
            fontSize: 64,
            color: "#1F2937",
            lineHeight: 70,
          }}>
            {displayValue}
          </Text>
          {metric === "steps" && (
            <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: "#9CA3AF", marginTop: 2 }}>
              steps per day
            </Text>
          )}
          {metric === "hydration" && (
            <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: "#9CA3AF", marginTop: 2 }}>
              glasses per day
            </Text>
          )}
        </View>

        {/* Goal setter */}
        {meta.setter === "slider" ? (
          <View style={{ alignItems: "center", marginBottom: 8 }}>
            <Slider
              style={{ width: SLIDER_WIDTH, height: 40 }}
              minimumValue={meta.min}
              maximumValue={meta.max}
              step={meta.step}
              value={value}
              onValueChange={handleSliderChange}
              minimumTrackTintColor={isBelowRecommended ? "#F59E0B" : meta.color}
              maximumTrackTintColor="#E5E7EB"
              thumbTintColor={isBelowRecommended ? "#F59E0B" : meta.color}
            />
            <RangeBar
              min={meta.min}
              max={meta.max}
              recMin={meta.recommended.min}
              recMax={meta.recommended.max}
              color={meta.color}
            />
            <Text style={{
              fontFamily: fonts.semibold,
              fontSize: 10,
              color: "#9CA3AF",
              letterSpacing: 0.8,
              textTransform: "uppercase",
              textAlign: "center",
              marginTop: 10,
            }}>
              {meta.recommendedLabel}
            </Text>
            {isBelowRecommended && (
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor: "#FFFBEB",
                borderWidth: 1,
                borderColor: "#FDE68A",
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginTop: 12,
                width: "100%",
              }}>
                <TriangleAlert size={14} color="#D97706" strokeWidth={2} />
                <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "#92400E", flex: 1, lineHeight: 17 }}>
                  This is below the recommended {meta.recommended.min}{meta.unit} minimum. You can still save this goal.
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={{ alignItems: "center", marginBottom: 8 }}>
            <HydrationSetter value={value} onChange={setValue} meta={meta} />
            <Text style={{
              fontFamily: fonts.semibold,
              fontSize: 10,
              color: "#9CA3AF",
              letterSpacing: 0.8,
              textTransform: "uppercase",
              textAlign: "center",
              marginTop: 16,
            }}>
              {meta.recommendedLabel}
            </Text>
            {isBelowRecommended && (
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor: "#FFFBEB",
                borderWidth: 1,
                borderColor: "#FDE68A",
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginTop: 12,
                width: "100%",
              }}>
                <TriangleAlert size={14} color="#D97706" strokeWidth={2} />
                <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "#92400E", flex: 1, lineHeight: 17 }}>
                  This is below the recommended {meta.recommended.min} {meta.unit} minimum. You can still save this goal.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Tip paragraph */}
        <View style={{ flex: 1, justifyContent: "flex-end", paddingTop: 16 }}>
          <Text style={{
            fontFamily: fonts.regular,
            fontSize: 13,
            color: "#6B7280",
            lineHeight: 20,
            textAlign: "center",
            marginBottom: 20,
          }}>
            {meta.tip}
          </Text>

          {/* Save button */}
          <TouchableOpacity
            onPress={handleSave}
            style={{
              backgroundColor: meta.color,
              borderRadius: 16,
              paddingVertical: 17,
              alignItems: "center",
            }}
          >
            <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: "#fff" }}>
              Done
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
