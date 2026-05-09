import { View } from "react-native";
import { Bone } from "@/components/Skeleton/Bone";
import { useTheme } from "@/hooks/useTheme";

export function PostSkeleton() {
  const t = useTheme();
  return (
    <View
      style={{
        backgroundColor: t.surface,
        borderRadius: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 16,
        shadowColor: "#1A1A1A",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      {/* Author row */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
        <Bone width={40} height={40} borderRadius={20} style={{ marginRight: 10 }} />
        <View style={{ gap: 7 }}>
          <Bone width={120} height={12} />
          <Bone width={70} height={10} />
        </View>
      </View>

      {/* Content lines */}
      <View style={{ gap: 8, marginBottom: 14 }}>
        <Bone width="100%" height={12} />
        <Bone width="95%" height={12} />
        <Bone width="80%" height={12} />
      </View>

      {/* Category chip + action row */}
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: t.border,
          paddingTop: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 16,
        }}
      >
        <Bone width={60} height={22} borderRadius={10} />
        <View style={{ flex: 1 }} />
        <Bone width={36} height={14} borderRadius={6} />
        <Bone width={28} height={14} borderRadius={6} />
        <Bone width={20} height={14} borderRadius={6} />
      </View>
    </View>
  );
}
