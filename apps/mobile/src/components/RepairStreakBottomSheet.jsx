import React, { useCallback, useRef, useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { X, Wrench } from "lucide-react-native";
import { useAppStore } from "@/store/appStore";

export default function RepairStreakBottomSheet({ isVisible, onClose }) {
  const bottomSheetRef = useRef(null);
  const missedDay = useAppStore((state) => state.missedDay);
  const repairsAvailable = useAppStore((state) => state.repairsAvailable);
  const healthStreak = useAppStore((state) => state.healthStreak);
  const useStreakRepair = useAppStore((state) => state.useStreakRepair);
  const dismissMissedDay = useAppStore((state) => state.dismissMissedDay);

  const [isRepairing, setIsRepairing] = useState(false);
  const [repairComplete, setRepairComplete] = useState(false);

  // Animation values
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

    // Wrench rotation animation
    Animated.sequence([
      Animated.timing(wrenchRotation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(wrenchRotation, {
        toValue: -1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(wrenchRotation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Actually apply the repair
      const result = useStreakRepair();

      if (result.success) {
        setRepairComplete(true);

        // Success animations
        Animated.parallel([
          Animated.spring(checkScale, {
            toValue: 1,
            useNativeDriver: true,
          }),
          Animated.timing(successOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Auto close after showing success
          setTimeout(() => {
            handleClose();
          }, 2000);
        });
      } else {
        setIsRepairing(false);
        // Could show error state here
      }
    });
  }, [useStreakRepair, wrenchRotation, checkScale, successOpacity]);

  const handleClose = useCallback(() => {
    dismissMissedDay();
    setIsRepairing(false);
    setRepairComplete(false);
    wrenchRotation.setValue(0);
    checkScale.setValue(0);
    successOpacity.setValue(0);
    onClose();
  }, [dismissMissedDay, onClose, wrenchRotation, checkScale, successOpacity]);

  const rotateInterpolate = wrenchRotation.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-30deg", "30deg"],
  });

  if (!missedDay) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={["65%"]}
      enablePanDownToClose
      onClose={handleClose}
      backgroundStyle={{ backgroundColor: "#FFF9F0" }}
    >
      <BottomSheetView style={{ flex: 1, padding: 24 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#1F2937" }}>
            Repair Your Streak
          </Text>
          <TouchableOpacity onPress={handleClose}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {!repairComplete ? (
          <>
            {/* Wrench Icon with Animation */}
            <View style={{ alignItems: "center", marginVertical: 32 }}>
              <Animated.View
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: "#FEF3C7",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: [{ rotate: rotateInterpolate }],
                }}
              >
                <Wrench size={48} color="#F59E0B" />
              </Animated.View>
            </View>

            {/* Message */}
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "700",
                  color: "#1F2937",
                  textAlign: "center",
                  marginBottom: 12,
                }}
              >
                You missed a day
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  color: "#6B7280",
                  textAlign: "center",
                  lineHeight: 24,
                }}
              >
                You didn't log your health on{"\n"}
                <Text style={{ fontWeight: "600", color: "#1F2937" }}>
                  {missedDay.formattedDate}
                </Text>
              </Text>
            </View>

            {/* Stats Card */}
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                padding: 20,
                marginBottom: 24,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View
                style={{ flexDirection: "row", justifyContent: "space-around" }}
              >
                <View style={{ alignItems: "center" }}>
                  <Text
                    style={{
                      fontSize: 28,
                      fontWeight: "700",
                      color: "#DC2626",
                    }}
                  >
                    {healthStreak}
                  </Text>
                  <Text
                    style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}
                  >
                    Current Streak
                  </Text>
                </View>
                <View style={{ width: 1, backgroundColor: "#E5E7EB" }} />
                <View style={{ alignItems: "center" }}>
                  <Text
                    style={{
                      fontSize: 28,
                      fontWeight: "700",
                      color: "#F59E0B",
                    }}
                  >
                    {repairsAvailable}
                  </Text>
                  <Text
                    style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}
                  >
                    Repairs Available
                  </Text>
                </View>
              </View>
            </View>

            {/* Info Text */}
            <Text
              style={{
                fontSize: 14,
                color: "#6B7280",
                textAlign: "center",
                marginBottom: 24,
                lineHeight: 20,
              }}
            >
              Use 1 repair to fill the gap and keep your{" "}
              <Text style={{ fontWeight: "600", color: "#DC2626" }}>
                {healthStreak} day streak
              </Text>{" "}
              alive
            </Text>

            {/* CTA Buttons */}
            <View style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={handleRepair}
                disabled={isRepairing || repairsAvailable <= 0}
                style={{
                  backgroundColor: repairsAvailable > 0 ? "#F59E0B" : "#D1D5DB",
                  paddingVertical: 16,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 16,
                    fontWeight: "700",
                  }}
                >
                  {isRepairing ? "Repairing..." : "Use Repair"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleClose}
                disabled={isRepairing}
                style={{
                  paddingVertical: 16,
                  borderRadius: 12,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                }}
              >
                <Text
                  style={{
                    color: "#6B7280",
                    fontSize: 16,
                    fontWeight: "600",
                  }}
                >
                  Maybe Later
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* Success State */
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <Animated.View
              style={{
                opacity: successOpacity,
                transform: [{ scale: checkScale }],
              }}
            >
              <View
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  backgroundColor: "#10B981",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 24,
                }}
              >
                <Check size={64} color="#FFFFFF" strokeWidth={3} />
              </View>
            </Animated.View>

            <Animated.View
              style={{ opacity: successOpacity, alignItems: "center" }}
            >
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "700",
                  color: "#1F2937",
                  marginBottom: 12,
                }}
              >
                Streak Restored!
              </Text>
              <Text
                style={{ fontSize: 16, color: "#6B7280", textAlign: "center" }}
              >
                Your {healthStreak} day streak is safe
              </Text>
            </Animated.View>
          </View>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
}
