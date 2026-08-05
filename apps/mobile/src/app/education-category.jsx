import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { fonts } from "@/utils/fonts";
import { useTheme } from "@/hooks/useTheme";
import { useEducationContentQuery } from "@/hooks/queries/useEducationContentQuery";
import {
  LibraryCard,
  LIBRARY_H_PADDING,
  LIBRARY_CARD_GAP,
  LIBRARY_CARD_WIDTH,
} from "@/components/EducationLibrary/LibraryCard";

// "See All" screen for one library category — the same 2-up cards as the
// Learn tab, laid out as a vertical grid instead of a horizontal carousel.
export default function EducationCategoryScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { category: categorySlug } = useLocalSearchParams();
  const { getCategory, getArticlesByCategory } = useEducationContentQuery();
  const category = getCategory(categorySlug);
  const articles = category ? getArticlesByCategory(category.slug) : [];

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <StatusBar style={t.isDark ? "light" : "dark"} />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingTop: insets.top + 10,
          paddingHorizontal: LIBRARY_H_PADDING,
          paddingBottom: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.6}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: t.surfaceElevated,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <ChevronLeft size={22} color={t.text} />
        </TouchableOpacity>
        <Text style={{ fontFamily: fonts.bold, fontSize: 20, color: t.text }}>
          {category?.title ?? "Learn"}
        </Text>
      </View>

      {category ? (
        <FlatList
          data={articles}
          keyExtractor={(item) => item.topic}
          numColumns={2}
          columnWrapperStyle={{ paddingHorizontal: LIBRARY_H_PADDING, gap: LIBRARY_CARD_GAP }}
          contentContainerStyle={{ gap: LIBRARY_CARD_GAP, paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <LibraryCard
              article={item}
              width={LIBRARY_CARD_WIDTH}
              onPress={() =>
                router.push(`/education-article?topic=${item.topic}&from=library_category`)
              }
            />
          )}
        />
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <Text
            style={{
              fontFamily: fonts.medium,
              fontSize: 16,
              color: t.textSecondary,
              textAlign: "center",
              lineHeight: 24,
            }}
          >
            This section isn't ready yet — check back soon.
          </Text>
        </View>
      )}
    </View>
  );
}
