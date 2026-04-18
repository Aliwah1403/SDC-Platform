import { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LineChart, BarChart } from "react-native-gifted-charts";
import { MotiView } from "moti";
import {
  ChevronLeft,
  Settings,
  AlignLeft,
  TrendingUp,
  Sparkles,
  Zap,
  Droplets,
  Smile,
  Activity,
  Moon,
  Heart,
  Thermometer,
  Waves,
  Wind,
  AlertTriangle,
} from "lucide-react-native";
import { useHealthDataQuery } from "@/hooks/queries/useHealthDataQuery";
import { useMetricGoalsQuery } from "@/hooks/queries/useMetricGoalsQuery";
import { fonts } from "@/utils/fonts";
import { useAppStore } from "@/store/appStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
// scrollview pad 20*2 + card pad 20*2 + yAxisLabelWidth 24 - marginLeft offset 8 = 96
const CHART_WIDTH = SCREEN_WIDTH - 96;

function dateToStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const METRIC_META = {
  pain: {
    label: "Pain Level",
    icon: Zap,
    color: "#DC2626",
    max: 10,
    rangeMin: 0,
    rangeMax: 10,
    chartType: "line",
    dataField: "painLevel",
    hasGoal: false,
    lowerIsBetter: true,
    aboutTitle: "Your body's daily distress signal",
    about: "Pain management is central to living with sickle cell disease. Tracking your pain daily helps you and your care team identify triggers, monitor trends, and adjust your treatment plan. Consistent logging — even on pain-free days — gives the most accurate picture of your health over time.",
  },
  hydration: {
    label: "Hydration",
    icon: Droplets,
    color: "#3B82F6",
    max: 16,
    rangeMin: 0,
    rangeMax: 16,
    chartType: "bar",
    dataField: "hydration",
    hasGoal: true,
    lowerIsBetter: false,
    aboutTitle: "The key to preventing a pain crisis",
    about: "Staying well hydrated is one of the most important things you can do to manage SCD. Dehydration is a major trigger for pain crises — it causes red blood cells to sickle more easily. Aim for at least 8 glasses of water per day, and increase this when it's hot or when you're physically active.",
    unit: "glasses",
  },
  mood: {
    label: "Mood",
    icon: Smile,
    color: "#7C3AED",
    max: 5,
    rangeMin: 1,
    rangeMax: 5,
    chartType: "line",
    dataField: "mood",
    hasGoal: false,
    lowerIsBetter: false,
    aboutTitle: "Your emotional wellbeing over time",
    about: "Mental and emotional wellbeing is deeply connected to physical health in SCD. Chronic pain, fatigue, and treatment demands can significantly affect mood. Tracking how you feel emotionally helps identify patterns and informs conversations with your care team about mental health support.",
  },
  steps: {
    label: "Steps",
    icon: Activity,
    color: "#059669",
    max: 15000,
    rangeMin: 0,
    rangeMax: 15000,
    chartType: "bar",
    dataField: "steps",
    hasGoal: true,
    lowerIsBetter: false,
    aboutTitle: "A passive measure of your daily activity",
    about: "Light to moderate physical activity can help improve circulation and overall wellbeing with SCD. However, over-exertion is a known crisis trigger. Step counting from Apple Health gives you a passive measure of your daily activity level to help you find your safe, sustainable range.",
    unit: "steps",
  },
  sleep: {
    label: "Sleep",
    icon: Moon,
    color: "#6366F1",
    max: 12,
    rangeMin: 0,
    rangeMax: 12,
    chartType: "bar",
    dataField: "sleepHours",
    hasGoal: true,
    lowerIsBetter: false,
    aboutTitle: "Recovery and repair while you rest",
    about: "Quality sleep is essential for immune function and pain recovery in SCD. Poor sleep can amplify pain perception and increase the likelihood of a crisis. Apple Health tracks your nightly sleep duration automatically — aim for 7–9 hours, and flag consistently poor nights to your doctor.",
    unit: "h",
  },
  heartrate: {
    label: "Heart Rate",
    icon: Heart,
    color: "#EF4444",
    max: 120,
    rangeMin: 40,
    rangeMax: 130,
    chartType: "line",
    dataField: "heartRate",
    hasGoal: false,
    lowerIsBetter: false,
    aboutTitle: "How hard your heart is working each day",
    about: "Heart rate from Apple Health reflects your cardiovascular activity. People with SCD typically have a higher resting heart rate (80–100 bpm) due to chronic anaemia — the heart works harder to compensate for reduced oxygen-carrying capacity. Readings above 110 bpm warrant rest; above 120 bpm contact your care team.",
    unit: "bpm",
  },
  spo2: {
    label: "Blood Oxygen",
    icon: Waves,
    color: "#0EA5E9",
    max: 100,
    rangeMin: 88,
    rangeMax: 100,
    chartType: "line",
    dataField: "spO2",
    hasGoal: false,
    lowerIsBetter: false,
    aboutTitle: "Oxygen saturation — the most critical SCD metric",
    about: "Blood oxygen (SpO2) measures the percentage of haemoglobin carrying oxygen. For SCD patients (HbSS), a normal baseline is 94–98% — lower than the 95–100% seen in healthy individuals. A reading below 92% is a red flag for Acute Chest Syndrome, one of the most serious SCD complications. Requires Apple Watch Series 6 or later.",
    unit: "%",
  },
  temperature: {
    label: "Temperature",
    icon: Thermometer,
    color: "#F59E0B",
    max: 42,
    rangeMin: 35,
    rangeMax: 42,
    chartType: "line",
    dataField: "temperature",
    hasGoal: false,
    lowerIsBetter: false,
    aboutTitle: "Fever is a medical emergency for SCD patients",
    about: "SCD patients have functional asplenia — the spleen cannot fight infections effectively. A fever of 38°C or above requires immediate medical evaluation because sepsis can develop rapidly. Even a mild fever should never be managed at home without care team guidance.",
    unit: "°C",
  },
  resprate: {
    label: "Resp. Rate",
    icon: Wind,
    color: "#8B5CF6",
    max: 30,
    rangeMin: 8,
    rangeMax: 30,
    chartType: "line",
    dataField: "respiratoryRate",
    hasGoal: false,
    lowerIsBetter: false,
    aboutTitle: "Breathing rate as an early warning sign",
    about: "Normal respiratory rate is 12–20 breaths per minute. An elevated rate (above 20/min) can be an early indicator of Acute Chest Syndrome (ACS) — a life-threatening complication of SCD that begins with chest pain, fever, and difficulty breathing. ACS requires emergency care. Requires Apple Watch.",
    unit: "/min",
  },
};

