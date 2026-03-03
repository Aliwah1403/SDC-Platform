import React from "react";
import { ScrollView, TouchableOpacity, Text, View } from "react-native";

export function DatePicker({
  dates,
  selectedDate,
  setSelectedDate,
  formatDatePickerDay,
  formatDatePickerDate,
  isToday,
  isFuture,
  isSelected,
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
      style={{ flexGrow: 0 }}
    >
      {dates.map((date, index) => {
        const future = isFuture(date);
        const selected = isSelected(date, selectedDate);
        const todayDate = isToday(date);

        return (
          <TouchableOpacity
            key={index}
            onPress={() => !future && setSelectedDate(date)}
            disabled={future}
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 8,
              paddingHorizontal: 10,
              marginHorizontal: 6,
              borderRadius: 20,
              backgroundColor: selected
                ? "rgba(255, 255, 255, 0.35)"
                : todayDate
                  ? "rgba(255, 255, 255, 0.2)"
                  : "transparent",
              opacity: future ? 0.4 : 1,
              minWidth: 45,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: "#FFFFFF",
                marginBottom: 4,
                opacity: 0.9,
              }}
            >
              {formatDatePickerDay(date)}
            </Text>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#FFFFFF",
              }}
            >
              {formatDatePickerDate(date)}
            </Text>
            {todayDate && (
              <View
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: "#FFFFFF",
                  marginTop: 6,
                }}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
