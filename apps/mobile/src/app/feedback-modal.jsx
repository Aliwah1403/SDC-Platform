import React, { useRef, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { X, RefreshCw } from "lucide-react-native";
import { WebView } from "react-native-webview";
import { fonts } from "@/utils/fonts";
import { USERJOT_FEEDBACK_URL } from "@/constants/feedback";
import { useAuthStore } from "@/utils/auth/store";

export default function FeedbackModalScreen() {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const webViewRef = useRef(null);

  const user = useAuthStore((s) => s.auth?.user);
  const userId = user?.id ?? "";
  const userEmail = user?.email ?? "";
  const fullName =
    user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? "";
  const [firstName, ...rest] = fullName.trim().split(" ");
  const lastName = rest.join(" ");

  const identifyUser = () => {
    if (!userId || !webViewRef.current) return;
    const payload = JSON.stringify({
      id: userId,
      email: userEmail,
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
    });
    // Poll until window.uj is ready — the widget initialises asynchronously
    // after the page HTML loads, so onLoadEnd fires too early.
    webViewRef.current.injectJavaScript(`
      (function() {
        function tryIdentify(attempts) {
          if (window.uj && typeof window.uj.identify === 'function') {
            window.uj.identify(${payload});
          } else if (attempts > 0) {
            setTimeout(function() { tryIdentify(attempts - 1); }, 250);
          }
        }
        tryIdentify(20);
      })();
      true;
    `);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <StatusBar style="auto" />

      <View
        style={{
          height: 56,
          borderBottomWidth: 1,
          borderBottomColor: "#F0E4E1",
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={20} color="#09332C" />
        </TouchableOpacity>

        <Text
          style={{
            flex: 1,
            textAlign: "center",
            fontFamily: fonts.semibold,
            fontSize: 16,
            color: "#09332C",
          }}
        >
          Feedback
        </Text>

        <View style={{ width: 36, height: 36 }} />
      </View>

      {error ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
            gap: 14,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.semibold,
              fontSize: 18,
              color: "#09332C",
              textAlign: "center",
            }}
          >
            Couldn’t load feedback
          </Text>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 14,
              color: "#6B7280",
              textAlign: "center",
            }}
          >
            Please check your connection and try again.
          </Text>
          <TouchableOpacity
            onPress={() => {
              setError(null);
              setReloadKey((prev) => prev + 1);
            }}
            activeOpacity={0.8}
            style={{
              marginTop: 4,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: "#A9334D",
              borderRadius: 999,
              paddingHorizontal: 16,
              paddingVertical: 10,
            }}
          >
            <RefreshCw size={16} color="#ffffff" />
            <Text
              style={{
                fontFamily: fonts.medium,
                color: "#ffffff",
                fontSize: 14,
              }}
            >
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          key={reloadKey}
          source={{ uri: USERJOT_FEEDBACK_URL }}
          onLoadStart={() => setError(null)}
          onLoadEnd={identifyUser}
          onError={() => setError("load_error")}
          startInLoadingState={false}
        />
      )}
    </View>
  );
}
