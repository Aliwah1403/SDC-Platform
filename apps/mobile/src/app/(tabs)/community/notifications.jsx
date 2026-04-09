import { useMemo } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Heart, MessageCircle, Bell } from "lucide-react-native";
import { useAppStore } from "@/store/appStore";
import { fonts } from "@/utils/fonts";

function timeAgo(date) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const ICON_CONFIG = {
  like: { Component: Heart, color: "#A9334D", fill: true },
  comment: { Component: MessageCircle, color: "#3B82F6", fill: false },
  category_post: { Component: Bell, color: "#09332C", fill: false },
  system_poll: { Component: Bell, color: "#A9334D", fill: false },
};

function buildText(n) {
  if (n.type === "like") return { bold: n.actorName, rest: " liked your post" };
  if (n.type === "comment") return { bold: n.actorName, rest: " commented on your post" };
  if (n.type === "category_post") return { bold: n.categoryName, rest: " posted in this community" };
  return { bold: n.categoryName, rest: " started a new poll" };
}

function NotificationRow({ item }) {
  const cfg = ICON_CONFIG[item.type] ?? ICON_CONFIG.comment;
  const { bold, rest } = buildText(item);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        padding: 16,
        backgroundColor: item.read ? "#FFFFFF" : "#FDF8F7",
        borderLeftWidth: item.read ? 0 : 3,
        borderLeftColor: "#A9334D",
        borderBottomWidth: 1,
        borderBottomColor: "#F5F0EE",
      }}
    >
      {/* Icon circle */}
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: `${cfg.color}18`,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
          flexShrink: 0,
        }}
      >
        <cfg.Component
          size={16}
          color={cfg.color}
          strokeWidth={2}
          fill={cfg.fill ? cfg.color : "transparent"}
        />
      </View>

      {/* Text */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: 14,
            color: "#09332C",
            lineHeight: 20,
          }}
        >
          <Text style={{ fontFamily: fonts.semibold }}>{bold}</Text>
          {rest}
        </Text>

        {item.postSnippet && (
          <Text
            numberOfLines={1}
            style={{
              fontFamily: fonts.regular,
              fontSize: 12,
              color: "#9C8D8A",
              marginTop: 3,
            }}
          >
            "{item.postSnippet}"
          </Text>
        )}

        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: 11,
            color: "#9C8D8A",
            marginTop: 4,
          }}
        >
          {timeAgo(item.timestamp)}
        </Text>
      </View>
    </View>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const notifications = useAppStore((s) => s.notifications);
  const notificationCount = useAppStore((s) => s.notificationCount);
  const markAllNotificationsRead = useAppStore((s) => s.markAllNotificationsRead);

  // Group by Today / Yesterday / Earlier
  const sections = useMemo(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups = { Today: [], Yesterday: [], Earlier: [] };
    notifications.forEach((n) => {
      const d = new Date(n.timestamp);
      if (d.toDateString() === today.toDateString()) groups.Today.push(n);
      else if (d.toDateString() === yesterday.toDateString()) groups.Yesterday.push(n);
      else groups.Earlier.push(n);
    });

    const items = [];
    for (const [label, rows] of Object.entries(groups)) {
      if (rows.length === 0) continue;
      items.push({ id: `header_${label}`, _header: label });
      rows.forEach((r) => items.push(r));
    }
    return items;
  }, [notifications]);

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 12,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#FFFFFF",
          borderBottomWidth: 1,
          borderBottomColor: "#F0EAE8",
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#F8F4F0",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronLeft size={20} color="#09332C" strokeWidth={2} />
        </TouchableOpacity>

        <Text
          style={{
            flex: 1,
            textAlign: "center",
            fontFamily: fonts.bold,
            fontSize: 17,
            color: "#09332C",
          }}
        >
          Notifications
        </Text>

        {notificationCount > 0 ? (
          <TouchableOpacity
            onPress={markAllNotificationsRead}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: 13,
                color: "#A9334D",
              }}
            >
              Mark all read
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      <FlatList
        data={sections}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => {
          if (item._header) {
            return (
              <Text
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                  color: "#9C8D8A",
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  paddingHorizontal: 16,
                  paddingTop: 20,
                  paddingBottom: 8,
                  backgroundColor: "#F8F4F0",
                }}
              >
                {item._header}
              </Text>
            );
          }
          return <NotificationRow item={item} />;
        }}
        ListEmptyComponent={
          <View
            style={{ alignItems: "center", paddingTop: 80, paddingHorizontal: 32 }}
          >
            <Text
              style={{
                fontFamily: fonts.semibold,
                fontSize: 16,
                color: "#09332C",
                marginBottom: 6,
              }}
            >
              All caught up
            </Text>
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 14,
                color: "#6B7280",
                textAlign: "center",
              }}
            >
              Activity from your posts and followed communities will appear here.
            </Text>
          </View>
        }
      />
    </View>
  );
}