function getLastNDays(healthData, field, n) {
  const today = new Date();
  const result = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const entry = healthData.find((d) => d.date === dateToStr(date));
    result.push({ date, value: entry?.[field] ?? 0 });
  }
  return result;
}

function calcTrendDelta(data) {
  const logged = data.filter((d) => d.value > 0);
  if (logged.length < 2) return null;
  const half = Math.floor(logged.length / 2);
  const firstAvg = logged.slice(0, half).reduce((s, d) => s + d.value, 0) / half;
  const secondAvg = logged.slice(half).reduce((s, d) => s + d.value, 0) / (logged.length - half);
  return secondAvg - firstAvg;
}

function getStatus(metricKey, value) {
  if (!value) return null;
  switch (metricKey) {
    case "pain":
      if (value <= 2) return { label: "Low", color: "#059669" };
      if (value <= 5) return { label: "Moderate", color: "#F59E0B" };
      return { label: "High", color: "#DC2626" };
    case "hydration":
      if (value >= 8) return { label: "On track", color: "#059669" };
      if (value >= 5) return { label: "Fair", color: "#F59E0B" };
      return { label: "Low", color: "#DC2626" };
    case "mood":
      if (value >= 4) return { label: "Great", color: "#059669" };
      if (value >= 3) return { label: "Good", color: "#059669" };
      if (value >= 2) return { label: "Okay", color: "#F59E0B" };
      return { label: "Low", color: "#DC2626" };
    case "steps":
      if (value >= 8000) return { label: "Active", color: "#059669" };
      if (value >= 5000) return { label: "Moderate", color: "#F59E0B" };
      return { label: "Low", color: "#EF4444" };
    case "sleep":
      if (value >= 8) return { label: "Great", color: "#059669" };
      if (value >= 7) return { label: "Good", color: "#059669" };
      if (value >= 6) return { label: "Fair", color: "#F59E0B" };
      return { label: "Low", color: "#DC2626" };
    case "heartrate":
      // SCD resting HR baseline 80–100 bpm due to chronic anaemia
      if (value >= 60 && value <= 110) return { label: "Normal", color: "#059669" };
      if (value > 110) return { label: "Elevated", color: "#DC2626" };
      return { label: "Low", color: "#F59E0B" };
    case "spo2":
      if (value >= 94) return { label: "Normal", color: "#059669" };
      if (value >= 92) return { label: "Warning", color: "#F59E0B" };
      return { label: "Critical", color: "#DC2626" };
    case "temperature":
      if (value >= 36.5 && value < 38.0) return { label: "Normal", color: "#059669" };
      if (value >= 38.0) return { label: "Fever ⚠", color: "#DC2626" };
      return { label: "Low", color: "#F59E0B" };
    case "resprate":
      if (value >= 12 && value <= 20) return { label: "Normal", color: "#059669" };
      if (value > 20 && value <= 25) return { label: "Elevated", color: "#F59E0B" };
      if (value > 25) return { label: "Critical", color: "#DC2626" };
      return { label: "Low", color: "#F59E0B" };
    default:
      return null;
  }
}

// ─── SCD Alert Banner ─────────────────────────────────────────────────────────
// Shown at the top of a metric detail screen when the reading crosses an
// SCD-specific threshold. Uses safe, non-diagnostic language per the spec.
// Also surfaces whether this metric contributed to the composite alert state.

