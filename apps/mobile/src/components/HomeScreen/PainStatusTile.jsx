import { useMemo } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { fonts } from "@/utils/fonts";
import { useTheme } from "@/hooks/useTheme";
import { Card } from "@/components/Card";
import { HomeLineChart } from "@/components/Charts/line-chart";
import { useMetricGoalsQuery } from "@/hooks/queries/useMetricGoalsQuery";
import { DEFAULT_SUGGESTED_ML } from "@/utils/hydrationGoal";

// Tinted-chip colors aligned with the app's pain scale (green → yellow →
// orange → red, see PainOrb.jsx / log-symptoms.jsx getPainColor). Text uses a
// darker shade of each hue for contrast on a light card — raw scale colors
// like #FDE047 (yellow) are unreadable as text on white. "No data" reuses the
// neutral gray convention from sibling MetricGrid tiles (e.g. MoodHalo's
// mood===0 state) instead of an alarm color.
function getPainStatus(painLevel) {
  if (painLevel === 0)
    return { label: "No data", bg: "#F3F4F6", color: "#9CA3AF" };
  if (painLevel <= 3) return { label: "Low pain", bg: "#10B98120", color: "#059669" };
  if (painLevel <= 6) return { label: "Moderate", bg: "#FDE04730", color: "#CA8A04" };
  if (painLevel <= 8) return { label: "High", bg: "#F59E0B22", color: "#C2410C" };
  return { label: "Severe", bg: "#EF444422", color: "#DC2626" };
}

function computeScore(data, goalMl) {
  if (!data) return null;
  const pain = (10 - (data.painLevel || 0)) * 0.4;
  const mood = ((data.mood || 0) / 5) * 10 * 0.3;
  const hydration = Math.min((data.hydration || 0) / goalMl, 1) * 10 * 0.3;
  return Math.round((pain + mood + hydration) * 10) / 10;
}

export function PainStatusTile({ selectedDateData, healthData }) {
  const router = useRouter();
  const t = useTheme();
  const { data: metricGoals } = useMetricGoalsQuery();
  const hydrationGoalMl = metricGoals?.hydration ?? DEFAULT_SUGGESTED_ML;
  const painLevel = selectedDateData?.painLevel ?? 0;
  const status = getPainStatus(painLevel);
  const score = computeScore(selectedDateData, hydrationGoalMl);

  const chartData = useMemo(() => {
    const today = new Date();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const dateStr = d.toISOString().split("T")[0];
      const entry = healthData.find((e) => e.date === dateStr);
      return { x: i, y: entry?.painLevel ?? 0, label: days[d.getDay()] };
    });
  }, [healthData]);

  return (
    <Card
      onPress={
        selectedDateData
          ? () =>
              router.push({
                pathname: "/metric-detail",
                params: { metric: "pain", date: selectedDateData.date },
              })
          : undefined
      }
      style={{
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 20,
      }}
    >
      {/* Header row */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Text
          style={{ fontFamily: fonts.bold, fontSize: 16, color: t.text }}
        >
          Pain Status
        </Text>
        {selectedDateData && (
          <View
            style={{
              backgroundColor: status.bg,
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.semibold,
                fontSize: 11,
                color: status.color,
              }}
            >
              {status.label}
            </Text>
          </View>
        )}
      </View>

      {selectedDateData ? (
        <>
          {/* Pain number */}
          <Text
            style={{
              fontFamily: fonts.extrabold,
              fontSize: 56,
              color: t.text,
              lineHeight: 60,
              marginBottom: 4,
            }}
          >
            {painLevel}
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 22,
                color: t.textSecondary,
              }}
            >
              {" "}
              / 10
            </Text>
          </Text>

          {/* Sparkline — burgundy accent, matching the progress-visual color
              used by sibling home tiles (HydrationTank fill, StepsGauge arc) */}
          <View style={{ marginLeft: -12, marginBottom: 16 }}>
            <HomeLineChart
              data={chartData}
              config={{
                height: 80,
                showGrid: false,
                animated: true,
                duration: 800,
                showYLabels: false,
                showXLabels: false,
                padding: 16,
                primaryColor: "#A9334D",
              }}
            />
          </View>

          {/* Footer row: 7-day label + wellbeing score */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 12,
                color: t.textSecondary,
              }}
            >
              Last 7 days
            </Text>
            {score !== null && (
              <View
                style={{
                  backgroundColor: "#A9334D14",
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.semibold,
                    fontSize: 12,
                    color: "#A9334D",
                  }}
                >
                  Wellbeing: {score}/10
                </Text>
              </View>
            )}
          </View>
        </>
      ) : (
        <View style={{ paddingVertical: 16, alignItems: "center" }}>
          <Text
            style={{
              fontFamily: fonts.bold,
              fontSize: 17,
              color: t.text,
              marginBottom: 6,
              textAlign: "center",
            }}
          >
            No pain data for this day
          </Text>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 14,
              color: t.textSecondary,
              textAlign: "center",
            }}
          >
            Log today to track your pain status
          </Text>
        </View>
      )}
    </Card>
  );
}
