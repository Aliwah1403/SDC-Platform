import { View, Text, TouchableOpacity } from "react-native";
import { User } from "lucide-react-native";
import { useRouter } from "expo-router";
import { fonts } from "@/utils/fonts";
import { Image } from "expo-image";
import { getStreakFireAsset } from "@/utils/streakFire";

export function CompactNavbar({ date, healthStreak, insets }) {
  const router = useRouter();
  return (
    <View
      style={{
        backgroundColor: "rgba(169, 51, 77, 0.88)",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(248, 233, 231, 0.25)",
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

      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <TouchableOpacity
          onPress={() => router.push("/streak-modal")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
          }}
        >
          <Image source={getStreakFireAsset(healthStreak)} style={{ width: 32, height: 32 }} contentFit="contain" />
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

        <TouchableOpacity
          onPress={() => router.push("/(tabs)/profile")}
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <User size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
