import { ScrollView, TouchableOpacity, Text } from "react-native";
import { fonts } from "@/utils/fonts";

export const FEED_FILTERS = [
  { id: "popular", label: "Popular" },
  { id: "recent", label: "Recent" },
  { id: "mine", label: "My Posts" },
  { id: "saved", label: "Saved" },
];

export function FeedFilter({ active, onSelect }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
        alignItems: "center",
      }}
      style={{ backgroundColor: "#F8F4F0", flexGrow: 0 }}
    >
      {FEED_FILTERS.map((filter) => {
        const isActive = active === filter.id;
        return (
          <TouchableOpacity
            key={filter.id}
            onPress={() => onSelect(filter.id)}
            activeOpacity={0.75}
            style={{
              backgroundColor: isActive ? "#A9334D" : "#FFFFFF",
              borderRadius: 20,
              borderWidth: 1,
              borderColor: isActive ? "#A9334D" : "#E2D9D6",
              paddingHorizontal: 16,
              height: 34,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontFamily: fonts.semibold,
                fontSize: 13,
                color: isActive ? "#F8E9E7" : "#09332C",
              }}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
