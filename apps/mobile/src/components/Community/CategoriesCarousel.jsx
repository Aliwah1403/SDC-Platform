import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { CategoryCard } from "./CategoryCard";
import { ALL_CATEGORIES } from "@/data/communityCategories";
import { fonts } from "@/utils/fonts";

export function CategoriesCarousel({ communityPosts, followedCategoryIds }) {
  const router = useRouter();

  function postCountFor(categoryId) {
    return communityPosts.filter((p) => p.category === categoryId).length;
  }

  return (
    <View style={{ marginBottom: 8 }}>
      {/* Section header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingTop: 4,
          paddingBottom: 12,
        }}
      >
        <Text
          style={{ fontFamily: fonts.bold, fontSize: 16, color: "#09332C" }}
        >
          Communities
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/community/categories")}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text
            style={{
              fontFamily: fonts.semibold,
              fontSize: 13,
              color: "#A9334D",
            }}
          >
            See all
          </Text>
        </TouchableOpacity>
      </View>

      {/* Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4 }}
      >
        {ALL_CATEGORIES.map((cat) => (
          <CategoryCard
            key={cat.id}
            category={cat}
            postCount={postCountFor(cat.id)}
            isFollowing={followedCategoryIds.includes(cat.id)}
            onPress={() => router.push(`/community/category/${cat.id}`)}
          />
        ))}
      </ScrollView>

      {/* Divider */}
      <View
        style={{
          height: 1,
          backgroundColor: "#EDE8E5",
          marginHorizontal: 16,
          marginTop: 16,
          marginBottom: 4,
        }}
      />
    </View>
  );
}
