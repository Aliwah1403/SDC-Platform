import React from "react";
import { View, Text } from "react-native";
// LineGraph (react-native-graph/Skia) disabled for Expo Go — requires dev build

export function HydrationChart({ hydrationData, graphWidth, avgHydration }) {
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
          Hydration Levels
        </Text>
        <View
          style={{
            backgroundColor: "#DBEAFE",
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 12,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#2563EB" }}>
            Last 30 days
          </Text>
        </View>
      </View>
      <Text style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>
        Monitor your daily water intake (glasses)
      </Text>

      <View style={{ height: 200, backgroundColor: "#EFF6FF", borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#BFDBFE", borderStyle: "dashed" }}>
        <Text style={{ fontSize: 13, color: "#2563EB", opacity: 0.5 }}>Chart placeholder</Text>
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
            Daily Avg
          </Text>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#1F2937" }}>
            {avgHydration}
          </Text>
        </View>
        <View>
          <Text style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>
            Goal
          </Text>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#2563EB" }}>
            8
          </Text>
        </View>
      </View>
    </View>
  );
}
