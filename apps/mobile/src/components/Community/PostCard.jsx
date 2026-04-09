import React from "react";
import { View, Text, TouchableOpacity, Share, Image } from "react-native";
import { Bookmark, Heart, MessageCircle, Share2 } from "lucide-react-native";
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

export function PostCard({ post, isLiked, onLike, isSaved, onSave, onPress }) {
  const handleShare = async () => {
    try {
      await Share.share({
        message: `${post.author.name} on Hemo: "${post.content}"`,
      });
    } catch (_) {}
  };

  const displayLikes = post.likes + (isLiked ? 1 : 0);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.95}
      style={{
        backgroundColor: "#fff",
        borderRadius: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        overflow: "hidden",
        shadowColor: "#09332C",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      {/* Author row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 16,
          paddingBottom: 10,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: avatarColor(post.author.name),
            alignItems: "center",
            justifyContent: "center",
            marginRight: 10,
          }}
        >
          <Text
            style={{ fontFamily: fonts.bold, fontSize: 14, color: "#F8E9E7" }}
          >
            {post.author.avatarInitials}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text
              style={{
                fontFamily: fonts.semibold,
                fontSize: 14,
                color: "#09332C",
              }}
            >
              {post.author.name}
            </Text>
            <View
              style={{
                backgroundColor: "#F8E9E7",
                borderRadius: 10,
                paddingHorizontal: 7,
                paddingVertical: 2,
              }}
            ></View>
          </View>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 12,
              color: "#6B7280",
              marginTop: 1,
            }}
          >
            {timeAgo(post.timestamp)}
          </Text>
        </View>
      </View>

      {/* Content */}
      <Text
        numberOfLines={post.imageUrl ? 3 : 4}
        style={{
          fontFamily: fonts.regular,
          fontSize: 15,
          color: "#09332C",
          lineHeight: 22,
          paddingHorizontal: 16,
          marginBottom: 12,
        }}
      >
        {post.content}
      </Text>

      {/* Photo */}
      {post.imageUrl && (
        <Image
          source={{ uri: post.imageUrl }}
          style={{ width: "100%", height: 200 }}
          resizeMode="cover"
        />
      )}

      {/* Category chip + action row */}
      <View style={{ padding: 16, paddingTop: post.imageUrl ? 12 : 0 }}>
        <View
          style={{
            alignSelf: "flex-start",
            backgroundColor: "#F8F4F0",
            borderRadius: 10,
            paddingHorizontal: 10,
            paddingVertical: 3,
            marginBottom: 12,
          }}
        >
          <Text
            style={{ fontFamily: fonts.medium, fontSize: 11, color: "#09332C" }}
          >
            {CATEGORY_LABELS[post.category] ?? post.category}
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderTopWidth: 1,
            borderTopColor: "#F0EAE8",
            paddingTop: 10,
          }}
        >
          <TouchableOpacity
            onPress={onLike}
            style={{ flexDirection: "row", alignItems: "center", gap: 5, marginRight: 16 }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Heart
              size={18}
              color={isLiked ? "#A9334D" : "#9CA3AF"}
              fill={isLiked ? "#A9334D" : "transparent"}
              strokeWidth={2}
            />
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: 13,
                color: isLiked ? "#A9334D" : "#6B7280",
              }}
            >
              {displayLikes}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onPress}
            style={{ flexDirection: "row", alignItems: "center", gap: 5, marginRight: 16 }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MessageCircle size={18} color="#9CA3AF" strokeWidth={2} />
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: 13,
                color: "#6B7280",
              }}
            >
              {post.comments.length}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShare}
            style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Share2 size={18} color="#9CA3AF" strokeWidth={2} />
          </TouchableOpacity>

          <View style={{ flex: 1 }} />

          <TouchableOpacity
            onPress={onSave}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Bookmark
              size={18}
              color={isSaved ? "#A9334D" : "#9CA3AF"}
              fill={isSaved ? "#A9334D" : "transparent"}
              strokeWidth={2}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}