function ScdAlertBanner({ metric, value, status, compositeAlert }) {
  if (!value || !status) return null;
  const isNormal = ["Normal", "Good", "Great"].includes(status.label);
  if (isNormal) return null;

  const isCritical = ["Critical", "Fever ⚠"].includes(status.label);

  // Safe language per spec — never "diagnosis", "abnormal", "crisis"
  let message = null;
  if (metric === "spo2" && value < 94) {
    message = value < 92
      ? "Your blood oxygen has shifted outside a safe range. This is worth contacting your care team about right away."
      : "Your blood oxygen is different from the usual SCD range. This may be worth watching — check in on how you're feeling.";
  } else if (metric === "temperature" && value >= 38.0) {
    message = "A temperature at this level is important for SCD. Combined with your condition, this warrants prompt medical evaluation.";
  } else if (metric === "heartrate" && value > 110) {
    message = value > 120
      ? "Your heart rate has moved significantly from your usual pattern. Rest and contact your care team."
      : "Your heart rate is higher than your usual range. This may be worth watching alongside your other readings.";
  } else if (metric === "resprate" && value > 20) {
    message = value > 25
      ? "Your breathing rate has shifted significantly. Combined with SCD, this pattern can be important — seek care if you feel unwell."
      : "Your respiratory rate is above your usual range. Monitor for any chest discomfort or breathing changes.";
  }

  if (!message) return null;

  // If this metric is part of a broader composite alert, note that context
  const compositeNote = compositeAlert?.triggers?.find((t) => t.type === metric)
    ? "This reading is part of a wider pattern Hemo has flagged today."
    : null;

  return (
    <View style={{
      backgroundColor: isCritical ? "#FEF2F2" : "#FFFBEB",
      borderRadius: 14,
      padding: 14,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: isCritical ? "#FECACA" : "#FDE68A",
      gap: 6,
    }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
        <AlertTriangle size={16} color={isCritical ? "#DC2626" : "#D97706"} style={{ marginTop: 1 }} />
        <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: isCritical ? "#991B1B" : "#92400E", flex: 1, lineHeight: 19 }}>
          {message}
        </Text>
      </View>
      {compositeNote && (
        <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: isCritical ? "#B91C1C" : "#B45309", paddingLeft: 26, lineHeight: 17 }}>
          {compositeNote}
        </Text>
      )}
    </View>
  );
}

// ─── Dot Range Indicator ─────────────────────────────────────────────────────

function DotRange({ value, rangeMin, rangeMax, color }) {
  const DOTS = 36;
  if (!value) return null;
  const clamped = Math.min(Math.max(value, rangeMin), rangeMax);
  const position = (clamped - rangeMin) / (rangeMax - rangeMin);
  const activeIndex = Math.round(position * (DOTS - 1));

  return (
    <View style={{ marginTop: 20 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
        {Array.from({ length: DOTS }).map((_, i) => {
          const isFilled = i <= activeIndex;
          const isCurrent = i === activeIndex;
          const progress = isFilled ? i / Math.max(activeIndex, 1) : 0;
          return (
            <View
              key={i}
              style={{
                width: isCurrent ? 10 : 7,
                height: isCurrent ? 10 : 7,
                borderRadius: 999,
                backgroundColor: isFilled ? color : "#E5E7EB",
                opacity: isFilled ? (0.3 + progress * 0.7) : 1,
              }}
            />
          );
        })}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
        <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: "#9CA3AF" }}>{rangeMin}</Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: "#9CA3AF" }}>{rangeMax}</Text>
      </View>
    </View>
  );
}

// ─── Dynamic Insights ─────────────────────────────────────────────────────────
// Returns data-driven content based on current value, status and trend.
// Swap the return values here for an AI-generated response when ready.

