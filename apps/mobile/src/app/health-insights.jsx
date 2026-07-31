import { useMemo, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { ChevronLeft, Sparkles, Share2 } from "lucide-react-native";
import { fonts } from "@/utils/fonts";
import { useTheme } from "@/hooks/useTheme";
import { useHealthDataQuery, useTriggersQuery } from "@/hooks/queries/useHealthDataQuery";
import { useMetricGoalsQuery } from "@/hooks/queries/useMetricGoalsQuery";
import { DEFAULT_SUGGESTED_ML } from "@/utils/hydrationGoal";
import { PressableScale } from "@/components/PressableScale";
import { UnderstandingSCDRow } from "@/components/Insights/UnderstandingSCDRow";
import { PatternRow, WatchingRow, LinearGauge } from "@/components/Insights/patternRows";
import {
  RecapCard,
  CARD_GAP,
  MINI_CARD_WIDTH,
  MONTHLY_CARD_WIDTH,
  WEEKLY_GRADIENT,
  MONTHLY_GRADIENT,
} from "@/components/HomeScreen/recapShared";
import {
  toDateStr,
  addDays,
  startOfWeekMonday,
  weekRange,
  formatWeekLabel,
  buildDayRange,
  countLogged,
  computePatterns,
  computeWatchlist,
  buildMonthlyRecaps,
} from "@/utils/recapEngine";

const WEEKS_TO_SCAN = 12; // ~complete-90-day fetch window
const PATTERNS_WINDOW_DAYS = 60;

function buildWeeklyRecaps(healthData) {
  const today = new Date();
  const thisMonday = startOfWeekMonday(today);
  const weeks = [];
  for (let i = 1; i <= WEEKS_TO_SCAN; i++) {
    const monday = addDays(thisMonday, -7 * i);
    const { start, end } = weekRange(monday);
    const days = buildDayRange(healthData, start, end);
    const daysLogged = countLogged(days);
    if (daysLogged === 0) continue;
    weeks.push({
      key: `week-${toDateStr(start)}`,
      start,
      label: formatWeekLabel(start, end),
      daysLogged,
    });
  }
  return weeks;
}

function SectionHeader({ children }) {
  const t = useTheme();
  return (
    <Text style={{ fontFamily: fonts.bold, fontSize: 19, color: t.text, marginBottom: 12 }}>
      {children}
    </Text>
  );
}

function EmptyFirstRun({ daysLogged }) {
  const t = useTheme();
  return (
    <View style={{ alignItems: "center", paddingTop: 60, paddingHorizontal: 24 }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: t.surfaceElevated,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 18,
        }}
      >
        <Sparkles size={26} color={t.accent} strokeWidth={1.5} />
      </View>
      <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: t.text, textAlign: "center", marginBottom: 8 }}>
        Your first weekly recap arrives Monday
      </Text>
      <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: t.textSecondary, textAlign: "center", lineHeight: 21 }}>
        {daysLogged} day{daysLogged === 1 ? "" : "s"} logged so far — keep going and your recaps and patterns will start showing up here.
      </Text>
    </View>
  );
}

// Reassurance state for "Your patterns" when no *correlational* pattern
// (hydration/sleep/mood/weekday vs. pain) has unlocked yet — real data simply
// hasn't crossed the thresholds. Card-less so it blends into the page rather
// than reading as its own boxed-off element, whether it stands alone (whole
// section empty) or sits above a pattern that HAS surfaced (e.g. a trigger).
// The subtle illustration is a pair of muted "ghost" pattern rows — a short
// label line above an all-inactive LinearGauge — hinting at what fills in here.
function PatternsFormingState() {
  const t = useTheme();
  const GhostRow = ({ labelWidth, total }) => (
    <View style={{ gap: 7 }}>
      <View style={{ height: 9, width: labelWidth, borderRadius: 5, backgroundColor: t.border }} />
      <LinearGauge filled={0} total={total} color={t.accent} ghost />
    </View>
  );
  return (
    <View>
      <View style={{ gap: 14, marginBottom: 18 }}>
        <GhostRow labelWidth="55%" total={7} />
        <GhostRow labelWidth="42%" total={5} />
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <Sparkles size={16} color={t.accent} strokeWidth={2} />
        <Text style={{ fontFamily: fonts.semibold, fontSize: 15, color: t.text }}>
          Still finding your patterns
        </Text>
      </View>
      <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.textSecondary, lineHeight: 20 }}>
        Hemo checks your last 60 days for links between your habits and your pain. Keep logging daily — connections like hydration, sleep and mood show up here as they emerge.
      </Text>
    </View>
  );
}

