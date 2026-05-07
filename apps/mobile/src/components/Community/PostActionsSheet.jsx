import { useCallback, useRef, useEffect, useState } from "react";
import { usePostHog } from "posthog-react-native";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import BottomSheet, { BottomSheetView, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Flag, EyeOff, Trash2, ChevronRight, CheckCircle2, X } from "lucide-react-native";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { useAppStore } from "@/store/appStore";
import {
  useReportPostMutation,
  useDeletePostMutation,
} from "@/hooks/queries/useCommunityMutations";
import { fonts } from "@/utils/fonts";
import { useTheme } from "@/hooks/useTheme";

const REPORT_REASONS = [
  {
    id: "misinformation",
    label: "Dangerous medical misinformation",
    description: "False claims about treatments, dosages, or cures",
  },
  {
    id: "spam",
    label: "Spam or self-promotion",
    description: "Repetitive posts, advertising, or off-topic links",
  },
  {
    id: "harassment",
    label: "Harassment or bullying",
    description: "Targeting, personal attacks, or name-calling",
  },
  {
    id: "offensive",
    label: "Inappropriate or offensive content",
    description: "Hate speech or explicit material",
  },
  {
    id: "private_info",
    label: "Sharing private information",
    description: "Someone else's personal or medical data",
  },
  {
    id: "other",
    label: "Something else",
    description: null,
  },
];

