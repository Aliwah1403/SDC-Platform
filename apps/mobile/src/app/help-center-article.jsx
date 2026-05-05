import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft } from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function ArticlePage({ item, insets }) {
  return (
    <ScrollView
      style={{ width: SCREEN_WIDTH }}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 28,
        paddingBottom: insets.bottom + 80,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.body}>{item.body}</Text>

      {item.steps?.length > 0 && (
        <View style={{ marginTop: 24 }}>
          {item.steps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

export default function HelpCenterArticleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items: itemsJson, initialIndex } = useLocalSearchParams();

  const items = (() => {
    try {
      return JSON.parse(itemsJson) ?? [];
    } catch {
      return [];
    }
  })();

  const startIndex = Number(initialIndex) || 0;
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const flatListRef = useRef(null);

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }, []);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 });

  const getItemLayout = useCallback(
    (_, index) => ({
      length: SCREEN_WIDTH,
      offset: SCREEN_WIDTH * index,
      index,
    }),
    [],
  );

  if (items.length === 0) return null;

  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 10,
          paddingBottom: 12,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          borderBottomWidth: 1,
          borderBottomColor: "#F0E4E1",
          backgroundColor: "#ffffff",
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.6}
          style={styles.backBtn}
        >
          <ChevronLeft size={22} color="#09332C" />
        </TouchableOpacity>
        <View style={{ width: 38 }} />
      </View>

      {/* Pager */}
      <FlatList
        ref={flatListRef}
        data={items}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={startIndex}
        getItemLayout={getItemLayout}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig.current}
        renderItem={({ item }) => (
          <ArticlePage item={item} insets={insets} />
        )}
      />

      {/* Dot indicators */}
      {items.length > 1 && (
        <View
          style={[
            styles.dotsRow,
            { paddingBottom: insets.bottom + 20 },
          ]}
        >
          {items.map((_, i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={0.7}
              onPress={() =>
                flatListRef.current?.scrollToIndex({ index: i, animated: true })
              }
            >
              <View
                style={[
                  styles.dot,
                  i === currentIndex ? styles.dotActive : styles.dotInactive,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F8F4F0",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Geist_700Bold",
    fontSize: 26,
    color: "#09332C",
    lineHeight: 33,
    marginBottom: 16,
  },
  body: {
    fontFamily: "Geist_400Regular",
    fontSize: 16,
    color: "#374151",
    lineHeight: 26,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#A9334D",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  stepBadgeText: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 13,
    color: "#ffffff",
  },
  stepText: {
    fontFamily: "Geist_400Regular",
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
    flex: 1,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    paddingTop: 12,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#F0E4E1",
  },
  dot: {
    borderRadius: 99,
  },
  dotActive: {
    width: 20,
    height: 7,
    backgroundColor: "#A9334D",
  },
  dotInactive: {
    width: 7,
    height: 7,
    backgroundColor: "#D1C8C4",
  },
});
