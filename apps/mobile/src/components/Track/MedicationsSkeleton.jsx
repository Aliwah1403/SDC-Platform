import { View } from "react-native";
import { Bone } from "@/components/Skeleton/Bone";
import { useTheme } from "@/hooks/useTheme";

function MedicationRowSkeleton({ isLast }) {
  const t = useTheme();
  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: t.surface,
          borderRadius: 14,
          padding: 14,
          marginBottom: 10,
        }}
      >
        <Bone width={36} height={36} borderRadius={10} style={{ marginRight: 12 }} />
        <View style={{ flex: 1, gap: 7 }}>
          <Bone width="50%" height={14} />
          <Bone width="38%" height={12} />
        </View>
        <Bone width={28} height={28} borderRadius={8} />
      </View>
    </View>
  );
}

export function MedicationsSkeleton() {
  return (
    <View style={{ marginTop: 24, paddingHorizontal: 16 }}>
      <Bone width={160} height={18} style={{ marginBottom: 14 }} />
      <MedicationRowSkeleton />
      <MedicationRowSkeleton />
      <MedicationRowSkeleton isLast />
    </View>
  );
}
