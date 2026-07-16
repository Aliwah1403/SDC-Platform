import { useState } from "react";
import { View, Text } from "react-native";
import { HomeLineChart } from "./line-chart";
import { BarChart } from "./bar-chart";
import { HeatmapChart } from "./heatmap-chart";
import { BubbleChart } from "./bubble-chart";
import { SleepHypnogramChart } from "./sleep-hypnogram-chart";
import { fonts } from "@/utils/fonts";

function shortDate(date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function labelStep(range) {
  return Math.max(1, Math.ceil(range / 6));
}

function formatSteps(value) {
  return `${Math.round(value).toLocaleString("en-US")} steps`;
}

function formatSleepHours(value) {
  const h = Math.floor(value);
  const m = Math.round((value - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function TooltipText({ children }) {
  return (
    <Text style={{ color: "#fff", fontSize: 12, fontFamily: fonts.bold, textAlign: "center" }}>
      {children}
    </Text>
  );
}

function TooltipSubtext({ children }) {
  return (
    <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, marginTop: 1 }}>
      {children}
    </Text>
  );
}

// ─── Per-metric chart configuration ────────────────────────────────────────

function buildLineConfig({ metric, data, range, color, getStatus }) {
  const step = labelStep(range);
  const chartData = data.map((d, i) => ({
    x: i,
    y: d.value,
    label: i % step === 0 ? d.date.getDate().toString() : "",
    tooltipLabel: shortDate(d.date),
  }));

  const base = {
    animated: true,
    gradient: true,
    interactive: true,
    showGrid: true,
    showYLabels: false,
    showXLabels: true,
    showDataPoints: range <= 7,
    primaryColor: color,
    height: 200,
  };

  switch (metric) {
    case "pain":
      return {
        chartData,
        config: {
          ...base,
          yMin: 0,
          yMax: 10,
          getPointColor: (v) => (v <= 3 ? "#10B981" : v <= 6 ? "#F59E0B" : "#EF4444"),
          renderTooltip: (point) => {
            const status = getStatus?.(point.y);
            return (
              <>
                <TooltipText>{point.y}{status ? ` · ${status.label}` : ""}</TooltipText>
                <TooltipSubtext>{point.tooltipLabel}</TooltipSubtext>
              </>
            );
          },
        },
      };
    case "spo2":
      return {
        chartData,
        config: {
          ...base,
          yMin: 88,
          yMax: 100,
          zones: [
            { min: 92, max: 94, color: "#F59E0B", opacity: 0.15 },
            { min: 88, max: 92, color: "#EF4444", opacity: 0.20 },
          ],
          thresholds: [
            { value: 94, color: "#F59E0B", label: "Warning threshold" },
            { value: 92, color: "#EF4444", label: "Critical threshold" },
          ],
          getPointColor: (v) => (v >= 94 ? "#0EA5E9" : v >= 92 ? "#F59E0B" : "#EF4444"),
          renderTooltip: (point) => {
            const status = getStatus?.(point.y);
            return (
              <>
                <TooltipText>{point.y}%</TooltipText>
                <TooltipSubtext>{status ? `${status.label} · ` : ""}{point.tooltipLabel}</TooltipSubtext>
              </>
            );
          },
        },
      };
    case "temperature":
      return {
        chartData,
        config: {
          ...base,
          yMin: 35,
          yMax: 42,
          zones: [
            { min: 38.0, max: 42, color: "#EF4444", opacity: 0.18 },
            { min: 35, max: 36.5, color: "#F59E0B", opacity: 0.10 },
          ],
          thresholds: [{ value: 38.0, color: "#EF4444", weight: 1.5 }],
          getPointColor: (v) => (v >= 38.0 ? "#EF4444" : v < 36.5 ? "#6366F1" : "#F59E0B"),
          renderTooltip: (point) => {
            const status = getStatus?.(point.y);
            return (
              <>
                <TooltipText>{point.y}°C</TooltipText>
                <TooltipSubtext>{status ? `${status.label} · ` : ""}{point.tooltipLabel}</TooltipSubtext>
              </>
            );
          },
        },
      };
    case "resprate":
      return {
        chartData,
        config: {
          ...base,
          yMin: 8,
          yMax: 30,
          zones: [
            { min: 20, max: 25, color: "#F59E0B", opacity: 0.12 },
            { min: 25, max: 30, color: "#EF4444", opacity: 0.18 },
          ],
          thresholds: [
            { value: 20, color: "#F59E0B", weight: 1 },
            { value: 25, color: "#EF4444", weight: 1.5 },
          ],
          getPointColor: (v) => (v > 25 ? "#EF4444" : v > 20 ? "#F59E0B" : "#8B5CF6"),
          renderTooltip: (point) => {
            const status = getStatus?.(point.y);
            return (
              <>
                <TooltipText>{point.y}/min</TooltipText>
                <TooltipSubtext>{status ? `${status.label} · ` : ""}{point.tooltipLabel}</TooltipSubtext>
              </>
            );
          },
        },
      };
    default:
      return { chartData, config: base };
  }
}

function buildHeartRateWaveformConfig({ data, range, getStatus }) {
  const step = labelStep(range);
  const chartData = data.map((d, i) => ({
    label: i % step === 0 ? d.date.getDate().toString() : "",
    value: d.value,
    tooltipLabel: shortDate(d.date),
  }));

  const logged = data.filter((d) => d.value > 0);
  const zonePercentages = logged.length
    ? (() => {
        const counts = { normal: 0, elevated: 0, low: 0 };
        logged.forEach((d) => {
          if (d.value > 110) counts.elevated++;
          else if (d.value < 60) counts.low++;
          else counts.normal++;
        });
        const total = logged.length;
        return {
          normal: Math.round((counts.normal / total) * 100),
          elevated: Math.round((counts.elevated / total) * 100),
          low: Math.round((counts.low / total) * 100),
        };
      })()
    : null;

  return {
    chartData,
    zonePercentages,
    config: {
      animated: true,
      showLabels: false,
      height: 200,
      yMin: 40,
      yMax: 130,
      getBarColor: (v) => getStatus?.(v)?.color ?? "#EF4444",
      renderTooltip: (item) => (
        <>
          <TooltipText>{item.value} bpm</TooltipText>
          <TooltipSubtext>{item.tooltipLabel}</TooltipSubtext>
        </>
      ),
    },
  };
}

function HeartRateLegend({ zonePercentages }) {
  if (!zonePercentages) return null;
  const items = [
    { label: "Normal", pct: zonePercentages.normal, color: "#059669" },
    { label: "Elevated", pct: zonePercentages.elevated, color: "#DC2626" },
    { label: "Low", pct: zonePercentages.low, color: "#F59E0B" },
  ].filter((item) => item.pct > 0);

  return (
    <View style={{ flexDirection: "row", justifyContent: "center", gap: 16, marginTop: 12 }}>
      {items.map((item) => (
        <View key={item.label} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color }} />
          <Text style={{ fontSize: 11, color: "rgba(107,107,107,0.9)", fontFamily: fonts.semibold }}>
            {item.label} · {item.pct}%
          </Text>
        </View>
      ))}
    </View>
  );
}

