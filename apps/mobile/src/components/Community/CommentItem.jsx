import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MotiView } from "moti";
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

function Avatar({ name, initials, size = 34 }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: avatarColor(name),
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.bold,
          fontSize: size === 34 ? 12 : 10,
          color: "#F8E9E7",
        }}
      >
        {initials}
      </Text>
    </View>
  );
}

function ReplyRow({ reply, onReply }) {
  return (
    <View style={{ flexDirection: "row", marginBottom: 12 }}>
      <Avatar
        name={reply.author.name}
        initials={reply.author.avatarInitials}
        size={28}
      />
      <View style={{ flex: 1, marginLeft: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: "#09332C" }}>
            {reply.author.name}
          </Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "#9CA3AF" }}>
            {timeAgo(reply.timestamp)}
          </Text>
        </View>

        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: 14,
            color: "#374151",
            lineHeight: 20,
          }}
        >
          {reply.replyingToName && (
            <Text style={{ fontFamily: fonts.semibold, color: "#A9334D" }}>
              @{reply.replyingToName}{" "}
            </Text>
          )}
          {reply.content}
        </Text>

        <TouchableOpacity
          onPress={onReply}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          style={{ marginTop: 5 }}
        >
          <Text
            style={{
              fontFamily: fonts.semibold,
              fontSize: 12,
              color: "#9CA3AF",
            }}
          >
            Reply
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function CommentItem({ comment, onReply }) {
  const [repliesExpanded, setRepliesExpanded] = useState(false);
  const replyCount = comment.replies?.length ?? 0;

  return (
    <View style={{ marginBottom: 16 }}>
      {/* ── Main comment ──────────────────────────────────────────────────────── */}
      <View style={{ flexDirection: "row" }}>
        <View style={{ marginTop: 2, marginRight: 10 }}>
          <Avatar name={comment.author.name} initials={comment.author.avatarInitials} />
        </View>

        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 3,
            }}
          >
            <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: "#09332C" }}>
              {comment.author.name}
            </Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "#9CA3AF" }}>
              {timeAgo(comment.timestamp)}
            </Text>
          </View>

          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 14,
              color: "#374151",
              lineHeight: 20,
            }}
          >
            {comment.content}
          </Text>

          {/* Reply button */}
          {onReply && (
            <TouchableOpacity
              onPress={() => onReply(comment.id, comment.author.name)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              style={{ marginTop: 6 }}
            >
              <Text
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                  color: "#9CA3AF",
                }}
              >
                Reply
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Replies section ───────────────────────────────────────────────────── */}
      {replyCount > 0 && (
        <View
          style={{
            marginLeft: 44, // align under comment text (avatar 34 + gap 10)
            marginTop: 6,
          }}
        >
          {/* "View / Hide replies" toggle */}
          <TouchableOpacity
            onPress={() => setRepliesExpanded((v) => !v)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}
          >
            {/* Thread line stub */}
            <View
              style={{
                width: 20,
                height: 1.5,
                backgroundColor: "#D1C9C7",
                borderRadius: 1,
              }}
            />
            <Text
              style={{
                fontFamily: fonts.semibold,
                fontSize: 12,
                color: "#A9334D",
              }}
            >
              {repliesExpanded
                ? "Hide replies"
                : `View ${replyCount} ${replyCount === 1 ? "reply" : "replies"}`}
            </Text>
          </TouchableOpacity>

          {/* Expanded replies */}
          {repliesExpanded && (
            <MotiView
              from={{ opacity: 0, translateY: -4 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 180 }}
            >
              {/* Container with left thread line */}
              <View
                style={{
                  borderLeftWidth: 2,
                  borderLeftColor: "#EDE8E6",
                  paddingLeft: 12,
                }}
              >
                {comment.replies.map((reply) => (
                  <ReplyRow
                    key={reply.id}
                    reply={reply}
                    // replying to a reply targets the parent comment,
                    // but @-mentions the reply's author
                    onReply={() => onReply?.(comment.id, reply.author.name)}
                  />
                ))}
              </View>
            </MotiView>
          )}
        </View>
      )}
    </View>
  );
}
