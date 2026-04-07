import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { X, Image as ImageIcon } from "lucide-react-native";
import { useAppStore } from "@/store/appStore";
import { COMMUNITY_CATEGORIES } from "@/components/Community/CategoryFilter";
import { fonts } from "@/utils/fonts";

const MAX_CHARS = 500;

const AVATAR_COLORS = ["#A9334D", "#09332C", "#781D11", "#5C2E00"];
function avatarColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + hash * 31;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function CreatePostScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const inputRef = useRef(null);

  const onboardingData = useAppStore((s) => s.onboardingData);
  const addCommunityPost = useAppStore((s) => s.addCommunityPost);

  const nickname = onboardingData.nickname ?? "You";
  const scdType = onboardingData.scdType ?? null;
  const initials = nickname
    .split(" ")
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);

  const [content, setContent] = useState("");
  const [category, setCategory] = useState("wins");

  const canPost = content.trim().length > 0;
  const charsLeft = MAX_CHARS - content.length;

  function handlePost() {
    if (!canPost) return;
    const newPost = {
      id: `cp_${Date.now()}`,
      author: {
        id: "me",
        name: nickname,
        avatarInitials: initials,
        scdType: scdType ?? undefined,
      },
      content: content.trim(),
      category,
      likes: 0,
      timestamp: new Date().toISOString(),
      comments: [],
    };
    addCommunityPost(newPost);
    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 12,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottomWidth: 1,
          borderBottomColor: "#F0EAE8",
          backgroundColor: "#FFFFFF",
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
          <X size={18} color="#09332C" strokeWidth={2} />
        </TouchableOpacity>

        <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: "#09332C" }}>
          New Post
        </Text>

        <TouchableOpacity
          onPress={handlePost}
          disabled={!canPost}
          style={{
            backgroundColor: canPost ? "#A9334D" : "#E2D9D6",
            borderRadius: 20,
            paddingHorizontal: 20,
            height: 36,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontFamily: fonts.bold,
              fontSize: 14,
              color: canPost ? "#F8E9E7" : "#B0A0A0",
            }}
          >
            Post
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Author row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingHorizontal: 16,
            paddingTop: 20,
            paddingBottom: 16,
          }}
        >
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              backgroundColor: avatarColor(nickname),
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: "#F8E9E7" }}>
              {initials}
            </Text>
          </View>
          <View style={{ gap: 2 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: "#09332C" }}>
              {nickname}
            </Text>
            {scdType && (
              <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "#9C8D8A" }}>
                {scdType}
              </Text>
            )}
          </View>
        </View>

        {/* Text input */}
        <TextInput
          ref={inputRef}
          value={content}
          onChangeText={(t) => t.length <= MAX_CHARS && setContent(t)}
          placeholder="Share an experience, tip, question or win with the community…"
          placeholderTextColor="#C4B5B2"
          multiline
          autoFocus
          style={{
            fontFamily: fonts.regular,
            fontSize: 16,
            color: "#09332C",
            lineHeight: 24,
            paddingHorizontal: 16,
            minHeight: 140,
            textAlignVertical: "top",
          }}
        />

        {/* Char count */}
        {content.length > 0 && (
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 12,
              color: charsLeft < 50 ? "#DC2626" : "#9C8D8A",
              textAlign: "right",
              paddingHorizontal: 16,
              marginTop: 4,
            }}
          >
            {charsLeft}
          </Text>
        )}

        {/* Divider */}
        <View
          style={{
            height: 1,
            backgroundColor: "#F0EAE8",
            marginHorizontal: 16,
            marginVertical: 20,
          }}
        />

        {/* Category picker */}
        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: "#09332C" }}>
            Category
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {COMMUNITY_CATEGORIES.filter((c) => c.id !== "all").map((cat) => {
              const isSelected = category === cat.id;
              const { Icon } = cat;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setCategory(cat.id)}
                  activeOpacity={0.75}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    backgroundColor: isSelected ? "#A9334D" : "#FFFFFF",
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: isSelected ? "#A9334D" : "#E2D9D6",
                    paddingHorizontal: 13,
                    height: 34,
                    overflow: "hidden",
                  }}
                >
                  <Icon
                    size={13}
                    color={isSelected ? "#F8E9E7" : "#09332C"}
                    strokeWidth={2}
                  />
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: fonts.semibold,
                      fontSize: 13,
                      lineHeight: 17,
                      includeFontPadding: false,
                      color: isSelected ? "#F8E9E7" : "#09332C",
                    }}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Add image placeholder */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginHorizontal: 16,
            marginTop: 24,
            padding: 14,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#E2D9D6",
            borderStyle: "dashed",
          }}
        >
          <ImageIcon size={18} color="#9C8D8A" strokeWidth={1.5} />
          <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: "#9C8D8A" }}>
            Add a photo (coming soon)
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
