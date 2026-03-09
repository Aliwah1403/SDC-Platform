import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fonts } from "@/utils/fonts";
import { Users } from "lucide-react-native";

export default function CommunityScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
        <Users size={64} color="#D09F9A" strokeWidth={1.5} />
        <Text style={{ fontFamily: fonts.bold, fontSize: 22, color: "#1F2937", marginTop: 20, marginBottom: 8 }}>
          Community
        </Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 15, color: "#6B7280", textAlign: "center", lineHeight: 22 }}>
          Connect with others in the Hemo community. Coming soon.
        </Text>
      </View>
    </SafeAreaView>
  );
}
