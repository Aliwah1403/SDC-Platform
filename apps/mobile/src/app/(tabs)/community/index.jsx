import { useState, useMemo, useCallback } from "react";
import { View, FlatList, Text, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { PenLine } from "lucide-react-native";
import { CommunityHeader } from "@/components/Community/CommunityHeader";
import { FeedFilter } from "@/components/Community/FeedFilter";
import { PostCard } from "@/components/Community/PostCard";
import { PostSkeleton } from "@/components/Community/PostSkeleton";
import { CategoriesCarousel } from "@/components/Community/CategoriesCarousel";
import { useAppStore } from "@/store/appStore";
import { fonts } from "@/utils/fonts";

const SKELETON_DATA = [
  { id: "sk1", _skeleton: true },
  { id: "sk2", _skeleton: true },
  { id: "sk3", _skeleton: true },
];

const EMPTY_MESSAGES = {
  popular: "No posts yet. Be the first to share!",
  recent: "No posts yet.",
  following: null, // handled separately
  mine: "You haven't posted yet.\nTap the button below to share.",
  saved: "No saved posts yet.\nTap the bookmark on any post to save it.",
};

export default function CommunityFeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeFeed, setActiveFeed] = useState("popular");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const communityPosts = useAppStore((s) => s.communityPosts);
  const likedPostIds = useAppStore((s) => s.likedPostIds);
  const toggleLike = useAppStore((s) => s.toggleLike);
  const savedPostIds = useAppStore((s) => s.savedPostIds);
  const toggleSave = useAppStore((s) => s.toggleSave);
  const followedCategoryIds = useAppStore((s) => s.followedCategoryIds);
  const blockedCategoryIds = useAppStore((s) => s.blockedCategoryIds);
  const toggleFollowCategory = useAppStore((s) => s.toggleFollowCategory);
  const pollVotes = useAppStore((s) => s.pollVotes);
  const voteOnPoll = useAppStore((s) => s.voteOnPoll);
  const notificationCount = useAppStore((s) => s.notificationCount);

  const filteredPosts = useMemo(() => {
    let posts = [...communityPosts];

    // Always exclude blocked categories
    posts = posts.filter((p) => !blockedCategoryIds.includes(p.category));

    if (activeFeed === "popular") {
      posts.sort((a, b) => b.likes - a.likes);
    } else if (activeFeed === "recent") {
      posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else if (activeFeed === "following") {
      posts = posts.filter((p) => followedCategoryIds.includes(p.category));
    } else if (activeFeed === "mine") {
      posts = posts.filter((p) => p.author.isCurrentUser);
    } else if (activeFeed === "saved") {
      posts = posts.filter((p) => savedPostIds.includes(p.id));
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
  }, [activeFeed, searchQuery, communityPosts, savedPostIds, followedCategoryIds, blockedCategoryIds]);

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1400));
    setRefreshing(false);
  }, []);

  const handleCompose = () => router.push("/community/create-post");

  const listData = refreshing ? SKELETON_DATA : filteredPosts;

  const showCarousel = (activeFeed === "popular" || activeFeed === "recent") && !searchQuery;

  function renderEmptyFollowing() {
    return (
      <View style={{ alignItems: "center", paddingTop: 60, paddingHorizontal: 32 }}>
        <Text style={{ fontFamily: fonts.semibold, fontSize: 17, color: "#09332C", marginBottom: 8 }}>
          No communities followed yet
        </Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: "#6B7280", textAlign: "center", marginBottom: 20 }}>
          Follow communities to see their posts here.
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/community/categories")}
          style={{
            backgroundColor: "#A9334D",
            borderRadius: 12,
            paddingHorizontal: 24,
            paddingVertical: 12,
          }}
        >
          <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: "#F8E9E7" }}>
            Browse communities
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F4F0" }}>
      <StatusBar style="light" />

      <CommunityHeader
        postCount={filteredPosts.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNotifications={() => router.push("/community/notifications")}
        notificationCount={notificationCount}
      />
      <FeedFilter active={activeFeed} onSelect={setActiveFeed} />

      <View style={{ flex: 1 }}>
        <FlatList
          data={listData}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          onRefresh={onRefresh}
          refreshing={false}
          ListHeaderComponent={
            showCarousel ? (
              <CategoriesCarousel
                communityPosts={communityPosts}
                followedCategoryIds={followedCategoryIds}
              />
            ) : null
          }
          ListEmptyComponent={
            !refreshing ? (
              activeFeed === "following" ? (
                renderEmptyFollowing()
              ) : (
                <View style={{ alignItems: "center", paddingTop: 60, paddingHorizontal: 32 }}>
                  <Text style={{ fontFamily: fonts.semibold, fontSize: 17, color: "#09332C", marginBottom: 8 }}>
                    Nothing here yet
                  </Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: "#6B7280", textAlign: "center" }}>
                    {searchQuery
                      ? `No results for "${searchQuery}"`
                      : EMPTY_MESSAGES[activeFeed]}
                  </Text>
                </View>
              )
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
                isSaved={savedPostIds.includes(item.id)}
                onSave={() => toggleSave(item.id)}
                onPress={() => router.push(`/community/${item.id}`)}
                pollVotedOptionId={pollVotes[item.id] ?? null}
                onVote={(optionId) => voteOnPoll(item.id, optionId)}
                followedCategoryIds={followedCategoryIds}
                blockedCategoryIds={blockedCategoryIds}
                onFollowCategory={toggleFollowCategory}
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
            bottom: insets.bottom + 16,
            right: 20,
            paddingHorizontal: 20,
            height: 44,
            borderRadius: 22,
            backgroundColor: "#A9334D",
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            shadowColor: "#A9334D",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          <PenLine size={18} color="#F8E9E7" strokeWidth={2} />
          <Text style={{ color: "#F8E9E7", fontFamily: fonts.semibold, fontSize: 14 }}>
            New post
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
