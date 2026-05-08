import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { User } from "lucide-react-native";
import { Image } from "expo-image";
import { getStreakFireAsset } from "@/utils/streakFire";
import Svg, { Path } from "react-native-svg";
import { useRouter } from "expo-router";
import { DatePicker } from "./DatePicker";
import { Bone } from "@/components/Skeleton/Bone";
import { fonts } from "@/utils/fonts";
import { useTheme } from "@/hooks/useTheme";

const BONE_COLOR = "rgba(255,255,255,0.2)";

function MessageSkeleton() {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20, alignItems: "center", gap: 10 }}>
      <Bone width={90} height={22} borderRadius={11} color={BONE_COLOR} />
      <Bone width="75%" height={28} borderRadius={8} color={BONE_COLOR} />
      <Bone width="55%" height={28} borderRadius={8} color={BONE_COLOR} />
      <View style={{ gap: 8, width: "100%", alignItems: "center", marginTop: 2 }}>
        <Bone width="85%" height={13} borderRadius={6} color={BONE_COLOR} />
        <Bone width="70%" height={13} borderRadius={6} color={BONE_COLOR} />
      </View>
    </View>
  );
}

const { width } = Dimensions.get("window");

const AbstractShape = ({ style }) => (
  <View
    style={[
      {
        position: "absolute",
        borderRadius: 999,
        opacity: 0.1,
      },
      style,
    ]}
  />
);

export function HomeHeader({
  insets,
  gradientColors,
  hasLoggedData,
  formatNavDate,
  selectedDate,
  healthStreak,
  setSelectedDate,
  isToday,
  isFuture,
  isSelected,
  message,
  isMessageLoading = false,
}) {
  const router = useRouter();
  const t = useTheme();
  return (
    <View style={{ position: "relative" }}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: insets.top,
          paddingBottom: 60,
        }}
      >
        {/* Abstract shapes */}
        <AbstractShape
          style={{
            width: 200,
            height: 200,
            backgroundColor: hasLoggedData ? "#D09F9A" : "#D8D8D8",
            top: -60,
            right: -40,
          }}
        />
        <AbstractShape
          style={{
            width: 150,
            height: 150,
            backgroundColor: hasLoggedData ? "#781D11" : "#B8B8B8",
            bottom: 20,
            left: -30,
          }}
        />

        {/* Navbar */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 20,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontFamily: fonts.bold,
              fontSize: 18,
              color: "#FFFFFF",
            }}
          >
            {formatNavDate(selectedDate)}
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TouchableOpacity
              onPress={() => router.push("/streak-modal")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(255, 255, 255, 0.25)",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
              }}
            >
              <Image
                source={getStreakFireAsset(healthStreak)}
                style={{ width: 15, height: 20 }}
                contentFit="contain"
              />
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

        {/* Weekly Date Picker */}
        <DatePicker
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          isToday={isToday}
          isFuture={isFuture}
          isSelected={isSelected}
        />

        {/* Today's Forecast */}
        {isMessageLoading ? (
          <MessageSkeleton />
        ) : (
          <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20, alignItems: "center" }}>
            {message.label && (
              <View
                style={{
                  alignSelf: "center",
                  backgroundColor: "rgba(255,255,255,0.2)",
                  borderRadius: 20,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.semibold,
                    fontSize: 11,
                    color: "rgba(255,255,255,0.9)",
                    letterSpacing: 0.8,
                  }}
                >
                  {message.label}
                </Text>
              </View>
            )}

            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 28,
                color: "#FFFFFF",
                lineHeight: 34,
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              {message.headline}
            </Text>

            {message.body && (
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 13,
                  color: "rgba(255,255,255,0.8)",
                  lineHeight: 19,
                  marginBottom: 10,
                  textAlign: "center",
                }}
              >
                {message.body}
              </Text>
            )}

            {message.basis && (
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 12,
                  color: "rgba(255,255,255,0.55)",
                  textAlign: "center",
                }}
              >
                {message.basis}
              </Text>
            )}
          </View>
        )}

      </LinearGradient>
      

      {/* Curved bottom edge */}
      <Svg
        height="50"
        width={width}
        style={{ position: "absolute", bottom: 0 }}
      >
        <Path
          d={`M0,0 Q${width / 2},50 ${width},0 L${width},50 L0,50 Z`}
          fill={t.background}
        />
      </Svg>
    </View>
  );
}