const SLEEP_STAGE_COLORS = { awake: "#F59E0B", core: "#818CF8", deep: "#4F46E5", rem: "#A78BFA" };
const SLEEP_STAGE_LABELS = { awake: "Awake", core: "Core", deep: "Deep", rem: "REM" };

function SleepStageLegend({ segments }) {
  if (!segments?.length) return null;
  const totals = { awake: 0, core: 0, deep: 0, rem: 0 };
  segments.forEach((s) => {
    const hours = (new Date(s.end).getTime() - new Date(s.start).getTime()) / 3600000;
    totals[s.stage] += hours;
  });

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 14, marginTop: 12 }}>
      {(["awake", "rem", "core", "deep"]).map((stage) => (
        <View key={stage} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: SLEEP_STAGE_COLORS[stage] }} />
          <Text style={{ fontSize: 11, color: "rgba(107,107,107,0.9)", fontFamily: fonts.semibold }}>
            {SLEEP_STAGE_LABELS[stage]} · {formatSleepHours(totals[stage])}
          </Text>
        </View>
      ))}
    </View>
  );
}

function SleepTrendLegend({ avgValue }) {
  if (avgValue == null) return null;
  return (
    <View style={{ flexDirection: "row", justifyContent: "center", gap: 16, marginTop: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: "#6366F120", borderWidth: 1, borderColor: "#6366F1" }} />
        <Text style={{ fontSize: 11, color: "rgba(107,107,107,0.9)", fontFamily: fonts.semibold }}>
          Optimal range · 7-9h
        </Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View style={{ width: 12, height: 0, borderTopWidth: 1.5, borderColor: "#1A1A1A", borderStyle: "dashed" }} />
        <Text style={{ fontSize: 11, color: "rgba(107,107,107,0.9)", fontFamily: fonts.semibold }}>
          Avg. {formatSleepHours(avgValue)}
        </Text>
      </View>
    </View>
  );
}

