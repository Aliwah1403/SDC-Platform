import { View, Text, ScrollView } from "react-native";
import { fonts } from "@/utils/fonts";
import { useTheme } from "@/hooks/useTheme";
import { useAppStore } from "@/store/appStore";
import { CARD_GAP, CARD_WIDTH, computeStats, entryFor, toDateStr } from "./recapShared";
import { WeeklySummaryCard } from "./WeeklySummaryCard";
import { MonthlySummaryCard } from "./MonthlySummaryCard";

function buildPrevMonthData(healthData) {
  const today = new Date();
  const year = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
  const monthIndex = today.getMonth() === 0 ? 11 : today.getMonth() - 1;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, monthIndex, i + 1);
    return entryFor(healthData, d);
  });
}

// Previous complete week, Monday → Sunday, relative to today.
function buildPrevWeekData(healthData) {
  const today = new Date();
  const daysSinceMonday = (today.getDay() + 6) % 7; // 0=Mon … 6=Sun
  const prevMonday = new Date(today);
  prevMonday.setDate(today.getDate() - daysSinceMonday - 7);

  const data = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(prevMonday);
    d.setDate(prevMonday.getDate() + i);
    return entryFor(healthData, d);
  });

  const start = new Date(prevMonday);
  const end = new Date(prevMonday);
  end.setDate(prevMonday.getDate() + 6);
  return { data, start, end };
}

function formatWeekRange(start, end) {
  const short = (d) => d.toLocaleDateString("en-US", { month: "short" });
  return start.getMonth() === end.getMonth()
    ? `${start.getDate()} – ${end.getDate()} ${short(end)}`
    : `${start.getDate()} ${short(start)} – ${end.getDate()} ${short(end)}`;
}

export function HealthRecaps({ healthData }) {
  const t = useTheme();
  const dismissedRecaps = useAppStore((s) => s.dismissedRecaps);
  const dismissRecap = useAppStore((s) => s.dismissRecap);

  const today = new Date();

  // ── Monthly recap (previous calendar month) ────────────────────────────────
  const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const monthName = prevMonthDate.toLocaleDateString("en-US", { month: "long" });
  const monthKey = `month-${prevMonthDate.getFullYear()}-${String(
    prevMonthDate.getMonth() + 1,
  ).padStart(2, "0")}`;
  const monthData = buildPrevMonthData(healthData);
  const monthStats = computeStats(monthData);

  // ── Weekly recap (previous complete Mon–Sun week) ──────────────────────────
  const { data: weekData, start: weekStart, end: weekEnd } = buildPrevWeekData(healthData);
  const weekRange = formatWeekRange(weekStart, weekEnd);
  const weekKey = `week-${toDateStr(weekStart)}`;
  const weekStats = computeStats(weekData);

  const showWeekly = weekStats.daysLogged > 0 && !dismissedRecaps.includes(weekKey);
  const showMonthly = monthStats.daysLogged > 0 && !dismissedRecaps.includes(monthKey);
  if (!showWeekly && !showMonthly) return null;

  const weeklyCard = showWeekly && (
    <WeeklySummaryCard
      stats={weekStats}
      weekRange={weekRange}
      weekStart={weekStart}
      onDismiss={() => dismissRecap(weekKey)}
    />
  );

  const monthlyCard = showMonthly && (
    <MonthlySummaryCard
      stats={monthStats}
      dayCount={monthData.length}
      monthName={monthName}
      monthStart={prevMonthDate}
      onDismiss={() => dismissRecap(monthKey)}
    />
  );

  const singleCard = showWeekly !== showMonthly;

  return (
    <View style={{ marginBottom: 24 }}>
      <Text
        style={{
          fontFamily: fonts.bold,
          fontSize: 17,
          color: t.text,
          marginBottom: 10,
          paddingHorizontal: 16,
        }}
      >
        My Health Recaps
      </Text>

      {singleCard ? (
        <View style={{ alignItems: "center", paddingHorizontal: 16 }}>
          {weeklyCard || monthlyCard}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH + CARD_GAP}
          snapToAlignment="start"
          contentContainerStyle={{ paddingHorizontal: 16, gap: CARD_GAP }}
        >
          {weeklyCard}
          {monthlyCard}
        </ScrollView>
      )}
    </View>
  );
}
