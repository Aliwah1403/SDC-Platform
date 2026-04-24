import React, { useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Flame, RotateCcw } from "lucide-react-native";
import { fonts } from "@/utils/fonts";
import { usePostHog } from "posthog-react-native";

export default function LostStreakModal({ visible, lostStreak = 0, onClose }) {
  const posthog = usePostHog();
  const flameScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      posthog?.capture('streak_lost', { streak_days: lostStreak });
      Animated.spring(flameScale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }).start();
    } else {
      flameScale.setValue(0.8);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(9, 51, 44, 0.6)",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 28,
        }}
      >
        <MotiView
          from={{ opacity: 0, scale: 0.92, translateY: 16 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          transition={{ type: "spring", damping: 18, stiffness: 200 }}
          style={{
            backgroundColor: "#F8F4F0",
            borderRadius: 28,
            paddingHorizontal: 28,
            paddingTop: 36,
            paddingBottom: 28,
            width: "100%",
            alignItems: "center",
          }}
        >
          {/* Broken flame icon */}
          <Animated.View style={{ transform: [{ scale: flameScale }], marginBottom: 20 }}>
            <LinearGradient
              colors={["#781D11", "#A9334D"]}
              style={{
                width: 88,
                height: 88,
                borderRadius: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Flame size={42} color="#F8E9E7" strokeWidth={1.6} />
            </LinearGradient>

            {/* Broken badge */}
            <View
              style={{
                position: "absolute",
                bottom: -4,
                right: -4,
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: "#6B7280",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2.5,
                borderColor: "#F8F4F0",
              }}
            >
              <Text style={{ fontSize: 14 }}>💔</Text>
            </View>
          </Animated.View>

          {/* Streak count pill */}
          <View
            style={{
              backgroundColor: "#F0E8E5",
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 6,
              marginBottom: 16,
            }}
          >
            <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: "#A9334D" }}>
              {lostStreak}-day streak lost
            </Text>
          </View>

          {/* Headline */}
          <Text
            style={{
              fontFamily: fonts.extrabold,
              fontSize: 26,
              color: "#09332C",
              textAlign: "center",
              marginBottom: 10,
            }}
          >
            Your streak ended
          </Text>

          {/* Body */}
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 14,
              color: "#7A6F6A",
              textAlign: "center",
              lineHeight: 22,
              marginBottom: 28,
            }}
          >
            You had a strong {lostStreak}-day run — that's real progress.{"\n"}
            Every comeback starts with one log.
          </Text>

          {/* Start Fresh CTA */}
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.88}
            style={{ width: "100%", marginBottom: 12 }}
          >
            <LinearGradient
              colors={["#781D11", "#A9334D"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 16,
                borderRadius: 16,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <RotateCcw size={18} color="#F8E9E7" strokeWidth={2.2} />
              <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: "#F8E9E7" }}>
                Start Fresh Today
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Dismiss */}
          <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={{ paddingVertical: 8 }}>
            <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: "#9CA3AF" }}>
              Maybe later
            </Text>
          </TouchableOpacity>
        </MotiView>
      </View>
    </Modal>
  );
}
