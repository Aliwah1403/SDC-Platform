import { useState, useMemo, useCallback } from "react";
import { View, FlatList, Text, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { PenLine } from "lucide-react-native";
import { CommunityHeader } from "@/components/Community/CommunityHeader";
import { CategoryFilter } from "@/components/Community/CategoryFilter";
import { PostCard } from "@/components/Community/PostCard";
import { PostSkeleton } from "@/components/Community/PostSkeleton";
import { useAppStore } from "@/store/appStore";
import { fonts } from "@/utils/fonts";

const SKELETON_DATA = [
  { id: "sk1", _skeleton: true },
  { id: "sk2", _skeleton: true },
  { id: "sk3", _skeleton: true },
];

export default function CommunityFeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const communityPosts = useAppStore((s) => s.communityPosts);
  const likedPostIds = useAppStore((s) => s.likedPostIds);
  const toggleLike = useAppStore((s) => s.toggleLike);

  const filteredPosts = useMemo(() => {
    let posts = communityPosts;
    if (activeCategory !== "all") {
      posts = posts.filter((p) => p.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      posts = posts.filter(
        (p) =>
          p.content.toLowerCase().includes(q) ||
          p.author.name.toLowerCase().includes(q),
      );
    }
    return posts;
  }, [activeCategory, searchQuery, communityPosts]);

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRefreshing(true);
    // Simulate network fetch
    await new Promise((resolve) => setTimeout(resolve, 1400));
    setRefreshing(false);
  }, []);

  const handleCompose = () => router.push("/community/create-post");

  const listData = refreshing ? SKELETON_DATA : filteredPosts;

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F4F0" }}>
      <StatusBar style="light" />

      <CommunityHeader
        postCount={filteredPosts.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNotifications={() => {}}
      />
      <CategoryFilter active={activeCategory} onSelect={setActiveCategory} />

      <View style={{ flex: 1 }}>
        <FlatList
          data={listData}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          onRefresh={onRefresh}
          refreshing={false}
          ListEmptyComponent={
            !refreshing ? (
              <View
                style={{
                  alignItems: "center",
                  paddingTop: 60,
                  paddingHorizontal: 32,
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.semibold,
                    fontSize: 17,
                    color: "#09332C",
                    marginBottom: 8,
                  }}
                >
                  No posts found
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.regular,
                    fontSize: 14,
                    color: "#6B7280",
                    textAlign: "center",
                  }}
                >
                  {searchQuery
                    ? `No results for "${searchQuery}"`
                    : "Nothing in this category yet."}
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) =>
            item._skeleton ? (
              <PostSkeleton />
            ) : (
              <PostCard
                post={item}
                isLiked={likedPostIds.includes(item.id)}
                onLike={() => toggleLike(item.id)}
                onPress={() => router.push(`/community/${item.id}`)}
              />
            )
          }
        />

        {/* Floating compose button */}
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            handleCompose();
          }}
          activeOpacity={0.85}
          style={{
            position: "absolute",
            bottom: insets.bottom - 10,
            right: 20,
            
            paddingHorizontal: 20,
            height: 40,
            borderRadius: 26,
            backgroundColor: "#A9334D",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#A9334D",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          <View style={{ alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 4 }}>
            <PenLine size={22} color="#F8E9E7" strokeWidth={2} />
            <Text style={{ color: "#F8E9E7", fontFamily: fonts.semibold, fontSize: 14 }}>New post</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
