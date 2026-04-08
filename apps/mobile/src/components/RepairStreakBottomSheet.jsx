import React, { useCallback, useRef, useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { X, Wrench, Flame, Shield } from "lucide-react-native";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import { useMissedDay, useStreakQuery, useStreakRepairMutation } from "@/hooks/queries/useStreakQuery";
import { fonts } from "@/utils/fonts";

export default function RepairStreakBottomSheet({ isVisible, onClose }) {
  const bottomSheetRef = useRef(null);
  const missedDay = useMissedDay();
  const { data: streak } = useStreakQuery();
  const repairsAvailable = streak?.repairsAvailable ?? 0;
  const healthStreak = streak?.currentStreak ?? 0;
  const repairMutation = useStreakRepairMutation();

  const [isRepairing, setIsRepairing] = useState(false);
  const [repairComplete, setRepairComplete] = useState(false);
  const [restoredStreak, setRestoredStreak] = useState(0);

  // Wrench wobble animation
  const wrenchRotation = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isVisible]);

  const handleRepair = useCallback(() => {
    setIsRepairing(true);

    Animated.sequence([
      Animated.timing(wrenchRotation, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(wrenchRotation, { toValue: -1, duration: 300, useNativeDriver: true }),
      Animated.timing(wrenchRotation, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      repairMutation.mutate(undefined, {
        onSuccess: (data) => {
          setRestoredStreak(data?.restoredStreak ?? healthStreak);
          setRepairComplete(true);
          Animated.parallel([
            Animated.spring(checkScale, { toValue: 1, useNativeDriver: true }),
            Animated.timing(successOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
          ]).start(() => {
            setTimeout(() => handleClose(), 2200);
          });
        },
        onError: () => setIsRepairing(false),
      });
    });
  }, [repairMutation, missedDay, wrenchRotation, checkScale, successOpacity]);

  const handleClose = useCallback(() => {
    setIsRepairing(false);
    setRepairComplete(false);
    setRestoredStreak(0);
    wrenchRotation.setValue(0);
    checkScale.setValue(0);
    successOpacity.setValue(0);
    onClose();
  }, [onClose, wrenchRotation, checkScale, successOpacity]);

  const rotateInterpolate = wrenchRotation.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-30deg", "30deg"],
  });

  if (!missedDay) return null;

  const canRepair = repairsAvailable > 0;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={["68%"]}
      enablePanDownToClose
      onClose={handleClose}
      backgroundStyle={{ backgroundColor: "#F8F4F0", borderRadius: 28 }}
      handleIndicatorStyle={{ backgroundColor: "#DDD8D2", width: 36 }}
    >
      <BottomSheetView style={{ flex: 1, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 }}>

        {!repairComplete ? (
          <>
            {/* Close button */}
            <TouchableOpacity
              onPress={handleClose}
              style={{
                alignSelf: "flex-end",
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: "#EDE8E3",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <X size={16} color="#7A6F6A" strokeWidth={2.5} />
            </TouchableOpacity>

            {/* Icon + headline */}
            <MotiView
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 350 }}
              style={{ alignItems: "center", marginBottom: 20 }}
            >
              {/* Icon */}
              <View style={{ marginBottom: 16 }}>
                <LinearGradient
                  colors={["#781D11", "#A9334D"]}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Flame size={38} color="#F8E9E7" strokeWidth={1.8} />
                </LinearGradient>

                {/* Repair badge */}
                <Animated.View
                  style={{
                    position: "absolute",
                    bottom: -4,
                    right: -4,
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: "#F0531C",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 2.5,
                    borderColor: "#F8F4F0",
                    transform: [{ rotate: rotateInterpolate }],
                  }}
                >
                  <Wrench size={14} color="#fff" strokeWidth={2.5} />
                </Animated.View>
              </View>

              {/* Title */}
              <Text style={{ fontFamily: fonts.extrabold, fontSize: 24, color: "#09332C", marginBottom: 6 }}>
                Streak at Risk
              </Text>

              {/* Missed date chip */}
              <View style={{ backgroundColor: "#F0E8E5", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}>
                <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: "#A9334D" }}>
                  Missed · {missedDay.formattedDate}
                </Text>
              </View>
            </MotiView>

            {/* Stats row */}
            <MotiView
              from={{ opacity: 0, translateY: 6 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 350, delay: 80 }}
              style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}
            >
              {/* Streak stat */}
              <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 16, padding: 16, alignItems: "center", borderWidth: 1, borderColor: "#EDE8E3" }}>
                <Text style={{ fontFamily: fonts.extrabold, fontSize: 30, color: "#09332C", lineHeight: 34 }}>
                  {healthStreak}
                </Text>
                <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
                  Day Streak
                </Text>
              </View>

              {/* Repairs stat */}
              <View style={{ flex: 1, backgroundColor: canRepair ? "#FEF0EB" : "#F5F5F5", borderRadius: 16, padding: 16, alignItems: "center", borderWidth: 1, borderColor: canRepair ? "#F0C4B4" : "#E5E5E5" }}>
                <Text style={{ fontFamily: fonts.extrabold, fontSize: 30, color: canRepair ? "#F0531C" : "#9CA3AF", lineHeight: 34 }}>
                  {repairsAvailable}
                </Text>
                <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
                  Repairs Left
                </Text>
              </View>
            </MotiView>

            {/* Body text */}
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: "timing", duration: 350, delay: 140 }}
              style={{ marginBottom: 24 }}
            >
              <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: "#7A6F6A", textAlign: "center", lineHeight: 21 }}>
                {canRepair
                  ? `Use 1 repair to fill the gap and keep your `
                  : "You've used all your repairs. Log today to start a fresh streak."}
                {canRepair && (
                  <Text style={{ fontFamily: fonts.bold, color: "#09332C" }}>
                    {healthStreak} day streak
                  </Text>
                )}
                {canRepair && " alive."}
              </Text>
            </MotiView>

            {/* CTA buttons */}
            <View style={{ gap: 10 }}>
              <TouchableOpacity
                onPress={handleRepair}
                disabled={isRepairing || !canRepair}
                activeOpacity={0.88}
                style={{
                  backgroundColor: canRepair ? "#F0531C" : "#E5E0DB",
                  paddingVertical: 16,
                  borderRadius: 16,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: canRepair ? "#fff" : "#A09890" }}>
                  {isRepairing ? "Repairing…" : canRepair ? "Use a Repair" : "No Repairs Left"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleClose}
                disabled={isRepairing}
                activeOpacity={0.7}
                style={{ paddingVertical: 14, alignItems: "center" }}
              >
                <Text style={{ fontFamily: fonts.semibold, fontSize: 15, color: "#9CA3AF" }}>
                  Skip for now
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* ── Success state ── */
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 0 }}>
            <Animated.View
              style={{
                opacity: successOpacity,
                transform: [{ scale: checkScale }],
                alignItems: "center",
              }}
            >
              <LinearGradient
                colors={["#09332C", "#1A5C52"]}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 24,
                }}
              >
                <Shield size={48} color="#F8E9E7" strokeWidth={1.8} />
              </LinearGradient>

              <Text style={{ fontFamily: fonts.extrabold, fontSize: 28, color: "#09332C", marginBottom: 8 }}>
                Streak Saved!
              </Text>
              <Text style={{ fontFamily: fonts.regular, fontSize: 16, color: "#7A6F6A", textAlign: "center" }}>
                Your {restoredStreak} day streak is restored 🔥
              </Text>
            </Animated.View>
          </View>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
}
