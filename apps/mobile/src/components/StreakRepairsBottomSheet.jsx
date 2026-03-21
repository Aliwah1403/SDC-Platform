import React, { forwardRef, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { X, Gift, Wrench, Flame, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height } = Dimensions.get("window");

const StreakRepairsBottomSheet = forwardRef(({ onClose }, ref) => {
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => [height * 0.85], []);

  // Mock data - replace with real data later
  const repairs = {
    available: 3,
    totalUsed: 0,
    totalEarned: 3,
    nextRepairProgress: 0,
    daysUntilNext: 30,
  };

  const progressPercentage =
    (repairs.nextRepairProgress / repairs.daysUntilNext) * 100;

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={{
        backgroundColor: "#FFF9F9",
      }}
      handleIndicatorStyle={{
        backgroundColor: "#F8E9E7",
        width: 40,
      }}
    >
      <BottomSheetScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingVertical: 16,
          }}
        >
          <View style={{ width: 40 }} />
          <Text
            style={{
              fontSize: 22,
              fontWeight: "700",
              color: "#1a1a1a",
            }}
          >
            Repair Details
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#F2EFEC",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          {/* Cat Illustration */}
          <View style={{ alignItems: "center", marginVertical: 24 }}>
            <View
              style={{
                width: 180,
                height: 180,
                borderRadius: 90,
                backgroundColor: "#FFF",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              {/* Placeholder for cat with hard hat illustration */}
              <View
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  backgroundColor: "#FFD700",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Wrench size={60} color="#F59E0B" />
              </View>
            </View>
          </View>

          {/* Title */}
          <Text
            style={{
              fontSize: 32,
              fontWeight: "800",
              color: "#1a1a1a",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Streak Repairs
          </Text>

          <Text
            style={{
              fontSize: 16,
              color: "#666",
              textAlign: "center",
              marginBottom: 32,
            }}
          >
            Use repairs to bridge gaps and keep your streak alive
          </Text>

          {/* Stats Cards */}
          <View
            style={{
              backgroundColor: "#FFF",
              borderRadius: 20,
              padding: 20,
              flexDirection: "row",
              justifyContent: "space-around",
              marginBottom: 24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            {/* Available */}
            <View style={{ alignItems: "center", flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    backgroundColor: "#D1FAE5",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 8,
                  }}
                >
                  <CheckCircle2 size={18} color="#059669" />
                </View>
                <Text
                  style={{
                    fontSize: 36,
                    fontWeight: "800",
                    color: "#1a1a1a",
                  }}
                >
                  {repairs.available}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 13,
                  color: "#999",
                  fontWeight: "500",
                }}
              >
                available
              </Text>
            </View>

            {/* Total Used */}
            <View style={{ alignItems: "center", flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    backgroundColor: "#FEF3C7",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 8,
                  }}
                >
                  <AlertTriangle size={18} color="#F59E0B" />
                </View>
                <Text
                  style={{
                    fontSize: 36,
                    fontWeight: "800",
                    color: "#1a1a1a",
                  }}
                >
                  {repairs.totalUsed}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 13,
                  color: "#999",
                  fontWeight: "500",
                }}
              >
                total used
              </Text>
            </View>

            {/* Total Earned */}
            <View style={{ alignItems: "center", flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    backgroundColor: "#FEF3F2",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 8,
                  }}
                >
                  <Sparkles size={18} color="#A9334D" />
                </View>
                <Text
                  style={{
                    fontSize: 36,
                    fontWeight: "800",
                    color: "#1a1a1a",
                  }}
                >
                  {repairs.totalEarned}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 13,
                  color: "#999",
                  fontWeight: "500",
                }}
              >
                total earned
              </Text>
            </View>
          </View>

          {/* Next Repair Progress */}
          <View
            style={{
              backgroundColor: "#FFF",
              borderRadius: 20,
              padding: 20,
              marginBottom: 24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#1a1a1a",
                }}
              >
                Next Repair Progress
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#999",
                }}
              >
                {repairs.nextRepairProgress}/{repairs.daysUntilNext} days
              </Text>
            </View>

            {/* Progress Bar */}
            <View
              style={{
                height: 12,
                backgroundColor: "#E5E7EB",
                borderRadius: 6,
                overflow: "hidden",
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  height: "100%",
                  width: `${progressPercentage}%`,
                  backgroundColor: "#10B981",
                  borderRadius: 6,
                }}
              />
            </View>

            <Text
              style={{
                fontSize: 14,
                color: "#999",
              }}
            >
              {repairs.daysUntilNext - repairs.nextRepairProgress} days left to
              earn next repair
            </Text>
          </View>

          {/* How Repairs Work */}
          <View
            style={{
              backgroundColor: "#FFF",
              borderRadius: 20,
              padding: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: "#1a1a1a",
                marginBottom: 20,
              }}
            >
              How Repairs Work
            </Text>

            {/* Gift Icon Item */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                marginBottom: 20,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "#F2EFEC",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}
              >
                <Gift size={24} color="#2563EB" />
              </View>
              <Text
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: "#1a1a1a",
                  lineHeight: 22,
                  paddingTop: 4,
                }}
              >
                Earn 1 repair for every 30 consecutive days logged
              </Text>
            </View>

            {/* Wrench Icon Item */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                marginBottom: 20,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "#FEF3C7",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}
              >
                <Wrench size={24} color="#F59E0B" />
              </View>
              <Text
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: "#1a1a1a",
                  lineHeight: 22,
                  paddingTop: 4,
                }}
              >
                Use repairs to bridge gaps and preserve streak continuity
              </Text>
            </View>

            {/* Flame Icon Item */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "#FEE2E2",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}
              >
                <Flame size={24} color="#DC2626" />
              </View>
              <Text
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: "#1a1a1a",
                  lineHeight: 22,
                  paddingTop: 4,
                }}
              >
                Repairs don't add to your streak count, but keep it alive
              </Text>
            </View>
          </View>
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
});

StreakRepairsBottomSheet.displayName = "StreakRepairsBottomSheet";

export default StreakRepairsBottomSheet;
