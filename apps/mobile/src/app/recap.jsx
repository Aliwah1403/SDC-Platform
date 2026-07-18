import { useMemo, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { ChevronLeft, Share2 } from "lucide-react-native";
import { MotiView } from "moti";
import { fonts } from "@/utils/fonts";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/utils/auth/store";
import { useHealthDataQuery, useTriggersQuery } from "@/hooks/queries/useHealthDataQuery";
import { useMetricGoalsQuery } from "@/hooks/queries/useMetricGoalsQuery";
import { useHydrationStore } from "@/store/hydrationStore";
import { hydrationValueInUnit, HYDRATION_UNIT_LABEL } from "@/utils/hydrationUnits";
import { DEFAULT_SUGGESTED_ML } from "@/utils/hydrationGoal";
import { MetricChart } from "@/components/Charts/MetricChart";
import { PressableScale } from "@/components/PressableScale";
import { RecapCard, CARD_GAP, MONTHLY_CARD_WIDTH, MONTHLY_GRADIENT } from "@/components/HomeScreen/recapShared";
import {
  parseDateStr,
  toDateStr,
  startOfWeekMonday,
  weekRange,
  prevWeekRange,
  monthRange,
  prevMonthRange,
  formatWeekLabel,
  formatMonthLabel,
  buildDayRange,
  countLogged,
  countGoodDays,
  avgPain,
  countHydrationGoalDays,
  crisisFreeLongestStretch,
  wordedCountDelta,
  wordedPainDelta,
  pickWeeklySignal,
  computePatterns,
  buildMonthlyRecaps,
} from "@/utils/recapEngine";
import { generatePreviewHealthData, PREVIEW_TRIGGER_COUNTS } from "@/utils/previewHealthData";

// DEV-ONLY: mirrors the same flag in app/health-insights.jsx — swaps real
// Supabase data for a rich generated sample so the weekly/monthly recap
// screens can be reviewed visually. Flip to false (or delete this + the
// previewHealthData.js import) once done; keep both files in sync.
const PREVIEW_MODE = true;
const PREVIEW_DATA = PREVIEW_MODE ? generatePreviewHealthData() : null;

const EDUCATION_COPY = {
  pain: "Managing pain during a crisis →",
  hydration: "Why hydration matters in SCD →",
};

function StatBlock({ label, value, delta }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: t.textSecondary, marginBottom: 4 }}>
        {label}
      </Text>
      <Text style={{ fontFamily: fonts.bold, fontSize: 26, color: t.text }}>
        {value}
      </Text>
      {delta && (
        <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: t.textSecondary, marginTop: 2 }}>
          {delta}
        </Text>
      )}
    </View>
  );
}

function EducationLink({ topic, onPress }) {
  const t = useTheme();
  if (!topic || !EDUCATION_COPY[topic]) return null;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ marginTop: 14 }}>
      <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: t.accent }}>
        {EDUCATION_COPY[topic]}
      </Text>
    </TouchableOpacity>
  );
}

function ShareButton({ label, onPress }) {
  const t = useTheme();
  return (
    <PressableScale onPress={onPress}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          backgroundColor: t.accent,
          borderRadius: 14,
          paddingVertical: 15,
          marginTop: 32,
        }}
      >
        <Share2 size={16} color="#fff" strokeWidth={2} />
        <Text style={{ fontFamily: fonts.semibold, fontSize: 15, color: "#fff" }}>{label}</Text>
      </View>
    </PressableScale>
  );
}

function SectionLabel({ children }) {
  const t = useTheme();
  return (
    <Text
      style={{
        fontFamily: fonts.semibold,
        fontSize: 11,
        color: t.textSecondary,
        letterSpacing: 1,
        textTransform: "uppercase",
        marginBottom: 12,
      }}
    >
      {children}
    </Text>
  );
}

// ─── Weekly recap ───────────────────────────────────────────────────────────