// step: "actions" → "report" → "done"
export function PostActionsSheet({ isVisible, onClose, postId, isOwnPost }) {
  const posthog = usePostHog();
  const t = useTheme();
  const bottomSheetRef = useRef(null);
  const [step, setStep] = useState("actions");
  const [selectedReason, setSelectedReason] = useState(null);
  const [extraNote, setExtraNote] = useState("");

  const hidePost = useAppStore((s) => s.hidePost);
  const { mutate: reportPost } = useReportPostMutation();
  const { mutate: deletePost } = useDeletePostMutation();

  const snapPoints =
    step === "actions" ? ["35%"] : step === "report" ? ["70%"] : ["45%"];

  useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isVisible]);

  useEffect(() => {
    if (isVisible) {
      setStep("actions");
      setSelectedReason(null);
      setExtraNote("");
    }
  }, [isVisible]);

  const handleClose = useCallback(() => {
    bottomSheetRef.current?.close();
    onClose();
  }, [onClose]);

  const handleHide = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    hidePost(postId);
    handleClose();
  }, [postId, hidePost, handleClose]);

  const handleDelete = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    deletePost(postId);
    handleClose();
  }, [postId, deletePost, handleClose]);

  const handleSubmitReport = useCallback(() => {
    if (!selectedReason) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const reasonLabel = REPORT_REASONS.find((r) => r.id === selectedReason)?.label ?? selectedReason;
    posthog?.capture('post_reported', { reason: reasonLabel });
    reportPost({ postId, reason: reasonLabel, description: extraNote || undefined });
    setStep("done");
  }, [postId, selectedReason, extraNote, reportPost, posthog]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      animateOnMount
      backgroundStyle={{ backgroundColor: t.surface, borderRadius: 20 }}
      handleIndicatorStyle={{ backgroundColor: t.border, width: 36 }}
    >
      {step === "actions" && (
        <BottomSheetView style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28 }}>
          {!isOwnPost ? (
            <>
              <ActionRow
                icon={<Flag size={20} color="#A9334D" strokeWidth={2} />}
                label="Report post"
                onPress={() => setStep("report")}
                destructive
              />
              <ActionRow
                icon={<EyeOff size={20} color={t.textSecondary} strokeWidth={2} />}
                label="Hide post"
                sublabel="Remove from your feed"
                onPress={handleHide}
              />
            </>
          ) : (
            <ActionRow
              icon={<Trash2 size={20} color="#DC2626" strokeWidth={2} />}
              label="Delete post"
              onPress={handleDelete}
              destructive
            />
          )}

          <TouchableOpacity
            onPress={handleClose}
            style={{
              marginTop: 8,
              paddingVertical: 14,
              alignItems: "center",
              borderRadius: 12,
              backgroundColor: t.isDark ? t.surfaceElevated : "#F8F4F0",
            }}
          >
            <Text style={{ fontFamily: fonts.semibold, fontSize: 15, color: t.textSecondary }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </BottomSheetView>
      )}

      {step === "report" && (
        <BottomSheetScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 36 }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <TouchableOpacity
              onPress={() => setStep("actions")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ marginRight: 12 }}
            >
              <X size={20} color={t.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
            <Text style={{ fontFamily: fonts.bold, fontSize: 17, color: t.text }}>
              Report post
            </Text>
          </View>

          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 13,
              color: t.textSecondary,
              marginBottom: 16,
              lineHeight: 18,
            }}
          >
            Help us understand what's wrong. Your report is anonymous.
          </Text>

          {REPORT_REASONS.map((reason) => {
            const isSelected = selectedReason === reason.id;
            return (
              <TouchableOpacity
                key={reason.id}
                onPress={() => setSelectedReason(reason.id)}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 13,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  marginBottom: 8,
                  backgroundColor: isSelected ? (t.isDark ? t.surfaceElevated : "#FDF0F2") : (t.isDark ? t.surfaceElevated : "#F8F4F0"),
                  borderWidth: 1.5,
                  borderColor: isSelected ? "#A9334D" : "transparent",
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: isSelected ? "#A9334D" : t.border,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                    flexShrink: 0,
                  }}
                >
                  {isSelected && (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: "#A9334D",
                      }}
                    />
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: fonts.semibold,
                      fontSize: 14,
                      color: isSelected ? "#A9334D" : t.text,
                    }}
                  >
                    {reason.label}
                  </Text>
                  {reason.description && (
                    <Text
                      style={{
                        fontFamily: fonts.regular,
                        fontSize: 12,
                        color: t.textSecondary,
                        marginTop: 2,
                      }}
                    >
                      {reason.description}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}

          <TextInput
            value={extraNote}
            onChangeText={setExtraNote}
            placeholder="Anything else we should know? (optional)"
            placeholderTextColor={t.textTertiary}
            multiline
            maxLength={200}
            keyboardAppearance={t.isDark ? "dark" : "light"}
            style={{
              marginTop: 4,
              marginBottom: 20,
              backgroundColor: t.isDark ? t.surfaceElevated : "#F8F4F0",
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontFamily: fonts.regular,
              fontSize: 14,
              color: t.text,
              minHeight: 72,
              textAlignVertical: "top",
            }}
          />

          <TouchableOpacity
            onPress={handleSubmitReport}
            disabled={!selectedReason}
            activeOpacity={0.85}
            style={{
              backgroundColor: selectedReason ? "#A9334D" : (t.isDark ? t.surfaceElevated : "#D1C9C7"),
              borderRadius: 14,
              paddingVertical: 15,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 15,
                color: selectedReason ? "#F8E9E7" : t.textSecondary,
              }}
            >
              Submit report
            </Text>
          </TouchableOpacity>
        </BottomSheetScrollView>
      )}

      {step === "done" && (
        <BottomSheetView
          style={{
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: 36,
            alignItems: "center",
          }}
        >
          <MotiView
            from={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 14, stiffness: 160 }}
            style={{ marginBottom: 16, marginTop: 8 }}
          >
            <CheckCircle2 size={52} color={t.text} strokeWidth={1.5} />
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 120 }}
          >
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 18,
                color: t.text,
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              Thanks for letting us know
            </Text>
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 14,
                color: t.textSecondary,
                textAlign: "center",
                lineHeight: 20,
                marginBottom: 28,
              }}
            >
              We've hidden this post from your feed and will review it. The Hemo
              community is safer because of you.
            </Text>
          </MotiView>

          <TouchableOpacity
            onPress={handleClose}
            activeOpacity={0.85}
            style={{
              backgroundColor: t.isDark ? t.surfaceElevated : "#1A1A1A",
              borderRadius: 14,
              paddingVertical: 14,
              paddingHorizontal: 40,
            }}
          >
            <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: "#F8E9E7" }}>
              Done
            </Text>
          </TouchableOpacity>
        </BottomSheetView>
      )}
    </BottomSheet>
  );
}

function ActionRow({ icon, label, sublabel, onPress, destructive = false }) {
  const t = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: t.border,
      }}
    >
      <View style={{ marginRight: 14 }}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: fonts.semibold,
            fontSize: 15,
            color: destructive ? "#A9334D" : t.text,
          }}
        >
          {label}
        </Text>
        {sublabel && (
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 12,
              color: t.textSecondary,
              marginTop: 1,
            }}
          >
            {sublabel}
          </Text>
        )}
      </View>
      <ChevronRight size={16} color={t.border} strokeWidth={2} />
    </TouchableOpacity>
  );
}
