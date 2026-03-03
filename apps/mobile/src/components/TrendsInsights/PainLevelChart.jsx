import { View, Text, Dimensions } from "react-native";
import { LineChart } from "react-native-gifted-charts";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
// Card has 16px margin each side + 20px padding each side inside
const GRAPH_WIDTH = SCREEN_WIDTH - 32;
const CHART_WIDTH = GRAPH_WIDTH - 40;

export function PainLevelChart({ painLevelData, avgPainLevel, chartData }) {
  const giftedData = painLevelData.map((d, i) => ({
    value: d.value,
    label: i % 7 === 0 ? new Date(d.date).getDate().toString() : "",
    labelTextStyle: { color: "#9CA3AF", fontSize: 9 },
  }));

  const highest = Math.max(...chartData.map((d) => d.painLevel));
  const lowestLogged = Math.min(
    ...chartData.filter((d) => d.painLevel > 0).map((d) => d.painLevel),
  );

  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {/* Title row */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 4,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#1F2937" }}>
          Pain Level Trends
        </Text>
        <View
          style={{
            backgroundColor: "#FEE2E2",
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 12,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#DC2626" }}>
            Last 30 days
          </Text>
        </View>
      </View>
      <Text style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>
        Track your pain levels over time
      </Text>

      {/* Chart */}
      <View style={{ marginLeft: -8 }}>
        <LineChart
          data={giftedData}
          width={CHART_WIDTH}
          height={160}
          color="#DC2626"
          thickness={2}
          curved
          dataPointsColor="#DC2626"
          dataPointsRadius={3}
          hideDataPoints={false}
          noOfSections={5}
          maxValue={10}
          yAxisColor="transparent"
          xAxisColor="#E5E7EB"
          rulesColor="#F3F4F6"
          rulesType="solid"
          initialSpacing={8}
          spacing={Math.max(4, Math.floor(CHART_WIDTH / 32))}
          yAxisTextStyle={{ color: "#9CA3AF", fontSize: 9 }}
          xAxisLabelTextStyle={{ color: "#9CA3AF", fontSize: 9 }}
          backgroundColor="transparent"
          hideYAxisText={false}
          yAxisLabelWidth={24}
        />
      </View>

      {/* Stats row */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 16,
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: "#F3F4F6",
        }}
      >
        <View>
          <Text style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>
            Average
          </Text>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#1F2937" }}>
            {avgPainLevel}
          </Text>
        </View>
        <View>
          <Text style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>
            Highest
          </Text>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#DC2626" }}>
            {highest}
          </Text>
        </View>
        <View>
          <Text style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>
            Lowest
          </Text>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#10B981" }}>
            {isFinite(lowestLogged) ? lowestLogged : 0}
          </Text>
        </View>
      </View>
    </View>
  );
}