export default function HealthInsightsScreen() {
  const router = useRouter();
  const t = useTheme();
  const posthog = usePostHog();
  const { data: healthData = [] } = useHealthDataQuery();
  const { data: metricGoals } = useMetricGoalsQuery();
  const goalMl = metricGoals?.hydration ?? DEFAULT_SUGGESTED_ML;

  const totalDaysLogged = useMemo(() => countLogged(healthData), [healthData]);
  const isFirstRun = totalDaysLogged < 7;

  const weeklyRecaps = useMemo(() => (isFirstRun ? [] : buildWeeklyRecaps(healthData)), [healthData, isFirstRun]);
  const monthlyRecaps = useMemo(() => (isFirstRun ? [] : buildMonthlyRecaps(healthData)), [healthData, isFirstRun]);

  const patternsStart = useMemo(() => addDays(new Date(), -(PATTERNS_WINDOW_DAYS - 1)), []);
  const patternsEnd = useMemo(() => new Date(), []);
  const patternsDays = useMemo(() => buildDayRange(healthData, patternsStart, patternsEnd), [healthData, patternsStart, patternsEnd]);
  const { data: triggerCounts } = useTriggersQuery(toDateStr(patternsStart), toDateStr(patternsEnd));
  const patterns = useMemo(
    () => computePatterns(patternsDays, { goalMl, triggerCounts }),
    [patternsDays, goalMl, triggerCounts],
  );
  const watchlist = useMemo(
    () => computeWatchlist(patternsDays, { triggerCounts, activeIds: patterns.map((p) => p.id) }),
    [patternsDays, triggerCounts, patterns],
  );

  // A "correlational" pattern links a habit to pain (metric hydration/sleep/
  // mood/pain); the trigger-frequency pattern (metric "trigger") is a tally,
  // not a correlation. Until at least one correlational pattern unlocks, we
  // keep the reassurance banner up so the section never reads as an empty gap.
  const hasCorrelationalPattern = useMemo(
    () => patterns.some((p) => p.metric !== "trigger"),
    [patterns],
  );

  useEffect(() => {
    patterns.forEach((p) => posthog?.capture("insight_pattern_shown", { pattern_id: p.id }));
  }, [patterns]);

  const patternsLoggedCount = countLogged(patternsDays);

  const tap = (section) => posthog?.capture("hub_section_tapped", { section });
  const goToPatternsEducation = (topic) => {
    tap("patterns_education");
    router.push(`/education-article?topic=${topic}&from=hub`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 16,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: t.surfaceElevated,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronLeft size={20} color={t.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: "center", fontFamily: fonts.bold, fontSize: 17, color: t.text }}>
          Insights
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {isFirstRun ? (
        <EmptyFirstRun daysLogged={totalDaysLogged} />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {weeklyRecaps.length > 0 && (
            <View style={{ marginBottom: 28, marginHorizontal: -20 }}>
              <View style={{ paddingHorizontal: 20 }}>
                <SectionHeader>Weekly recaps</SectionHeader>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={MINI_CARD_WIDTH + CARD_GAP}
                snapToAlignment="start"
                contentContainerStyle={{ paddingHorizontal: 20, gap: CARD_GAP }}
              >
                {weeklyRecaps.map((w) => (
                  <RecapCard
                    key={w.key}
                    compact
                    width={MINI_CARD_WIDTH}
                    kicker="WEEKLY RECAP"
                    title={w.label}
                    titleSize={15}
                    gradient={WEEKLY_GRADIENT}
                    onPress={() => {
                      tap("weekly_recaps");
                      router.push(`/recap?period=week&start=${toDateStr(w.start)}&from=hub`);
                    }}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {monthlyRecaps.length > 0 && (
            <View style={{ marginBottom: 28, marginHorizontal: -20 }}>
              <View style={{ paddingHorizontal: 20 }}>
                <SectionHeader>Monthly recaps</SectionHeader>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={MONTHLY_CARD_WIDTH + CARD_GAP}
                snapToAlignment="start"
                contentContainerStyle={{ paddingHorizontal: 20, gap: CARD_GAP }}
              >
                {monthlyRecaps.map((m) => (
                  <RecapCard
                    key={m.key}
                    compact
                    width={MONTHLY_CARD_WIDTH}
                    kicker="MONTHLY RECAP"
                    title={m.monthName}
                    titleSize={22}
                    gradient={MONTHLY_GRADIENT}
                    onPress={() => {
                      tap("monthly_recaps");
                      router.push(`/recap?period=month&start=${toDateStr(m.start)}&from=hub`);
                    }}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          <View style={{ marginBottom: 28 }}>
            <SectionHeader>Your patterns</SectionHeader>
            <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: t.textSecondary, marginTop: -6, marginBottom: 14 }}>
              From your last {PATTERNS_WINDOW_DAYS} days
            </Text>
            {patterns.length > 0 || watchlist.length > 0 ? (
              <View>
                {!hasCorrelationalPattern && (
                  <View style={{ marginBottom: 20 }}>
                    <PatternsFormingState />
                  </View>
                )}
                {patterns.map((p, i) => (
                  <PatternRow
                    key={p.id}
                    pattern={p}
                    isLast={i === patterns.length - 1 && watchlist.length === 0}
                    onEducationPress={goToPatternsEducation}
                  />
                ))}
                {watchlist.map((w, i) => (
                  <WatchingRow key={w.id} row={w} isLast={i === watchlist.length - 1} />
                ))}
              </View>
            ) : (
              <PatternsFormingState />
            )}
          </View>

          <View style={{ marginBottom: 32 }}>
            <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.textSecondary, marginBottom: 10 }}>
              Preparing for an appointment?
            </Text>
            <PressableScale
              onPress={() => {
                tap("share");
                router.push("/share-summary");
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  backgroundColor: t.accent,
                  borderRadius: 14,
                  paddingVertical: 15,
                }}
              >
                <Share2 size={16} color="#fff" strokeWidth={2} />
                <Text style={{ fontFamily: fonts.semibold, fontSize: 15, color: "#fff" }}>
                  Share a health summary
                </Text>
              </View>
            </PressableScale>
          </View>

          <View style={{ marginBottom: 28 }}>
            <UnderstandingSCDRow
              onPress={() => {
                tap("understanding_scd");
                router.push("/(tabs)/learn");
              }}
            />
          </View>

          <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: t.textSecondary, textAlign: "center" }}>
            Logged {patternsLoggedCount} of the last {PATTERNS_WINDOW_DAYS} days — insights get sharper the more you log.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}
