import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { X, RefreshCw } from "lucide-react-native";
import { WebView } from "react-native-webview";
import { fonts } from "@/utils/fonts";
import { FEATUREBASE_URL } from "@/constants/feedback";
import { useTheme } from "@/hooks/useTheme";

export default function FeedbackModalScreen() {
  const router = useRouter();
  const t = useTheme();
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <View style={{ flex: 1, backgroundColor: t.surface }}>
      <StatusBar style="auto" />

      <View
        style={{
          height: 56,
          borderBottomWidth: 1,
          borderBottomColor: t.border,
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
          <X size={20} color={t.text} />
        </TouchableOpacity>

        <Text
          style={{
            flex: 1,
            textAlign: "center",
            fontFamily: fonts.semibold,
            fontSize: 16,
            color: t.text,
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
              color: t.text,
              textAlign: "center",
            }}
          >
            Couldn’t load feedback
          </Text>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 14,
              color: t.textSecondary,
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
              backgroundColor: t.accent,
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
          source={{ uri: FEATUREBASE_URL }}
          onLoadStart={() => setError(null)}
          onError={() => setError("load_error")}
          startInLoadingState={false}
        />
      )}
    </View>
  );
}
