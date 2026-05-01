import { useMemo } from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { useRouter } from "expo-router";
import { fonts } from "@/utils/fonts";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function getPainStatus(painLevel) {
  if (painLevel === 0) return { label: "No data", color: "rgba(255,255,255,0.5)" };
  if (painLevel <= 3)  return { label: "Low pain",  color: "#D09F9A" };
  if (painLevel <= 6)  return { label: "Moderate",  color: "#F8E9E7" };
  if (painLevel <= 8)  return { label: "High",      color: "#F8E9E7" };
  return                      { label: "Severe",    color: "#F8E9E7" };
}

function computeScore(data) {
  if (!data) return null;
  const pain = (10 - (data.painLevel || 0)) * 0.4;
  const mood = ((data.mood || 0) / 5) * 10 * 0.3;
  const hydration = Math.min((data.hydration || 0) / 8, 1) * 10 * 0.3;
  return Math.round((pain + mood + hydration) * 10) / 10;
}

export function PainStatusTile({ selectedDateData, healthData }) {
  const router = useRouter();
  const painLevel = selectedDateData?.painLevel ?? 0;
  const status = getPainStatus(painLevel);
  const score = computeScore(selectedDateData);

  const sparklineData = useMemo(() => {
    const today = new Date();
    const points = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const entry = healthData.find((e) => e.date === dateStr);
      points.push({ value: entry?.painLevel ?? 0 });
    }
    return points;
  }, [healthData]);

  const chartWidth = SCREEN_WIDTH - 32 - 40;

  return (
    <TouchableOpacity
      activeOpacity={selectedDateData ? 0.85 : 1}
      onPress={() =>
        selectedDateData &&
        router.push({ pathname: "/metric-detail", params: { metric: "pain" } })
      }
      style={{
        backgroundColor: "#781D11",
        borderRadius: 20,
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 20,
        overflow: "hidden",
      }}
    >
      {/* Decorative circles */}
      <View
        style={{
          position: "absolute",
          width: 180,
          height: 180,
          borderRadius: 90,
          backgroundColor: "rgba(208,159,154,0.08)",
          top: -50,
          right: -30,
        }}
      />

      {/* Header row */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: "#FFFFFF" }}>
          Pain Status
        </Text>
        {selectedDateData && (
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.15)",
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
              color: "#FFFFFF",
              lineHeight: 60,
              marginBottom: 4,
            }}
          >
            {painLevel}
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 22,
                color: "rgba(255,255,255,0.6)",
              }}
            >
              {" "}/ 10
            </Text>
          </Text>

          {/* Sparkline */}
          <View style={{ marginLeft: -12, marginBottom: 16 }}>
            <LineChart
              data={sparklineData}
              width={chartWidth}
              height={60}
              color="rgba(208,159,154,0.8)"
              thickness={2}
              curved
              hideDataPoints
              hideYAxisText
              hideAxesAndRules
              backgroundColor="transparent"
              initialSpacing={8}
              spacing={Math.floor(chartWidth / 8)}
              maxValue={10}
              noOfSections={2}
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
                color: "rgba(255,255,255,0.5)",
              }}
            >
              Last 7 days
            </Text>
            {score !== null && (
              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.12)",
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.semibold,
                    fontSize: 12,
                    color: "rgba(255,255,255,0.85)",
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
              color: "#FFFFFF",
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
              color: "rgba(255,255,255,0.6)",
              textAlign: "center",
            }}
          >
            Log today to track your pain status
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
