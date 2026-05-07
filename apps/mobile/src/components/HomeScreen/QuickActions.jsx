import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { fonts } from "@/utils/fonts";
import { ChevronRight, NotebookPen, Flame, Pill } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";

export function QuickActions({ medications = [] }) {
  const router = useRouter();
  const t = useTheme();
  const hasMeds = medications.length > 0;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 16,
        gap: 5,
        paddingBottom: 4,
      }}
      style={{ flexGrow: 0, marginBottom: 16 }}
    >
      <TouchableOpacity
        onPress={() => router.push("/log-symptoms")}
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
          backgroundColor: "#A9334D",
          borderRadius: 10,
          paddingHorizontal: 13,
          paddingVertical: 7,
        }}
        activeOpacity={0.8}
      >
        <NotebookPen size={15} color="#FFFFFF" />
        <Text
          style={{ fontFamily: fonts.semibold, fontSize: 14, color: "#FFFFFF" }}
        >
          Log today
        </Text>
        <ChevronRight size={16} color="#FFFFFF" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/log-symptoms")}
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
          backgroundColor: t.surface,
          borderRadius: 10,
          paddingHorizontal: 13,
          paddingVertical: 7,
          borderWidth: 1.5,
          borderColor: t.border,
        }}
        activeOpacity={0.8}
      >
        <Flame size={15} color={t.isDark ? t.text : "#A9334D"} opacity={0.8} />
        <Text
          style={{ fontFamily: fonts.semibold, fontSize: 14, color: t.isDark ? t.text : "#A9334D" }}
        >
          Log a flare
        </Text>
        <ChevronRight
          size={16}
          color={t.isDark ? t.text : "#A9334D"}
          style={{ marginLeft: 4, opacity: 0.8 }}
        />
      </TouchableOpacity>

      {hasMeds && (
        <TouchableOpacity
          onPress={() => router.push("/care/medications")}
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 6,
            backgroundColor: t.surface,
            borderRadius: 10,
            paddingHorizontal: 13,
            paddingVertical: 7,
            borderWidth: 1.5,
            borderColor: t.border,
          }}
          activeOpacity={0.8}
        >
          <Pill size={15} color={t.isDark ? t.text : "#A9334D"} opacity={0.8} />
          <Text
            style={{
              fontFamily: fonts.semibold,
              fontSize: 14,
              color: t.isDark ? t.text : "#A9334D",
            }}
          >
            Mark meds taken
          </Text>
          <ChevronRight
            size={16}
            color={t.isDark ? t.text : "#A9334D"}
            style={{ marginLeft: 4, opacity: 0.8 }}
          />
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}
