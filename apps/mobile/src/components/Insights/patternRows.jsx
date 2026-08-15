import { View, Text } from "react-native";
import { fonts } from "@/utils/fonts";
import { useTheme } from "@/hooks/useTheme";

// Shared "Your patterns" row + evidence-receipt components — used by both the
// insights hub (app/health-insights.jsx, active + "still watching" rows) and
// the monthly recap (app/recap.jsx, "Patterns spotted this month", active
// rows only — a finished month can't be unlocked by logging more, so the
// recap never renders WatchingRow).

// Fixed per-metric accent colors for evidence visuals — deliberately NOT
// theme tokens (these are brand/metric identity, not text/surface colors).
// Drawn from the Hemo gradient palette (dusty rose → burgundy → dark burgundy)
// so the whole "Your patterns" section reads as one brand family.
export const METRIC_COLORS = {
  hydration: "#A9334D", // Burgundy
  sleep: "#781D11",     // Dark burgundy
  mood: "#D09F9A",      // Dusty rose
};

// Linear sibling of ArcGaugeChart: same discrete filled-notch language, laid
// out along a straight track instead of an arc. Each segment is one day, so
// `filled` of `total` stays countable (as the old dots were) — active notches
// in the metric's color, the rest muted like the arc gauge's inactive ticks.
// `ghost` renders an all-empty placeholder gauge (a not-yet-unlocked pattern):
// inactive segments use the more-visible border tone so the row still reads as
// a gauge waiting to fill, rather than fading out on light backgrounds.
export function LinearGauge({ filled, total, color, ghost = false }) {
  const t = useTheme();
  if (total <= 0) return null;
  const inactiveColor = ghost ? t.border : t.divider;
  return (
    <View style={{ flexDirection: "row", gap: 4, height: 8 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            borderRadius: 3,
            backgroundColor: i < filled ? color : inactiveColor,
            opacity: i < filled ? 1 : ghost ? 1 : 0.5,
          }}
        />
      ))}
    </View>
  );
}

// Compact top-3 bar receipt for a bars-type pattern (trigger frequency).
// Widths are proportional to the max count in the set — flat, single color.
export function MiniBars({ items }) {
  const t = useTheme();
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <View style={{ gap: 6 }}>
      {items.map((item) => (
        <View key={item.label} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.text, width: 92 }} numberOfLines={1}>
            {item.label}
          </Text>
          <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: t.divider, overflow: "hidden" }}>
            <View
              style={{
                width: `${(item.count / max) * 100}%`,
                height: 6,
                borderRadius: 3,
                backgroundColor: "#A9334D",
              }}
            />
          </View>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.textSecondary, width: 18, textAlign: "right" }}>
            {item.count}
          </Text>
        </View>
      ))}
    </View>
  );
}

export const WEEKDAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

// Seven small cells, one per weekday — background opacity scales with that
// weekday's count. A receipt, not a chart: no axis, no labels beyond letters.
export function WeekdayStrip({ counts }) {
  const t = useTheme();
  const max = Math.max(...counts, 1);
  return (
    <View style={{ flexDirection: "row", gap: 5 }}>
      {counts.map((count, i) => {
        const opacity = count === 0 ? 0 : 0.25 + 0.75 * (count / max);
        return (
          <View key={i} style={{ alignItems: "center", gap: 3 }}>
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                backgroundColor: count === 0 ? "transparent" : `rgba(220,38,38,${opacity})`,
                borderWidth: count === 0 ? 1 : 0,
                borderColor: t.divider,
              }}
            />
            <Text style={{ fontFamily: fonts.regular, fontSize: 10, color: t.textSecondary }}>
              {WEEKDAY_LETTERS[i]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export function PatternEvidence({ evidence, metric }) {
  if (!evidence) return null;
  if (evidence.type === "dots") {
    const color = METRIC_COLORS[metric] || "#A9334D";
    return <LinearGauge filled={evidence.filled} total={evidence.total} color={color} />;
  }
  if (evidence.type === "bars") {
    return <MiniBars items={evidence.items} />;
  }
  if (evidence.type === "weekdays") {
    return <WeekdayStrip counts={evidence.counts} />;
  }
  return null;
}

export function PatternRow({ pattern, isLast }) {
  const t = useTheme();
  return (
    <View
      style={{
        paddingVertical: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: t.divider,
      }}
    >
      <Text style={{ fontFamily: fonts.semibold, fontSize: 16, color: t.text, lineHeight: 21, marginBottom: 4 }}>
        {pattern.headline}
      </Text>
      <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.textSecondary, lineHeight: 19, marginBottom: 12 }}>
        {pattern.body}
      </Text>
      <PatternEvidence evidence={pattern.evidence} metric={pattern.metric} />
    </View>
  );
}

// Row for a not-yet-unlocked pattern. Mirrors PatternRow's layout — label,
// hint, then a muted "ghost" LinearGauge (all-inactive segments) in place of
// real evidence — so a watched slot previews what will fill in here once data
// arrives, rather than reading as a blank line. Hub-only — the monthly recap
// never renders this (a finished month can't be unlocked by logging more).
export function WatchingRow({ row, isLast }) {
  const t = useTheme();
  return (
    <View
      style={{
        paddingVertical: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: t.divider,
      }}
    >
      <Text style={{ fontFamily: fonts.semibold, fontSize: 16, color: t.text, lineHeight: 21, marginBottom: 4 }}>
        {row.label}
      </Text>
      <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.textSecondary, lineHeight: 19, marginBottom: 12 }}>
        {row.hint}
      </Text>
      <LinearGauge filled={0} total={7} color={t.accent} ghost />
    </View>
  );
}
