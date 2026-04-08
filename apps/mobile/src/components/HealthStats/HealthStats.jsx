import React from "react";
import { View, Text } from "react-native";
import { Activity, Heart, Droplets } from "lucide-react-native";

export function HealthStats({ hasLoggedData, selectedDateData }) {
  if (!hasLoggedData) {
    return (
      <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: "#781D11",
            marginBottom: 16,
          }}
        >
          Your Stats
        </Text>
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            padding: 24,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              color: "#666",
              textAlign: "center",
            }}
          >
            No health data logged for this day
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "700",
          color: "#781D11",
          marginBottom: 16,
        }}
      >
        Your Stats
      </Text>
      <View
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        {/* Pain Level */}
        {selectedDateData.painLevel > 0 && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <View
              style={{
                backgroundColor: "#A9334D",
                borderRadius: 8,
                padding: 8,
                marginRight: 12,
              }}
            >
              <Activity size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  color: "#666",
                  marginBottom: 2,
                }}
              >
                Pain Level
              </Text>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: "#781D11",
                }}
              >
                {selectedDateData.painLevel}/10
              </Text>
            </View>
          </View>
        )}

        {/* Mood */}
        {selectedDateData.mood > 0 && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <View
              style={{
                backgroundColor: "#D09F9A",
                borderRadius: 8,
                padding: 8,
                marginRight: 12,
              }}
            >
              <Heart size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  color: "#666",
                  marginBottom: 2,
                }}
              >
                Mood
              </Text>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: "#781D11",
                }}
              >
                {selectedDateData.mood}/5
              </Text>
            </View>
          </View>
        )}

        {/* Hydration */}
        {selectedDateData.hydration > 0 && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <View
              style={{
                backgroundColor: "#D09F9A",
                borderRadius: 8,
                padding: 8,
                marginRight: 12,
              }}
            >
              <Droplets size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  color: "#666",
                  marginBottom: 2,
                }}
              >
                Hydration
              </Text>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: "#781D11",
                }}
              >
                {selectedDateData.hydration} glasses
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
