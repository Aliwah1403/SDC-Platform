import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { fonts } from "@/utils/fonts";

export function QuickActions({ medications = [] }) {
  const router = useRouter();
  const hasMeds = medications.length > 0;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: 4 }}
      style={{ flexGrow: 0, marginBottom: 16 }}
    >
      <TouchableOpacity
        onPress={() => router.push("/log-symptoms")}
        style={{
          backgroundColor: "#A9334D",
          borderRadius: 100,
          paddingHorizontal: 20,
          paddingVertical: 12,
        }}
        activeOpacity={0.8}
      >
        <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: "#FFFFFF" }}>
          Log today →
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/log-symptoms")}
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 100,
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderWidth: 1.5,
          borderColor: "#A9334D",
        }}
        activeOpacity={0.8}
      >
        <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: "#A9334D" }}>
          Log a flare →
        </Text>
      </TouchableOpacity>

      {hasMeds && (
        <TouchableOpacity
          onPress={() => router.push("/care/medications")}
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 100,
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderWidth: 1.5,
            borderColor: "#A9334D",
          }}
          activeOpacity={0.8}
        >
          <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: "#A9334D" }}>
            Mark meds taken →
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}
