import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TrackScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF9F9" }}>
      <View
        style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
      >
        <Text
          style={{
            fontFamily: "Geist_700Bold",
            fontSize: 22,
            color: "#781D11",
            marginBottom: 8,
          }}
        >
          Track
        </Text>
        <Text
          style={{
            fontFamily: "Geist_400Regular",
            fontSize: 15,
            color: "#9CA3AF",
          }}
        >
          Coming soon
        </Text>
      </View>
    </SafeAreaView>
  );
}
