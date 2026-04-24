import { TouchableOpacity, View, Text, ImageBackground } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { fonts } from "@/utils/fonts";

export function CategoryCard({
  category,
  postCount = 0,
  isFollowing = false,
  onPress,
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      style={{ width: 255, marginRight: 12 }}
    >
      {/* Photo card */}
      <ImageBackground
        source={{ uri: category.photo }}
        style={{
          width: 255,
          height: 200,
          borderRadius: 16,
          overflow: "hidden",
        }}
        imageStyle={{ borderRadius: 16 }}
        resizeMode="cover"
      >
        {/* Following badge */}
        {isFollowing && (
          <View
            style={{
              margin: 10,
              alignSelf: "flex-start",
              backgroundColor: "rgba(0,0,0,0.45)",
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 3,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.semibold,
                fontSize: 10,
                color: "#FFFFFF",
              }}
            >
              Following
            </Text>
          </View>
        )}

        {/* Bottom scrim — ensures card edges look clean */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.18)"]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 60,
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
          }}
        />
      </ImageBackground>

      {/* Name + post count below the card */}
      <Text
        numberOfLines={2}
        style={{
          fontFamily: fonts.semibold,
          fontSize: 13,
          color: "#09332C",
          marginTop: 8,
          lineHeight: 18,
        }}
      >
        {category.label}
      </Text>
      <Text
        style={{
          fontFamily: fonts.regular,
          fontSize: 11,
          color: "#9C8D8A",
          marginTop: 2,
        }}
      >
        {postCount} {postCount === 1 ? "post" : "posts"}
      </Text>
    </TouchableOpacity>
  );
}
