import { useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
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
import { PollBlock } from "@/components/Community/PollBlock";
import { useAppStore } from "@/store/appStore";
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

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const likedPostIds = useAppStore((s) => s.likedPostIds);
  const toggleLike = useAppStore((s) => s.toggleLike);
  const communityPosts = useAppStore((s) => s.communityPosts);
  const pollVotes = useAppStore((s) => s.pollVotes);
  const voteOnPoll = useAppStore((s) => s.voteOnPoll);
  const notificationCount = useAppStore((s) => s.notificationCount);

  const post = communityPosts.find((p) => p.id === postId);
  const [comments, setComments] = useState(post?.comments ?? []);
  const [inputText, setInputText] = useState("");
  const [actionsSheetOpen, setActionsSheetOpen] = useState(false);
  // { commentId: string, authorName: string } | null
  const [replyingTo, setReplyingTo] = useState(null);
  const inputRef = useRef(null);

  if (!post) return null;

  const isLiked = likedPostIds.includes(post.id);
  const displayLikes = post.likes + (isLiked ? 1 : 0);
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

    if (replyingTo) {
      const newReply = {
        id: `r-${Date.now()}`,
        author: { name: "You", avatarInitials: "ME" },
        replyingToName: replyingTo.authorName,
        content: text,
        timestamp: new Date(),
      };
      setComments((prev) =>
        prev.map((c) =>
          c.id === replyingTo.commentId
            ? { ...c, replies: [...(c.replies ?? []), newReply] }
            : c,
        ),
      );
      setReplyingTo(null);
    } else {
      setComments((prev) => [
        ...prev,
        {
          id: `new-${Date.now()}`,
          author: { name: "You", avatarInitials: "ME" },
          content: text,
          timestamp: new Date(),
        },
      ]);
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
      <View style={{ backgroundColor: "#fff", padding: 20, marginBottom: 8 }}>
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
            <Text
              style={{
                fontFamily: fonts.semibold,
                fontSize: 15,
                color: "#09332C",
              }}
            >
              {post.isAnonymous ? "Anonymous" : post.author.name}
            </Text>
            {!post.isSystemPost && !post.isAnonymous && post.author.scdType && (
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
            )}
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
        {post.isDiscussionPrompt ? (
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
              votedOptionId={pollVotes[post.id] ?? null}
              onVote={(optionId) => voteOnPoll(post.id, optionId)}
            />
          </View>
        )}

        {/* Photo */}
        {post.imageUrl && !post.isDiscussionPrompt && !post.poll && (
          <Image
            source={{ uri: post.imageUrl }}
            style={{
              width: "100%",
              height: 260,
              borderRadius: 12,
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
            onPress={() => toggleLike(post.id)}
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
              <CommentItem comment={item} onReply={handleReply} />
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
    </View>
  );
}
