import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  X,
  ChevronLeft,
  Camera,
  ImageIcon,
  X as RemoveIcon,
  Lock,
  UserCircle,
  Plus,
  BarChart2,
} from "lucide-react-native";
import { useAppStore } from "@/store/appStore";
import { COMMUNITY_CATEGORIES_DATA } from "@/data/communityCategories";
import { fonts } from "@/utils/fonts";

const MAX_CHARS = 500;

const AVATAR_COLORS = ["#A9334D", "#09332C", "#781D11", "#5C2E00"];
function avatarColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + hash * 31;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const FLAIR_OPTIONS = [
  { id: "advice", label: "Asking for advice", color: "#3B82F6" },
  { id: "story", label: "Sharing my story", color: "#7C3AED" },
  { id: "vent", label: "Vent", color: "#F59E0B" },
  { id: "win", label: "Win 🏆", color: "#10B981" },
  { id: "info", label: "Research/Info", color: "#0D9488" },
];

export default function CreatePostScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const onboardingData = useAppStore((s) => s.onboardingData);
  const addCommunityPost = useAppStore((s) => s.addCommunityPost);

  const nickname = onboardingData.nickname ?? "You";
  const scdType = onboardingData.scdType ?? null;
  const initials = nickname
    .split(" ")
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);

  const [step, setStep] = useState(1);
  const [content, setContent] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const [category, setCategory] = useState(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [flair, setFlair] = useState(null);
  const [pollEnabled, setPollEnabled] = useState(false);
  const [pollOptions, setPollOptions] = useState(["", ""]);

  const charsLeft = MAX_CHARS - content.length;
  const canAdvance = content.trim().length > 0;
  const pollValid =
    !pollEnabled || pollOptions.filter((o) => o.trim().length > 0).length >= 2;
  const canPost = canAdvance && category !== null && pollValid;

  async function pickFromLibrary() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Allow access to your photo library to add images.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow camera access to take photos.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  }

  function addPollOption() {
    if (pollOptions.length < 4) setPollOptions([...pollOptions, ""]);
  }

  function removePollOption(index) {
    if (pollOptions.length <= 2) return;
    setPollOptions(pollOptions.filter((_, i) => i !== index));
  }

  function updatePollOption(index, text) {
    const updated = [...pollOptions];
    updated[index] = text;
    setPollOptions(updated);
  }

  function handlePost() {
    if (!canPost) return;
    const newPost = {
      id: `cp_${Date.now()}`,
      author: {
        id: "me",
        name: nickname,
        avatarInitials: initials,
        scdType: scdType ?? undefined,
        isCurrentUser: true,
      },
      content: content.trim(),
      category,
      flair: flair ?? undefined,
      isAnonymous: isAnonymous || undefined,
      likes: 0,
      timestamp: new Date().toISOString(),
      comments: [],
      imageUrl: imageUri ?? undefined,
      poll: pollEnabled
        ? {
            options: pollOptions
              .filter((o) => o.trim().length > 0)
              .map((o, i) => ({
                id: String.fromCharCode(97 + i),
                text: o.trim(),
                votes: 0,
              })),
          }
        : undefined,
    };
    addCommunityPost(newPost);
    router.back();
  }

  // ── Step 1: Content + Photo ────────────────────────────────────────────────
  if (step === 1) {
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

          <Text
            style={{ fontFamily: fonts.bold, fontSize: 16, color: "#09332C" }}
          >
            New Post
          </Text>

          <TouchableOpacity
            onPress={() => setStep(2)}
            disabled={!canAdvance}
            style={{
              backgroundColor: canAdvance ? "#A9334D" : "#E2D9D6",
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
                color: canAdvance ? "#F8E9E7" : "#B0A0A0",
              }}
            >
              Next
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
              paddingBottom: 8,
            }}
          >
            {isAnonymous ? (
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  backgroundColor: "#E5E0DD",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <UserCircle size={26} color="#9C8D8A" strokeWidth={1.5} />
              </View>
            ) : (
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
                <Text
                  style={{
                    fontFamily: fonts.bold,
                    fontSize: 16,
                    color: "#F8E9E7",
                  }}
                >
                  {initials}
                </Text>
              </View>
            )}
            <View style={{ gap: 2 }}>
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 15,
                  color: "#09332C",
                }}
              >
                {isAnonymous ? "Anonymous" : nickname}
              </Text>
              {!isAnonymous && scdType && (
                <Text
                  style={{
                    fontFamily: fonts.regular,
                    fontSize: 12,
                    color: "#9C8D8A",
                  }}
                >
                  {scdType}
                </Text>
              )}
            </View>
          </View>

          {/* Anonymous toggle */}
          <TouchableOpacity
            onPress={() => setIsAnonymous((v) => !v)}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 16,
              paddingBottom: 14,
            }}
          >
            <Lock
              size={13}
              color={isAnonymous ? "#A9334D" : "#9C8D8A"}
              strokeWidth={2}
            />
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: 13,
                color: isAnonymous ? "#A9334D" : "#9C8D8A",
              }}
            >
              {isAnonymous ? "Posting anonymously" : "Post anonymously"}
            </Text>
          </TouchableOpacity>

          {/* Text input */}
          <TextInput
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
              minHeight: 120,
              textAlignVertical: "top",
            }}
          />

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

          {/* Image preview */}
          {imageUri && (
            <View
              style={{
                marginHorizontal: 16,
                marginTop: 16,
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <Image
                source={{ uri: imageUri }}
                style={{ width: "100%", height: 200, borderRadius: 12 }}
                resizeMode="cover"
              />
              <TouchableOpacity
                onPress={() => setImageUri(null)}
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <RemoveIcon size={14} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          )}

          {/* Photo buttons */}
          {!imageUri && !pollEnabled && (
            <View
              style={{
                flexDirection: "row",
                gap: 10,
                marginHorizontal: 16,
                marginTop: 20,
              }}
            >
              <TouchableOpacity
                onPress={takePhoto}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: 14,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#E2D9D6",
                  backgroundColor: "#FAFAFA",
                }}
              >
                <Camera size={18} color="#09332C" strokeWidth={1.5} />
                <Text
                  style={{
                    fontFamily: fonts.medium,
                    fontSize: 14,
                    color: "#09332C",
                  }}
                >
                  Take photo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={pickFromLibrary}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: 14,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#E2D9D6",
                  backgroundColor: "#FAFAFA",
                }}
              >
                <ImageIcon size={18} color="#09332C" strokeWidth={1.5} />
                <Text
                  style={{
                    fontFamily: fonts.medium,
                    fontSize: 14,
                    color: "#09332C",
                  }}
                >
                  Upload photo
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {imageUri && (
            <TouchableOpacity
              onPress={pickFromLibrary}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginHorizontal: 16,
                marginTop: 10,
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#E2D9D6",
                backgroundColor: "#FAFAFA",
              }}
            >
              <ImageIcon size={16} color="#09332C" strokeWidth={1.5} />
              <Text
                style={{
                  fontFamily: fonts.medium,
                  fontSize: 14,
                  color: "#09332C",
                }}
              >
                Change photo
              </Text>
            </TouchableOpacity>
          )}

          {/* Poll toggle */}
          <TouchableOpacity
            onPress={() => {
              setPollEnabled((v) => !v);
              if (!pollEnabled) setImageUri(null);
            }}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginHorizontal: 16,
              marginTop: imageUri ? 10 : 12,
              padding: 14,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: pollEnabled ? "#A9334D" : "#E2D9D6",
              backgroundColor: pollEnabled ? "#FDF0F2" : "#FAFAFA",
            }}
          >
            <BarChart2
              size={18}
              color={pollEnabled ? "#A9334D" : "#09332C"}
              strokeWidth={1.5}
            />
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: 14,
                color: pollEnabled ? "#A9334D" : "#09332C",
                flex: 1,
              }}
            >
              {pollEnabled ? "Remove poll" : "Add a poll"}
            </Text>
          </TouchableOpacity>

          {/* Poll options */}
          {pollEnabled && (
            <View style={{ marginHorizontal: 16, marginTop: 12, gap: 8 }}>
              {pollOptions.map((opt, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <TextInput
                    value={opt}
                    onChangeText={(t) => updatePollOption(index, t)}
                    placeholder={`Option ${index + 1}`}
                    placeholderTextColor="#C4B5B2"
                    maxLength={80}
                    style={{
                      flex: 1,
                      fontFamily: fonts.regular,
                      fontSize: 14,
                      color: "#09332C",
                      backgroundColor: "#F8F4F0",
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      borderWidth: 1,
                      borderColor: opt.trim() ? "#A9334D" : "#E2D9D6",
                    }}
                  />
                  {pollOptions.length > 2 && (
                    <TouchableOpacity
                      onPress={() => removePollOption(index)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X size={16} color="#9C8D8A" strokeWidth={2} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {pollOptions.length < 4 && (
                <TouchableOpacity
                  onPress={addPollOption}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingVertical: 8,
                  }}
                >
                  <Plus size={14} color="#A9334D" strokeWidth={2} />
                  <Text
                    style={{
                      fontFamily: fonts.medium,
                      fontSize: 13,
                      color: "#A9334D",
                    }}
                  >
                    Add option
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Flair picker */}
          <View style={{ marginTop: 20, paddingHorizontal: 16 }}>
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: 12,
                color: "#9C8D8A",
                marginBottom: 8,
              }}
            >
              Flair (optional)
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {FLAIR_OPTIONS.map((f) => {
                const isActive = flair === f.id;
                return (
                  <TouchableOpacity
                    key={f.id}
                    onPress={() => setFlair(isActive ? null : f.id)}
                    activeOpacity={0.75}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      borderRadius: 20,
                      backgroundColor: isActive ? f.color : "#F8F4F0",
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: fonts.medium,
                        fontSize: 13,
                        color: isActive ? "#FFFFFF" : "#09332C",
                      }}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Step 2: Category picker ────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 14,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          borderBottomWidth: 1,
          borderBottomColor: "#F0EAE8",
          backgroundColor: "#FFFFFF",
        }}
      >
        <TouchableOpacity
          onPress={() => setStep(1)}
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
            fontSize: 16,
            color: "#09332C",
          }}
        >
          Choose category
        </Text>

        <View style={{ width: 36 }} />
      </View>

      {/* Category list */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {COMMUNITY_CATEGORIES_DATA.map((group, gi) => (
          <View key={group.group}>
            <Text
              style={{
                fontFamily: fonts.semibold,
                fontSize: 11,
                color: "#9C8D8A",
                letterSpacing: 0.8,
                textTransform: "uppercase",
                paddingHorizontal: 20,
                paddingTop: gi === 0 ? 20 : 24,
                paddingBottom: 8,
              }}
            >
              {group.group}
            </Text>

            {group.categories.map((cat) => {
              const isSelected = category === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setCategory(cat.id)}
                  activeOpacity={0.7}
                  style={{
                    marginHorizontal: 16,
                    marginBottom: 8,
                    paddingHorizontal: 18,
                    paddingVertical: 16,
                    borderRadius: 14,
                    backgroundColor: isSelected ? "#A9334D" : "#F8F4F0",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: fonts.medium,
                      fontSize: 15,
                      color: isSelected ? "#F8E9E7" : "#09332C",
                    }}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* Post button */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom,
          paddingTop: 16,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#F0EAE8",
        }}
      >
        <TouchableOpacity
          onPress={handlePost}
          disabled={!canPost}
          activeOpacity={0.85}
          style={{
            backgroundColor: canPost ? "#A9334D" : "#E2D9D6",
            borderRadius: 14,
            height: 52,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontFamily: fonts.bold,
              fontSize: 16,
              color: canPost ? "#F8E9E7" : "#B0A0A0",
            }}
          >
            Post
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