function WeeklyRecap({ healthData, goalMl, firstName, onEducationPress }) {
  const t = useTheme();
  const { start: startParam } = useLocalSearchParams();

  const monday = useMemo(() => {
    const parsed = startParam ? parseDateStr(startParam) : null;
    return parsed && !Number.isNaN(parsed.getTime()) ? parsed : (() => {
      const today = new Date();
      const daysSinceMonday = (today.getDay() + 6) % 7;
      const d = new Date(today);
      d.setDate(d.getDate() - daysSinceMonday);
      return d;
    })();
  }, [startParam]);

  const { start, end } = weekRange(monday);
  const { start: prevStart, end: prevEnd } = prevWeekRange(monday);
  const days = buildDayRange(healthData, start, end);
  const prevDays = buildDayRange(healthData, prevStart, prevEnd);

  const daysLogged = countLogged(days);
  const goodDays = countGoodDays(days);
  const hydrationGoalDays = countHydrationGoalDays(days, goalMl);
  const avg = avgPain(days);
  const hasPrevWeek = countLogged(prevDays) >= 3;
  const prevAvg = hasPrevWeek ? avgPain(prevDays) : null;

  const { highlight, flag, flagEducation, quiet } = pickWeeklySignal({ days, prevDays, goalMl, firstName });

  return (
    <>
      <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: t.textSecondary, marginBottom: 28 }}>
        {daysLogged} of 7 days logged
      </Text>

      <View style={{ flexDirection: "row", marginBottom: 28 }}>
        <StatBlock label="Good days" value={`${goodDays}/7`} />
        <StatBlock
          label="Avg pain"
          value={avg != null ? avg.toFixed(1) : "—"}
          delta={hasPrevWeek ? wordedPainDelta(avg, prevAvg, "week") : null}
        />
        <StatBlock label="Hydration goal" value={`${hydrationGoalDays}/7`} />
      </View>

      <View style={{ height: 1, backgroundColor: t.divider, marginBottom: 24 }} />

      {quiet ? (
        <Text style={{ fontFamily: fonts.regular, fontSize: 15, color: t.textSecondary, lineHeight: 22 }}>
          A steady week — nothing unusual to flag.
        </Text>
      ) : (
        <View style={{ gap: 10 }}>
          {highlight && (
            <Text style={{ fontFamily: fonts.medium, fontSize: 15, color: t.text, lineHeight: 22 }}>
              {highlight}
            </Text>
          )}
          {flag && (
            <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: t.textSecondary, lineHeight: 21 }}>
              {flag}
            </Text>
          )}
        </View>
      )}

      <EducationLink topic={flagEducation} onPress={onEducationPress} />
    </>
  );
}

// ─── Monthly recap ──────────────────────────────────────────────────────────

