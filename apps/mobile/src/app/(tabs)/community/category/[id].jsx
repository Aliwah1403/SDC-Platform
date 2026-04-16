import { useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft, Check, Ban } from "lucide-react-native";
import { useCommunityFeedQuery } from "@/hooks/queries/useCommunityFeedQuery";
import {
  useLikeMutation,
  useSaveMutation,
} from "@/hooks/queries/useCommunityMutations";
import {
  useCategoryPrefsQuery,
  useFollowCategoryMutation,
  useBlockCategoryMutation,
  useRemoveCategoryPrefMutation,
} from "@/hooks/queries/useCategoryPrefsQuery";
import { PostCard } from "@/components/Community/PostCard";
import { PostSkeleton } from "@/components/Community/PostSkeleton";
import { CategoryCard } from "@/components/Community/CategoryCard";
import { CATEGORY_MAP, getRelatedCategories } from "@/data/communityCategories";
import { fonts } from "@/utils/fonts";

const RELATED_INSERT_AFTER = 2; // inject "You may also like" after this post index

export default function CategoryDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();

  const category = CATEGORY_MAP[id];

  const { data: allPosts = [] } = useCommunityFeedQuery("popular");
  const { data: prefs } = useCategoryPrefsQuery();
  const followedCategoryIds = prefs?.followedCategoryIds ?? [];
  const blockedCategoryIds = prefs?.blockedCategoryIds ?? [];

  const { mutate: likePost } = useLikeMutation();
  const { mutate: savePost } = useSaveMutation();
  const { mutate: followCategory } = useFollowCategoryMutation();
  const { mutate: blockCategory } = useBlockCategoryMutation();
  const { mutate: removeCategoryPref } = useRemoveCategoryPrefMutation();

  const isFollowing = followedCategoryIds.includes(id);
  const isBlocked = blockedCategoryIds.includes(id);

  function toggleFollowCategory() {
    isFollowing ? removeCategoryPref(id) : followCategory(id);
  }

  function toggleBlockCategory() {
    isBlocked ? removeCategoryPref(id) : blockCategory(id);
  }

  const relatedCategories = useMemo(() => getRelatedCategories(id), [id]);

  const categoryPosts = useMemo(
    () => allPosts.filter((p) => p.category === id),
    [allPosts, id],
  );

  // Inject the "You may also like" block after RELATED_INSERT_AFTER posts
  const listData = useMemo(() => {
    if (categoryPosts.length === 0) return categoryPosts;
    const insertAt = Math.min(RELATED_INSERT_AFTER, categoryPosts.length);
    return [
      ...categoryPosts.slice(0, insertAt),
      { id: "_related", _type: "related" },
      ...categoryPosts.slice(insertAt),
    ];
  }, [categoryPosts]);

  if (!category) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontFamily: fonts.regular, color: "#6B7280" }}>
          Category not found.
        </Text>
      </View>
    );
  }

  function renderItem({ item }) {
    if (item._type === "related") {
      return (
        <RelatedSection
          relatedCategories={relatedCategories}
          followedCategoryIds={followedCategoryIds}
          router={router}
        />
      );
    }
    return (
      <PostCard
        post={item}
        isLiked={item.isLiked ?? false}
        onLike={() =>
          likePost({ postId: item.id, isLiked: item.isLiked ?? false })
        }
        isSaved={item.isSaved ?? false}
        onSave={() =>
          savePost({ postId: item.id, isSaved: item.isSaved ?? false })
        }
        onPress={() => router.push(`/community/${item.id}`)}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F4F0" }}>
      <StatusBar style="light" />

      <FlatList
        data={listData}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListHeaderComponent={
          <CategoryHeader
            category={category}
            isFollowing={isFollowing}
            isBlocked={isBlocked}
            insets={insets}
            postCount={categoryPosts.length}
            onBack={() => router.back()}
            onFollow={toggleFollowCategory}
            onBlock={toggleBlockCategory}
          />
        }
        ListEmptyComponent={
          <View
            style={{
              alignItems: "center",
              paddingTop: 48,
              paddingHorizontal: 32,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.semibold,
                fontSize: 16,
                color: "#09332C",
                marginBottom: 6,
              }}
            >
              No posts yet
            </Text>
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 14,
                color: "#6B7280",
                textAlign: "center",
              }}
            >
              Be the first to post in this community.
            </Text>
          </View>
        }
        renderItem={renderItem}
      />
    </View>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function CategoryHeader({
  category,
  isFollowing,
  isBlocked,
  insets,
  postCount,
  onBack,
  onFollow,
  onBlock,
}) {
  return (
    <ImageBackground
      source={{ uri: category.photo }}
      style={{ minHeight: 320, marginBottom: 20 }}
      resizeMode="cover"
    >
      {/* Dark scrim — fades from semi-dark at top to darker at bottom for legibility */}
      <LinearGradient
        colors={["rgba(0,0,0,0.25)", "rgba(0,0,0,0.62)"]}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      {/* Content over scrim */}
      <View style={{ flex: 1, justifyContent: "space-between" }}>
        {/* Back button */}
        <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 16 }}>
          <TouchableOpacity
            onPress={onBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(0,0,0,0.3)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronLeft size={20} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Bottom content */}
        <View
          style={{ paddingHorizontal: 20, paddingBottom: 24, paddingTop: 40 }}
        >
          <Text
            style={{
              fontFamily: fonts.bold,
              fontSize: 30,
              color: "#FFFFFF",
              lineHeight: 36,
              marginBottom: 8,
            }}
          >
            {category.label}
          </Text>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 14,
              color: "rgba(255,255,255,0.85)",
              lineHeight: 21,
              marginBottom: 20,
            }}
          >
            {category.description}
          </Text>

          {/* CTAs */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {/* Follow pill */}
            <TouchableOpacity
              onPress={onFollow}
              activeOpacity={0.82}
              style={{
                flex: 1,
                height: 48,
                borderRadius: 24,
                backgroundColor: isFollowing
                  ? "rgba(255,255,255,0.2)"
                  : "#FFFFFF",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 6,
                borderWidth: isFollowing ? 1 : 0,
                borderColor: "rgba(255,255,255,0.45)",
              }}
            >
              {isFollowing && (
                <Check size={15} color="#FFFFFF" strokeWidth={2.5} />
              )}
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 16,
                  color: isFollowing ? "#FFFFFF" : "#09332C",
                }}
              >
                {isFollowing ? "Following" : "Follow"}
              </Text>
            </TouchableOpacity>

            {/* Block — small circle */}
            <TouchableOpacity
              onPress={onBlock}
              activeOpacity={0.82}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: isBlocked
                  ? "rgba(0,0,0,0.35)"
                  : "rgba(255,255,255,0.18)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.4)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ban
                size={20}
                color={isBlocked ? "rgba(255,255,255,0.45)" : "#FFFFFF"}
                strokeWidth={1.8}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

function RelatedSection({ relatedCategories, followedCategoryIds, router }) {
  if (relatedCategories.length === 0) return null;

  return (
    <View style={{ paddingVertical: 20 }}>
      {/* Section header */}
      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <Text
          style={{
            fontFamily: fonts.bold,
            fontSize: 15,
            color: "#09332C",
            marginBottom: 2,
          }}
        >
          You may also like
        </Text>
        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: 12,
            color: "#6B7280",
          }}
        >
          Similar communities you might enjoy
        </Text>
      </View>

      {/* Horizontal cards */}
      <FlatList
        data={relatedCategories}
        keyExtractor={(c) => c.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={({ item }) => (
          <CategoryCard
            category={item}
            isFollowing={followedCategoryIds.includes(item.id)}
            onPress={() => router.push(`/community/category/${item.id}`)}
          />
        )}
      />
    </View>
  );
}
