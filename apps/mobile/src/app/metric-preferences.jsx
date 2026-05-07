import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Check } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fonts } from "@/utils/fonts";
import { useTheme } from "@/hooks/useTheme";

export const PREFS_KEY = "hemo_visible_metrics";
export const DEFAULT_VISIBLE = ["hydration", "mood", "steps", "sleep"];

const METRICS = [
  { key: "hydration", label: "Hydration", emoji: "💧", description: "Daily water intake vs. your 8-glass goal" },
  { key: "mood",      label: "Mood",       emoji: "😊", description: "How you're feeling each day" },
  { key: "steps",     label: "Steps",      emoji: "👟", description: "Daily step count toward 10,000" },
  { key: "sleep",     label: "Sleep",      emoji: "🌙", description: "Hours of sleep each night" },
];

export default function MetricPreferences() {
  const t = useTheme();
  const router = useRouter();
  const [selected, setSelected] = useState(DEFAULT_VISIBLE);

  useEffect(() => {
    AsyncStorage.getItem(PREFS_KEY).then((raw) => {
      if (raw) setSelected(JSON.parse(raw));
    });
  }, []);

  const toggle = useCallback((key) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }, []);

  const handleDone = useCallback(async () => {
    const next = selected.length > 0 ? selected : DEFAULT_VISIBLE;
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));
    router.back();
  }, [selected, router]);

  return (
    <View style={{ flex: 1, justifyContent: "flex-end" }}>
      {/* Dim overlay — tap to dismiss */}
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: t.modalBackdrop }}
        activeOpacity={1}
        onPress={() => router.back()}
      />

      {/* Sheet */}
      <View
        style={{
          height: "50%",
          backgroundColor: t.surface,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingTop: 12,
        }}
      >
        {/* Drag handle */}
        <View
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: t.border,
            alignSelf: "center",
            marginBottom: 16,
          }}
        />

        {/* Header */}
        <View style={{ alignItems: "center", marginBottom: 20, paddingHorizontal: 20 }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 20, color: t.text }}>
            Health Metrics
          </Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.textSecondary, marginTop: 3 }}>
            Choose what appears on your home screen
          </Text>
        </View>

        {/* Metric list */}
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {METRICS.map((m, i) => {
            const active = selected.includes(m.key);
            return (
              <Pressable
                key={m.key}
                onPress={() => toggle(m.key)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                  borderBottomWidth: i < METRICS.length - 1 ? 1 : 0,
                  borderBottomColor: t.divider,
                }}
              >
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: t.text }}>
                    {m.label}
                  </Text>
                </View>

                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    backgroundColor: active ? "#A9334D" : t.surfaceElevated,
                    borderWidth: active ? 0 : 1.5,
                    borderColor: t.border,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {active && <Check size={14} color="#FFFFFF" strokeWidth={2.5} />}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Done button */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 32, paddingTop: 8 }}>
          <TouchableOpacity
            onPress={handleDone}
            activeOpacity={0.85}
            style={{
              backgroundColor: selected.length > 0 ? "#A9334D" : "#D09F9A",
              borderRadius: 14,
              paddingVertical: 15,
              alignItems: "center",
            }}
          >
            <Text style={{ fontFamily: fonts.semibold, fontSize: 15, color: "#FFFFFF" }}>
              Done
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
