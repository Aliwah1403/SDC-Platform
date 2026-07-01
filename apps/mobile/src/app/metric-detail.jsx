import { useState, useMemo, useEffect } from "react";
import { useMetricInsights } from "@/hooks/useMetricInsights";
import { usePostHog } from "posthog-react-native";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MetricChart } from "@/components/Charts/MetricChart";
import { ArcGaugeChart } from "@/components/Charts/arc-gauge-chart";
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
import { useTheme } from "@/hooks/useTheme";

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
    const raw = entry?.[field];
    result.push({ date, value: (raw != null && Number.isFinite(raw)) ? raw : 0 });
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

// ─── Dynamic Insights ─────────────────────────────────────────────────────────
// Returns data-driven content based on current value, status and trend.
// Swap the return values here for an AI-generated response when ready.

function getInsights(metric, currentValue, statusLabel, trendDelta, lowerIsBetter) {
  if (!currentValue || !statusLabel) return null;
  const trendingWorse = trendDelta !== null && (lowerIsBetter ? trendDelta > 0 : trendDelta < 0);

  switch (metric) {
    case "pain": {
      if (statusLabel === "Low") return trendingWorse ? {
        headline: "Pain has been low but is starting to rise — act early",
        paragraph: "Small preventive actions now can stop a larger flare developing. Top up hydration, rest before fatigue builds, and note anything unusual with your stress or mood.",
      } : {
        headline: "Your pain is well-controlled — keep up what's working",
        paragraph: "Maintaining your current habits is your best defence against a crisis. Keep hydration high, rest before fatigue builds, and check in on your stress levels regularly.",
      };
      if (statusLabel === "Moderate") return {
        headline: "Moderate pain detected — targeted action can prevent escalation",
        paragraph: "Now is the time to support your body before the pain increases further. Prioritise hydration if you haven't hit your goal today, apply warmth to painful areas, and stop any activity to rest.",
      };
      return {
        headline: "Your pain level is elevated — focus on relief and recovery",
        paragraph: "High pain requires immediate attention, rest, and care team contact if it persists. Stop all physical activity, address hydration right away, and don't wait to reach out if it doesn't ease.",
      };
    }

    case "hydration": {
      if (statusLabel === "On track") return trendingWorse ? {
        headline: "Your hydration has been good but is declining — stay consistent",
        paragraph: "A drop in hydration can quickly raise your crisis risk, so don't let it slip. Get back to your usual routine today, and add a glass or two if it's warm or you've been active.",
      } : {
        headline: "Great hydration! You're protecting yourself against pain crises",
        paragraph: "Consistent hydration is one of the most powerful SCD management tools you have. Keep the routine going, add extra glasses on hot or active days, and check your urine colour each morning as a quick gauge.",
      };
      if (statusLabel === "Fair") return {
        headline: "Your hydration is below target — small improvements make a real difference",
        paragraph: "Fair hydration still carries elevated crisis risk, so closing the gap today matters. Add just one more glass, set hourly reminders, and keep a bottle somewhere you'll actually see it.",
      };
      return {
        headline: "Low hydration is a major pain crisis risk — prioritise drinking today",
        paragraph: "Dehydration causes red blood cells to sickle more easily, so act now. Have a full glass immediately, set a reminder every 30 minutes, and consider electrolytes if you're severely behind.",
      };
    }

    case "mood": {
      if (statusLabel === "Great" || statusLabel === "Good") return trendingWorse ? {
        headline: "Your mood has been positive but shows a downward trend — stay proactive",
        paragraph: "Positive mood is closely linked to better pain management, so it's worth protecting. Keep the habits that have been working, and set boundaries around anything that's been draining your energy.",
      } : {
        headline: "Your mood is strong — these habits are supporting your wellbeing",
        paragraph: "Positive mood is closely linked to better pain management and physical health. Keep your sleep, hydration, and connection habits consistent, and take a moment each day to note what's going well.",
      };
      if (statusLabel === "Okay") return {
        headline: "Your mood is moderate — small, consistent actions can shift it upward",
        paragraph: "Managing mood with SCD takes care, and you're not alone in this. A short walk outside, a conversation with someone you trust, or some gentle movement can all help lift things.",
      };
      return {
        headline: "Low mood is common with SCD — recognising it is the first step",
        paragraph: "Chronic pain and fatigue can significantly affect emotional wellbeing. Talk to someone you trust or your care team, and focus on one small positive step today rather than everything at once.",
      };
    }

    case "steps": {
      if (statusLabel === "Active") return trendingWorse ? {
        headline: "You've been very active but activity is declining — check in with your body",
        paragraph: "Consistent movement improves circulation and overall wellbeing, so a dip is worth noticing. Listen to what your body's telling you, and ease back in gently rather than pushing through fatigue.",
      } : {
        headline: "You're hitting great activity levels — here's how to keep it sustainable",
        paragraph: "Consistent movement improves circulation and overall wellbeing with SCD. Spread activity across the day rather than bursts, stretch afterwards, and hydrate before and after to offset fluid loss.",
      };
      if (statusLabel === "Moderate") return {
        headline: "You're moderately active — gradual increases can safely boost circulation",
        paragraph: "Building up slowly is the right approach to increasing activity with SCD. Add a short 10-minute walk, take the stairs when you can, and try starting your day with a little movement.",
      };
      return {
        headline: "Low activity may be affecting your circulation — gentle movement helps",
        paragraph: "Even light walking daily significantly supports blood flow with SCD. Start with just 5 minutes, let stretching or standing at home count too, and rest first if pain is high.",
      };
    }

    case "sleep": {
      if (statusLabel === "Great") return trendingWorse ? {
        headline: "Your sleep has been great but is starting to dip — protect this habit",
        paragraph: "Great sleep significantly reduces pain sensitivity and crisis risk, so it's worth protecting. Keep your bedtime consistent, even on weekends, and stick with the wind-down routine that's been working.",
      } : {
        headline: "Excellent sleep! Consistent rest is your body's most powerful recovery tool",
        paragraph: "Great sleep significantly reduces pain sensitivity and crisis risk. Protect your schedule, keep a wind-down routine before bed, and have a glass of water beforehand to avoid overnight dehydration.",
      };
      if (statusLabel === "Good") return {
        headline: "Good sleep — you're close to optimal, here's how to maximise quality",
        paragraph: "Small improvements in sleep quality can have outsized benefits for SCD. Lock in a consistent bedtime, limit screens beforehand, and keep your room a little cooler for deeper rest.",
      };
      if (statusLabel === "Fair") return {
        headline: "Your sleep is below recommended — this can amplify pain sensitivity",
        paragraph: "Even one extra hour of sleep can meaningfully improve your pain tolerance. Shift your bedtime 15 minutes earlier each night, cut caffeine after 2pm, and mention any nighttime pain to your care team.",
      };
      return {
        headline: "Insufficient sleep is increasing your pain sensitivity and crisis risk",
        paragraph: "Prioritising sleep tonight is one of the most impactful things you can do. It's okay to cancel non-essentials to rest, a short nap before 3pm can help, and persistent poor sleep is worth flagging to your doctor.",
      };
    }

    case "heartrate": {
      if (statusLabel === "Normal") return trendingWorse ? {
        headline: "Heart rate is normal but trending upward — keep monitoring",
        paragraph: "Maintaining this range supports good oxygen delivery throughout your body, so a rising trend is worth watching. Keep hydration and rest consistent, and mention it at your next check-in if it continues.",
      } : {
        headline: "Your heart rate is in a healthy range — keep supporting it",
        paragraph: "Maintaining this range supports good oxygen delivery throughout your body. Stay active with low-impact movement, keep hydration up, and use slow breathing to help manage stress.",
      };
      if (statusLabel === "Elevated") return {
        headline: "Your heart rate is elevated — this warrants rest and attention",
        paragraph: "An elevated heart rate alongside SCD may signal increased stress or a developing episode. Stop any activity and rest, use slow breathing to help bring it down, and contact your care team if pain accompanies it.",
      };
      return {
        headline: "Your heart rate is lower than typical — worth monitoring alongside other symptoms",
        paragraph: "While a lower rate can be normal, it's worth tracking in context with how you feel. Mention any dizziness or fatigue to your care team, and keep light daily activity going to support heart health.",
      };
    }

    default:
      return null;
  }
}

