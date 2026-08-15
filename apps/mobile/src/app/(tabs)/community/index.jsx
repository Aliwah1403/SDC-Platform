import { useState, useMemo, useCallback, useEffect } from "react";
import { usePostHog } from "posthog-react-native";
import { View, FlatList, Text, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { PenLine, Bookmark, Users, Search, Clock, Flame } from "lucide-react-native";
import { CommunityHeader } from "@/components/Community/CommunityHeader";
import { FeedFilter } from "@/components/Community/FeedFilter";
import { PostCard } from "@/components/Community/PostCard";
import { PostSkeleton } from "@/components/Community/PostSkeleton";
import { CategoriesCarousel } from "@/components/Community/CategoriesCarousel";
import { PostActionsSheet } from "@/components/Community/PostActionsSheet";
import AppEmptyState from "@/components/AppEmptyState";
import { useAppStore } from "@/store/appStore";
import { useCommunityFeedQuery } from "@/hooks/queries/useCommunityFeedQuery";
import {
  useLikeMutation,
  useSaveMutation,
  useVoteMutation,
} from "@/hooks/queries/useCommunityMutations";
import {
  useCategoryPrefsQuery,
  useFollowCategoryMutation,
} from "@/hooks/queries/useCategoryPrefsQuery";
import { useCommunityNotificationsQuery } from "@/hooks/queries/useCommunityNotificationsQuery";
import { fonts } from "@/utils/fonts";
import { useTheme } from "@/hooks/useTheme";

const SKELETON_DATA = [
  { id: "sk1", _skeleton: true },
  { id: "sk2", _skeleton: true },
  { id: "sk3", _skeleton: true },
];

// Per-feed empty states — same centered icon/title/subtitle design as the
// notifications screen, each with a fitting icon. `following` is handled
// separately (it carries a CTA button).
const FEED_EMPTY = {
  popular: {
    Icon: Flame,
    title: "No posts yet",
    subtitle: "Be the first to share something with the community.",
  },
  recent: {
    Icon: Clock,
    title: "No posts yet",
    subtitle: "New posts will show up here as they're shared.",
  },
  mine: {
    Icon: PenLine,
    title: "You haven't posted yet",
    subtitle: "Tap the compose button to share your first post.",
  },
  saved: {
    Icon: Bookmark,
    title: "No saved posts yet",
    subtitle: "Tap the bookmark on any post to save it here.",
  },
};

export default function CommunityFeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const posthog = usePostHog();
  const t = useTheme();
  const [activeFeed, setActiveFeed] = useState("popular");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const [actionsPost, setActionsPost] = useState(null); // { id, isOwnPost }

  const hiddenPostIds = useAppStore((s) => s.hiddenPostIds);

  useEffect(() => {
    posthog?.capture('community_viewed', { feed_type: activeFeed });
  }, []);

  const handleFeedChange = useCallback((feed) => {
    posthog?.capture('feed_type_changed', { to: feed });
    setActiveFeed(feed);
  }, [posthog]);

  const { data: feedData = [], isLoading, refetch } = useCommunityFeedQuery(activeFeed);
  const { data: prefs } = useCategoryPrefsQuery();
  const followedCategoryIds = prefs?.followedCategoryIds ?? [];
  const blockedCategoryIds = prefs?.blockedCategoryIds ?? [];

  const { data: notificationsData = [] } = useCommunityNotificationsQuery();
  const notificationCount = notificationsData.filter((n) => !n.read).length;

  const { mutate: likePost } = useLikeMutation();
  const { mutate: savePost } = useSaveMutation();
  const { mutate: voteOnPoll } = useVoteMutation();
  const { mutate: followCategory } = useFollowCategoryMutation();

  useEffect(() => {
    if (!searchQuery.trim()) return;
    const t = setTimeout(() => {
      posthog?.capture('community_search_performed', { query_length: searchQuery.trim().length });
    }, 800);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const filteredPosts = useMemo(() => {
    let posts = feedData.filter((p) => !hiddenPostIds.includes(p.id));

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      posts = posts.filter(
        (p) =>
          p.content.toLowerCase().includes(q) ||
          (p.author?.name ?? "").toLowerCase().includes(q),
      );
    }

    return posts;
  }, [feedData, hiddenPostIds, searchQuery]);

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleCompose = () => {
    posthog?.capture('new_post_started', {});
    router.push("/community/create-post");
  };

  const listData = isLoading || refreshing ? SKELETON_DATA : filteredPosts;

  const showCarousel = (activeFeed === "popular" || activeFeed === "recent") && !searchQuery;

  function renderEmptyFollowing() {
    const isFollowingCommunities = followedCategoryIds.length > 0;

    return (
      <AppEmptyState
        Icon={Users}
        title={
          isFollowingCommunities
            ? "No posts from followed communities yet"
            : "No communities followed yet"
        }
        subtitle={
          isFollowingCommunities
            ? "Posts from communities you follow will appear here when they're shared."
            : "Follow communities to see their posts here."
        }
      >
        <TouchableOpacity
          onPress={() => router.push("/community/categories")}
          style={{
            marginTop: 20,
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
      </AppEmptyState>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <StatusBar style="light" />

      <CommunityHeader
        postCount={filteredPosts.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNotifications={() => router.push("/notifications")}
        onProfile={() => router.push("/(tabs)/profile")}
        onLearnMore={() => router.push("/education-article?topic=hemo-community&from=community")}
        notificationCount={notificationCount}
      />
      <FeedFilter active={activeFeed} onSelect={handleFeedChange} />

      <View style={{ flex: 1 }}>
        <FlatList
          data={listData}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 100, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          onRefresh={onRefresh}
          refreshing={false}
          ListHeaderComponent={
            showCarousel ? (
              <CategoriesCarousel
                communityPosts={feedData}
                followedCategoryIds={followedCategoryIds}
              />
            ) : null
          }
          ListEmptyComponent={
            !refreshing ? (
              activeFeed === "following" ? (
                renderEmptyFollowing()
              ) : searchQuery ? (
                <AppEmptyState
                  Icon={Search}
                  title="No results"
                  subtitle={`No posts match "${searchQuery}".`}
                />
              ) : (
                <AppEmptyState
                  Icon={(FEED_EMPTY[activeFeed] ?? FEED_EMPTY.recent).Icon}
                  title={(FEED_EMPTY[activeFeed] ?? FEED_EMPTY.recent).title}
                  subtitle={(FEED_EMPTY[activeFeed] ?? FEED_EMPTY.recent).subtitle}
                />
              )
            ) : null
          }
          renderItem={({ item }) =>
            item._skeleton ? (
              <PostSkeleton />
            ) : (
              <PostCard
                post={item}
                isLiked={item.isLiked ?? false}
                onLike={() => {
                  posthog?.capture('post_liked', { action: item.isLiked ? 'unlike' : 'like' });
                  likePost({ postId: item.id, isLiked: item.isLiked ?? false });
                }}
                isSaved={item.isSaved ?? false}
                onSave={() => {
                  posthog?.capture('post_saved', { action: item.isSaved ? 'unsave' : 'save' });
                  savePost({ postId: item.id, isSaved: item.isSaved ?? false });
                }}
                onPress={() => {
                  posthog?.capture('post_tapped', { post_type: item.poll ? 'poll' : 'text' });
                  router.push(`/community/${item.id}`);
                }}
                onMorePress={() =>
                  setActionsPost({
                    id: item.id,
                    isOwnPost: !!item.author?.isCurrentUser,
                  })
                }
                pollVotedOptionId={item.poll?.votedOptionId ?? null}
                onVote={(optionId) => {
                  posthog?.capture('poll_voted', {});
                  voteOnPoll({
                    postId: item.id,
                    optionId,
                    previousOptionId: item.poll?.votedOptionId ?? undefined,
                  });
                }}
                followedCategoryIds={followedCategoryIds}
                blockedCategoryIds={blockedCategoryIds}
                onFollowCategory={(categoryId) => followCategory(categoryId)}
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

      <PostActionsSheet
        isVisible={actionsPost !== null}
        postId={actionsPost?.id}
        isOwnPost={actionsPost?.isOwnPost ?? false}
        onClose={() => setActionsPost(null)}
      />
    </View>
  );
}
