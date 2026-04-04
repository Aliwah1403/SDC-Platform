import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PenLine } from "lucide-react-native";
import { fonts } from "@/utils/fonts";

export function CommunityHeader({ onCompose }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        backgroundColor: "#09332C",
        paddingTop: insets.top + 16,
        paddingBottom: 18,
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <View>
        <Text
          style={{
            fontFamily: fonts.bold,
            fontSize: 26,
            color: "#F8E9E7",
            lineHeight: 32,
          }}
        >
          Community
        </Text>
        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: 13,
            color: "#F8E9E766",
            marginTop: 2,
          }}
        >
          Connect with others living with SCD
        </Text>
      </View>

      <TouchableOpacity
        onPress={onCompose}
        style={{
          backgroundColor: "#A9334D",
          borderRadius: 24,
          width: 44,
          height: 44,
          alignItems: "center",
          justifyContent: "center",
        }}
        activeOpacity={0.8}
      >
        <PenLine size={20} color="#F8E9E7" strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
}
