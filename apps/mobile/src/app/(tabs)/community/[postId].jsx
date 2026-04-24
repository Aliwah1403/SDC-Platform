import { useState, useRef, useEffect } from "react";
import { usePostHog } from "posthog-react-native";
import {
  View,
  Text,
  FlatList,
  Animated,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Share,
  Image,
  ImageBackground,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Bell,
  Heart,
  MoreHorizontal,
  Send,
  Share2,
  UserCircle,
  X,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { CommentItem } from "@/components/Community/CommentItem";
import { PostActionsSheet } from "@/components/Community/PostActionsSheet";
import { CommentActionsSheet } from "@/components/Community/CommentActionsSheet";
import { PollBlock } from "@/components/Community/PollBlock";
import { usePostDetailQuery } from "@/hooks/queries/usePostDetailQuery";
import {
  useLikeMutation,
  useAddCommentMutation,
  useAddReplyMutation,
  useVoteMutation,
} from "@/hooks/queries/useCommunityMutations";
import { useCommunityNotificationsQuery } from "@/hooks/queries/useCommunityNotificationsQuery";
import {
  useCategoryPrefsQuery,
  useFollowCategoryMutation,
} from "@/hooks/queries/useCategoryPrefsQuery";
import { CATEGORY_MAP } from "@/data/communityCategories";
import { fonts } from "@/utils/fonts";

const AVATAR_COLORS = ["#A9334D", "#09332C", "#781D11", "#5C2E00"];

function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + hash * 31;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function timeAgo(date) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const CATEGORY_LABELS = {
  wins: "Wins & Achievements",
  daily: "Daily Life",
  pain: "Pain & Crisis",
  mental: "Mental Health & Emotions",
  tips: "Tips & Advice",
  medications: "Medications",
  diet: "Diet & Nutrition",
  exercise: "Exercise & Movement",
  questions: "Questions",
  new: "New to SCD",
  research: "Research & Clinical Trials",
  support: "Support & Encouragement",
};

const FLAIR_CONFIG = {
  advice: { label: "Asking for advice", color: "#3B82F6" },
  story: { label: "Sharing my story", color: "#7C3AED" },
  vent: { label: "Vent", color: "#F59E0B" },
  win: { label: "Win 🏆", color: "#10B981" },
  info: { label: "Research/Info", color: "#0D9488" },
};

function SkeletonBox({ opacity, style }) {
  return (
    <Animated.View
      style={[{ backgroundColor: "#E8E0DC", borderRadius: 6, opacity }, style]}
    />
  );
}

function PostDetailSkeleton({ insets }) {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <StatusBar style="light" />
      {/* Gradient header placeholder */}
      <View
        style={{
          backgroundColor: "#A9334D",
          paddingTop: insets.top + 12,
          paddingBottom: 16,
          paddingHorizontal: 20,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <SkeletonBox opacity={pulse} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.25)" }} />
          <SkeletonBox opacity={pulse} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.25)" }} />
        </View>
      </View>

      {/* Post body placeholder */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 20 }}>
        {/* Author row */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <SkeletonBox opacity={pulse} style={{ width: 44, height: 44, borderRadius: 22, marginRight: 12 }} />
          <View style={{ gap: 8 }}>
            <SkeletonBox opacity={pulse} style={{ width: 120, height: 13 }} />
            <SkeletonBox opacity={pulse} style={{ width: 72, height: 11 }} />
          </View>
        </View>

        {/* Content lines */}
        <SkeletonBox opacity={pulse} style={{ height: 14, marginBottom: 10 }} />
        <SkeletonBox opacity={pulse} style={{ height: 14, marginBottom: 10, width: "90%" }} />
        <SkeletonBox opacity={pulse} style={{ height: 14, marginBottom: 10, width: "75%" }} />
        <SkeletonBox opacity={pulse} style={{ height: 14, marginBottom: 10, width: "82%" }} />

        {/* Actions row */}
        <View style={{ flexDirection: "row", gap: 20, marginTop: 20 }}>
          <SkeletonBox opacity={pulse} style={{ width: 56, height: 12 }} />
          <SkeletonBox opacity={pulse} style={{ width: 56, height: 12 }} />
          <SkeletonBox opacity={pulse} style={{ width: 40, height: 12 }} />
        </View>
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: "#F0EAE7", marginHorizontal: 16 }} />

      {/* Comment placeholders */}
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ flexDirection: "row", paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
          <SkeletonBox opacity={pulse} style={{ width: 36, height: 36, borderRadius: 18, flexShrink: 0 }} />
          <View style={{ flex: 1, gap: 8, paddingTop: 2 }}>
            <SkeletonBox opacity={pulse} style={{ width: 100, height: 12 }} />
            <SkeletonBox opacity={pulse} style={{ height: 12 }} />
            <SkeletonBox opacity={pulse} style={{ height: 12, width: `${70 + i * 7}%` }} />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const posthog = usePostHog();

  const { data: post, isLoading, isError } = usePostDetailQuery(postId);
  const { data: notificationsData = [] } = useCommunityNotificationsQuery();
  const notificationCount = notificationsData.filter((n) => !n.read).length;

  const { mutate: likePost } = useLikeMutation();
  const { mutate: addComment } = useAddCommentMutation();
  const { mutate: addReply } = useAddReplyMutation();
  const { mutate: voteOnPoll } = useVoteMutation();
  const { data: prefs } = useCategoryPrefsQuery();
  const { mutate: followCategory } = useFollowCategoryMutation();
  const followedCategoryIds = prefs?.followedCategoryIds ?? [];

  const [inputText, setInputText] = useState("");
  const [actionsSheetOpen, setActionsSheetOpen] = useState(false);

  // Track post view once data is available
  useEffect(() => {
    if (!post) return;
    posthog?.capture('post_viewed', { post_type: post.poll ? 'poll' : 'text' });
  }, [!!post]);
  const [actionsComment, setActionsComment] = useState(null); // { id, isOwnComment }
  // { commentId: string, authorName: string } | null
  const [replyingTo, setReplyingTo] = useState(null);
  const inputRef = useRef(null);

  if (isLoading) {
    return <PostDetailSkeleton insets={insets} />;
  }

  if (isError || (!isLoading && !post)) {
    return (
      <View style={{ flex: 1, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }}>
        <StatusBar style="dark" />
        <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: "#09332C", marginBottom: 8, textAlign: "center" }}>
          Post not found
        </Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: "#6B6B6B", textAlign: "center", marginBottom: 24 }}>
          This post may have been removed or is no longer available.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ backgroundColor: "#A9334D", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 }}
        >
          <Text style={{ fontFamily: fonts.semiBold, fontSize: 14, color: "#fff" }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isLiked = post.isLiked ?? false;
  const displayLikes = post.likes;
  const comments = post.comments ?? [];
  const systemCategory = post.isSystemPost
    ? CATEGORY_MAP[post.systemCategory]
    : null;
  const flair = post.flair ? FLAIR_CONFIG[post.flair] : null;

  const handleReply = (commentId, authorName) => {
    setReplyingTo({ commentId, authorName });
    inputRef.current?.focus();
  };

  const handleSubmitComment = () => {
    const text = inputText.trim();
    if (!text) return;

    posthog?.capture('comment_submitted', { is_reply: !!replyingTo });

    if (replyingTo) {
      addReply({
        postId,
        parentCommentId: replyingTo.commentId,
        replyingToName: replyingTo.authorName,
        content: text,
      });
      setReplyingTo(null);
    } else {
      addComment({ postId, content: text });
    }

    setInputText("");
  };

  const handleShare = async () => {
    try {
      const author = post.isAnonymous ? "Someone" : post.author.name;
      await Share.share({ message: `${author} on Hemo: "${post.content}"` });
    } catch (_) {}
  };

  const ListHeader = (
    <View>
      {/* Gradient header */}
      <LinearGradient
        colors={["#D09F9A", "#A9334D", "#781D11"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: insets.top + 12,
          paddingBottom: 16,
          paddingHorizontal: 20,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            position: "absolute",
            width: 180,
            height: 180,
            borderRadius: 999,
            backgroundColor: "#D09F9A",
            opacity: 0.15,
            top: -60,
            right: -40,
          }}
        />
        <View
          style={{
            position: "absolute",
            width: 120,
            height: 120,
            borderRadius: 999,
            backgroundColor: "#781D11",
            opacity: 0.15,
            bottom: -20,
            left: -30,
          }}
        />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
            gap: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: 20,
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowLeft size={20} color="#F8E9E7" strokeWidth={2} />
          </TouchableOpacity>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TouchableOpacity
            onPress={() => router.push("/community/notifications")}
            style={{
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: 20,
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
            }}
            activeOpacity={0.7}
          >
            <View style={{ position: "relative" }}>
              <Bell size={20} color="#F8E9E7" strokeWidth={2} />
              {notificationCount > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: -3,
                    right: -3,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "#DC2626",
                    borderWidth: 1.5,
                    borderColor: "rgba(169,51,77,0.9)",
                  }}
                />
              )}
            </View>
          </TouchableOpacity>

          {!post.isSystemPost && (
            <TouchableOpacity
              onPress={() => setActionsSheetOpen(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                borderRadius: 20,
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
              }}
              activeOpacity={0.7}
            >
              <MoreHorizontal size={20} color="#F8E9E7" strokeWidth={2} />
            </TouchableOpacity>
          )}
          </View>
        </View>
      </LinearGradient>

      {/* Post body */}
      <View style={{ backgroundColor: "#fff", paddingHorizontal: 8, paddingVertical: 20, marginBottom: 8 }}>
        {/* Author row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          {post.isSystemPost && systemCategory ? (
            <ImageBackground
              source={{ uri: systemCategory.photo }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                overflow: "hidden",
                marginRight: 12,
              }}
              imageStyle={{ borderRadius: 22 }}
              resizeMode="cover"
            />
          ) : post.isAnonymous ? (
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "#E5E0DD",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <UserCircle size={24} color="#9C8D8A" strokeWidth={1.5} />
            </View>
          ) : (
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: avatarColor(post.author.name),
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 15,
                  color: "#F8E9E7",
                }}
              >
                {post.author.avatarInitials}
              </Text>
            </View>
          )}

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: 15,
                  color: "#09332C",
                }}
              >
                {post.isSystemPost && systemCategory
                  ? systemCategory.label
                  : post.isAnonymous
                  ? "Anonymous"
                  : post.author.name}
              </Text>
              {post.isSystemPost &&
                post.systemCategory &&
                !followedCategoryIds.includes(post.systemCategory) && (
                  <TouchableOpacity
                    onPress={() => followCategory(post.systemCategory)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text
                      style={{
                        fontFamily: fonts.semibold,
                        fontSize: 13,
                        color: "#A9334D",
                      }}
                    >
                      · Follow
                    </Text>
                  </TouchableOpacity>
                )}
            </View>
            {/* {!post.isSystemPost && !post.isAnonymous && post.author.scdType && (
              <View
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: "#F8E9E7",
                  borderRadius: 8,
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  marginTop: 2,
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.medium,
                    fontSize: 11,
                    color: "#A9334D",
                  }}
                >
                  {post.author.scdType}
                </Text>
              </View>
            )} */}
            {!post.isSystemPost && (
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 13,
                  color: "#6B7280",
                  marginTop: 2,
                }}
              >
                {timeAgo(post.timestamp)}
              </Text>
            )}
          </View>
        </View>

        {/* Content / discussion prompt */}
        {post.poll ? (
          <Text
            style={{
              fontFamily: fonts.bold,
              fontSize: 22,
              color: "#09332C",
              lineHeight: 30,
              marginBottom: 14,
            }}
          >
            {post.content}
          </Text>
        ) : post.isDiscussionPrompt ? (
          <ImageBackground
            source={{ uri: post.imageUrl }}
            style={{
              width: "100%",
              height: 220,
              borderRadius: 12,
              overflow: "hidden",
              marginBottom: 16,
            }}
            resizeMode="cover"
          >
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.65)"]}
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 130,
              }}
            />
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: 16,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 18,
                  color: "#FFFFFF",
                  lineHeight: 26,
                }}
              >
                {post.content}
              </Text>
            </View>
          </ImageBackground>
        ) : (
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 16,
              color: "#09332C",
              lineHeight: 24,
              marginBottom: post.poll ? 12 : post.imageUrl ? 16 : 14,
            }}
          >
            {post.content}
          </Text>
        )}

        {/* Poll */}
        {post.poll && (
          <View style={{ marginBottom: 12, marginHorizontal: -4 }}>
            <PollBlock
              poll={post.poll}
              votedOptionId={post.poll?.votedOptionId ?? null}
              onVote={(optionId) => {
                posthog?.capture('poll_voted', {});
                voteOnPoll({
                  postId: post.id,
                  optionId,
                  previousOptionId: post.poll?.votedOptionId ?? undefined,
                });
              }}
            />
          </View>
        )}

        {/* Photo — full width, breaks out of horizontal padding */}
        {post.imageUrl && !post.isDiscussionPrompt && !post.poll && (
          <Image
            source={{ uri: post.imageUrl }}
            style={{
              marginHorizontal: -16,
              height: 280,
              marginBottom: 16,
            }}
            resizeMode="cover"
          />
        )}

        {/* Category + flair chips */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginBottom: 14,
          }}
        >
          <View
            style={{
              backgroundColor: "#F8F4F0",
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: 12,
                color: "#09332C",
              }}
            >
              {CATEGORY_LABELS[post.category] ?? post.category}
            </Text>
          </View>
          {flair && (
            <View
              style={{
                backgroundColor: flair.color,
                borderRadius: 10,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.medium,
                  fontSize: 12,
                  color: "#FFFFFF",
                }}
              >
                {flair.label}
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 24,
            borderTopWidth: 1,
            borderTopColor: "#F0EAE8",
            paddingTop: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              posthog?.capture('post_liked', { action: isLiked ? 'unlike' : 'like' });
              likePost({ postId: post.id, isLiked });
            }}
            style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <Heart
              size={20}
              color={isLiked ? "#A9334D" : "#9CA3AF"}
              fill={isLiked ? "#A9334D" : "transparent"}
              strokeWidth={2}
            />
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: 14,
                color: isLiked ? "#A9334D" : "#6B7280",
              }}
            >
              {displayLikes}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShare}
            style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <Share2 size={20} color="#9CA3AF" strokeWidth={2} />
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: 14,
                color: "#6B7280",
              }}
            >
              Share
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Comments header */}
      <View
        style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 }}
      >
        <Text
          style={{ fontFamily: fonts.semibold, fontSize: 16, color: "#09332C" }}
        >
          {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F4F0" }}>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={ListHeader}
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: 20 }}>
              <CommentItem
                comment={item}
                onReply={handleReply}
                onLongPress={(commentId, isOwnComment) =>
                  setActionsComment({ id: commentId, isOwnComment })
                }
              />
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        />

        {/* Comment input */}
        <View
          style={{
            backgroundColor: "#fff",
            borderTopWidth: 1,
            borderTopColor: "#F0EAE8",
          }}
        >
          {/* Replying-to chip */}
          {replyingTo && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 16,
                paddingTop: 8,
                paddingBottom: 4,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 13,
                  color: "#6B7280",
                }}
              >
                Replying to{" "}
                <Text style={{ fontFamily: fonts.semibold, color: "#A9334D" }}>
                  @{replyingTo.authorName}
                </Text>
              </Text>
              <TouchableOpacity
                onPress={() => setReplyingTo(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={14} color="#9CA3AF" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          )}

          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: replyingTo ? 4 : 12,
              paddingBottom: Math.max(insets.bottom, 16),
              flexDirection: "row",
              alignItems: "flex-end",
              gap: 10,
            }}
          >
          <TextInput
            ref={inputRef}
            style={{
              flex: 1,
              fontFamily: fonts.regular,
              fontSize: 15,
              color: "#09332C",
              backgroundColor: "#F8F4F0",
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              maxHeight: 100,
            }}
            placeholder={replyingTo ? `Reply to @${replyingTo.authorName}…` : "Add a comment…"}
            placeholderTextColor="#9CA3AF"
            multiline
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity
            onPress={handleSubmitComment}
            disabled={!inputText.trim()}
            style={{
              backgroundColor: inputText.trim() ? "#A9334D" : "#E5E7EB",
              borderRadius: 20,
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
            }}
            activeOpacity={0.8}
          >
            <Send size={18} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <PostActionsSheet
        isVisible={actionsSheetOpen}
        postId={post.id}
        isOwnPost={!!post.author?.isCurrentUser}
        onClose={() => setActionsSheetOpen(false)}
      />

      <CommentActionsSheet
        isVisible={actionsComment !== null}
        commentId={actionsComment?.id}
        postId={post.id}
        isOwnComment={actionsComment?.isOwnComment ?? false}
        onClose={() => setActionsComment(null)}
      />
    </View>
  );
}
