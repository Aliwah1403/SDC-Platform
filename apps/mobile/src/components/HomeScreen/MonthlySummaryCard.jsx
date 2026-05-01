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
        marginHorizontal: 16,
        marginBottom: 16,
        backgroundColor: "#F8F4F0",
        borderRadius: 16,
        padding: 18,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: fonts.bold,
              fontSize: 18,
              color: "#781D11",
              marginBottom: 4,
            }}
          >
            {monthName}
          </Text>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 13,
              color: "#6B7280",
              lineHeight: 18,
            }}
          >
            {parts.join(" · ")}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => router.push("/health-insights")}
        activeOpacity={0.8}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          marginTop: 14,
          alignSelf: "flex-start",
          backgroundColor: "#FFFFFF",
          borderRadius: 100,
          paddingHorizontal: 14,
          paddingVertical: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 3,
          elevation: 2,
        }}
      >
        <TrendingUp size={14} color="#A9334D" strokeWidth={2} />
        <Text
          style={{
            fontFamily: fonts.semibold,
            fontSize: 13,
            color: "#A9334D",
          }}
        >
          See full analysis →
        </Text>
      </TouchableOpacity>
    </View>
  );
}