function MonthlyRecap({ healthData, goalMl, displayUnit, posthog, onEducationPress }) {
  const t = useTheme();
  const router = useRouter();
  const { start: startParam } = useLocalSearchParams();

  const firstOfMonth = useMemo(() => {
    const parsed = startParam ? parseDateStr(startParam) : null;
    return parsed && !Number.isNaN(parsed.getTime())
      ? new Date(parsed.getFullYear(), parsed.getMonth(), 1)
      : (() => {
          const today = new Date();
          return new Date(today.getFullYear(), today.getMonth(), 1);
        })();
  }, [startParam]);

  const { start, end } = monthRange(firstOfMonth);
  const { start: prevStart, end: prevEnd } = prevMonthRange(firstOfMonth);
  const days = buildDayRange(healthData, start, end);
  const prevDays = buildDayRange(healthData, prevStart, prevEnd);

  const daysLogged = countLogged(days);
  const goodDays = countGoodDays(days);
  const hydrationGoalDays = countHydrationGoalDays(days, goalMl);
  const longestStretch = crisisFreeLongestStretch(days);

  const hasPrevMonth = countLogged(prevDays) >= 3;
  const goodDaysDelta = hasPrevMonth ? wordedCountDelta(goodDays, countGoodDays(prevDays), "good day", "good days", "month") : null;
  const hydDaysDelta = hasPrevMonth
    ? wordedCountDelta(hydrationGoalDays, countHydrationGoalDays(prevDays, goalMl), "goal-day", "goal-days", "month")
    : null;

  const { data: realTriggerCounts } = useTriggersQuery(toDateStr(start), toDateStr(end));
  const triggerCounts = PREVIEW_MODE ? PREVIEW_TRIGGER_COUNTS : realTriggerCounts;
  const patterns = useMemo(
    () => computePatterns(days, { goalMl, triggerCounts }),
    [days, goalMl, triggerCounts],
  );

  useEffect(() => {
    patterns.forEach((p) => posthog?.capture("insight_pattern_shown", { pattern_id: p.id }));
  }, [patterns]);

  const painData = useMemo(() => days.map((d) => ({ date: d.date, value: d.painLevel })), [days]);
  const hydrationData = useMemo(
    () => days.map((d) => ({ date: d.date, value: hydrationValueInUnit(d.hydration, displayUnit) })),
    [days, displayUnit],
  );
  const moodData = useMemo(() => days.map((d) => ({ date: d.date, value: d.mood })), [days]);
  const hydrationGoalInUnit = Math.max(0.1, hydrationValueInUnit(goalMl, displayUnit));
  const unitLabel = HYDRATION_UNIT_LABEL[displayUnit] ?? "glasses";

  const firstPatternWithEducation = patterns.find((p) => p.educationTopic);

  const otherMonths = useMemo(
    () => buildMonthlyRecaps(healthData).filter((m) => toDateStr(m.start) !== toDateStr(start)),
    [healthData, start],
  );

  return (
    <>
      <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: t.textSecondary, marginBottom: 28 }}>
        {daysLogged} of {days.length} days logged
      </Text>

      <SectionLabel>Trends</SectionLabel>
      <View style={{ marginBottom: 8 }}>
        <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: t.text, marginBottom: 8 }}>Pain</Text>
        <MetricChart metric="pain" data={painData} range={painData.length} color="#DC2626" scrollable />
      </View>
      <View style={{ marginTop: 20, marginBottom: 8 }}>
        <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: t.text, marginBottom: 8 }}>Hydration</Text>
        <MetricChart
          metric="hydration"
          data={hydrationData}
          range={hydrationData.length}
          goal={hydrationGoalInUnit}
          unit={unitLabel}
          scrollable
        />
      </View>
      <View style={{ marginTop: 20, marginBottom: 28 }}>
        <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: t.text, marginBottom: 8 }}>Mood</Text>
        <MetricChart metric="mood" data={moodData} range={moodData.length} color="#7C3AED" scrollable />
      </View>

      <View style={{ height: 1, backgroundColor: t.divider, marginBottom: 24 }} />

      <SectionLabel>This month</SectionLabel>
      <View style={{ gap: 14, marginBottom: 28 }}>
        <View>
          <Text style={{ fontFamily: fonts.medium, fontSize: 15, color: t.text }}>
            Hit your hydration goal {hydrationGoalDays} of {days.length} days
          </Text>
          {hydDaysDelta && (
            <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.textSecondary, marginTop: 2 }}>
              {hydDaysDelta}
            </Text>
          )}
        </View>
        <View>
          <Text style={{ fontFamily: fonts.medium, fontSize: 15, color: t.text }}>
            {goodDays} good pain days out of {days.length}
          </Text>
          {goodDaysDelta && (
            <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.textSecondary, marginTop: 2 }}>
              {goodDaysDelta}
            </Text>
          )}
        </View>
        <View>
          <Text style={{ fontFamily: fonts.medium, fontSize: 15, color: t.text }}>
            Longest crisis-free stretch: {longestStretch} {longestStretch === 1 ? "day" : "days"}
          </Text>
        </View>
      </View>

      {patterns.length > 0 && (
        <>
          <View style={{ height: 1, backgroundColor: t.divider, marginBottom: 24 }} />
          <SectionLabel>Patterns spotted this month</SectionLabel>
          <View style={{ gap: 14, marginBottom: 4 }}>
            {patterns.map((p) => (
              <View key={p.id}>
                <Text style={{ fontFamily: fonts.semibold, fontSize: 15, color: t.text, marginBottom: 2, lineHeight: 20 }}>
                  {p.headline}
                </Text>
                <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.textSecondary, lineHeight: 19 }}>
                  {p.body}
                </Text>
              </View>
            ))}
          </View>
          <EducationLink topic={firstPatternWithEducation?.educationTopic} onPress={onEducationPress} />
        </>
      )}

      {otherMonths.length > 0 && (
        <>
          <View style={{ height: 1, backgroundColor: t.divider, marginTop: patterns.length > 0 ? 24 : 0, marginBottom: 24 }} />
          <View style={{ marginHorizontal: -20, marginBottom: 4 }}>
            <View style={{ paddingHorizontal: 20 }}>
              <SectionLabel>Other months</SectionLabel>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={MONTHLY_CARD_WIDTH + CARD_GAP}
              snapToAlignment="start"
              contentContainerStyle={{ paddingHorizontal: 20, gap: CARD_GAP }}
            >
              {otherMonths.map((m) => (
                <RecapCard
                  key={m.key}
                  compact
                  width={MONTHLY_CARD_WIDTH}
                  kicker="MONTHLY RECAP"
                  title={m.monthName}
                  titleSize={22}
                  gradient={MONTHLY_GRADIENT}
                  onPress={() => {
                    posthog?.capture("recap_other_month_tapped", { target_month: toDateStr(m.start) });
                    router.push(`/recap?period=month&start=${toDateStr(m.start)}&from=recap`);
                  }}
                />
              ))}
            </ScrollView>
          </View>
        </>
      )}
    </>
  );
}

// ─── Screen ─────────────────────────────────────────────────────────────────

