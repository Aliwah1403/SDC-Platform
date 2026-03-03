import { View, Text, TouchableOpacity } from "react-native";
import { Flame } from "lucide-react-native";

export function CompactNavbar({ date, healthStreak, insets, bottomSheetRef }) {
  return (
    <View
      style={{
        backgroundColor: "rgba(9, 51, 44, 0.88)",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(247, 223, 186, 0.25)",
        paddingTop: insets.top,
        paddingBottom: 12,
        paddingHorizontal: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Text
        style={{
          fontSize: 16,
          fontWeight: "700",
          color: "#FFFFFF",
        }}
      >
        {date}
      </Text>

      <TouchableOpacity
        onPress={() => bottomSheetRef.current?.snapToIndex(0)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "rgba(255, 255, 255, 0.2)",
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 20,
        }}
      >
        <Flame size={16} color="#FFFFFF" />
        <Text
          style={{
            fontSize: 14,
            fontWeight: "700",
            color: "#FFFFFF",
            marginLeft: 4,
          }}
        >
          {healthStreak}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