// ─── Insights Card ───────────────────────────────────────────────────────────

function InsightsCard({ insights }) {
  const t = useTheme();
  if (!insights) return null;

  // The edge function now returns { headline, paragraph } directly, but
  // AsyncStorage caches AI insights for 24h — this falls back to synthesising
  // a paragraph from the old { subtitle, tips } shape for anything cached
  // before the schema changed.
  const paragraph = insights.paragraph
    ?? [insights.subtitle, insights.tips?.[0]?.bullets?.[0]?.text]
      .filter(Boolean)
      .join(" ");

  return (
    <View>
      {/* Header row */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 }}>
        <Sparkles size={13} color={t.textSecondary} strokeWidth={2} />
        <Text style={{ fontFamily: fonts.semibold, fontSize: 11, color: t.textSecondary, letterSpacing: 1, textTransform: "uppercase" }}>
          Insights
        </Text>
      </View>

      {/* Headline */}
      <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: t.text, lineHeight: 26, marginBottom: 10 }}>
        {insights.headline}
      </Text>
      <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: t.textSecondary, lineHeight: 22 }}>
        {paragraph}
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MetricDetailScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const posthog = usePostHog();
  const { metric } = useLocalSearchParams();
  const { data: healthData = [] } = useHealthDataQuery();
  const { data: metricGoals } = useMetricGoalsQuery();

  const { healthKitData, healthConnectData, computedAlertState, onboardingData } = useAppStore();
  const platformHealthData = Platform.OS === "ios" ? healthKitData : healthConnectData;

  const meta = METRIC_META[metric] ?? METRIC_META.pain;
  const [range, setRange] = useState(14);

  useEffect(() => {
    posthog?.capture('metric_detail_viewed', { metric: metric ?? 'pain' });
  }, []);

  const goal = meta.hasGoal ? (metricGoals?.[metric] ?? null) : null;

  // Merge platform health data into healthData before computing chart data.
  const mergedHealthData = useMemo(() => {
    if (!platformHealthData || Object.keys(platformHealthData).length === 0) return healthData;
    const base = healthData.map((entry) => {
      const platformDay = platformHealthData[entry.date];
      return platformDay ? { ...entry, ...platformDay } : entry;
    });
    const coveredDates = new Set(healthData.map((e) => e.date));
    const platformOnlyEntries = Object.entries(platformHealthData)
      .filter(([date]) => !coveredDates.has(date))
      .map(([date, day]) => ({ date, ...day }));
    return [...base, ...platformOnlyEntries];
  }, [healthData, platformHealthData]);

  const data = useMemo(
    () => getLastNDays(mergedHealthData, meta.dataField, range),
    [mergedHealthData, meta.dataField, range]
  );

  const latestSleepSegments = useMemo(() => {
    if (metric !== "sleep") return null;
    const withSegments = mergedHealthData
      .filter((d) => Array.isArray(d.sleepSegments) && d.sleepSegments.length > 0)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    return withSegments[0]?.sleepSegments ?? null;
  }, [mergedHealthData, metric]);

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

  const { insight: aiInsight } = useMetricInsights(
    metric, currentValue, status?.label, trendDelta, meta.lowerIsBetter,
    { range, unit: meta.unit, goal, scdType: onboardingData?.scdType },
  );

  const startDate = data[0]?.date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endDate = data[data.length - 1]?.date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const IconComp = meta.icon;

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      {/* Header */}
      <View style={{
        paddingTop: insets.top + 8,
        paddingBottom: 12,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: t.background,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: t.surfaceElevated,
            alignItems: "center", justifyContent: "center",
          }}
        >
          <ChevronLeft size={20} color={t.text} strokeWidth={2} />
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 17, color: t.text }}>
            {meta.label}
          </Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: t.textSecondary }}>
            Last {range} days
          </Text>
        </View>

        {meta.hasGoal ? (
          <TouchableOpacity
            onPress={() => router.push(`/metric-goal?metric=${metric}`)}
            style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: t.surfaceElevated,
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Settings size={18} color={t.text} strokeWidth={2} />
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
          style={{ marginBottom: 28 }}
        >
          {/* Range toggle */}
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 28 }}>
            {[7, 14].map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => { posthog?.capture('metric_range_changed', { metric: metric ?? 'pain', range: r }); setRange(r); }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 7,
                  borderRadius: 20,
                  backgroundColor: range === r ? t.text : t.surfaceElevated,
                }}
              >
                <Text style={{
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                  color: range === r ? t.surface : t.textSecondary,
                }}>
                  {r}d
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Arc gauge with hero value */}
          <ArcGaugeChart
            value={currentValue ?? meta.rangeMin}
            min={meta.rangeMin}
            max={meta.rangeMax}
            color={meta.color}
            config={{
              totalNotches: 44,
              getTickColor: (ratio) => {
                const projectedValue = meta.rangeMin + ratio * (meta.rangeMax - meta.rangeMin);
                return getStatus(metric, projectedValue)?.color ?? meta.color;
              },
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 56, color: t.text, lineHeight: 62 }}>
                {currentDisplay}
              </Text>
              {currentValue != null && meta.unit && (
                <Text style={{ fontFamily: fonts.medium, fontSize: 19, color: t.textSecondary, marginBottom: 5 }}>
                  {meta.unit}
                </Text>
              )}
            </View>

            {status && (
              <View style={{
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: status.color,
                paddingHorizontal: 14,
                paddingVertical: 5,
                marginTop: 12,
              }}>
                <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: status.color }}>
                  {status.label}
                </Text>
              </View>
            )}
          </ArcGaugeChart>
        </MotiView>

        {/* ── Insights Section ─────────────────────────────── */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 80, type: "timing", duration: 280 }}
          style={{ marginBottom: 28 }}
        >
          <InsightsCard
            insights={aiInsight ?? getInsights(metric, currentValue, status?.label, trendDelta, meta.lowerIsBetter)}
          />
        </MotiView>

        <View style={{ height: 1, backgroundColor: t.divider, marginBottom: 28 }} />

        {/* ── Trend Section ──────────────────────────────── */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 160, type: "timing", duration: 280 }}
          style={{ marginBottom: 28 }}
        >
          {/* Section label row */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <TrendingUp size={13} color={t.textSecondary} strokeWidth={2} />
              <Text style={{ fontFamily: fonts.semibold, fontSize: 11, color: t.textSecondary, letterSpacing: 1, textTransform: "uppercase" }}>
                Trend
              </Text>
            </View>
            <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: t.textSecondary }}>
              {startDate} – {endDate}
            </Text>
          </View>

          {/* Trend delta */}
          {trendDelta !== null && (
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4, marginBottom: 16 }}>
              <Text style={{
                fontFamily: fonts.bold,
                fontSize: 23,
                color: trendDelta > 0
                  ? (meta.lowerIsBetter ? "#DC2626" : "#059669")
                  : (meta.lowerIsBetter ? "#059669" : "#DC2626"),
              }}>
                {trendDelta > 0 ? "▲" : "▼"} {Math.abs(trendDelta).toFixed(1)}
              </Text>
              {meta.unit && (
                <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: t.textSecondary }}>
                  {meta.unit}
                </Text>
              )}
            </View>
          )}

          {/* Chart */}
          <MetricChart
            metric={metric}
            data={data}
            range={range}
            goal={goal}
            color={meta.color}
            unit={meta.unit}
            getStatus={(value) => getStatus(metric, value)}
            sleepSegments={latestSleepSegments}
          />

          {goal && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 }}>
              <View style={{ width: 18, height: 2, backgroundColor: meta.color, opacity: 0.6 }} />
              <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: t.textSecondary }}>
                Daily goal ({goal} {meta.unit ?? ""})
              </Text>
            </View>
          )}
        </MotiView>

        <View style={{ height: 1, backgroundColor: t.divider, marginBottom: 28 }} />

        {/* ── About Section ──────────────────────────────── */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 240, type: "timing", duration: 280 }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <AlignLeft size={13} color={t.textSecondary} strokeWidth={2} />
            <Text style={{ fontFamily: fonts.semibold, fontSize: 11, color: t.textSecondary, letterSpacing: 1, textTransform: "uppercase" }}>
              About
            </Text>
          </View>
          <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: t.text, lineHeight: 26, marginBottom: 10 }}>
            {meta.aboutTitle}
          </Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: t.textSecondary, lineHeight: 22 }}>
            {meta.about}
          </Text>
        </MotiView>
      </ScrollView>
    </View>
  );
}
