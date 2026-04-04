import React from "react";
import { ScrollView, TouchableOpacity, Text } from "react-native";
import { fonts } from "@/utils/fonts";

export const COMMUNITY_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "wins", label: "Wins" },
  { id: "tips", label: "Tips" },
  { id: "questions", label: "Questions" },
  { id: "pain", label: "Pain & Treatment" },
  { id: "new", label: "New to SCD" },
  { id: "research", label: "Research" },
];

export function CategoryFilter({ active, onSelect }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
      style={{ backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#F0EAE8" }}
    >
      {COMMUNITY_CATEGORIES.map((cat) => {
        const isActive = active === cat.id;
        return (
          <TouchableOpacity
            key={cat.id}
            onPress={() => onSelect(cat.id)}
            activeOpacity={0.75}
            style={{
              backgroundColor: isActive ? "#A9334D" : "#F8E9E7",
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 7,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.semibold,
                fontSize: 13,
                color: isActive ? "#F8E9E7" : "#09332C",
              }}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
