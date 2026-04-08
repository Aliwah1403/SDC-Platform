import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { X, Gift, Wrench, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react-native";
import { StreakFireIcon } from "@/utils/streakFire";
import { useStreakQuery } from "@/hooks/queries/useStreakQuery";

const { height } = Dimensions.get("window");

export default function StreakRepairsScreen() {
  const router = useRouter();
  const { data: streak } = useStreakQuery();

  const daysTarget = streak?.daysUntilNextRepair ?? 30;
  const repairProgress = streak?.repairProgress ?? 0;

  const repairs = {
    available: streak?.repairsAvailable ?? 0,
    totalUsed: streak?.repairsUsed ?? 0,
    totalEarned: streak?.repairsEarned ?? 0,
    nextRepairProgress: repairProgress,
    daysUntilNext: daysTarget,
  };

  const progressPercentage = Math.min((repairProgress / daysTarget) * 100, 100);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
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
        <Text style={{ fontSize: 22, fontWeight: "700", color: "#1a1a1a" }}>
          Repair Details
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "#F3F4F6",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Illustration */}
        <View style={{ alignItems: "center", marginVertical: 24 }}>
          <View
            style={{
              width: 180,
              height: 180,
              borderRadius: 90,
              // backgroundColor: "#F9FAFB",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                // backgroundColor: "#FFF9C4",
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
            backgroundColor: "#F9FAFB",
            borderRadius: 20,
            padding: 20,
            flexDirection: "row",
            justifyContent: "space-around",
            marginBottom: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
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
                style={{ fontSize: 36, fontWeight: "800", color: "#1a1a1a" }}
              >
                {repairs.available}
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: "#999", fontWeight: "500" }}>
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
                style={{ fontSize: 36, fontWeight: "800", color: "#1a1a1a" }}
              >
                {repairs.totalUsed}
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: "#999", fontWeight: "500" }}>
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
                style={{ fontSize: 36, fontWeight: "800", color: "#1a1a1a" }}
              >
                {repairs.totalEarned}
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: "#999", fontWeight: "500" }}>
              total earned
            </Text>
          </View>
        </View>

        {/* Next Repair Progress */}
        <View
          style={{
            backgroundColor: "#F9FAFB",
            borderRadius: 20,
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
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#1a1a1a" }}>
              Next Repair Progress
            </Text>
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#999" }}>
              {repairs.nextRepairProgress}/{repairs.daysUntilNext} days
            </Text>
          </View>

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

          <Text style={{ fontSize: 14, color: "#999" }}>
            {repairs.daysUntilNext - repairs.nextRepairProgress} days left to
            earn next repair
          </Text>
        </View>

        {/* How Repairs Work */}
        <View
          style={{
            backgroundColor: "#F9FAFB",
            borderRadius: 20,
            padding: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
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
              Earn 1 repair for every {daysTarget} consecutive days logged
            </Text>
          </View>

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

          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
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
              <StreakFireIcon size={36} />
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
      </ScrollView>
    </SafeAreaView>
  );
}
