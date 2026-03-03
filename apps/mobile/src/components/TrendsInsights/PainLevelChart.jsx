import React from "react";
import { View, Text } from "react-native";
// LineGraph (react-native-graph/Skia) disabled for Expo Go — requires dev build

export function PainLevelChart({
  painLevelData,
  graphWidth,
  avgPainLevel,
  chartData,
}) {
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

      <View style={{ height: 200, backgroundColor: "#FEF2F2", borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#FECACA", borderStyle: "dashed" }}>
        <Text style={{ fontSize: 13, color: "#DC2626", opacity: 0.5 }}>Chart placeholder</Text>
      </View>

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
            {Math.max(...chartData.map((d) => d.painLevel))}
          </Text>
        </View>
        <View>
          <Text style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>
            Lowest
          </Text>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#10B981" }}>
            {Math.min(
              ...chartData
                .filter((d) => d.painLevel > 0)
                .map((d) => d.painLevel),
            ) || 0}
          </Text>
        </View>
      </View>
    </View>
  );
}
