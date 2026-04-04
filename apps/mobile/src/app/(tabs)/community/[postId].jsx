import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Share,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Heart, Share2, Send } from "lucide-react-native";
import { CommentItem } from "@/components/Community/CommentItem";
import { useAppStore } from "@/store/appStore";
import { mockCommunityPosts } from "@/types";
import { fonts } from "@/utils/fonts";
import { LinearGradient } from "expo-linear-gradient";

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
  wins: "Wins",
  tips: "Tips",
  questions: "Questions",
  pain: "Pain & Treatment",
  new: "New to SCD",
  research: "Research",
};

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const likedPostIds = useAppStore((s) => s.likedPostIds);
  const toggleLike = useAppStore((s) => s.toggleLike);

  const post = mockCommunityPosts.find((p) => p.id === postId);
  const [comments, setComments] = useState(post?.comments ?? []);
  const [inputText, setInputText] = useState("");

  if (!post) return null;

  const isLiked = likedPostIds.includes(post.id);
  const displayLikes = post.likes + (isLiked ? 1 : 0);

  const handleSubmitComment = () => {
    const text = inputText.trim();
    if (!text) return;
    setComments((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        author: { name: "You", avatarInitials: "ME" },
        content: text,
        timestamp: new Date(),
      },
    ]);
    setInputText("");
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${post.author.name} on Hemo: "${post.content}"`,
      });
    } catch (_) {}
  };

  const ListHeader = (
    <View>
      {/* Nav header */}

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
        {/* Decorative circles */}
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

        {/* Title row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
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
          <Text
            style={{ fontFamily: fonts.bold, fontSize: 24, color: "#F8E9E7" }}
          >
            Community
          </Text>
        </View>
      </LinearGradient>

      {/* Post body */}
      <View style={{ backgroundColor: "#fff", padding: 20, marginBottom: 8 }}>
        {/* Author */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
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
              style={{ fontFamily: fonts.bold, fontSize: 15, color: "#F8E9E7" }}
            >
              {post.author.avatarInitials}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Text
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: 15,
                  color: "#09332C",
                }}
              >
                {post.author.name}
              </Text>
              <View
                style={{
                  backgroundColor: "#F8E9E7",
                  borderRadius: 10,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
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
            </View>
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
          </View>
        </View>

        {/* Full content */}
        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: 16,
            color: "#09332C",
            lineHeight: 24,
            marginBottom: 14,
          }}
        >
          {post.content}
        </Text>

        {/* Category chip */}
        <View
          style={{
            alignSelf: "flex-start",
            backgroundColor: "#F8F4F0",
            borderRadius: 10,
            paddingHorizontal: 10,
            paddingVertical: 4,
            marginBottom: 14,
          }}
        >
          <Text
            style={{ fontFamily: fonts.medium, fontSize: 12, color: "#09332C" }}
          >
            {CATEGORY_LABELS[post.category] ?? post.category}
          </Text>
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
              <CommentItem comment={item} />
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
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: Math.max(insets.bottom, 16),
            flexDirection: "row",
            alignItems: "flex-end",
            gap: 10,
          }}
        >
          <TextInput
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
            placeholder="Add a comment..."
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
      </KeyboardAvoidingView>
    </View>
  );
}
