import { View, Text, TouchableOpacity } from "react-native";
import { Flame } from "lucide-react-native";
import { useRouter } from "expo-router";
import { fonts } from "@/utils/fonts";

export function CompactNavbar({ date, healthStreak, insets }) {
  const router = useRouter();
  return (
    <View
      style={{
        backgroundColor: "rgba(93, 29, 212, 0.88)",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(204, 194, 233, 0.25)",
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
          fontFamily: fonts.bold,
          fontSize: 16,
          color: "#FFFFFF",
        }}
      >
        {date}
      </Text>

      <TouchableOpacity
        onPress={() => router.push('/streak-modal')}
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
            fontFamily: fonts.bold,
            fontSize: 14,
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
