import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert, Linking } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { X, RefreshCw } from "lucide-react-native";
import { WebView } from "react-native-webview";
import { fonts } from "@/utils/fonts";
import { USERJOT_FEEDBACK_URL, isUserJotUrl } from "@/constants/feedback";

export default function FeedbackModalScreen() {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const handleShouldStartRequest = (request) => {
    const url = request?.url;

    if (isUserJotUrl(url)) return true;

    if (!url) return false;

    Linking.openURL(url).catch(() => {
      Alert.alert("Unable to open link", "Please try again in your browser.");
    });
    return false;
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
          key={reloadKey}
          source={{ uri: USERJOT_FEEDBACK_URL }}
          onShouldStartLoadWithRequest={handleShouldStartRequest}
          onLoadStart={() => {
            setError(null);
          }}
          onError={() => {
            setError("load_error");
          }}
          startInLoadingState={false}
        />
      )}
    </View>
  );
}