function buildBarConfig({ metric, data, range, goal }) {
  const step = labelStep(range);
  const chartData = data.map((d, i) => ({
    label: i % step === 0 ? d.date.getDate().toString() : "",
    value: d.value,
    tooltipLabel: shortDate(d.date),
    date: d.date,
  }));

  const base = { animated: true, showLabels: true, height: 180 };

  switch (metric) {
    case "hydration": {
      const target = goal ?? 8;
      return {
        chartData,
        config: {
          ...base,
          getBarColor: (v) => (v >= target ? "#A9334D" : "#D09F9A80"),
          referenceValue: target,
          referenceColor: "#A9334D",
          yMin: 0,
          yMax: 16,
          renderTooltip: (item) => (
            <>
              <TooltipText>{item.value} glasses</TooltipText>
              <TooltipSubtext>{item.value >= target ? "At goal · " : "Below goal · "}{item.tooltipLabel}</TooltipSubtext>
            </>
          ),
        },
      };
    }
    case "steps": {
      const target = goal ?? 10000;
      return {
        chartData,
        config: {
          ...base,
          getBarColor: (v) => (v >= target ? "#059669" : v >= target * 0.5 ? "#6EE7B7" : "#D1D5DB"),
          referenceValue: target,
          referenceColor: "#059669",
          yMin: 0,
          yMax: 15000,
          renderTooltip: (item) => (
            <>
              <TooltipText>{formatSteps(item.value)}</TooltipText>
              <TooltipSubtext>{item.tooltipLabel}</TooltipSubtext>
            </>
          ),
        },
      };
    }
    case "sleep": {
      const logged = data.filter((d) => d.value > 0);
      const avgValue = logged.length
        ? logged.reduce((s, d) => s + d.value, 0) / logged.length
        : null;
      return {
        chartData,
        avgValue,
        config: {
          ...base,
          getBarColor: (v) => (v >= 8 ? "#6366F1" : v >= 7 ? "#818CF8" : v >= 6 ? "#F59E0B" : "#EF4444"),
          goalBand: { min: 7, max: 9 },
          goalBandColor: "#6366F1",
          yMin: 0,
          yMax: 12,
          ...(avgValue != null ? { referenceValue: avgValue, referenceColor: "#1A1A1A" } : {}),
          renderTooltip: (item) => (
            <>
              <TooltipText>{formatSleepHours(item.value)}</TooltipText>
              <TooltipSubtext>{item.tooltipLabel}</TooltipSubtext>
            </>
          ),
        },
      };
    }
    default:
      return { chartData, config: base };
  }
}

