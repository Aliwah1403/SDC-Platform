import { useState, useCallback, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, RefreshCw } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/utils/auth/supabase";
import { HemoQRCode } from "@/components/QRCode";
import { fonts } from "@/utils/fonts";
import { useTheme } from "@/hooks/useTheme";

const STORAGE_KEY = "hemo:ed_card_token";

function formatExpiry(expiresAt) {
  const diff = new Date(expiresAt) - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `Valid for ${hours}h ${mins}m`;
  return `Valid for ${mins}m`;
}

export default function QRCodeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useTheme();

  const [cardUrl, setCardUrl] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore persisted token on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        const saved = JSON.parse(raw);
        if (new Date(saved.expiresAt) > new Date()) {
          setCardUrl(saved.url);
          setExpiresAt(saved.expiresAt);
        } else {
          AsyncStorage.removeItem(STORAGE_KEY);
        }
      }
      setLoading(false);
    });
  }, []);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-ed-card");
      if (fnError || !data?.data?.url) {
        setError("Failed to generate card. Please try again.");
      } else {
        const { url, expiresAt: exp } = data.data;
        setCardUrl(url);
        setExpiresAt(exp);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ url, expiresAt: exp }));
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <StatusBar style={t.isDark ? "light" : "dark"} />

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
            backgroundColor: `${t.text}14`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowLeft size={20} color={t.text} strokeWidth={2} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: t.text }}>
            Emergency Card
          </Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: t.textSecondary, marginTop: 1 }}>
            {cardUrl
              ? expiresAt
                ? formatExpiry(expiresAt)
                : "Tap the QR to reveal"
              : "Generate a scannable card for ED staff"}
          </Text>
        </View>

        {cardUrl && (
          <TouchableOpacity
            onPress={generate}
            activeOpacity={0.7}
            disabled={loading}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: `${t.text}14`,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <RefreshCw size={18} color={t.text} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {cardUrl ? (
        <HemoQRCode qrData={cardUrl} />
      ) : loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#A9334D" />
        </View>
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          {error && (
            <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: "#DC2626", marginBottom: 20, textAlign: "center" }}>
              {error}
            </Text>
          )}
          <TouchableOpacity
            onPress={generate}
            activeOpacity={0.8}
            disabled={loading}
            style={{
              backgroundColor: "#A9334D",
              borderRadius: 16,
              paddingHorizontal: 36,
              paddingVertical: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : null}
            <Text style={{ fontFamily: fonts.semiBold, fontSize: 16, color: "#fff" }}>
              {loading ? "Generating…" : "Generate Emergency Card"}
            </Text>
          </TouchableOpacity>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.textSecondary, marginTop: 14, textAlign: "center", lineHeight: 20 }}>
            Creates a secure QR code valid for 4 hours.{"\n"}ED staff scan it to view your medical info.
          </Text>
        </View>
      )}
    </View>
  );
}
