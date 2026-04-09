import React from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Bell, Search, X } from "lucide-react-native";
import { fonts } from "@/utils/fonts";

export function CommunityHeader({ postCount, searchQuery, onSearchChange, onNotifications }) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={["#D09F9A", "#A9334D", "#781D11"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        paddingTop: insets.top + 12,
        paddingBottom: 16,
        paddingHorizontal: 20,
        overflow: "hidden",
      }}
    >
      {/* Decorative circles */}
      <View
        style={{
          position: "absolute",
          width: 180,
          height: 180,
          borderRadius: 999,
          backgroundColor: "#D09F9A",
          opacity: 0.15,
          top: -60,
          right: -40,
        }}
      />
      <View
        style={{
          position: "absolute",
          width: 120,
          height: 120,
          borderRadius: 999,
          backgroundColor: "#781D11",
          opacity: 0.15,
          bottom: -20,
          left: -30,
        }}
      />

      {/* Title row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <View>
          <Text style={{ fontFamily: fonts.bold, fontSize: 24, color: "#F8E9E7" }}>
            Community
          </Text>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 13,
              color: "rgba(248,233,231,0.6)",
              marginTop: 2,
            }}
          >
            {postCount} {postCount === 1 ? "post" : "posts"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onNotifications}
          style={{
            backgroundColor: "rgba(255,255,255,0.2)",
            borderRadius: 20,
            width: 40,
            height: 40,
            alignItems: "center",
            justifyContent: "center",
          }}
          activeOpacity={0.7}
        >
          <Bell size={20} color="#F8E9E7" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "rgba(255,255,255,0.15)",
          borderRadius: 12,
          paddingHorizontal: 12,
          height: 42,
          gap: 8,
        }}
      >
        <Search size={16} color="rgba(248,233,231,0.7)" strokeWidth={2} />
        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Search posts..."
          placeholderTextColor="rgba(248,233,231,0.5)"
          style={{
            flex: 1,
            fontFamily: fonts.regular,
            fontSize: 14,
            color: "#F8E9E7",
            paddingVertical: 0,
          }}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => onSearchChange("")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={15} color="rgba(248,233,231,0.7)" strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
}
