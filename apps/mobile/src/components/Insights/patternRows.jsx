import { View, Text, TouchableOpacity } from "react-native";
import { fonts } from "@/utils/fonts";
import { useTheme } from "@/hooks/useTheme";

// Shared "Your patterns" row + evidence-receipt components — used by both the
// insights hub (app/health-insights.jsx, active + "still watching" rows) and
// the monthly recap (app/recap.jsx, "Patterns spotted this month", active
// rows only — a finished month can't be unlocked by logging more, so the
// recap never renders WatchingRow).

// Copy map for each pattern's `educationTopic` → the action-link label.
// Single source of truth — previously hand-duplicated in both screens.
export const EDUCATION_COPY = {
  pain: "Managing pain during a crisis →",
  hydration: "Why hydration matters in SCD →",
};

// Fixed per-metric accent colors for evidence visuals — deliberately NOT
// theme tokens (these are brand/metric identity, not text/surface colors),
// matching the palette used elsewhere for hydration/sleep/mood.
export const METRIC_COLORS = {
  hydration: "#A9334D",
  sleep: "#6366F1",
  mood: "#7C3AED",
};

export const MAX_EVIDENCE_DOTS = 14;

// One-color, flat "receipt" for a dots-type pattern: filled dots in the
// metric's color, hollow ones just an outline. Falls back to a compact
// fraction once `total` would make for an absurdly long row.
export function DotRow({ filled, total, color }) {
  const t = useTheme();
  if (total > MAX_EVIDENCE_DOTS) {
    return (
      <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color }}>
        {filled} of {total}
      </Text>
    );
  }
  return (
    <View style={{ flexDirection: "row", gap: 5 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: i < filled ? color : "transparent",
            borderWidth: i < filled ? 0 : 1,
            borderColor: t.divider,
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
    return <DotRow filled={evidence.filled} total={evidence.total} color={color} />;
  }
  if (evidence.type === "bars") {
    return <MiniBars items={evidence.items} />;
  }
  if (evidence.type === "weekdays") {
    return <WeekdayStrip counts={evidence.counts} />;
  }
  return null;
}

export function PatternRow({ pattern, isLast, onEducationPress }) {
  const t = useTheme();
  const educationCopy = pattern.educationTopic && EDUCATION_COPY[pattern.educationTopic];
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
      {educationCopy ? (
        <TouchableOpacity
          onPress={() => onEducationPress?.(pattern.educationTopic)}
          activeOpacity={0.7}
          style={{ marginTop: 14 }}
        >
          <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: t.accent }}>{educationCopy}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// Quiet-by-design row for a not-yet-unlocked pattern: no icon, no badge, no
// color — just label + hint, so a sparse section reads as anticipation
// rather than an empty lab report. Hub-only — the monthly recap never
// renders this (a finished month can't be unlocked by logging more).
export function WatchingRow({ row, isLast }) {
  const t = useTheme();
  return (
    <View
      style={{
        paddingVertical: 14,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: t.divider,
      }}
    >
      <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: t.textSecondary, marginBottom: 3 }}>
        {row.label}
      </Text>
      <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.textSecondary, opacity: 0.7 }}>
        {row.hint}
      </Text>
    </View>
  );
}
