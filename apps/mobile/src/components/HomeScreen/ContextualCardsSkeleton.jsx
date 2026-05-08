import { View } from "react-native";
import { Bone } from "@/components/Skeleton/Bone";
import { useTheme } from "@/hooks/useTheme";

function AppointmentCardSkeleton() {
  const t = useTheme();
  return (
    <View
      style={{
        backgroundColor: t.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: t.border,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
      }}
    >
      {/* Date block */}
      <Bone width={52} height={72} borderRadius={12} />

      {/* Content */}
      <View style={{ flex: 1, gap: 8 }}>
        <Bone width={72} height={20} borderRadius={10} />
        <Bone width="80%" height={14} />
        <Bone width="60%" height={12} />
        <Bone width="70%" height={11} />
      </View>

      {/* Countdown block */}
      <Bone width={52} height={72} borderRadius={12} />
    </View>
  );
}

function MedicationCardSkeleton() {
  const t = useTheme();
  return (
    <View
      style={{
        backgroundColor: t.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: t.border,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 16,
          padding: 16,
          paddingBottom: 14,
        }}
      >
        {/* Ring placeholder */}
        <Bone width={76} height={76} borderRadius={38} />

        <View style={{ flex: 1, gap: 9 }}>
          <Bone width="60%" height={15} />
          <Bone width="45%" height={12} />
          <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
            <Bone width={52} height={24} borderRadius={12} />
            <Bone width={76} height={24} borderRadius={12} />
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: t.border, marginHorizontal: 16 }} />

      {/* Med rows */}
      {[0, 1].map((i) => (
        <View key={i}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 14,
              gap: 12,
            }}
          >
            <Bone width={42} height={42} borderRadius={12} />
            <View style={{ flex: 1, gap: 7 }}>
              <Bone width="55%" height={13} />
              <Bone width="40%" height={11} />
            </View>
            <Bone width={36} height={13} />
          </View>
          {i === 0 && (
            <View style={{ height: 1, backgroundColor: t.border, marginLeft: 70 }} />
          )}
        </View>
      ))}
    </View>
  );
}

export function ContextualCardsSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 16, gap: 16 }}>
      <View>
        <View style={{ marginBottom: 10 }}>
          <Bone width={180} height={17} />
        </View>
        <AppointmentCardSkeleton />
      </View>
      <MedicationCardSkeleton />
    </View>
  );
}
