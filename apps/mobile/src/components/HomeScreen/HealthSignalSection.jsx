import { useState, useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MotiView } from "moti";
import Svg, { Path, Circle } from "react-native-svg";
import { useRouter } from "expo-router";
import { fonts } from "@/utils/fonts";
import { toLocalDateStr } from "@/utils/dateUtils";

const ACCENT = {
  concern: "#A9334D",
  vocRisk: "#781D11",
};

function PainSparkline({ data, color }) {
  const W = 76;
  const H = 38;
  const hasData = data.some((v) => v > 0);
  const max = Math.max(...data, 1);

  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: hasData ? H - Math.max((v / max) * H, 2) : H / 2,
  }));

  const tension = 0.35;
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const prev = pts[Math.max(i - 1, 0)];
    const cur = pts[i];
    const next = pts[i + 1];
    const after = pts[Math.min(i + 2, pts.length - 1)];
    const cp1x = cur.x + (next.x - prev.x) * tension;
    const cp1y = cur.y + (next.y - prev.y) * tension;
    const cp2x = next.x - (after.x - cur.x) * tension;
    const cp2y = next.y - (after.y - cur.y) * tension;
    d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${next.x.toFixed(1)},${next.y.toFixed(1)}`;
  }

  return (
    <Svg width={W} height={H}>
      <Path
        d={d}
        stroke={color}
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.5}
      />
      {pts.map((p, i) => (
        <Circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === pts.length - 1 ? 2.5 : 1.5}
          fill={color}
          opacity={i === pts.length - 1 ? 0.9 : 0.3}
        />
      ))}
    </Svg>
  );
}

export function HealthSignalSection({ alertState, healthData }) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();

  if (!alertState || (alertState.level !== "concern" && !alertState.vocRisk)) {
    return null;
  }

  const accent = alertState.vocRisk ? ACCENT.vocRisk : ACCENT.concern;
  const label = alertState.vocRisk ? "PAIN FLARE RISK" : "PATTERN DETECTED";
  const triggerLabels = [
    ...new Set(alertState.triggers?.map((t) => t.reason) ?? []),
  ];

  const sparkData = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const entry = healthData.find((e) => e.date === toLocalDateStr(d));
      return entry?.painLevel ?? 0;
    });
  }, [healthData]);

  return (
    <MotiView
      from={{ opacity: 0, translateY: -6 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 300 }}
      style={{ marginHorizontal: 16, marginBottom: 16 }}
    >
      <View
        style={{
          flexDirection: "row",
          backgroundColor: "#FFF0ED",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {/* Left accent bar */}
        <View style={{ width: 4, backgroundColor: accent }} />

        <View style={{ flex: 1, padding: 16 }}>
          {/* Header row: label + sparkline */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <View style={{ flex: 1, paddingRight: 12 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 7,
                  marginBottom: 6,
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.semibold,
                    fontSize: 10,
                    color: accent,
                    letterSpacing: 0.9,
                  }}
                >
                  {label}
                </Text>
                {alertState.vocRisk && (
                  <View
                    style={{
                      backgroundColor: `${accent}18`,
                      borderRadius: 20,
                      paddingHorizontal: 7,
                      paddingVertical: 2,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: fonts.medium,
                        fontSize: 10,
                        color: accent,
                      }}
                    >
                      Pain flare
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: 14,
                  color: "#09332C",
                  lineHeight: 20,
                }}
              >
                {alertState.message}
              </Text>
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <PainSparkline data={sparkData} color={accent} />
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 9,
                  color: accent,
                  opacity: 0.55,
                  marginTop: 3,
                }}
              >
                7-day pain
              </Text>
            </View>
          </View>

          {/* Expanded: trigger pills + CTA */}
          {expanded && (
            <MotiView
              from={{ opacity: 0, translateY: -4 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 200 }}
            >
              {triggerLabels.length > 0 && (
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 6,
                    marginBottom: alertState.callToAction ? 12 : 4,
                  }}
                >
                  {triggerLabels.map((t, i) => (
                    <View
                      key={i}
                      style={{
                        backgroundColor: `${accent}14`,
                        borderRadius: 20,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: fonts.regular,
                          fontSize: 12,
                          color: accent,
                        }}
                      >
                        {t}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              {alertState.callToAction && (
                <TouchableOpacity
                  onPress={() => router.push("/log-symptoms")}
                  activeOpacity={0.7}
                  style={{ alignSelf: "flex-start" }}
                >
                  <Text
                    style={{
                      fontFamily: fonts.semibold,
                      fontSize: 13,
                      color: accent,
                    }}
                  >
                    {alertState.callToAction} →
                  </Text>
                </TouchableOpacity>
              )}
            </MotiView>
          )}

          {/* Expand toggle */}
          {triggerLabels.length > 0 && (
            <TouchableOpacity
              onPress={() => setExpanded((e) => !e)}
              activeOpacity={0.7}
              style={{ marginTop: 10, alignSelf: "flex-start" }}
            >
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 12,
                  color: accent,
                  opacity: 0.65,
                }}
              >
                {expanded
                  ? "Show less"
                  : `${triggerLabels.length} trigger${triggerLabels.length !== 1 ? "s" : ""} detected — see more`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </MotiView>
  );
}
