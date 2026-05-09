import { View } from "react-native";
import { Bone } from "@/components/Skeleton/Bone";
import { useTheme } from "@/hooks/useTheme";

function WorkoutRowSkeleton({ isLast }) {
  const t = useTheme();
  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 14,
        }}
      >
        <Bone width={44} height={44} borderRadius={12} style={{ marginRight: 12 }} />
        <View style={{ flex: 1, gap: 8 }}>
          <Bone width="50%" height={14} />
          <Bone width="35%" height={11} />
          <View style={{ flexDirection: "row", gap: 10, marginTop: 2 }}>
            <Bone width={52} height={12} borderRadius={6} />
            <Bone width={60} height={12} borderRadius={6} />
          </View>
        </View>
      </View>
      {!isLast && (
        <View style={{ height: 1, backgroundColor: t.border, marginLeft: 72 }} />
      )}
    </View>
  );
}

export function ActivitySkeleton() {
  const t = useTheme();
  return (
    <View
      style={{
        backgroundColor: t.surface,
        borderRadius: 20,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <WorkoutRowSkeleton />
      <WorkoutRowSkeleton isLast />
    </View>
  );
}
