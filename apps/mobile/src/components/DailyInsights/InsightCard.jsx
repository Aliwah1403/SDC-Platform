import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { fonts } from "@/utils/fonts";

export function InsightCard({ card }) {
  const router = useRouter();

  function handlePress() {
    if (card.type === "log-health" && card.cta) {
      router.push("/log-symptoms");
    }
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      style={{
        width: 200,
        minHeight: 170,
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        justifyContent: "space-between",
      }}
    >
      {/* Top row: emoji chip + type label */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 10,
            // backgroundColor: card.accentColor + "20",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 5,
          }}
        >
          <card.icon size={18} color={card.accentColor} strokeWidth={2} />
        </View>
        <Text
          style={{
            fontFamily: fonts.semibold,
            fontSize: 11,
            color: card.accentColor,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {card.title}
        </Text>
      </View>

      {/* Big value + unit */}
      <View style={{ flex: 1, justifyContent: "center", paddingVertical: 4 }}>
        <Text
          style={{
            fontFamily: fonts.extrabold,
            fontSize: card.value.length > 4 ? 32 : 44,
            color: "#1F2937",
            lineHeight: card.value.length > 4 ? 36 : 50,
          }}
        >
          {card.value}
        </Text>
        {card.unit ? (
          <Text
            style={{
              fontFamily: fonts.medium,
              fontSize: 13,
              color: "#6B7280",
              marginTop: 2,
            }}
          >
            {card.unit}
          </Text>
        ) : null}
      </View>

      {/* Footer: subtitle or CTA */}
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: card.accentColor + "20",
          paddingTop: 10,
          marginTop: 4,
        }}
      >
        {card.cta ? (
          <Text
            style={{
              fontFamily: fonts.semibold,
              fontSize: 13,
              color: card.accentColor,
            }}
          >
            {card.cta}
          </Text>
        ) : (
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 12,
              color: "#6B7280",
              lineHeight: 16,
            }}
            numberOfLines={2}
          >
            {card.subtitle}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
