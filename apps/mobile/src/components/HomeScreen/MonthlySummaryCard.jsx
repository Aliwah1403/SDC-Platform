import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Svg, { Path, Circle } from "react-native-svg";
import { useRouter } from "expo-router";
import { fonts } from "@/utils/fonts";

const SPARK_W = 90;
const SPARK_H = 36;

function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildPrevMonthData(healthData) {
  const today = new Date();
  const year = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
  const monthIndex = today.getMonth() === 0 ? 11 : today.getMonth() - 1;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, monthIndex, i + 1);
    const dateStr = toDateStr(d);
    const entry = healthData.find((e) => e.date === dateStr);
    return {
      painLevel: entry?.painLevel ?? 0,
      hydration: entry?.hydration ?? 0,
      mood: entry?.mood ?? 0,
    };
  });
}

function MonthSparkline({ data }) {
  const values = data.map((d) => d.painLevel);
  const hasData = values.some((v) => v > 0);
  const max = Math.max(...values, 1);

  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * SPARK_W,
    y: hasData ? SPARK_H - Math.max((v / max) * SPARK_H, 2) : SPARK_H / 2,
  }));

  const tension = 0.3;
  let linePath = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const prev = pts[Math.max(i - 1, 0)];
    const cur = pts[i];
    const next = pts[i + 1];
    const after = pts[Math.min(i + 2, pts.length - 1)];
    const cp1x = cur.x + (next.x - prev.x) * tension;
    const cp1y = cur.y + (next.y - prev.y) * tension;
    const cp2x = next.x - (after.x - cur.x) * tension;
    const cp2y = next.y - (after.y - cur.y) * tension;
    linePath += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${next.x.toFixed(1)},${next.y.toFixed(1)}`;
  }

  const lastPt = pts[pts.length - 1];
  const fillPath = `${linePath} L${lastPt.x},${SPARK_H} L${pts[0].x},${SPARK_H} Z`;

  return (
    <Svg width={SPARK_W} height={SPARK_H}>
      <Path d={fillPath} fill="rgba(255,255,255,0.1)" />
      <Path
        d={linePath}
        stroke="rgba(255,255,255,0.65)"
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={lastPt.x} cy={lastPt.y} r={2.5} fill="#FFFFFF" opacity={0.85} />
    </Svg>
  );
}

function StatBlock({ value, label }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 4,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.bold,
          fontSize: 20,
          color: "#FFFFFF",
          lineHeight: 24,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontFamily: fonts.regular,
          fontSize: 10,
          color: "rgba(255,255,255,0.55)",
          textAlign: "center",
          marginTop: 3,
          lineHeight: 13,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export function MonthlySummaryCard({ healthData }) {
  const router = useRouter();

  const today = new Date();
  if (today.getDate() !== 1) return null;

  const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const prevMonthName = prevMonthDate.toLocaleDateString("en-US", { month: "long" });

  const data = buildPrevMonthData(healthData);

  const daysLogged = data.filter(
    (d) => d.painLevel > 0 || d.hydration > 0 || d.mood > 0,
  ).length;
  const goodDays = data.filter((d) => d.painLevel > 0 && d.painLevel <= 3).length;

  const painDays = data.filter((d) => d.painLevel > 0);
  const avgPainLevel =
    painDays.length > 0
      ? (painDays.reduce((s, d) => s + d.painLevel, 0) / painDays.length).toFixed(1)
      : "—";

  const hydrationDays = data.filter((d) => d.hydration > 0);
  const avgHydration =
    hydrationDays.length > 0
      ? (hydrationDays.reduce((s, d) => s + d.hydration, 0) / hydrationDays.length).toFixed(1)
      : "—";

  let current = 0;
  let bestStreak = 0;
  data.forEach((d) => {
    if (d.painLevel > 0 && d.painLevel < 5) {
      current++;
      bestStreak = Math.max(bestStreak, current);
    } else if (d.painLevel >= 5) {
      current = 0;
    }
  });

  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
      <Text
        style={{
          fontFamily: fonts.bold,
          fontSize: 17,
          color: "#09332C",
          marginBottom: 10,
        }}
      >
        Health Recap
      </Text>

      <LinearGradient
        colors={["#D09F9A", "#A9334D", "#781D11"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 22, overflow: "hidden" }}
      >
        {/* Abstract floating circles */}
        <View
          pointerEvents="none"
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <View style={{ position: "absolute", top: -30, right: -20, width: 150, height: 150, borderRadius: 75, backgroundColor: "rgba(255,255,255,0.10)" }} />
          <View style={{ position: "absolute", top: 10, right: 90, width: 85, height: 85, borderRadius: 42, backgroundColor: "rgba(208,159,154,0.30)" }} />
          <View style={{ position: "absolute", top: -15, left: 40, width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.07)" }} />
          <View style={{ position: "absolute", top: 45, left: -25, width: 95, height: 95, borderRadius: 48, backgroundColor: "rgba(255,255,255,0.09)" }} />
          <View style={{ position: "absolute", top: 55, right: 10, width: 65, height: 65, borderRadius: 32, backgroundColor: "rgba(120,29,17,0.45)" }} />
          <View style={{ position: "absolute", top: 20, left: 130, width: 55, height: 55, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.13)" }} />
        </View>

        {/* Spacer — circles-only zone */}
        <View style={{ height: 110 }} />

        {/* Frosted glass panel */}
        <BlurView intensity={22} tint="dark" style={{ overflow: "hidden" }}>
          <View style={{ backgroundColor: "rgba(10,0,4,0.18)", padding: 16 }}>

            {/* Month name + sparkline */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-end",
                justifyContent: "space-between",
                marginBottom: 2,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 32,
                  color: "#FFFFFF",
                  lineHeight: 36,
                }}
              >
                {prevMonthName}
              </Text>
              <View style={{ alignItems: "flex-end", paddingBottom: 2 }}>
                <MonthSparkline data={data} />
                <Text
                  style={{
                    fontFamily: fonts.regular,
                    fontSize: 9,
                    color: "rgba(255,255,255,0.4)",
                    marginTop: 3,
                  }}
                >
                  pain trend
                </Text>
              </View>
            </View>

            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 13,
                color: "rgba(255,255,255,0.6)",
                marginBottom: 14,
              }}
            >
              {daysLogged} of {data.length} days logged
            </Text>

            {/* Stat blocks */}
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
              <StatBlock value={avgPainLevel} label={"avg\npain"} />
              <StatBlock value={avgHydration} label={"avg\nhydration"} />
              <StatBlock value={String(goodDays)} label={"low-pain\ndays"} />
              <StatBlock value={`${bestStreak}d`} label={"best\nstreak"} />
            </View>

            {/* CTA */}
            <TouchableOpacity
              onPress={() => router.push("/health-insights")}
              activeOpacity={0.8}
              style={{
                backgroundColor: "rgba(255,255,255,0.14)",
                borderRadius: 12,
                paddingVertical: 11,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: 14,
                  color: "#FFFFFF",
                }}
              >
                View {prevMonthName} insights →
              </Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </LinearGradient>
    </View>
  );
}
