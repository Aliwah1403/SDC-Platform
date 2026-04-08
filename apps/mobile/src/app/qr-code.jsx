import { View, Text, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useAppStore } from "@/store/appStore";
import { useProfileQuery } from "@/hooks/queries/useProfileQuery";
import { useAuthStore } from "@/utils/auth/store";
import { HemoQRCode } from "@/components/QRCode";
import { fonts } from "@/utils/fonts";

export default function QRCodeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { auth } = useAuthStore();
  const { data: profile } = useProfileQuery();
  const { onboardingData } = useAppStore();

  const userName = auth?.user?.user_metadata?.full_name ?? profile?.nickname ?? onboardingData?.nickname ?? "Hemo User";
  const scdType = profile?.scdType ?? onboardingData?.scdType ?? "Unknown";

  // Encode emergency card data as the QR payload
  const qrData = `HEMO:${userName}|SCD:${scdType}|APP:Hemo`;

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F4F0" }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "rgba(9,51,44,0.08)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowLeft size={20} color="#09332C" strokeWidth={2} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: "#09332C" }}>
            Emergency Card
          </Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "#9CA3AF", marginTop: 1 }}>
            Tap the button below to reveal your QR code
          </Text>
        </View>
      </View>

      {/* Animation — takes full screen */}
      <HemoQRCode qrData={qrData} />
    </View>
  );
}