function buildBubbleConfig({ data, range, getStatus }) {
  const step = labelStep(range);
  const chartData = data
    .filter((d) => d.value > 0)
    .map((d, i) => ({
      x: i,
      y: d.value,
      label: i % step === 0 ? d.date.getDate().toString() : "",
      tooltipLabel: shortDate(d.date),
      color: d.value >= 5 ? "#10B981" : d.value >= 4 ? "#6EE7B7" : d.value >= 3 ? "#F59E0B" : d.value >= 2 ? "#F87171" : "#EF4444",
    }));

  return {
    chartData,
    config: {
      animated: true,
      height: 200,
      size: 12,
      yMin: 1,
      yMax: 5,
      showTrendLine: true,
      renderTooltip: (point) => {
        const status = getStatus?.(point.y);
        return (
          <>
            <TooltipText>{status?.label ?? point.y}</TooltipText>
            <TooltipSubtext>{point.tooltipLabel}</TooltipSubtext>
          </>
        );
      },
    },
  };
}

function buildHeatmapConfig({ data, getStatus }) {
  const chartData = data.map((d) => ({ date: d.date, value: d.value }));
  return {
    chartData,
    config: {
      height: 220,
      colorScale: ["#10B981", "#A7F3D0", "#FDE047", "#F59E0B", "#EF4444", "#7F1D1D"],
      minValue: 0,
      maxValue: 10,
      emptyColor: "#F0E4E1",
      animated: true,
      renderTooltip: (cell) => {
        const status = cell.value != null ? getStatus?.(cell.value) : null;
        return (
          <>
            <TooltipText>{cell.value != null ? cell.value : "No data"}{status ? ` · ${status.label}` : ""}</TooltipText>
            <TooltipSubtext>{shortDate(cell.date)}</TooltipSubtext>
          </>
        );
      },
    },
  };
}

// ─── Main component ─────────────────────────────────────────────────────────

export function MetricChart({ metric, data, range, goal, color, unit, getStatus, sleepSegments }) {
  const [width, setWidth] = useState(300);

  const handleLayout = (e) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setWidth(w);
  };

  let content = null;

  if (metric === "pain" && range === 14) {
    const { chartData, config } = buildHeatmapConfig({ data, getStatus });
    content = <HeatmapChart data={chartData} config={{ ...config, width }} />;
  } else if (metric === "mood") {
    const { chartData, config } = buildBubbleConfig({ data, range, getStatus });
    content = <BubbleChart data={chartData} config={{ ...config, width }} />;
  } else if (metric === "sleep") {
    const { chartData, config, avgValue } = buildBarConfig({ metric, data, range, goal, color, getStatus });
    content = (
      <>
        {sleepSegments?.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 11, fontFamily: fonts.bold, color: "rgba(107,107,107,0.9)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
              Last night
            </Text>
            <SleepHypnogramChart segments={sleepSegments} config={{ height: 260 }} />
            <SleepStageLegend segments={sleepSegments} />
          </View>
        )}
        <Text style={{ fontSize: 11, fontFamily: fonts.bold, color: "rgba(107,107,107,0.9)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
          {range}-day trend
        </Text>
        <BarChart data={chartData} config={{ ...config, width }} />
        <SleepTrendLegend avgValue={avgValue} />
      </>
    );
  } else if (metric === "hydration" || metric === "steps") {
    const { chartData, config } = buildBarConfig({ metric, data, range, goal, color, getStatus });
    content = <BarChart data={chartData} config={{ ...config, width }} />;
  } else if (metric === "heartrate") {
    const { chartData, config, zonePercentages } = buildHeartRateWaveformConfig({ data, range, getStatus });
    content = (
      <>
        <BarChart data={chartData} config={{ ...config, width }} />
        <HeartRateLegend zonePercentages={zonePercentages} />
      </>
    );
  } else {
    const { chartData, config } = buildLineConfig({ metric, data, range, goal, color, unit, getStatus });
    content = <HomeLineChart data={chartData} config={{ ...config, width }} />;
  }

  return (
    <View style={{ width: "100%" }} onLayout={handleLayout}>
      {content}
    </View>
  );
}
