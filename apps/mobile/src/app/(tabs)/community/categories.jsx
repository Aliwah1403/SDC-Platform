import { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Check, Ban } from "lucide-react-native";
import {
  useCategoryPrefsQuery,
  useFollowCategoryMutation,
  useBlockCategoryMutation,
  useRemoveCategoryPrefMutation,
} from "@/hooks/queries/useCategoryPrefsQuery";
import { COMMUNITY_CATEGORIES_DATA } from "@/data/communityCategories";
import { fonts } from "@/utils/fonts";
import { useTheme } from "@/hooks/useTheme";

const GROUP_FILTERS = [
  { id: "following", label: "Following" },
  { id: "all", label: "All" },
  ...COMMUNITY_CATEGORIES_DATA.map((g) => ({ id: g.group, label: g.group })),
];

export default function CategoriesScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState("all");

  const { data: prefs } = useCategoryPrefsQuery();
  const followedCategoryIds = prefs?.followedCategoryIds ?? [];
  const blockedCategoryIds = prefs?.blockedCategoryIds ?? [];

  const { mutate: followCategory } = useFollowCategoryMutation();
  const { mutate: blockCategory } = useBlockCategoryMutation();
  const { mutate: removeCategoryPref } = useRemoveCategoryPrefMutation();

  function toggleFollowCategory(categoryId) {
    if (followedCategoryIds.includes(categoryId)) {
      removeCategoryPref(categoryId);
    } else {
      followCategory(categoryId);
    }
  }

  function toggleBlockCategory(categoryId) {
    if (blockedCategoryIds.includes(categoryId)) {
      removeCategoryPref(categoryId);
    } else {
      blockCategory(categoryId);
    }
  }

  const visibleGroups = useMemo(() => {
    if (activeFilter === "following") {
      return COMMUNITY_CATEGORIES_DATA.map((g) => ({
        ...g,
        categories: g.categories.filter((c) =>
          followedCategoryIds.includes(c.id)
        ),
      })).filter((g) => g.categories.length > 0);
    }
    if (activeFilter === "all") return COMMUNITY_CATEGORIES_DATA;
    return COMMUNITY_CATEGORIES_DATA.filter((g) => g.group === activeFilter);
  }, [activeFilter, followedCategoryIds]);

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <StatusBar style={t.isDark ? "light" : "dark"} />

      {/* Header */}
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
            fontFamily: fonts.bold,
            fontSize: 17,
            color: t.text,
          }}
        >
          Communities
        </Text>

        <View style={{ width: 36 }} />
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          gap: 8,
          alignItems: "center",
        }}
        style={{ flexGrow: 0, backgroundColor: t.surface }}
      >
        {GROUP_FILTERS.map((f) => {
          const isActive = activeFilter === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              onPress={() => setActiveFilter(f.id)}
              activeOpacity={0.75}
              style={{
                paddingHorizontal: 16,
                height: 34,
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isActive ? "#A9334D" : t.background,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: 13,
                  color: isActive ? "#F8E9E7" : t.text,
                }}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Category list */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {visibleGroups.length === 0 && activeFilter === "following" ? (
          <View
            style={{
              alignItems: "center",
              paddingTop: 60,
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
              Not following anything yet
            </Text>
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 14,
                color: t.textSecondary,
                textAlign: "center",
              }}
            >
              Tap Follow on any community below to personalise your feed.
            </Text>
          </View>
        ) : (
          visibleGroups.map((group, gi) => (
            <View key={group.group}>
              {/* Group label */}
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 13,
                  color: t.textSecondary,
                  paddingHorizontal: 20,
                  paddingTop: gi === 0 ? 12 : 20,
                  paddingBottom: 8,
                }}
              >
                {group.group}
              </Text>

              {group.categories.map((cat, ci) => {
                const isFollowing = followedCategoryIds.includes(cat.id);
                const isBlocked = blockedCategoryIds.includes(cat.id);
                const isLast = ci === group.categories.length - 1;

                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() =>
                      router.push(`/community/category/${cat.id}`)
                    }
                    activeOpacity={0.7}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 20,
                      paddingVertical: 12,
                      borderBottomWidth: isLast ? 0 : 1,
                      borderBottomColor: t.divider,
                    }}
                  >
                    {/* Circular photo avatar */}
                    <ImageBackground
                      source={{ uri: cat.photo }}
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 26,
                        marginRight: 14,
                        overflow: "hidden",
                      }}
                      imageStyle={{ borderRadius: 26 }}
                      resizeMode="cover"
                    />

                    {/* Name + post count */}
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: fonts.semibold,
                          fontSize: 15,
                          color: t.text,
                          marginBottom: 2,
                        }}
                      >
                        {cat.label}
                      </Text>
                      <Text
                        style={{
                          fontFamily: fonts.regular,
                          fontSize: 12,
                          color: t.textSecondary,
                        }}
                      >
                        Community
                      </Text>
                    </View>

                    {/* Follow pill */}
                    <TouchableOpacity
                      onPress={() => toggleFollowCategory(cat.id)}
                      activeOpacity={0.75}
                      style={{
                        paddingHorizontal: 16,
                        height: 34,
                        borderRadius: 17,
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "row",
                        gap: 4,
                        backgroundColor: isFollowing ? (t.isDark ? t.surfaceElevated : "#F3F0EE") : "#A9334D",
                        marginRight: 10,
                      }}
                    >
                      {isFollowing && (
                        <Check size={12} color={t.text} strokeWidth={2.5} />
                      )}
                      <Text
                        style={{
                          fontFamily: fonts.bold,
                          fontSize: 13,
                          color: isFollowing ? t.text : "#F8E9E7",
                        }}
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </Text>
                    </TouchableOpacity>

                    {/* Block circle */}
                    <TouchableOpacity
                      onPress={() => toggleBlockCategory(cat.id)}
                      activeOpacity={0.75}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        backgroundColor: isBlocked ? "#FFEEF0" : (t.isDark ? t.surfaceElevated : "#F3F0EE"),
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ban
                        size={16}
                        color={isBlocked ? "#DC2626" : t.textSecondary}
                        strokeWidth={1.8}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