function getInsights(metric, currentValue, statusLabel, trendDelta, lowerIsBetter) {
  if (!currentValue || !statusLabel) return null;
  const trendingWorse = trendDelta !== null && (lowerIsBetter ? trendDelta > 0 : trendDelta < 0);

  switch (metric) {
    case "pain": {
      if (statusLabel === "Low") return {
        headline: trendingWorse
          ? "Pain has been low but is starting to rise — act early"
          : "Your pain is well-controlled — keep up what's working",
        subtitle: trendingWorse
          ? "Small preventive actions now can stop a larger flare developing"
          : "Maintaining your current habits is your best defence against a crisis",
        sectionTitle: "Ways to stay ahead of pain",
        tips: [
          { heading: "Keep hydration high", bullets: [{ label: "Stay consistent:", text: "Even on good days, 8+ glasses daily keeps red blood cells from sickling" }] },
          { heading: "Rest proactively", bullets: [{ label: "Don't wait:", text: "Maintaining regular rest prevents the fatigue that commonly triggers crises" }] },
          { heading: "Monitor stress", bullets: [{ label: "Stress is a trigger:", text: "Emotional stress is a documented pain trigger — check in with your mood regularly" }] },
        ],
      };
      if (statusLabel === "Moderate") return {
        headline: "Moderate pain detected — targeted action can prevent escalation",
        subtitle: "Now is the time to support your body before the pain increases further",
        sectionTitle: "Ways to manage moderate pain",
        tips: [
          { heading: "Prioritise hydration", bullets: [{ label: "Drink now:", text: "If you haven't hit your goal today, start now — dehydration directly amplifies pain" }] },
          { heading: "Heat therapy", bullets: [{ label: "Warm compress:", text: "Applying warmth to painful areas improves local blood flow and reduces sickling" }] },
          { heading: "Rest immediately", bullets: [{ label: "Stop activity:", text: "Continuing physical exertion during moderate pain significantly increases your crisis risk" }] },
        ],
      };
      return {
        headline: "Your pain level is elevated — focus on relief and recovery",
        subtitle: "High pain requires immediate attention, rest, and care team contact if persistent",
        sectionTitle: "Ways to manage high pain",
        tips: [
          { heading: "Contact your care team", bullets: [{ label: "Don't wait:", text: "Persistent high pain should be reviewed by your healthcare provider promptly" }] },
          { heading: "Hydration is critical", bullets: [{ label: "Drink now:", text: "Dehydration is likely contributing to elevated pain — address it immediately" }] },
          { heading: "Complete rest", bullets: [{ label: "No exertion:", text: "All physical activity should stop during a high-pain episode to allow your body to recover" }] },
        ],
      };
    }

    case "hydration": {
      if (statusLabel === "On track") return {
        headline: trendingWorse
          ? "Your hydration has been good but is declining — stay consistent"
          : "Great hydration! You're protecting yourself against pain crises",
        subtitle: trendingWorse
          ? "A drop in hydration can quickly raise your crisis risk — don't let it slip"
          : "Consistent hydration is one of the most powerful SCD management tools",
        sectionTitle: trendingWorse ? "Ways to reverse the decline" : "Ways to maintain great hydration",
        tips: [
          { heading: "Keep the routine", bullets: [{ label: "Don't skip:", text: "Consistency matters — even one low-hydration day can elevate your sickling risk" }] },
          { heading: "Increase in heat", bullets: [{ label: "Add 2+ glasses:", text: "On warm days or when physically active, increase intake beyond your daily goal" }] },
          { heading: "Morning check", bullets: [{ label: "Urine colour:", text: "Dark urine first thing in the morning means start the day with two full glasses immediately" }] },
        ],
      };
      if (statusLabel === "Fair") return {
        headline: "Your hydration is below target — small improvements make a real difference",
        subtitle: "Fair hydration still carries elevated crisis risk — close the gap today",
        sectionTitle: "Ways to improve your hydration",
        tips: [
          { heading: "Add one more glass", bullets: [{ label: "Start small:", text: "Just one extra glass per day creates a meaningful improvement in blood viscosity" }] },
          { heading: "Set reminders", bullets: [{ label: "Phone alerts:", text: "Hourly reminders to sip water build the habit with very little effort" }] },
          { heading: "Keep water visible", bullets: [{ label: "Always in sight:", text: "A bottle you can see is the single most effective way to increase daily intake" }] },
        ],
      };
      return {
        headline: "Low hydration is a major pain crisis risk — prioritise drinking today",
        subtitle: "Dehydration causes red blood cells to sickle more easily — act now",
        sectionTitle: "Ways to urgently boost hydration",
        tips: [
          { heading: "Start immediately", bullets: [{ label: "Drink right now:", text: "Have a full glass now, then set a reminder every 30 minutes until you hit your goal" }] },
          { heading: "Avoid dehydrating drinks", bullets: [{ label: "Limit caffeine:", text: "Caffeine and alcohol increase fluid loss and significantly worsen dehydration" }] },
          { heading: "Electrolyte support", bullets: [{ label: "Consider electrolytes:", text: "If severely dehydrated, electrolyte drinks help your body absorb fluid more effectively" }] },
        ],
      };
    }

    case "mood": {
      if (statusLabel === "Great" || statusLabel === "Good") return {
        headline: trendingWorse
          ? "Your mood has been positive but shows a downward trend — stay proactive"
          : "Your mood is strong — these habits are supporting your wellbeing",
        subtitle: "Positive mood is closely linked to better pain management and physical health",
        sectionTitle: trendingWorse ? "Ways to protect your mood" : "Ways to sustain good mood",
        tips: [
          { heading: "Maintain your routines", bullets: [{ label: "Consistency matters:", text: "The habits keeping your mood up — sleep, hydration, connection — deserve to stay consistent" }] },
          { heading: "Daily reflection", bullets: [{ label: "Gratitude practice:", text: "Noting three positive things each day reinforces emotional resilience" }] },
          { heading: "Protect your energy", bullets: [{ label: "Set boundaries:", text: "Saying no to draining commitments preserves emotional resources for recovery" }] },
        ],
      };
      if (statusLabel === "Okay") return {
        headline: "Your mood is moderate — small, consistent actions can shift it upward",
        subtitle: "Managing mood with SCD takes care — you're not alone in this",
        sectionTitle: "Ways to lift your mood",
        tips: [
          { heading: "Get outside", bullets: [{ label: "Sunlight & fresh air:", text: "Even a short walk outside boosts serotonin and reduces stress hormones" }] },
          { heading: "Connect with others", bullets: [{ label: "Reach out today:", text: "A brief conversation with a trusted friend or family member can meaningfully improve mood" }] },
          { heading: "Gentle movement", bullets: [{ label: "Light activity:", text: "Low-intensity movement releases endorphins without risking a pain episode" }] },
        ],
      };
      return {
        headline: "Low mood is common with SCD — recognising it is the first step",
        subtitle: "Chronic pain and fatigue significantly affect emotional wellbeing",
        sectionTitle: "Ways to support your mental health",
        tips: [
          { heading: "Talk to someone", bullets: [{ label: "Don't carry it alone:", text: "Sharing how you feel with a trusted person or your care team can provide real relief" }] },
          { heading: "Professional support", bullets: [{ label: "Therapy works:", text: "CBT has strong evidence for improving mood in people managing chronic conditions" }] },
          { heading: "Focus on small wins", bullets: [{ label: "One step at a time:", text: "Completing one small positive action today is more helpful than trying to fix everything at once" }] },
        ],
      };
    }

    case "steps": {
      if (statusLabel === "Active") return {
        headline: trendingWorse
          ? "You've been very active but activity is declining — check in with your body"
          : "You're hitting great activity levels — here's how to keep it sustainable",
        subtitle: "Consistent movement improves circulation and overall wellbeing with SCD",
        sectionTitle: "Ways to stay active sustainably",
        tips: [
          { heading: "Pace throughout the day", bullets: [{ label: "Spread steps out:", text: "Distributing activity through the day prevents the fatigue spikes that can trigger crises" }] },
          { heading: "Cool down properly", bullets: [{ label: "Post-activity stretch:", text: "Stretching after activity reduces lactic acid build-up and muscle tension" }] },
          { heading: "Hydrate around activity", bullets: [{ label: "Before and after:", text: "Drink a glass before and after any physical activity to offset fluid loss" }] },
        ],
      };
      if (statusLabel === "Moderate") return {
        headline: "You're moderately active — gradual increases can safely boost circulation",
        subtitle: "Building up slowly is the right approach to increasing activity with SCD",
        sectionTitle: "Ways to increase activity safely",
        tips: [
          { heading: "Add short walks", bullets: [{ label: "10 minutes more:", text: "Adding just one extra 10-minute walk per day builds the habit without overexertion" }] },
          { heading: "Everyday choices", bullets: [{ label: "Take the stairs:", text: "Small environment-based activity adds up and keeps your body moving throughout the day" }] },
          { heading: "Morning movement", bullets: [{ label: "Start the day moving:", text: "A short morning walk sets a positive baseline and tends to increase overall activity" }] },
        ],
      };
      return {
        headline: "Low activity may be affecting your circulation — gentle movement helps",
        subtitle: "Even light walking daily significantly supports blood flow with SCD",
        sectionTitle: "Ways to gently increase your activity",
        tips: [
          { heading: "Start very small", bullets: [{ label: "5-minute walks:", text: "Begin with just 5 minutes and gradually extend as you feel comfortable" }] },
          { heading: "Home movement counts", bullets: [{ label: "No gym needed:", text: "Standing, stretching, or slow walking around your home all support circulation" }] },
          { heading: "Pain comes first", bullets: [{ label: "Rest if pain is high:", text: "Only increase activity on comfortable days — rest is the right call during a pain episode" }] },
        ],
      };
    }

    case "sleep": {
      if (statusLabel === "Great") return {
        headline: trendingWorse
          ? "Your sleep has been great but is starting to dip — protect this habit"
          : "Excellent sleep! Consistent rest is your body's most powerful recovery tool",
        subtitle: "Great sleep significantly reduces pain sensitivity and crisis risk",
        sectionTitle: "Ways to protect great sleep",
        tips: [
          { heading: "Protect your schedule", bullets: [{ label: "Same time every day:", text: "Even on weekends, a consistent sleep schedule preserves the quality you've built" }] },
          { heading: "Wind-down ritual", bullets: [{ label: "30-minute buffer:", text: "A consistent pre-sleep routine signals your brain to prepare for deep, restorative sleep" }] },
          { heading: "Pre-sleep hydration", bullets: [{ label: "One glass before bed:", text: "Prevents overnight dehydration and painful nighttime cramps" }] },
        ],
      };
      if (statusLabel === "Good") return {
        headline: "Good sleep — you're close to optimal, here's how to maximise quality",
        subtitle: "Small improvements in sleep quality can have outsized benefits for SCD",
        sectionTitle: "Ways to optimise your sleep",
        tips: [
          { heading: "Lock in bedtime", bullets: [{ label: "Within 30 minutes:", text: "Consistent bedtime within 30 minutes each night improves depth of sleep over time" }] },
          { heading: "Limit screens", bullets: [{ label: "Blue light impact:", text: "Screens within 30 minutes of sleep reduce melatonin and delay sleep onset" }] },
          { heading: "Cool your room", bullets: [{ label: "Lower temperature:", text: "Sleeping slightly cooler (around 18°C) promotes deeper, more restorative sleep" }] },
        ],
      };
      if (statusLabel === "Fair") return {
        headline: "Your sleep is below recommended — this can amplify pain sensitivity",
        subtitle: "Even one extra hour of sleep can meaningfully improve your pain tolerance",
        sectionTitle: "Ways to increase sleep duration",
        tips: [
          { heading: "Shift bedtime earlier", bullets: [{ label: "Gradual change:", text: "Move your bedtime 15 minutes earlier each night until you reach the 7–9 hour range" }] },
          { heading: "Reduce disruptors", bullets: [{ label: "Limit caffeine:", text: "Avoid caffeine after 2pm — it can delay sleep onset by several hours" }] },
          { heading: "Address nighttime pain", bullets: [{ label: "Talk to your doctor:", text: "If pain is what's keeping you awake, your care team has options that can help" }] },
        ],
      };
      return {
        headline: "Insufficient sleep is increasing your pain sensitivity and crisis risk",
        subtitle: "Prioritising sleep tonight is one of the most impactful things you can do",
        sectionTitle: "Ways to get more sleep urgently",
        tips: [
          { heading: "Make sleep the priority", bullets: [{ label: "Cancel non-essentials:", text: "When sleep is critically low, reducing commitments to rest is medically justified" }] },
          { heading: "Speak to your doctor", bullets: [{ label: "Sleep disorders:", text: "Persistent poor sleep may indicate an underlying issue your care team can help address" }] },
          { heading: "Nap strategically", bullets: [{ label: "Short naps:", text: "A 20-minute nap before 3pm can partially offset a poor night without disrupting nighttime sleep" }] },
        ],
      };
    }

    case "heartrate": {
      if (statusLabel === "Normal") return {
        headline: trendingWorse
          ? "Heart rate is normal but trending upward — keep monitoring"
          : "Your heart rate is in a healthy range — keep supporting it",
        subtitle: "Maintaining this range supports good oxygen delivery throughout your body",
        sectionTitle: "Ways to support heart health",
        tips: [
          { heading: "Stay active safely", bullets: [{ label: "Low-impact exercise:", text: "Regular gentle movement maintains cardiovascular fitness without strain" }] },
          { heading: "Manage stress", bullets: [{ label: "Breathing techniques:", text: "Daily slow breathing exercises help regulate your heart rate over time" }] },
          { heading: "Stay hydrated", bullets: [{ label: "Heart & hydration:", text: "Dehydration forces your heart to work harder — keeping fluids up lowers resting rate" }] },
        ],
      };
      if (statusLabel === "Elevated") return {
        headline: "Your heart rate is elevated — this warrants rest and attention",
        subtitle: "An elevated heart rate alongside SCD may signal increased stress or a developing episode",
        sectionTitle: "Ways to address elevated heart rate",
        tips: [
          { heading: "Rest immediately", bullets: [{ label: "Stop activity:", text: "Any physical exertion should stop when heart rate is elevated — allow your body to recover" }] },
          { heading: "Assess other symptoms", bullets: [{ label: "Pain + high HR:", text: "If elevated heart rate accompanies pain, contact your care team — this may signal a crisis" }] },
          { heading: "Deep breathing", bullets: [{ label: "Activate rest mode:", text: "Breathe in for 4 seconds, out for 6 — this activates the vagus nerve and lowers heart rate" }] },
        ],
      };
      return {
        headline: "Your heart rate is lower than typical — worth monitoring alongside other symptoms",
        subtitle: "While a lower rate can be normal, track it in context with how you feel",
        sectionTitle: "Ways to monitor heart health",
        tips: [
          { heading: "Watch for symptoms", bullets: [{ label: "Dizziness or fatigue:", text: "If a low heart rate accompanies fatigue or dizziness, mention it to your care team" }] },
          { heading: "Maintain light activity", bullets: [{ label: "Gentle movement:", text: "Daily activity supports cardiovascular health and keeps heart rate in a healthy range" }] },
          { heading: "Log consistently", bullets: [{ label: "Build a picture:", text: "Consistent logging gives your care team the context to assess whether readings are normal for you" }] },
        ],
      };
    }

    default:
      return null;
  }
}

