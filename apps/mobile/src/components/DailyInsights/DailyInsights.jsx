import React from "react";
import { View, Text, ScrollView } from "react-native";
import { InsightCard } from "./InsightCard";

export function DailyInsights({ insightCards }) {
  return (
    <View
      style={{
        paddingTop: 30,
        paddingBottom: 20,
      }}
    >
      <Text
        style={{
          fontSize: 20,
          fontWeight: "700",
          color: "#09332C",
          marginBottom: 16,
          paddingHorizontal: 20,
        }}
      >
        My daily insights
      </Text>

      {/* Horizontal Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          gap: 12,
        }}
        style={{ flexGrow: 0 }}
      >
        {insightCards.map((card) => (
          <InsightCard key={card.id} card={card} />
        ))}
      </ScrollView>
    </View>
  );
}
