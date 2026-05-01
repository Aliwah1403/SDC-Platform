import { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { LayoutGrid } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fonts } from "@/utils/fonts";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TILE_WIDTH = (SCREEN_WIDTH - 48) / 2;
const TILE_HEIGHT = 168;

const PREFS_KEY = "hemo_visible_metrics";
const DEFAULT_VISIBLE = ["hydration", "mood", "steps", "sleep"];

const METRIC_META = [
  { key: "hydration", label: "Hydration" },
  { key: "mood",      label: "Mood" },
  { key: "steps",     label: "Steps" },
  { key: "sleep",     label: "Sleep" },
];

// ─── Arc ring with value inside ───────────────────────────────────────────────

function ArcRing({ progress, size = 88, valueLine1, valueLine2 }) {
  const strokeWidth = 8;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const filled = circumference * Math.min(Math.max(progress, 0), 1);
  const cx = size / 2;
  const cy = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={cx} cy={cy} r={r} stroke="#F0E4E1" strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={cx} cy={cy} r={r}
          stroke="#A9334D"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${filled} ${circumference}`}
          strokeLinecap="round"
          rotation={-90}
          origin={`${cx},${cy}`}
        />
      </Svg>
      <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: "#781D11", lineHeight: 22 }}>
        {valueLine1}
      </Text>
      {valueLine2 ? (
        <Text style={{ fontFamily: fonts.regular, fontSize: 10, color: "#9CA3AF" }}>
          {valueLine2}
        </Text>
      ) : null}
    </View>
  );
}

// ─── Mood circle ──────────────────────────────────────────────────────────────

function MoodCircle({ emoji }) {
  return (
    <View
      style={{
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: "#F8E9E7",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: 44 }}>{emoji}</Text>
    </View>
  );
}

// ─── Sleep visual ─────────────────────────────────────────────────────────────

function SleepVisual({ hours }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", height: 88 }}>
      <Text style={{ fontSize: 36, fontFamily: fonts.extrabold, color: "#781D11", lineHeight: 42 }}>
        {hours > 0 ? hours : "—"}
      </Text>
      <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "#9CA3AF" }}>
        {hours > 0 ? "hours" : ""}
      </Text>
    </View>
  );
}

// ─── Steps arc ring ───────────────────────────────────────────────────────────

function StepsArc({ steps }) {
  const progress = steps / 10000;
  const shortSteps =
    steps >= 1000 ? `${(steps / 1000).toFixed(1)}k` : steps > 0 ? String(steps) : "—";
  return (
    <ArcRing
      progress={progress}
      valueLine1={shortSteps}
      valueLine2={steps > 0 ? "/ 10k" : ""}
    />
  );
}

// ─── Individual tile ──────────────────────────────────────────────────────────

function MetricTile({ title, statusLabel, statusColor, visual, metric, hasData }) {
  const router = useRouter();

  return (
    <TouchableOpacity
      activeOpacity={hasData ? 0.8 : 1}
      onPress={() =>
        hasData && router.push({ pathname: "/metric-detail", params: { metric } })
      }
      style={{
        width: TILE_WIDTH,
        height: TILE_HEIGHT,
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
        justifyContent: "space-between",
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: "#6B7280" }}>
          {title}
        </Text>
        {hasData && <Text style={{ fontSize: 16, color: "#D09F9A" }}>›</Text>}
      </View>

      <View style={{ alignItems: "center", flex: 1, justifyContent: "center" }}>
        {visual}
      </View>

      <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: statusColor }}>
        {statusLabel}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Mood helpers ─────────────────────────────────────────────────────────────

function getMoodEmoji(mood) {
  if (mood >= 5) return "😄";
  if (mood >= 4) return "🙂";
  if (mood >= 3) return "😐";
  if (mood >= 2) return "😔";
  return "😞";
}

function getMoodStatus(mood) {
  if (mood >= 4) return "Good";
  if (mood === 3) return "Fair";
  return "Low";
}

// ─── Grid ─────────────────────────────────────────────────────────────────────

export function MetricGrid({ selectedDateData }) {
  const router = useRouter();
  const [visibleMetrics, setVisibleMetrics] = useState(DEFAULT_VISIBLE);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(PREFS_KEY).then((raw) => {
        if (raw) setVisibleMetrics(JSON.parse(raw));
      });
    }, []),
  );

  const hydration = selectedDateData?.hydration ?? 0;
  const mood      = selectedDateData?.mood ?? 0;
  const steps     = selectedDateData?.steps ?? 0;
  const sleep     = selectedDateData?.sleepHours ?? 0;

  const hydrationStatus = hydration === 0 ? "No data" : hydration >= 8 ? "At goal" : "Below goal";
  const stepsStatus     = steps === 0 ? "No data" : steps >= 10000 ? "Goal reached" : steps >= 5000 ? "In progress" : "Below typical";
  const sleepStatus     = sleep === 0 ? "No data" : sleep >= 8 ? "Well rested" : sleep >= 6 ? "Adequate" : "Short night";

  const tiles = {
    hydration: (
      <MetricTile
        key="hydration"
        title="Hydration"
        statusLabel={hydrationStatus}
        statusColor={hydration > 0 ? (hydration >= 8 ? "#A9334D" : "#D09F9A") : "#D1D5DB"}
        metric="hydration"
        hasData={hydration > 0}
        visual={
          <ArcRing
            progress={hydration / 8}
            valueLine1={hydration > 0 ? `${hydration}/8` : "—"}
            valueLine2={hydration > 0 ? "glasses" : ""}
          />
        }
      />
    ),
    mood: (
      <MetricTile
        key="mood"
        title="Mood"
        statusLabel={mood > 0 ? getMoodStatus(mood) : "No data"}
        statusColor={mood > 0 ? "#A9334D" : "#D1D5DB"}
        metric="mood"
        hasData={mood > 0}
        visual={<MoodCircle emoji={mood > 0 ? getMoodEmoji(mood) : "—"} />}
      />
    ),
    steps: (
      <MetricTile
        key="steps"
        title="Steps"
        statusLabel={stepsStatus}
        statusColor={steps > 0 ? (steps >= 10000 ? "#A9334D" : "#D09F9A") : "#D1D5DB"}
        metric="steps"
        hasData={steps > 0}
        visual={<StepsArc steps={steps} />}
      />
    ),
    sleep: (
      <MetricTile
        key="sleep"
        title="Sleep"
        statusLabel={sleepStatus}
        statusColor={sleep > 0 ? (sleep >= 6 ? "#A9334D" : "#D09F9A") : "#D1D5DB"}
        metric="sleep"
        hasData={sleep > 0}
        visual={<SleepVisual hours={sleep} />}
      />
    ),
  };

  const visibleTiles = METRIC_META
    .filter((m) => visibleMetrics.includes(m.key))
    .map((m) => tiles[m.key]);

  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
      {/* Section header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <Text style={{ fontFamily: fonts.semibold, fontSize: 16, color: "#1F2937" }}>
          Health Metrics
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/metric-preferences")}
          activeOpacity={0.7}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: "#F8E9E7",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LayoutGrid size={18} color="#A9334D" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Tile grid */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
        {visibleTiles}
      </View>
    </View>
  );
}