// ─── Insights Card ───────────────────────────────────────────────────────────

function InsightsCard({ insights, color }) {
  if (!insights) return null;
  return (
    <View style={{
      backgroundColor: "#fff",
      borderRadius: 20,
      padding: 20,
      marginBottom: 14,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    }}>
      {/* Header row */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Sparkles size={13} color="#9CA3AF" strokeWidth={2} />
          <Text style={{ fontFamily: fonts.semibold, fontSize: 11, color: "#9CA3AF", letterSpacing: 1, textTransform: "uppercase" }}>
            Insights
          </Text>
        </View>
      </View>

      {/* Headline */}
      <Text style={{ fontFamily: fonts.bold, fontSize: 17, color: "#1F2937", lineHeight: 25, marginBottom: 6 }}>
        {insights.headline}
      </Text>
      <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: "#9CA3AF", lineHeight: 20, marginBottom: 18 }}>
        {insights.subtitle}
      </Text>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: "#F3F4F6", marginBottom: 18 }} />

      {/* Section title */}
      <Text style={{ fontFamily: fonts.bold, fontSize: 15, color, marginBottom: 16 }}>
        {insights.sectionTitle}
      </Text>

      {/* Tips */}
      {insights.tips.map((tip, ti) => (
        <View key={ti} style={{ marginBottom: ti < insights.tips.length - 1 ? 20 : 0 }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: "#1F2937", marginBottom: 10 }}>
            {tip.heading}
          </Text>
          {tip.bullets.map((b, bi) => (
            <View key={bi} style={{ flexDirection: "row", marginBottom: bi < tip.bullets.length - 1 ? 8 : 0 }}>
              <View style={{ width: 3, borderRadius: 2, backgroundColor: color, opacity: 0.5, marginRight: 12, marginTop: 2 }} />
              <Text style={{ flex: 1, fontFamily: fonts.regular, fontSize: 14, color: "#374151", lineHeight: 21 }}>
                <Text style={{ fontFamily: fonts.semibold }}>{b.label}</Text>
                {" "}{b.text}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MetricDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { metric } = useLocalSearchParams();
  const { data: healthData = [] } = useHealthDataQuery();
  const { data: metricGoals } = useMetricGoalsQuery();

  const { healthKitData, computedAlertState } = useAppStore();

  const meta = METRIC_META[metric] ?? METRIC_META.pain;
  const [range, setRange] = useState(30);

  const goal = meta.hasGoal ? (metricGoals?.[metric] ?? null) : null;

  // Merge HealthKit data into healthData before computing chart data
  const mergedHealthData = useMemo(() => {
    if (!healthKitData || Object.keys(healthKitData).length === 0) return healthData;
    return healthData.map((entry) => {
      const hkDay = healthKitData[entry.date];
      return hkDay ? { ...entry, ...hkDay } : entry;
    });
  }, [healthData, healthKitData]);

  const data = useMemo(
    () => getLastNDays(mergedHealthData, meta.dataField, range),
    [mergedHealthData, meta.dataField, range]
  );

  const latestEntry = [...data].reverse().find((d) => d.value > 0);
  const currentValue = latestEntry?.value ?? null;

  const currentDisplay = currentValue != null
    ? (metric === "sleep"
        ? currentValue.toFixed(1)
        : metric === "steps" && currentValue >= 1000
          ? `${(currentValue / 1000).toFixed(1)}k`
          : String(currentValue))
    : "—";

  const status = currentValue != null ? getStatus(metric, currentValue) : null;
  const trendDelta = useMemo(() => calcTrendDelta(data), [data]);

  const startDate = data[0]?.date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endDate = data[data.length - 1]?.date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const giftedData = data.map((d, i) => ({
    value: d.value,
    label: i % Math.ceil(range / 6) === 0 ? d.date.getDate().toString() : "",
    tooltipLabel: d.date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    labelTextStyle: { color: "#9CA3AF", fontSize: 9 },
    ...(meta.chartType === "bar" && {
      frontColor: goal && d.value >= goal ? meta.color : meta.color + "88",
    }),
  }));

  const IconComp = meta.icon;

  return (
    <View style={{ flex: 1, backgroundColor: "#F9F9F7" }}>
      {/* Header */}
      <View style={{
        paddingTop: insets.top + 8,
        paddingBottom: 12,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F9F9F7",
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: "#EFEFED",
            alignItems: "center", justifyContent: "center",
          }}
        >
          <ChevronLeft size={20} color="#1F2937" strokeWidth={2} />
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 17, color: "#1F2937" }}>
            {meta.label}
          </Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "#9CA3AF" }}>
            Last {range} days
          </Text>
        </View>

        {meta.hasGoal ? (
          <TouchableOpacity
            onPress={() => router.push(`/metric-goal?metric=${metric}`)}
            style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: "#EFEFED",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Settings size={18} color="#1F2937" strokeWidth={2} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 48 }}
      >
        {/* ── SCD Alert Banner (shown when value crosses clinical threshold) ── */}
        <ScdAlertBanner metric={metric} value={currentValue} status={status} compositeAlert={computedAlertState} />

        {/* ── Value Section ──────────────────────────────── */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 280 }}
          style={{ marginBottom: 24 }}
        >
          {/* Range toggle */}
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 20 }}>
            {[7, 30].map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setRange(r)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: range === r ? "#1F2937" : "#EFEFED",
                }}
              >
                <Text style={{
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                  color: range === r ? "#fff" : "#9CA3AF",
                }}>
                  {r}d
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Big value */}
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 64, color: "#1F2937", lineHeight: 70 }}>
              {currentDisplay}
            </Text>
            {currentValue != null && meta.unit && (
              <Text style={{ fontFamily: fonts.medium, fontSize: 22, color: "#9CA3AF", marginBottom: 6 }}>
                {meta.unit}
              </Text>
            )}
          </View>

          {/* Status badge */}
          {status && (
            <View style={{
              alignSelf: "flex-start",
              borderRadius: 20,
              borderWidth: 1.5,
              borderColor: status.color,
              paddingHorizontal: 14,
              paddingVertical: 5,
              marginTop: 8,
            }}>
              <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: status.color }}>
                {status.label}
              </Text>
            </View>
          )}

          {/* Dot range */}
          <DotRange
            value={currentValue}
            rangeMin={meta.rangeMin}
            rangeMax={meta.rangeMax}
            color={meta.color}
          />
        </MotiView>

        {/* ── About Section ──────────────────────────────── */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 80, type: "timing", duration: 280 }}
          style={{
            backgroundColor: "#fff",
            borderRadius: 20,
            padding: 20,
            marginBottom: 14,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          {/* Section label */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <AlignLeft size={13} color="#9CA3AF" strokeWidth={2} />
            <Text style={{ fontFamily: fonts.semibold, fontSize: 11, color: "#9CA3AF", letterSpacing: 1, textTransform: "uppercase" }}>
              About
            </Text>
          </View>
          <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: "#1F2937", lineHeight: 26, marginBottom: 10 }}>
            {meta.aboutTitle}
          </Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: "#6B7280", lineHeight: 22 }}>
            {meta.about}
          </Text>
        </MotiView>

        {/* ── Trend Section ──────────────────────────────── */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 160, type: "timing", duration: 280 }}
          style={{
            backgroundColor: "#fff",
            borderRadius: 20,
            padding: 20,
            marginBottom: 14,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          {/* Section label row */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <TrendingUp size={13} color="#9CA3AF" strokeWidth={2} />
              <Text style={{ fontFamily: fonts.semibold, fontSize: 11, color: "#9CA3AF", letterSpacing: 1, textTransform: "uppercase" }}>
                Trend
              </Text>
            </View>
            <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "#9CA3AF" }}>
              {startDate} – {endDate}
            </Text>
          </View>

          {/* Trend delta */}
          {trendDelta !== null && (
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4, marginBottom: 16 }}>
              <Text style={{
                fontFamily: fonts.bold,
                fontSize: 28,
                color: trendDelta > 0
                  ? (meta.lowerIsBetter ? "#DC2626" : "#059669")
                  : (meta.lowerIsBetter ? "#059669" : "#DC2626"),
              }}>
                {trendDelta > 0 ? "▲" : "▼"} {Math.abs(trendDelta).toFixed(1)}
              </Text>
              {meta.unit && (
                <Text style={{ fontFamily: fonts.medium, fontSize: 15, color: "#9CA3AF" }}>
                  {meta.unit}
                </Text>
              )}
            </View>
          )}

          {/* Chart */}
          <View style={{ marginLeft: -8 }}>
            {meta.chartType === "line" ? (
              <LineChart
                data={giftedData}
                width={CHART_WIDTH}
                height={180}
                color={meta.color}
                thickness={2}
                curved
                dataPointsColor={meta.color}
                dataPointsRadius={3}
                noOfSections={4}
                maxValue={meta.max}
                yAxisColor="transparent"
                xAxisColor="#E5E7EB"
                rulesColor="#F3F4F6"
                rulesType="solid"
                initialSpacing={8}
                spacing={Math.max(4, Math.floor(CHART_WIDTH / (range + 2)))}
                yAxisTextStyle={{ color: "#9CA3AF", fontSize: 9 }}
                backgroundColor="transparent"
                yAxisLabelWidth={24}
                pointerConfig={{
                  pointerStripHeight: 180,
                  pointerStripColor: meta.color + "28",
                  pointerStripWidth: 1.5,
                  pointerColor: meta.color,
                  radius: 5,
                  pointerLabelWidth: 90,
                  pointerLabelHeight: 46,
                  activatePointersInstantlyOnTouch: true,
                  autoAdjustPointerLabelPosition: true,
                  pointerLabelComponent: (items) => {
                    const item = items[0];
                    if (!item) return null;
                    const dv = metric === "sleep"
                      ? `${item.value}h`
                      : metric === "steps" && item.value >= 1000
                        ? `${(item.value / 1000).toFixed(1)}k`
                        : String(item.value);
                    return (
                      <View style={{
                        backgroundColor: "#1F2937", borderRadius: 10,
                        paddingHorizontal: 10, paddingVertical: 7,
                        alignItems: "center",
                        shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
                      }}>
                        <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: "#fff" }}>
                          {dv}{meta.unit ? ` ${meta.unit}` : ""}
                        </Text>
                        <Text style={{ fontFamily: fonts.regular, fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 1 }}>
                          {item.tooltipLabel}
                        </Text>
                      </View>
                    );
                  },
                }}
              />
            ) : (
              <BarChart
                data={giftedData}
                width={CHART_WIDTH}
                height={180}
                noOfSections={4}
                maxValue={meta.max}
                yAxisColor="transparent"
                xAxisColor="#E5E7EB"
                rulesColor="#F3F4F6"
                initialSpacing={8}
                barWidth={Math.max(4, Math.floor(CHART_WIDTH / (range * 1.6)))}
                spacing={Math.max(2, Math.floor(CHART_WIDTH / (range * 3)))}
                yAxisTextStyle={{ color: "#9CA3AF", fontSize: 9 }}
                backgroundColor="transparent"
                yAxisLabelWidth={24}
                roundedTop
                showReferenceLine1={!!goal}
                referenceLine1Position={goal ?? 0}
                referenceLine1Config={{ color: meta.color, dashWidth: 4, dashGap: 4, thickness: 1.5, opacity: 0.6 }}
                focusBarOnPress
                focusedBarConfig={{ color: meta.color, borderRadius: 6, borderTopLeftRadius: 6, borderTopRightRadius: 6 }}
                renderTooltip={(item) => {
                  if (!item?.value) return null;
                  const dv = metric === "steps" && item.value >= 1000
                    ? `${(item.value / 1000).toFixed(1)}k`
                    : String(item.value);
                  return (
                    <View style={{
                      backgroundColor: "#1F2937", borderRadius: 8,
                      paddingHorizontal: 8, paddingVertical: 5,
                      marginBottom: 4, alignItems: "center",
                    }}>
                      <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: "#fff" }}>
                        {dv}{meta.unit ? ` ${meta.unit}` : ""}
                      </Text>
                    </View>
                  );
                }}
              />
            )}
          </View>

          {goal && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 }}>
              <View style={{ width: 18, height: 2, backgroundColor: meta.color, opacity: 0.6 }} />
              <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: "#9CA3AF" }}>
                Daily goal ({goal} {meta.unit ?? ""})
              </Text>
            </View>
          )}
        </MotiView>

        {/* ── Insights Section ─────────────────────────────── */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 240, type: "timing", duration: 280 }}
        >
          <InsightsCard
            insights={getInsights(metric, currentValue, status?.label, trendDelta, meta.lowerIsBetter)}
            color={meta.color}
          />
        </MotiView>
      </ScrollView>
    </View>
  );
}
