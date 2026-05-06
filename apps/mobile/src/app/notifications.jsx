import { useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  Heart,
  MessageCircle,
  Bell,
  ShieldAlert,
  Pill,
  Flame,
  Calendar,
  AlertTriangle,
} from "lucide-react-native";
import {
  useCommunityNotificationsQuery,
  useMarkAllReadMutation,
} from "@/hooks/queries/useCommunityNotificationsQuery";
import {
  useSystemNotificationsQuery,
  useMarkAllSystemReadMutation,
} from "@/hooks/queries/useSystemNotificationsQuery";
import { fonts } from "@/utils/fonts";
import { useTheme } from "@/hooks/useTheme";

function timeAgo(date) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const ICON_CONFIG = {
  // Community types
  like: { Component: Heart, fill: true },
  comment: { Component: MessageCircle, fill: false },
  reply: { Component: MessageCircle, fill: false },
  category_post: { Component: Bell, fill: false },
  system_poll: { Component: Bell, fill: false },
  post_actioned: { Component: ShieldAlert, fill: false },
  // System types
  checkin: { Component: Bell, fill: false },
  medication: { Component: Pill, fill: false },
  streak: { Component: Flame, fill: false },
  appointment: { Component: Calendar, fill: false },
  health_alert: { Component: AlertTriangle, fill: false },
};

function buildText(n) {
  // System notifications have explicit title + body
  if (n._source === "system")
    return { bold: n.title, rest: n.body ? `\n${n.body}` : "" };

  if (n.type === "like") {
    const others = (n.actorCount ?? 1) - 1;
    const rest =
      others > 0
        ? ` and ${others} other${others > 1 ? "s" : ""} liked your post`
        : " liked your post";
    return { bold: n.actorName ?? "Someone", rest };
  }
  if (n.type === "comment")
    return { bold: n.actorName ?? "Someone", rest: " commented on your post" };
  if (n.type === "reply") {
    const others = (n.actorCount ?? 1) - 1;
    const rest =
      others > 0
        ? ` and ${others} other${others > 1 ? "s" : ""} replied to your comment`
        : " replied to your comment";
    return { bold: n.actorName ?? "Someone", rest };
  }
  if (n.type === "category_post")
    return { bold: n.categoryName, rest: " posted in this community" };
  if (n.type === "post_actioned")
    return { bold: "Your post was removed", rest: ` · ${n.reason}` };
  return { bold: n.categoryName, rest: " started a new poll" };
}

function NotificationRow({ item, theme }) {
  const cfg = ICON_CONFIG[item.type] ?? ICON_CONFIG.comment;
  const { bold, rest } = buildText(item);
  const sourceAccent = item._source === "system" ? theme.cta : theme.accent;
  const iconColor =
    item.type === "health_alert" ? theme.destructive : sourceAccent;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        padding: 16,
        backgroundColor: item.read ? theme.surface : theme.background,
        borderLeftWidth: item.read ? 0 : 3,
        borderLeftColor: sourceAccent,
        borderBottomWidth: 1,
        borderBottomColor: theme.divider,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: `${iconColor}18`,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
          flexShrink: 0,
        }}
      >
        <cfg.Component
          size={16}
          color={iconColor}
          strokeWidth={2}
          fill={cfg.fill ? iconColor : "transparent"}
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: 14,
            color: theme.text,
            lineHeight: 20,
          }}
        >
          <Text style={{ fontFamily: fonts.semibold }}>{bold}</Text>
          {rest && item._source !== "system" ? rest : null}
        </Text>

        {item._source === "system" && rest ? (
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 13,
              color: theme.textSecondary,
              marginTop: 2,
              lineHeight: 18,
            }}
          >
            {item.body}
          </Text>
        ) : null}

        {item._source === "community" && item.postSnippet ? (
          <Text
            numberOfLines={1}
            style={{
              fontFamily: fonts.regular,
              fontSize: 12,
              color: theme.textSecondary,
              marginTop: 3,
            }}
          >
            "{item.postSnippet}"
          </Text>
        ) : null}

        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: 11,
            color: theme.textSecondary,
            marginTop: 4,
          }}
        >
          {timeAgo(item.createdAt ?? item.timestamp)}
        </Text>
      </View>
    </View>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useTheme();

  const { data: communityNotifs = [], isLoading: communityLoading } =
    useCommunityNotificationsQuery();
  const { data: systemNotifs = [], isLoading: systemLoading } =
    useSystemNotificationsQuery();
  const { mutate: markCommunityRead } = useMarkAllReadMutation();
  const { mutate: markSystemRead } = useMarkAllSystemReadMutation();

  const isLoading = communityLoading || systemLoading;

  // Merge, tag source, sort newest-first
  const allNotifications = useMemo(() => {
    const tagged = [
      ...communityNotifs.map((n) => ({ ...n, _source: "community" })),
      ...systemNotifs.map((n) => ({ ...n, _source: "system" })),
    ];
    return tagged.sort(
      (a, b) =>
        new Date(b.createdAt ?? b.timestamp) -
        new Date(a.createdAt ?? a.timestamp),
    );
  }, [communityNotifs, systemNotifs]);

  const unreadCount = allNotifications.filter((n) => !n.read).length;

  function handleMarkAllRead() {
    markCommunityRead();
    markSystemRead();
  }

  // Group by Today / Yesterday / Earlier
  const sections = useMemo(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups = { Today: [], Yesterday: [], Earlier: [] };
    allNotifications.forEach((n) => {
      const d = new Date(n.createdAt ?? n.timestamp);
      if (d.toDateString() === today.toDateString()) groups.Today.push(n);
      else if (d.toDateString() === yesterday.toDateString())
        groups.Yesterday.push(n);
      else groups.Earlier.push(n);
    });

    const items = [];
    for (const [label, rows] of Object.entries(groups)) {
      if (rows.length === 0) continue;
      items.push({ id: `header_${label}`, _header: label });
      rows.forEach((r) => items.push(r));
    }
    return items;
  }, [allNotifications]);

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <StatusBar style={t.isDark ? "light" : "dark"} />

      <View
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 12,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: t.surface,
          borderBottomWidth: 1,
          borderBottomColor: t.border,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: t.background,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronLeft size={20} color={t.text} strokeWidth={2} />
        </TouchableOpacity>

        <Text
          style={{
            flex: 1,
            textAlign: "center",
            marginLeft: 36,
            fontFamily: fonts.bold,
            fontSize: 17,
            color: t.text,
          }}
        >
          Notifications
        </Text>

        {unreadCount > 0 ? (
          <TouchableOpacity
            onPress={handleMarkAllRead}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: 13,
                color: t.accent,
              }}
            >
              Mark all read
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {isLoading && (
        <ActivityIndicator style={{ marginTop: 40 }} color={t.accent} />
      )}
      <FlatList
        data={isLoading ? [] : sections}
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
                  color: t.textSecondary,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  paddingHorizontal: 16,
                  paddingTop: 20,
                  paddingBottom: 8,
                  backgroundColor: t.background,
                }}
              >
                {item._header}
              </Text>
            );
          }
          return <NotificationRow item={item} theme={t} />;
        }}
        ListEmptyComponent={
          <View
            style={{
              alignItems: "center",
              paddingTop: 80,
              paddingHorizontal: 32,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.semibold,
                fontSize: 16,
                color: t.text,
                marginBottom: 6,
              }}
            >
              All caught up
            </Text>
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 14,
                color: t.textSecondary,
                textAlign: "center",
              }}
            >
              Health reminders and community activity will appear here.
            </Text>
          </View>
        }
      />
    </View>
  );
}
