import React from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Flame } from "lucide-react-native";
import Svg, { Path } from "react-native-svg";
import { DatePicker } from "./DatePicker";

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
  bottomSheetRef,
  dates,
  setSelectedDate,
  formatDatePickerDay,
  formatDatePickerDate,
  isToday,
  isFuture,
  isSelected,
  message,
}) {
  return (
    <View style={{ position: "relative" }}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: insets.top,
          paddingBottom: 40,
        }}
      >
        {/* Abstract shapes */}
        <AbstractShape
          style={{
            width: 200,
            height: 200,
            backgroundColor: hasLoggedData ? "#5DD9D0" : "#D8D8D8",
            top: -60,
            right: -40,
          }}
        />
        <AbstractShape
          style={{
            width: 150,
            height: 150,
            backgroundColor: hasLoggedData ? "#3A9A92" : "#B8B8B8",
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
              fontSize: 18,
              fontWeight: "700",
              color: "#FFFFFF",
            }}
          >
            {formatNavDate(selectedDate)}
          </Text>

          {/* Streak Icon - Now Touchable */}
          <TouchableOpacity
            onPress={() => bottomSheetRef.current?.snapToIndex(0)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "rgba(255, 255, 255, 0.25)",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
            }}
          >
            <Flame size={18} color="#FFFFFF" />
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

        {/* Horizontal Date Picker */}
        <DatePicker
          dates={dates}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          formatDatePickerDay={formatDatePickerDay}
          formatDatePickerDate={formatDatePickerDate}
          isToday={isToday}
          isFuture={isFuture}
          isSelected={isSelected}
        />

        {/* Dynamic Message Section */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 24,
            paddingBottom: 20,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "500",
              color: "#FFFFFF",
              opacity: 0.9,
              marginBottom: 8,
            }}
          >
            {message.title}
          </Text>
          <Text
            style={{
              fontSize: 40,
              fontWeight: "700",
              color: "#FFFFFF",
              marginBottom: 16,
            }}
          >
            {message.subtitle}
          </Text>

          {/* Action message or button */}
          {!hasLoggedData && isToday(selectedDate) && (
            <TouchableOpacity
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.3)",
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#FFFFFF",
                  marginRight: 4,
                }}
              >
                Your health data is important
              </Text>
              <Text style={{ fontSize: 16, color: "#FFFFFF" }}>→</Text>
            </TouchableOpacity>
          )}

          {hasLoggedData && (
            <TouchableOpacity
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.3)",
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#FFFFFF",
                  marginRight: 4,
                }}
              >
                Keep up the good work!
              </Text>
              <Text style={{ fontSize: 16, color: "#FFFFFF" }}>→</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Log Health Button */}
        {!hasLoggedData && isToday(selectedDate) && (
          <View style={{ alignItems: "center", paddingBottom: 20 }}>
            <TouchableOpacity
              style={{
                backgroundColor: "#FFFFFF",
                paddingHorizontal: 32,
                paddingVertical: 14,
                borderRadius: 25,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: hasLoggedData ? "#4ECDC4" : "#888",
                }}
              >
                Log health
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>

      {/* Curved Bottom Edge */}
      <Svg
        height="40"
        width={width}
        style={{
          position: "absolute",
          bottom: 0,
        }}
      >
        <Path
          d={`M0,0 Q${width / 2},40 ${width},0 L${width},40 L0,40 Z`}
          fill={hasLoggedData ? "#3A9A92" : "#C0C0C0"}
        />
      </Svg>
    </View>
  );
}
