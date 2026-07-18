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
import { ChevronLeft, Share2, ArrowUp, ArrowDown } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { fonts } from "@/utils/fonts";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/utils/auth/store";
import {
  useHealthDataQuery,
  useTriggersQuery,
} from "@/hooks/queries/useHealthDataQuery";
import { useMetricGoalsQuery } from "@/hooks/queries/useMetricGoalsQuery";
import { useProfileQuery } from "@/hooks/queries/useProfileQuery";
import { useHydrationStore } from "@/store/hydrationStore";
import {
  hydrationValueInUnit,
  HYDRATION_UNIT_LABEL,
} from "@/utils/hydrationUnits";
import { DEFAULT_SUGGESTED_ML } from "@/utils/hydrationGoal";
import { MetricChart } from "@/components/Charts/MetricChart";
import { PressableScale } from "@/components/PressableScale";
import { PatternRow, EDUCATION_COPY } from "@/components/Insights/patternRows";
import {
  RecapCard,
  CARD_GAP,
  MONTHLY_CARD_WIDTH,
  MONTHLY_GRADIENT,
} from "@/components/HomeScreen/recapShared";
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
  countGoodMoodDays,
  avgPain,
  countHydrationGoalDays,
  crisisFreeLongestStretch,
  wordedCountDelta,
  wordedPainDelta,
  pickWeeklySignal,
  computePatterns,
  buildMonthlyRecaps,
} from "@/utils/recapEngine";
import {
  generatePreviewHealthData,
  PREVIEW_TRIGGER_COUNTS,
} from "@/utils/previewHealthData";

// DEV-ONLY: mirrors the same flag in app/health-insights.jsx — swaps real
// Supabase data for a rich generated sample so the weekly/monthly recap
// screens can be reviewed visually. Flip to false (or delete this + the
// previewHealthData.js import) once done; keep both files in sync.
const PREVIEW_MODE = true;
const PREVIEW_DATA = PREVIEW_MODE ? generatePreviewHealthData() : null;

// Big-number stat — the hero of each section. Nested Text so the unit
// baseline-aligns against the number instead of floating above it.
function BigStat({ value, suffix }) {
  const t = useTheme();
  return (
    <Text style={{ fontFamily: fonts.bold, fontSize: 52, color: t.text }}>
      {value}
      {suffix ? (
        <Text style={{ fontFamily: fonts.semibold, fontSize: 20 }}>
          {" "}
          {suffix}
        </Text>
      ) : null}
    </Text>
  );
}

// Warm, calm lead-in sentence above a big number. Never jokey — this is a
// health app for people managing a chronic illness.
function LeadIn({ children }) {
  const t = useTheme();
  return (
    <Text
      style={{
        fontFamily: fonts.regular,
        fontSize: 15,
        color: t.textSecondary,
        marginBottom: 8,
      }}
    >
      {children}
    </Text>
  );
}

// Full-bleed tinted section block (Gentler Streak style). `marginHorizontal:
// -20` cancels the scroll view's own 20px padding so the background spans
// edge to edge; callers re-add paddingHorizontal:20 around text content but
// deliberately leave charts unpadded so charts bleed full width too.
function TintedBlock({ color, children }) {
  return (
    <View
      style={{
        marginHorizontal: -20,
        paddingVertical: 28,
        backgroundColor: color,
      }}
    >
      {children}
    </View>
  );
}

// More-is-better count metrics (good days, hydration goal-days, good mood
// days): the chip's arrow always matches the raw sign of the change, and
// since more is always better for these, color follows the same sign.
function countChip(current, previous) {
  if (previous == null || current === previous) return null;
  const up = current > previous;
  return { up, good: up };
}

