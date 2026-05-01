import { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import Svg, { Circle, Rect, Path, G, Defs, ClipPath } from "react-native-svg";
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

// ─── Hydration: vertical fill tank ───────────────────────────────────────────

function HydrationTank({ hydration, goal = 8 }) {
  const W = 44;
  const H = 80;
  const R = 10;
  const progress = Math.min(hydration / goal, 1);
  const fillH = H * progress;
  const fillY = H - fillH;

  return (
    <View style={{ alignItems: "center", gap: 6 }}>
      <Svg width={W} height={H}>
        <Defs>
          <ClipPath id="tankClip">
            <Rect x={0} y={0} width={W} height={H} rx={R} ry={R} />
          </ClipPath>
        </Defs>
        {/* Track */}
        <Rect x={0} y={0} width={W} height={H} rx={R} ry={R} fill="#F8E9E7" />
        {/* Fill */}
        {progress > 0 && (
          <Rect
            x={0}
            y={fillY}
            width={W}
            height={fillH}
            rx={progress === 1 ? R : 0}
            ry={progress === 1 ? R : 0}
            fill="#A9334D"
            clipPath="url(#tankClip)"
          />
        )}
        {/* Outline */}
        <Rect
          x={1}
          y={1}
          width={W - 2}
          height={H - 2}
          rx={R - 1}
          ry={R - 1}
          fill="none"
          stroke="#F0E4E1"
          strokeWidth={2}
        />
        {/* Level markers (every 2 glasses) */}
        {[0.25, 0.5, 0.75].map((frac) => (
          <Rect
            key={frac}
            x={6}
            y={H * (1 - frac) - 0.5}
            width={W - 12}
            height={1}
            fill={fillY <= H * (1 - frac) ? "#FFFFFF40" : "#D09F9A60"}
          />
        ))}
      </Svg>
      <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: "#781D11" }}>
        {hydration > 0 ? `${hydration} / ${goal}` : "—"}
      </Text>
    </View>
  );
}

// ─── Mood: emoji with colored halo ───────────────────────────────────────────

const MOOD_HALO = {
  5: "#F8E9E7",
  4: "#F8E9E7",
  3: "#FFF8F0",
  2: "#F8F4F0",
  1: "#F8F4F0",
};

function MoodHalo({ mood }) {
  const emoji = mood >= 5 ? "😄" : mood >= 4 ? "🙂" : mood >= 3 ? "😐" : mood >= 2 ? "😔" : "😞";
  const haloBg = mood > 0 ? (MOOD_HALO[mood] ?? "#F8E9E7") : "#F3F4F6";
  const haloSize = 88;
  const innerSize = 64;

  return (
    <View style={{ width: haloSize, height: haloSize, alignItems: "center", justifyContent: "center" }}>
      {/* Outer soft halo */}
      <View
        style={{
          position: "absolute",
          width: haloSize,
          height: haloSize,
          borderRadius: haloSize / 2,
          backgroundColor: haloBg,
        }}
      />
      {/* Inner ring */}
      <View
        style={{
          position: "absolute",
          width: innerSize,
          height: innerSize,
          borderRadius: innerSize / 2,
          backgroundColor: mood > 0 ? "#FFFFFF" : "#F8F4F0",
          shadowColor: "#A9334D",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: mood > 0 ? 0.1 : 0,
          shadowRadius: 6,
          elevation: 0,
        }}
      />
      <Text style={{ fontSize: 36 }}>{mood > 0 ? emoji : "—"}</Text>
    </View>
  );
}

// ─── Steps: semicircle speedometer ───────────────────────────────────────────

