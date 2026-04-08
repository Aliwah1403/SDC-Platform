import React from "react";
import { View, Text } from "react-native";
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

export function CommentItem({ comment }) {
  return (
    <View style={{ flexDirection: "row", marginBottom: 16 }}>
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: avatarColor(comment.author.name),
          alignItems: "center",
          justifyContent: "center",
          marginRight: 10,
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: "#F8E9E7" }}>
          {comment.author.avatarInitials}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: "#09332C" }}>
            {comment.author.name}
          </Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "#9CA3AF" }}>
            {timeAgo(comment.timestamp)}
          </Text>
        </View>
        <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: "#374151", lineHeight: 20 }}>
          {comment.content}
        </Text>
      </View>
    </View>
  );
}
