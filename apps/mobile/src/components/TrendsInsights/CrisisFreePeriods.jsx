import React from "react";
import { useTheme } from "@/hooks/useTheme";
import { View, Text } from "react-native";

export function CrisisFreePeriods({ crisisPeriods }) {
  const t = useTheme();
  return (
    <View
      style={{
        backgroundColor: t.surface,
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
        <Text style={{ fontSize: 18, fontWeight: "700", color: t.text }}>
          Crisis-Free Periods
        </Text>
        <View
          style={{
            backgroundColor: "#F8E9E7",
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 12,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#A9334D" }}>
            Low pain days
          </Text>
        </View>
      </View>
      <Text style={{ fontSize: 13, color: t.textSecondary, marginBottom: 24 }}>
        Days with pain level below 5
      </Text>

      <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
        <View style={{ alignItems: "center" }}>
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: "#F8E9E7",
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 4,
              borderColor: "#A9334D",
            }}
          >
            <Text
              style={{
                fontSize: 32,
                fontWeight: "700",
                color: "#781D11",
              }}
            >
              {crisisPeriods.current}
            </Text>
            <Text style={{ fontSize: 11, color: t.textSecondary, marginTop: 2 }}>
              days
            </Text>
          </View>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: t.text,
              marginTop: 12,
            }}
          >
            Current Streak
          </Text>
        </View>

        <View style={{ alignItems: "center" }}>
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: t.isDark ? t.surfaceElevated : "#F8F4F0",
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 4,
              borderColor: "#D09F9A",
            }}
          >
            <Text
              style={{
                fontSize: 32,
                fontWeight: "700",
                color: "#781D11",
              }}
            >
              {crisisPeriods.longest}
            </Text>
            <Text style={{ fontSize: 11, color: t.textSecondary, marginTop: 2 }}>
              days
            </Text>
          </View>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: t.text,
              marginTop: 12,
            }}
          >
            Longest Streak
          </Text>
        </View>
      </View>

      <View
        style={{
          marginTop: 20,
          padding: 16,
          backgroundColor: t.isDark ? t.surfaceElevated : "#F9FAFB",
          borderRadius: 12,
        }}
      >
        <Text style={{ fontSize: 13, color: t.textSecondary, textAlign: "center" }}>
          {crisisPeriods.current > 0
            ? `${crisisPeriods.current} crisis-free days and counting. Keep it going.`
            : "Keep tracking to build your crisis-free streak."}
        </Text>
      </View>
    </View>
  );
}