function StepsGauge({ steps, goal = 10000 }) {
  const size = 90;
  const cx = size / 2;
  const cy = size / 2 + 8; // shift center down so arc sits at bottom
  const r = 36;
  const strokeWidth = 8;
  const progress = Math.min(steps / goal, 1);

  // Half-circle: from 180° to 0° (left to right along the bottom)
  const startAngle = Math.PI;
  const endAngle = 0;
  const totalArc = Math.PI; // 180°
  const filledArc = totalArc * progress;

  function polarToXY(angle, radius) {
    return {
      x: cx + radius * Math.cos(angle),
      y: cy - radius * Math.sin(angle),
    };
  }

  const trackStart = polarToXY(startAngle, r);
  const trackEnd = polarToXY(endAngle, r);
  const fillEnd = polarToXY(startAngle + filledArc, r);

  const trackPath = `M ${trackStart.x} ${trackStart.y} A ${r} ${r} 0 0 1 ${trackEnd.x} ${trackEnd.y}`;
  const fillPath =
    progress > 0
      ? `M ${trackStart.x} ${trackStart.y} A ${r} ${r} 0 ${filledArc > Math.PI / 2 ? 1 : 0} 1 ${fillEnd.x} ${fillEnd.y}`
      : null;

  const shortSteps =
    steps >= 1000 ? `${(steps / 1000).toFixed(1)}k` : steps > 0 ? String(steps) : "—";

  return (
    <View style={{ width: size, height: size / 2 + 16, alignItems: "center" }}>
      <Svg width={size} height={size / 2 + 16} style={{ position: "absolute", bottom: 0 }}>
        <Path d={trackPath} stroke="#F0E4E1" strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
        {fillPath && (
          <Path d={fillPath} stroke="#A9334D" strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
        )}
      </Svg>
      <View style={{ position: "absolute", bottom: 14, alignItems: "center" }}>
        <Text style={{ fontFamily: fonts.extrabold, fontSize: 22, color: "#781D11", lineHeight: 26 }}>
          {shortSteps}
        </Text>
        {steps > 0 && (
          <Text style={{ fontFamily: fonts.regular, fontSize: 10, color: "#9CA3AF" }}>
            / 10k
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── Sleep: crescent moon + stars ────────────────────────────────────────────

function SleepMoon({ hours }) {
  const size = 88;
  // Crescent: large circle minus offset circle (clip approach via two circles)
  const moonR = 28;
  const moonCx = size / 2;
  const moonCy = size / 2;
  const cutCx = moonCx + 14;
  const cutCy = moonCy - 8;
  const cutR = 22;

  // Star positions (small dots)
  const stars = [
    { x: 68, y: 18, r: 2.5 },
    { x: 20, y: 24, r: 1.8 },
    { x: 72, y: 50, r: 1.5 },
    { x: 14, y: 54, r: 2 },
    { x: 56, y: 72, r: 1.5 },
  ];

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <Defs>
          <ClipPath id="moonClip">
            {/* Full moon circle */}
            <Circle cx={moonCx} cy={moonCy} r={moonR} />
          </ClipPath>
        </Defs>
        {/* Stars */}
        {stars.map((s, i) => (
          <Circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#D09F9A" opacity={0.7} />
        ))}
        {/* Moon base */}
        <Circle cx={moonCx} cy={moonCy} r={moonR} fill="#F8E9E7" />
        {/* Cut-out to create crescent */}
        <Circle cx={cutCx} cy={cutCy} r={cutR} fill="#FFFFFF" clipPath="url(#moonClip)" />
        {/* Moon face glow */}
        <Circle cx={moonCx - 6} cy={moonCy + 4} r={moonR - 10} fill="#F0E4E1" opacity={0.5} />
      </Svg>
      <View style={{ position: "absolute", alignItems: "center" }}>
        <Text style={{ fontFamily: fonts.extrabold, fontSize: 20, color: "#781D11", lineHeight: 24 }}>
          {hours > 0 ? hours : "—"}
        </Text>
        {hours > 0 && (
          <Text style={{ fontFamily: fonts.regular, fontSize: 10, color: "#9CA3AF" }}>hrs</Text>
        )}
      </View>
    </View>
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
        visual={<HydrationTank hydration={hydration} />}
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
        visual={<MoodHalo mood={mood} />}
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
        visual={<StepsGauge steps={steps} />}
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
        visual={<SleepMoon hours={sleep} />}
      />
    ),
  };

  const visibleTiles = METRIC_META
    .filter((m) => visibleMetrics.includes(m.key))
    .map((m) => tiles[m.key]);

  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
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

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
        {visibleTiles}
      </View>
    </View>
  );
}
