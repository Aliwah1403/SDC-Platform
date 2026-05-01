import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { TrendingUp } from "lucide-react-native";
import { fonts } from "@/utils/fonts";

function getMoodSummary(chartData) {
  const logged = chartData.filter((d) => d.mood > 0);
  if (logged.length === 0) return null;
  const goodDays = logged.filter((d) => d.mood >= 4).length;
  return goodDays / logged.length >= 0.6 ? "mostly positive" : "variable";
}

export function MonthlySummaryCard({ chartData, avgPainLevel }) {
  const router = useRouter();

  const monthName = new Date().toLocaleDateString("en-US", { month: "long" });
  const daysLogged = chartData.filter(
    (d) => d.painLevel > 0 || d.hydration > 0 || d.mood > 0,
  ).length;
  const moodSummary = getMoodSummary(chartData);

  const parts = [];
  if (parseFloat(avgPainLevel) > 0) parts.push(`avg pain ${avgPainLevel}/10`);
  parts.push(`${daysLogged}/30 days logged`);
  if (moodSummary) parts.push(`mood ${moodSummary}`);

  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingTop: 4,
        marginBottom: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: fonts.semibold,
            fontSize: 14,
            color: "#781D11",
            marginBottom: 2,
          }}
        >
          {monthName}
        </Text>
        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: 12,
            color: "#9CA3AF",
            lineHeight: 17,
          }}
        >
          {parts.join(" · ")}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => router.push("/health-insights")}
        activeOpacity={0.8}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
        }}
      >
        <TrendingUp size={13} color="#A9334D" strokeWidth={2} />
        <Text
          style={{
            fontFamily: fonts.semibold,
            fontSize: 13,
            color: "#A9334D",
          }}
        >
          Full analysis →
        </Text>
      </TouchableOpacity>
    </View>
  );
}
