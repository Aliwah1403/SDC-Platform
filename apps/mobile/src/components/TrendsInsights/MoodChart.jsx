import React from "react";
import { View, Text } from "react-native";
import { LineGraph } from "react-native-graph";

export function MoodChart({ moodData, graphWidth, chartData }) {
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
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 4,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#1F2937" }}>
          Mood Patterns
        </Text>
        <View
          style={{
            backgroundColor: "#FEF3C7",
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 12,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#D97706" }}>
            Last 30 days
          </Text>
        </View>
      </View>
      <Text style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>
        Your emotional well-being over time
      </Text>

      <LineGraph
        points={moodData}
        color="#D97706"
        animated={true}
        enablePanGesture={true}
        style={{
          width: "100%",
          height: "100%",
        }}
        xLength={moodData.length}
        height={200}
        width={graphWidth}
        gradientFillColors={["rgba(217, 119, 6, 0.1)", "rgba(217, 119, 6, 0)"]}
      />

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          marginTop: 16,
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: "#F3F4F6",
        }}
      >
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 11, color: "#6B7280", marginBottom: 2 }}>
            😊 Excellent
          </Text>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#10B981" }}>
            {chartData.filter((d) => d.mood === 5).length}d
          </Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 11, color: "#6B7280", marginBottom: 2 }}>
            😐 Fair
          </Text>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#F59E0B" }}>
            {chartData.filter((d) => d.mood === 3).length}d
          </Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 11, color: "#6B7280", marginBottom: 2 }}>
            😔 Poor
          </Text>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#DC2626" }}>
            {chartData.filter((d) => d.mood <= 2 && d.mood > 0).length}d
          </Text>
        </View>
      </View>
    </View>
  );
}
