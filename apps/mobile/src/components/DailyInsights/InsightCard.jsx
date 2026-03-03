import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

export function InsightCard({ card }) {
  return (
    <TouchableOpacity
      style={{
        width: 280,
        backgroundColor: card.bgColor,
        borderRadius: 20,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: card.iconBgColor,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Text style={{ fontSize: 24 }}>{card.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: "#1a1a1a",
              marginBottom: 4,
            }}
          >
            {card.title}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: "#666",
            }}
          >
            {card.subtitle}
          </Text>
        </View>
      </View>

      {card.type === "log-symptoms" && (
        <View
          style={{
            marginTop: 8,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: "rgba(0,0,0,0.08)",
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: card.iconBgColor,
            }}
          >
            Tap to log →
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
