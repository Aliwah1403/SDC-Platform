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

// Soft "word cloud" illustration for empty states — the kinds of insights that
// will fill in, scattered with gentle rotations in warm brand tints. Purely
// decorative (aria-hidden in spirit): no assets, just Text. Geist rather than a
// script face, so it reads as a scattered cloud, not literal handwriting.
const INSIGHT_WORDS = [
  { text: "recaps",    top: 0,   left: 138, size: 16, rotate: "-8deg",  color: "#D09F9A" },
  { text: "hydration", top: 34,  left: 32,  size: 19, rotate: "-11deg", color: "#A9334D" },
  { text: "sleep",     top: 24,  left: 224, size: 17, rotate: "7deg",   color: "#F0531C" },
  { text: "patterns",  top: 74,  left: 112, size: 21, rotate: "-3deg",  color: "#781D11" },
  { text: "mood",      top: 120, left: 54,  size: 16, rotate: "9deg",   color: "#D09F9A" },
  { text: "triggers",  top: 116, left: 198, size: 18, rotate: "-6deg",  color: "#A9334D" },
  { text: "recovery",  top: 158, left: 128, size: 15, rotate: "5deg",   color: "#C58A93" },
];

function ScatteredWords() {
  return (
    <View style={{ width: 300, height: 190, marginBottom: 24 }}>
      {INSIGHT_WORDS.map((w) => (
        <Text
          key={w.text}
          style={{
            position: "absolute",
            top: w.top,
            left: w.left,
            fontFamily: fonts.medium,
            fontSize: w.size,
            color: w.color,
            opacity: 0.5,
            transform: [{ rotate: w.rotate }],
          }}
        >
          {w.text}
        </Text>
      ))}
    </View>
  );
}

// Full-screen first-run state — shown before a user has logged enough (< 7
// days) for any recap or pattern to exist yet. Deliberately takes over the
// whole screen for a focused "you're just getting started" moment, rather
// than stacking per-section empty states.
function EmptyFirstRun({ daysLogged }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, paddingBottom: 48 }}>
      <ScatteredWords />
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

// Empty state for the recaps row before any recap exists (new users — a recap
// only gets built once a past week/month has logged days). Card-less like
// PatternsFormingState; the subtle illustration is a pair of muted "ghost"
// recap cards echoing the real ones' shape, so the row previews what's coming.
function RecapsEmptyState() {
  const t = useTheme();
  return (
    <View style={{ paddingHorizontal: 20 }}>
      <View style={{ flexDirection: "row", gap: CARD_GAP, marginBottom: 18 }}>
        {[0, 1].map((i) => (
          <View
            key={i}
            style={{
              width: MINI_CARD_WIDTH,
              height: 116,
              borderRadius: 18,
              backgroundColor: t.divider,
              padding: 14,
              justifyContent: "flex-end",
              gap: 7,
              opacity: i === 0 ? 1 : 0.5,
            }}
          >
            <View style={{ height: 7, width: "55%", borderRadius: 4, backgroundColor: t.border }} />
            <View style={{ height: 11, width: "82%", borderRadius: 5, backgroundColor: t.border }} />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <Sparkles size={16} color={t.accent} strokeWidth={2} />
        <Text style={{ fontFamily: fonts.semibold, fontSize: 15, color: t.text }}>
          Your first recap is on its way
        </Text>
      </View>
      <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.textSecondary, lineHeight: 20 }}>
        Keep logging daily — Hemo bundles each full week into a recap you can look back on. Monthly recaps follow once you've tracked your first month.
      </Text>
    </View>
  );
}

export default function HealthInsightsScreen() {
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();
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
          paddingTop: insets.top + 8,
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
          <View style={{ marginBottom: 28, marginHorizontal: -20 }}>
            <View style={{ paddingHorizontal: 20 }}>
              <SectionHeader>Weekly recaps</SectionHeader>
            </View>
            {weeklyRecaps.length > 0 ? (
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
            ) : (
              <RecapsEmptyState />
            )}
          </View>

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
              onPress={(topic) => posthog?.capture("hub_section_tapped", { section: "understanding_scd", topic })}
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
