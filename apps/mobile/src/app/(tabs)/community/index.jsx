import React, { useState, useMemo } from "react";
import { View, FlatList, Alert, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { CommunityHeader } from "@/components/Community/CommunityHeader";
import { CategoryFilter } from "@/components/Community/CategoryFilter";
import { PostCard } from "@/components/Community/PostCard";
import { useAppStore } from "@/store/appStore";
import { mockCommunityPosts } from "@/types";
import { fonts } from "@/utils/fonts";

export default function CommunityFeedScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const likedPostIds = useAppStore((s) => s.likedPostIds);
  const toggleLike = useAppStore((s) => s.toggleLike);

  const filteredPosts = useMemo(() => {
    let posts = mockCommunityPosts;
    if (activeCategory !== "all") {
      posts = posts.filter((p) => p.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      posts = posts.filter(
        (p) =>
          p.content.toLowerCase().includes(q) ||
          p.author.name.toLowerCase().includes(q)
      );
    }
    return posts;
  }, [activeCategory, searchQuery]);

  const handleCompose = () => {
    Alert.alert("Coming Soon", "Post creation will be available in the next update.");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F4F0" }}>
      <StatusBar style="light" />

      <CommunityHeader
        postCount={filteredPosts.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCompose={handleCompose}
      />
      <CategoryFilter active={activeCategory} onSelect={setActiveCategory} />

      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 60, paddingHorizontal: 32 }}>
            <Text style={{ fontFamily: fonts.semibold, fontSize: 17, color: "#09332C", marginBottom: 8 }}>
              No posts found
            </Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: "#6B7280", textAlign: "center" }}>
              {searchQuery
                ? `No results for "${searchQuery}"`
                : "Nothing in this category yet."}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            isLiked={likedPostIds.includes(item.id)}
            onLike={() => toggleLike(item.id)}
            onPress={() => router.push(`/community/${item.id}`)}
          />
        )}
      />
    </View>
  );
}
