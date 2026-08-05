import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { fonts } from "@/utils/fonts";
import { colors } from "@/utils/colors";
import { useTheme } from "@/hooks/useTheme";
import { useEducationContentQuery } from "@/hooks/queries/useEducationContentQuery";
import {
  LibraryCard,
  LIBRARY_H_PADDING,
  LIBRARY_CARD_GAP,
  LIBRARY_CARD_WIDTH,
} from "@/components/EducationLibrary/LibraryCard";

function CategorySection({ category, t, router }) {
  const { getArticlesByCategory } = useEducationContentQuery();
  const articles = getArticlesByCategory(category.slug);
  if (articles.length === 0) return null;

  return (
    <View
      style={{
        marginHorizontal: LIBRARY_H_PADDING,
        marginBottom: 20,
        borderRadius: 20,
        paddingTop: 18,
        paddingBottom: 16,
        // backgroundColor: colors[category.tint],
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          paddingHorizontal: 16,
          marginBottom: 4,
        }}
      >
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 19, color: t.text }}>
            {category.title}
          </Text>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 13,
              color: t.textSecondary,
              lineHeight: 18,
              marginTop: 2,
            }}
          >
            {category.description}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() =>
            router.push(`/education-category?category=${category.slug}`)
          }
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ paddingTop: 2 }}
        >
          <Text
            style={{
              fontFamily: fonts.semibold,
              fontSize: 14,
              color: colors.burgundy,
            }}
          >
            See All
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          gap: LIBRARY_CARD_GAP,
        }}
      >
        {articles.map((article) => (
          <LibraryCard
            key={article.topic}
            article={article}
            width={LIBRARY_CARD_WIDTH}
            onPress={() =>
              router.push(
                `/education-article?topic=${article.topic}&from=library`,
              )
            }
          />
        ))}
      </ScrollView>
    </View>
  );
}

export default function LearnScreen() {
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const router = useRouter();
  const { getCategories } = useEducationContentQuery();
  const categories = getCategories();

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <StatusBar style={t.isDark ? "light" : "dark"} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        <View
          style={{
            paddingHorizontal: LIBRARY_H_PADDING,
            paddingTop: insets.top + 20,
            paddingBottom: 20,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.bold,
              fontSize: 28,
              color: t.text,
              marginBottom: 4,
            }}
          >
            Learn
          </Text>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 16,
              color: t.textSecondary,
            }}
          >
            Guides for living well with sickle cell
          </Text>
        </View>

        {categories.map((category) => (
          <CategorySection
            key={category.slug}
            category={category}
            t={t}
            router={router}
          />
        ))}
      </ScrollView>
    </View>
  );
}