// Pain average: lower is better, so a decrease reads as "good" (green) even
// though the arrow still literally points down. Mirrors wordedPainDelta's
// own rounding/threshold so the chip never contradicts the worded text.
function painChip(curAvg, prevAvg) {
  if (curAvg == null || prevAvg == null) return null;
  const diff = Math.round((curAvg - prevAvg) * 10) / 10;
  if (Math.abs(diff) < 0.05) return null;
  return { up: diff > 0, good: diff < 0 };
}

// Delta row under a big number: worded comparison text plus an optional
// small chip (~24px circle, tinted ~15% alpha) encoding good vs bad. Renders
// just the text (or nothing) when there's no chip to show.
function DeltaRow({ text, chip }) {
  const t = useTheme();
  if (!text) return null;
  const color = chip ? (chip.good ? "#10B981" : "#EF4444") : null;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
      {chip && (
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: `${color}26`,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 8,
          }}
        >
          {chip.up ? (
            <ArrowUp size={13} color={color} strokeWidth={2.5} />
          ) : (
            <ArrowDown size={13} color={color} strokeWidth={2.5} />
          )}
        </View>
      )}
      <Text
        style={{
          fontFamily: fonts.regular,
          fontSize: 13,
          color: t.textSecondary,
        }}
      >
        {text}
      </Text>
    </View>
  );
}

function EducationLink({ topic, onPress }) {
  const t = useTheme();
  if (!topic || !EDUCATION_COPY[topic]) return null;
  return (
    <TouchableOpacity
      onPress={() => onPress(topic)}
      activeOpacity={0.7}
      style={{ marginTop: 14 }}
    >
      <Text
        style={{ fontFamily: fonts.semibold, fontSize: 14, color: t.accent }}
      >
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
        <Text
          style={{ fontFamily: fonts.semibold, fontSize: 15, color: "#fff" }}
        >
          {label}
        </Text>
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
    return parsed && !Number.isNaN(parsed.getTime())
      ? parsed
      : (() => {
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

  const { highlight, flag, flagEducation, quiet } = pickWeeklySignal({
    days,
    prevDays,
    goalMl,
    firstName,
  });

  const goodDaysDelta = hasPrevWeek
    ? wordedCountDelta(
        goodDays,
        countGoodDays(prevDays),
        "good day",
        "good days",
        "week",
      )
    : null;
  const goodDaysChip = hasPrevWeek
    ? countChip(goodDays, countGoodDays(prevDays))
    : null;
  const avgPainDelta = hasPrevWeek
    ? wordedPainDelta(avg, prevAvg, "week")
    : null;
  const avgPainChip = hasPrevWeek ? painChip(avg, prevAvg) : null;

  return (
    <>
      {/* ── Good days (untinted) ── */}
      <View style={{ marginBottom: 28 }}>
        <LeadIn>Pain stayed manageable on</LeadIn>
        <BigStat value={goodDays} suffix="days" />
        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: 14,
            color: t.textSecondary,
            marginTop: 6,
          }}
        >
          of 7 this week
        </Text>
        <DeltaRow text={goodDaysDelta} chip={goodDaysChip} />
      </View>

      {/* ── Avg pain (tinted) ── */}
      <TintedBlock color="#DC262608">
        <View style={{ paddingHorizontal: 20 }}>
          <LeadIn>Your average pain level</LeadIn>
          <BigStat value={avg != null ? avg.toFixed(1) : "—"} />
          <DeltaRow text={avgPainDelta} chip={avgPainChip} />
        </View>
      </TintedBlock>

      {/* ── Hydration (untinted) ── */}
      <View style={{ marginTop: 28, marginBottom: 28 }}>
        <LeadIn>You hit your hydration goal on</LeadIn>
        <BigStat value={hydrationGoalDays} suffix="days" />
      </View>

      {/* ── This week (tinted, brand burgundy) — unchanged narrative content ── */}
      <TintedBlock color="#A9334D08">
        <View style={{ paddingHorizontal: 20 }}>
          <SectionLabel>This week</SectionLabel>
          {quiet ? (
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 15,
                color: t.textSecondary,
                lineHeight: 22,
              }}
            >
              A steady week — nothing unusual to flag.
            </Text>
          ) : (
            <View style={{ gap: 10 }}>
              {highlight && (
                <Text
                  style={{
                    fontFamily: fonts.medium,
                    fontSize: 15,
                    color: t.text,
                    lineHeight: 22,
                  }}
                >
                  {highlight}
                </Text>
              )}
              {flag && (
                <Text
                  style={{
                    fontFamily: fonts.regular,
                    fontSize: 14,
                    color: t.textSecondary,
                    lineHeight: 21,
                  }}
                >
                  {flag}
                </Text>
              )}
            </View>
          )}

          <EducationLink topic={flagEducation} onPress={onEducationPress} />
        </View>
      </TintedBlock>
    </>
  );
}