export default function RecapScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const posthog = usePostHog();
  const { period, from, start } = useLocalSearchParams();
  const { auth } = useAuthStore();
  const { data: realHealthData = [] } = useHealthDataQuery();
  const healthData = PREVIEW_MODE ? PREVIEW_DATA : realHealthData;
  const { data: metricGoals } = useMetricGoalsQuery();
  const { displayUnit } = useHydrationStore();
  const goalMl = metricGoals?.hydration ?? DEFAULT_SUGGESTED_ML;
  const firstName = auth?.user?.user_metadata?.full_name?.split(" ")[0] || "there";

  const isMonth = period === "month";

  useEffect(() => {
    posthog?.capture("recap_viewed", {
      period: isMonth ? "month" : "week",
      start: start ?? null,
      days_logged: healthData.length,
      from: from ?? "unknown",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToEducation = () => router.push("/(tabs)/learn");
  const goToShare = () => {
    posthog?.capture("share_recap_tapped", { period: isMonth ? "month" : "week", from: "recap_header" });
    router.push("/share-summary");
  };

  // Big title shown in the hero and (shortened to just this) in the compact
  // sticky nav once scrolled — same date math the recap bodies use below,
  // recomputed here since the hero lives at the screen level, above them.
  const bigTitle = useMemo(() => {
    const parsed = start ? parseDateStr(start) : null;
    const referenceDate = parsed && !Number.isNaN(parsed.getTime()) ? parsed : new Date();
    if (isMonth) {
      const firstOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
      return formatMonthLabel(firstOfMonth);
    }
    const { start: wStart, end: wEnd } = weekRange(startOfWeekMonday(referenceDate));
    return formatWeekLabel(wStart, wEnd);
  }, [isMonth, start]);

  const [heroHeight, setHeroHeight] = useState(insets.top + 150);
  const NAV_HEIGHT = insets.top + 56;
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const heroAnimStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, heroHeight - NAV_HEIGHT],
          [0, -(heroHeight - NAV_HEIGHT)],
          "clamp",
        ),
      },
    ],
  }));

  const compactNavStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [heroHeight * 0.45, heroHeight * 0.75],
      [0, 1],
      "clamp",
    ),
  }));

  const backBtnStyle = {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: t.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      {/* ── Hero (absolutely positioned, slides up on scroll) ── */}
      <Animated.View
        style={[
          { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: t.background },
          heroAnimStyle,
        ]}
        onLayout={(e) => setHeroHeight(e.nativeEvent.layout.height)}
      >
        <View style={{ paddingTop: insets.top + 8, paddingBottom: 20, paddingHorizontal: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 20 }}>
            <TouchableOpacity onPress={() => router.back()} style={backBtnStyle}>
              <ChevronLeft size={20} color={t.text} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity onPress={goToShare} style={backBtnStyle}>
              <Share2 size={18} color={t.text} strokeWidth={2} />
            </TouchableOpacity>
          </View>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.textSecondary, marginBottom: 4 }}>
            {isMonth ? "Your monthly recap" : "Your weekly recap"}
          </Text>
          <Text style={{ fontFamily: fonts.bold, fontSize: 30, color: t.text }}>
            {bigTitle}
          </Text>
        </View>
      </Animated.View>

      {/* ── Compact sticky nav (fades in on scroll) ── */}
      <Animated.View
        pointerEvents="box-none"
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 20,
            height: NAV_HEIGHT,
            backgroundColor: t.background,
            borderBottomWidth: 1,
            borderBottomColor: t.divider,
            flexDirection: "row",
            alignItems: "flex-end",
            paddingHorizontal: 16,
            paddingBottom: 10,
          },
          compactNavStyle,
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={backBtnStyle}>
          <ChevronLeft size={20} color={t.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text
          numberOfLines={1}
          style={{ flex: 1, textAlign: "center", fontFamily: fonts.semibold, fontSize: 16, color: t.text, marginHorizontal: 8 }}
        >
          {bigTitle}
        </Text>
        <TouchableOpacity onPress={goToShare} style={backBtnStyle}>
          <Share2 size={18} color={t.text} strokeWidth={2} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: heroHeight, paddingBottom: insets.bottom + 32 }}
      >
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 240 }}
        >
          {isMonth ? (
            <MonthlyRecap
              healthData={healthData}
              goalMl={goalMl}
              displayUnit={displayUnit}
              posthog={posthog}
              onEducationPress={goToEducation}
            />
          ) : (
            <WeeklyRecap
              healthData={healthData}
              goalMl={goalMl}
              firstName={firstName}
              onEducationPress={goToEducation}
            />
          )}

          <ShareButton
            label={isMonth ? "Share this month" : "Share this week"}
            onPress={() => router.push("/share-summary")}
          />
        </MotiView>
      </Animated.ScrollView>
    </View>
  );
}