// ─── Monthly recap ──────────────────────────────────────────────────────────

function MonthlyRecap({
  healthData,
  goalMl,
  displayUnit,
  posthog,
  onEducationPress,
}) {
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
  const goodMoodDays = countGoodMoodDays(days);
  const longestStretch = crisisFreeLongestStretch(days);

  const hasPrevMonth = countLogged(prevDays) >= 3;
  const goodDaysDelta = hasPrevMonth
    ? wordedCountDelta(
        goodDays,
        countGoodDays(prevDays),
        "good day",
        "good days",
        "month",
      )
    : null;
  const goodDaysChip = hasPrevMonth
    ? countChip(goodDays, countGoodDays(prevDays))
    : null;
  const hydDaysDelta = hasPrevMonth
    ? wordedCountDelta(
        hydrationGoalDays,
        countHydrationGoalDays(prevDays, goalMl),
        "goal-day",
        "goal-days",
        "month",
      )
    : null;
  const hydDaysChip = hasPrevMonth
    ? countChip(hydrationGoalDays, countHydrationGoalDays(prevDays, goalMl))
    : null;
  const moodDaysDelta = hasPrevMonth
    ? wordedCountDelta(
        goodMoodDays,
        countGoodMoodDays(prevDays),
        "good mood day",
        "good mood days",
        "month",
      )
    : null;
  const moodDaysChip = hasPrevMonth
    ? countChip(goodMoodDays, countGoodMoodDays(prevDays))
    : null;

  const { data: realTriggerCounts } = useTriggersQuery(
    toDateStr(start),
    toDateStr(end),
  );
  const triggerCounts = PREVIEW_MODE
    ? PREVIEW_TRIGGER_COUNTS
    : realTriggerCounts;
  const patterns = useMemo(
    () => computePatterns(days, { goalMl, triggerCounts }),
    [days, goalMl, triggerCounts],
  );

  useEffect(() => {
    patterns.forEach((p) =>
      posthog?.capture("insight_pattern_shown", { pattern_id: p.id }),
    );
  }, [patterns]);

  const painData = useMemo(
    () => days.map((d) => ({ date: d.date, value: d.painLevel })),
    [days],
  );
  const hydrationData = useMemo(
    () =>
      days.map((d) => ({
        date: d.date,
        value: hydrationValueInUnit(d.hydration, displayUnit),
      })),
    [days, displayUnit],
  );
  const moodData = useMemo(
    () => days.map((d) => ({ date: d.date, value: d.mood })),
    [days],
  );
  const hydrationGoalInUnit = Math.max(
    0.1,
    hydrationValueInUnit(goalMl, displayUnit),
  );
  const unitLabel = HYDRATION_UNIT_LABEL[displayUnit] ?? "glasses";

  const otherMonths = useMemo(
    () =>
      buildMonthlyRecaps(healthData).filter(
        (m) => toDateStr(m.start) !== toDateStr(start),
      ),
    [healthData, start],
  );

  return (
    <>
      {/* ── Logging (untinted) ── */}
      <View style={{ marginBottom: 28 }}>
        <LeadIn>You showed up on</LeadIn>
        <BigStat value={daysLogged} suffix="days" />
        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: 14,
            color: t.textSecondary,
            marginTop: 6,
          }}
        >
          out of {days.length} this month
        </Text>
      </View>

      {/* ── Pain (tinted) ── */}
      <TintedBlock color="#DC262608">
        <View style={{ paddingHorizontal: 20 }}>
          <SectionLabel>Pain</SectionLabel>
          <LeadIn>Pain stayed low on</LeadIn>
          <BigStat value={goodDays} suffix="days" />
          <DeltaRow text={goodDaysDelta} chip={goodDaysChip} />
        </View>
        <View style={{ marginTop: 24 }}>
          <MetricChart
            metric="pain"
            data={painData}
            range={painData.length}
            color="#DC2626"
            scrollable
          />
        </View>
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <Text
            style={{ fontFamily: fonts.medium, fontSize: 15, color: t.text }}
          >
            Longest crisis-free stretch: {longestStretch}{" "}
            {longestStretch === 1 ? "day" : "days"}
          </Text>
        </View>
      </TintedBlock>

      {/* ── Hydration (untinted) ── */}
      <View style={{ marginTop: 28, marginBottom: 28 }}>
        <SectionLabel>Hydration</SectionLabel>
        <LeadIn>You hit your hydration goal on</LeadIn>
        <BigStat value={hydrationGoalDays} suffix="days" />
        <DeltaRow text={hydDaysDelta} chip={hydDaysChip} />
        <View style={{ marginHorizontal: -20, marginTop: 20 }}>
          <MetricChart
            metric="hydration"
            data={hydrationData}
            range={hydrationData.length}
            goal={hydrationGoalInUnit}
            unit={unitLabel}
            scrollable
          />
        </View>
      </View>

      {/* ── Mood (tinted) ── */}
      <TintedBlock color="#7C3AED08">
        <View style={{ paddingHorizontal: 20 }}>
          <SectionLabel>Mood</SectionLabel>
          <LeadIn>Days your mood was good</LeadIn>
          <BigStat value={goodMoodDays} suffix="days" />
          <DeltaRow text={moodDaysDelta} chip={moodDaysChip} />
        </View>
        <View style={{ marginTop: 24 }}>
          <MetricChart
            metric="mood"
            data={moodData}
            range={moodData.length}
            color="#7C3AED"
            scrollable
          />
        </View>
      </TintedBlock>

      {patterns.length > 0 && (
        <View style={{ marginTop: 28 }}>
          <SectionLabel>Patterns spotted this month</SectionLabel>
          <View style={{ marginBottom: 4 }}>
            {patterns.map((p, i) => (
              <PatternRow
                key={p.id}
                pattern={p}
                isLast={i === patterns.length - 1}
                onEducationPress={onEducationPress}
              />
            ))}
          </View>
        </View>
      )}

      {otherMonths.length > 0 && (
        <>
          {/* Divider only when Patterns (untinted) is the section directly
              above — when Patterns is absent, Mood's tint is what separates
              this carousel from the section before it, so no hairline. */}
          {patterns.length > 0 && (
            <View
              style={{
                height: 1,
                backgroundColor: t.divider,
                marginTop: 24,
                marginBottom: 24,
              }}
            />
          )}
          <View
            style={{
              marginHorizontal: -20,
              marginTop: patterns.length > 0 ? 0 : 28,
              marginBottom: 4,
            }}
          >
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
                    posthog?.capture("recap_other_month_tapped", {
                      target_month: toDateStr(m.start),
                    });
                    router.push(
                      `/recap?period=month&start=${toDateStr(m.start)}&from=recap`,
                    );
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
  const { data: profile } = useProfileQuery();
  const { displayUnit } = useHydrationStore();
  const goalMl = metricGoals?.hydration ?? DEFAULT_SUGGESTED_ML;
  // Nickname set during onboarding wins (same rule as the home greeting);
  // auth full name is only the fallback for profiles created before the
  // nickname step existed.
  const firstName =
    profile?.nickname ||
    auth?.user?.user_metadata?.full_name?.split(" ")[0] ||
    "there";

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

  const goToEducation = (topic) =>
    router.push(
      `/education-article?topic=${topic}&from=${isMonth ? "recap_month" : "recap_week"}`,
    );
  const goToShare = () => {
    posthog?.capture("share_recap_tapped", {
      period: isMonth ? "month" : "week",
      from: "recap_header",
    });
    router.push("/share-summary");
  };

  // Big title shown in the hero and (shortened to just this) in the compact
  // sticky nav once scrolled — same date math the recap bodies use below,
  // recomputed here since the hero lives at the screen level, above them.
  const bigTitle = useMemo(() => {
    const parsed = start ? parseDateStr(start) : null;
    const referenceDate =
      parsed && !Number.isNaN(parsed.getTime()) ? parsed : new Date();
    if (isMonth) {
      const firstOfMonth = new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth(),
        1,
      );
      return formatMonthLabel(firstOfMonth);
    }
    const { start: wStart, end: wEnd } = weekRange(
      startOfWeekMonday(referenceDate),
    );
    return formatWeekLabel(wStart, wEnd);
  }, [isMonth, start]);

  // Two-tone hero title for monthly recaps only — month name and year
  // derived separately (rather than splitting formatMonthLabel's string) so
  // the year can be rendered in dusty rose. Weekly keeps the single-tone
  // bigTitle range above.
  const { heroMonth, heroYear } = useMemo(() => {
    if (!isMonth) return { heroMonth: null, heroYear: null };
    const parsed = start ? parseDateStr(start) : null;
    const referenceDate =
      parsed && !Number.isNaN(parsed.getTime()) ? parsed : new Date();
    const firstOfMonth = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      1,
    );
    return {
      heroMonth: firstOfMonth.toLocaleDateString("en-US", { month: "long" }),
      heroYear: firstOfMonth.getFullYear(),
    };
  }, [isMonth, start]);

  // Hero's small line-1 label — falls back to "Your" when there's no real
  // first name to personalize with.
  const heroLine1 =
    firstName === "there"
      ? `Your ${isMonth ? "Monthly" : "Weekly"} Recap`
      : `${firstName}'s ${isMonth ? "Monthly" : "Weekly"} Recap`;

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
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            overflow: "hidden",
            backgroundColor: t.background,
          },
          heroAnimStyle,
        ]}
        onLayout={(e) => setHeroHeight(e.nativeEvent.layout.height)}
      >
        {/* Very subtle brand wash behind the hero content — kept faint on
            purpose so it reads as a tint, not a colored panel. */}
        <LinearGradient
          colors={["#D09F9A22", t.background]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View
          style={{
            paddingTop: insets.top + 8,
            paddingBottom: 20,
            paddingHorizontal: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              style={backBtnStyle}
            >
              <ChevronLeft size={20} color={t.text} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity onPress={goToShare} style={backBtnStyle}>
              <Share2 size={18} color={t.text} strokeWidth={2} />
            </TouchableOpacity>
          </View>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 13,
              color: t.textSecondary,
              marginBottom: 4,
            }}
          >
            {heroLine1}
          </Text>
          <Text style={{ fontFamily: fonts.bold, fontSize: 30, color: t.text }}>
            {isMonth ? (
              <>
                {heroMonth} <Text style={{ color: "#D09F9A" }}>{heroYear}</Text>
              </>
            ) : (
              bigTitle
            )}
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
          style={{
            flex: 1,
            textAlign: "center",
            fontFamily: fonts.semibold,
            fontSize: 16,
            color: t.text,
            marginHorizontal: 8,
          }}
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
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: heroHeight,
          paddingBottom: insets.bottom + 32,
        }}
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
