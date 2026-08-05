import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Share,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import BottomSheet, {
  BottomSheetView,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import {
  X,
  Link2,
  Copy,
  Share2,
  Sparkles,
  Clock,
  AlertTriangle,
} from "lucide-react-native";
import { fonts } from "@/utils/fonts";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/utils/auth/supabase";
import { useAuthStore } from "@/utils/auth/store";
import { usePostHog } from "posthog-react-native";

// Same trio used by share-summary.jsx and health-export.jsx — kept local
// rather than shared since those two screens already each define their own
// copy of WEB_BASE_URL; this follows the existing (non-DRY, deliberate)
// convention instead of introducing a new shared module for three constants.
const BURGUNDY = "#A9334D";
const BORDER = "#F0E4E1";
const BG = "#F8F4F0";
const WEB_BASE_URL = __DEV__ ? "http://localhost:5173" : "https://hemo-scd.com";

// Same presets as the Health Summary "New" flow — this sheet only omits the
// period picker, expiry stays a free choice.
const EXPIRY_PRESETS = [
  { label: "7 days", value: 7 },
  { label: "14 days", value: 14 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

function fmt(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function SheetHeader({ title, onClose }) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 18,
      }}
    >
      <Text style={{ fontFamily: fonts.bold, fontSize: 17, color: t.text }}>
        {title}
      </Text>
      <TouchableOpacity
        onPress={onClose}
        activeOpacity={0.7}
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: t.isDark ? t.surfaceElevated : "#EDE8E3",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <X size={15} color={t.textSecondary} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}

// Opens in place on the recap screen instead of sending the user to the
// Health Summary list. The period is always this recap's exact week/month —
// there is deliberately no period picker here.
//
// phase: "checking" (looking for a reusable link) | "existing" (found one,
// reuse-first UI) | "form" (fixed period + expiry + note + generate) |
// "limit" (5-active cap hit)
export default function ShareRecapSheet({
  isVisible,
  onClose,
  periodStart,
  periodEnd,
  label,
}) {
  const t = useTheme();
  const router = useRouter();
  const posthog = usePostHog();
  const bottomSheetRef = useRef(null);
  const { auth } = useAuthStore();
  const userId = auth?.user?.id;

  const [phase, setPhase] = useState("checking");
  const [existingToken, setExistingToken] = useState(null);
  const [activeCount, setActiveCount] = useState(0);
  const [selectedExpiry, setSelectedExpiry] = useState(EXPIRY_PRESETS[0]);
  const [noteInput, setNoteInput] = useState("");
  const [generatingPhase, setGeneratingPhase] = useState(null); // null | "creating" | "analysing"
  const [createdUrl, setCreatedUrl] = useState(null);

  useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isVisible]);

  // Reusable-link lookup — runs every time the sheet opens for this exact
  // period so a user can't burn through the 5-active cap by re-sharing the
  // same week/month over and over.
  useEffect(() => {
    if (!isVisible || !userId) return;
    let cancelled = false;
    setPhase("checking");
    setExistingToken(null);
    setSelectedExpiry(EXPIRY_PRESETS[0]);
    setNoteInput("");
    setCreatedUrl(null);
    setGeneratingPhase(null);

    (async () => {
      try {
        const { data, error } = await supabase
          .from("export_tokens")
          .select("token, date_range_start, date_range_end, expires_at")
          .eq("mode", "health_summary")
          .eq("user_id", userId)
          .eq("is_active", true)
          .gt("expires_at", new Date().toISOString());
        if (cancelled) return;
        if (error) {
          console.error("ShareRecapSheet lookup error:", error.message);
          setPhase("form");
          return;
        }
        const rows = data ?? [];
        setActiveCount(rows.length);
        const match = rows.find(
          (r) =>
            r.date_range_start === periodStart &&
            r.date_range_end === periodEnd,
        );
        if (match) {
          setExistingToken(match);
          setPhase("existing");
        } else if (rows.length >= 5) {
          setPhase("limit");
        } else {
          setPhase("form");
        }
      } catch (err) {
        if (cancelled) return;
        console.error("ShareRecapSheet lookup unexpected error:", err);
        setPhase("form");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isVisible, userId, periodStart, periodEnd]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleGenerate = async () => {
    if (activeCount >= 5) {
      setPhase("limit");
      return;
    }

    setGeneratingPhase("creating");
    let token = null;
    try {
      const { data, error } = await supabase.functions.invoke(
        "create-export-token",
        {
          body: {
            mode: "health_summary",
            date_range_start: periodStart,
            date_range_end: periodEnd,
            label,
            expires_in_days: selectedExpiry.value,
            patient_note: noteInput.trim() || null,
          },
        },
      );

      if (error || !data?.data?.token) {
        Alert.alert("Error", "Failed to create summary. Please try again.");
        return;
      }

      token = data.data.token;
      posthog?.capture("summary_token_created", {
        source: "recap_sheet",
        label,
        expires_in_days: selectedExpiry.value,
        has_note: !!noteInput.trim(),
      });
    } catch (err) {
      console.error("ShareRecapSheet handleGenerate create error:", err);
      Alert.alert("Error", "Failed to create summary. Please try again.");
      return;
    } finally {
      if (!token) setGeneratingPhase(null);
    }

    // Phase 2: run AI enrichment — non-fatal if it fails, the link still works.
    setGeneratingPhase("analysing");
    try {
      const { error: aiError } = await supabase.functions.invoke(
        "generate-health-summary",
        { body: { token } },
      );
      if (aiError) {
        console.warn(
          "ShareRecapSheet AI enrichment failed (non-fatal):",
          aiError.message,
        );
        posthog?.capture("summary_ai_failed", { source: "recap_sheet" });
      } else {
        posthog?.capture("summary_ai_generated", {
          source: "recap_sheet",
          label,
        });
      }
    } catch (err) {
      console.warn(
        "ShareRecapSheet AI enrichment unexpected error (non-fatal):",
        err,
      );
    }

    setNoteInput("");
    setCreatedUrl(`${WEB_BASE_URL}/summary/${token}`);
    setGeneratingPhase(null);
  };

  const handleShareExisting = async () => {
    const url = `${WEB_BASE_URL}/summary/${existingToken.token}`;
    try {
      await Share.share({ message: url, title: "Hemo Health Summary" });
      posthog?.capture("summary_link_shared", {
        source: "recap_sheet_existing",
      });
    } catch {
      // dismissed
    }
  };

  const handleCopyExisting = async () => {
    const url = `${WEB_BASE_URL}/summary/${existingToken.token}`;
    await Clipboard.setStringAsync(url);
    posthog?.capture("summary_link_copied", { source: "recap_sheet_existing" });
    Alert.alert("Copied", "Summary link copied to clipboard.");
  };

  const handleCreateFreshAnyway = () => {
    if (activeCount >= 5) {
      setPhase("limit");
      return;
    }
    setPhase("form");
  };

  const handleGoToManage = () => {
    handleClose();
    router.push("/share-summary");
  };

  const isGenerating = generatingPhase !== null;
  const dateRangeLine = `${fmt(periodStart)} – ${fmt(periodEnd)}`;

  // Memoized on phase alone — an inline array would be a new identity on every
  // render, which re-runs the sheet's snap-point animation on each keystroke in
  // the note field.
  const snapPoints = useMemo(() => {
    if (phase === "form") return ["80%"];
    if (phase === "existing") return ["46%"];
    if (phase === "limit") return ["40%"];
    return ["28%"];
  }, [phase]);

  return (
    <>
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={handleClose}
        backgroundStyle={{ backgroundColor: t.surface, borderRadius: 24 }}
        handleIndicatorStyle={{ backgroundColor: t.border, width: 36 }}
      >
        {phase === "checking" && (
          <BottomSheetView
            style={{ paddingVertical: 60, alignItems: "center" }}
          >
            <ActivityIndicator size="large" color={BURGUNDY} />
          </BottomSheetView>
        )}

        {phase === "existing" && existingToken && (
          <BottomSheetView
            style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 28 }}
          >
            <SheetHeader title="Already shared" onClose={handleClose} />

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                marginBottom: 20,
              }}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: t.isDark ? `${BURGUNDY}18` : "#FDF2F4",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Link2 size={18} color={BURGUNDY} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: fonts.semibold,
                    fontSize: 14,
                    color: t.text,
                  }}
                >
                  {label}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.regular,
                    fontSize: 12,
                    color: t.textSecondary,
                    marginTop: 2,
                  }}
                >
                  Expires {fmt(existingToken.expires_at)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleShareExisting}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                paddingVertical: 14,
                borderTopWidth: 1,
                borderTopColor: t.border,
              }}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: t.background,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Share2 size={18} color={BURGUNDY} />
              </View>
              <Text
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: 16,
                  color: t.text,
                }}
              >
                Share Link
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCopyExisting}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                paddingVertical: 14,
                borderTopWidth: 1,
                borderTopColor: t.border,
              }}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: t.background,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Copy size={18} color={BURGUNDY} />
              </View>
              <Text
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: 16,
                  color: t.text,
                }}
              >
                Copy to Clipboard
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCreateFreshAnyway}
              activeOpacity={0.7}
              style={{
                paddingVertical: 14,
                borderTopWidth: 1,
                borderTopColor: t.border,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: 14,
                  color: t.textSecondary,
                }}
              >
                Create a new link anyway
              </Text>
            </TouchableOpacity>
          </BottomSheetView>
        )}

        {phase === "limit" && (
          <BottomSheetView
            style={{
              paddingHorizontal: 24,
              paddingTop: 8,
              paddingBottom: 28,
              alignItems: "center",
            }}
          >
            <SheetHeader title="Limit reached" onClose={handleClose} />
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: t.isDark ? `${BURGUNDY}18` : "#FDF2F4",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              <AlertTriangle size={22} color={BURGUNDY} strokeWidth={2} />
            </View>
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 16,
                color: t.text,
                textAlign: "center",
                marginBottom: 6,
              }}
            >
              You have 5 active summaries
            </Text>
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 13,
                color: t.textSecondary,
                textAlign: "center",
                lineHeight: 19,
                marginBottom: 20,
              }}
            >
              Revoke one from Health Summary to free up a slot, then come back
              and share this {label ? "period" : "recap"} again.
            </Text>
            <TouchableOpacity
              onPress={handleGoToManage}
              activeOpacity={0.85}
              style={{
                backgroundColor: BURGUNDY,
                borderRadius: 14,
                paddingVertical: 14,
                paddingHorizontal: 28,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: 15,
                  color: "#fff",
                }}
              >
                Manage Summaries
              </Text>
            </TouchableOpacity>
          </BottomSheetView>
        )}

        {phase === "form" && (
          <BottomSheetScrollView
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingTop: 8,
              paddingBottom: 36,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <SheetHeader title="Share Health Summary" onClose={handleClose} />
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 13,
                color: t.textSecondary,
                marginBottom: 22,
              }}
            >
              AI-enriched snapshot for your care team
            </Text>

            {/* Period — read-only, fixed to this recap */}
            <Text
              style={{
                fontFamily: fonts.semibold,
                fontSize: 13,
                color: t.textSecondary,
                marginBottom: 10,
                letterSpacing: 0.4,
              }}
            >
              PERIOD
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                backgroundColor: t.isDark ? `${t.text}10` : BG,
                borderWidth: 1,
                borderColor: t.isDark ? `${t.text}18` : BORDER,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                marginBottom: 24,
              }}
            >
              <Clock size={15} color={t.textSecondary} strokeWidth={1.5} />
              <View>
                <Text
                  style={{
                    fontFamily: fonts.semibold,
                    fontSize: 14,
                    color: t.text,
                  }}
                >
                  {label}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.regular,
                    fontSize: 12,
                    color: t.textSecondary,
                    marginTop: 1,
                  }}
                >
                  {dateRangeLine}
                </Text>
              </View>
            </View>

            {/* Expiry */}
            <Text
              style={{
                fontFamily: fonts.semibold,
                fontSize: 13,
                color: t.textSecondary,
                marginBottom: 10,
                letterSpacing: 0.4,
              }}
            >
              LINK EXPIRES IN
            </Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 28,
              }}
            >
              {EXPIRY_PRESETS.map((preset) => {
                const active = selectedExpiry.value === preset.value;
                return (
                  <TouchableOpacity
                    key={preset.value}
                    onPress={() => setSelectedExpiry(preset)}
                    activeOpacity={0.7}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: active
                        ? BURGUNDY
                        : t.isDark
                          ? `${t.text}10`
                          : BG,
                      borderWidth: 1,
                      borderColor: active
                        ? BURGUNDY
                        : t.isDark
                          ? `${t.text}18`
                          : BORDER,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: active ? fonts.semibold : fonts.regular,
                        fontSize: 13,
                        color: active ? "#fff" : t.text,
                      }}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Note to doctor */}
            <Text
              style={{
                fontFamily: fonts.semibold,
                fontSize: 13,
                color: t.textSecondary,
                marginBottom: 6,
                letterSpacing: 0.4,
              }}
            >
              NOTE TO DOCTOR{" "}
              <Text style={{ fontFamily: fonts.regular, letterSpacing: 0 }}>
                (optional)
              </Text>
            </Text>
            <BottomSheetTextInput
              value={noteInput}
              onChangeText={(v) => setNoteInput(v.slice(0, 300))}
              placeholder="e.g. My pain has been worse in the mornings…"
              placeholderTextColor={t.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{
                fontFamily: fonts.regular,
                fontSize: 14,
                color: t.text,
                backgroundColor: t.isDark ? `${t.text}08` : "#fff",
                borderWidth: 1,
                borderColor: t.isDark ? `${t.text}18` : BORDER,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                marginBottom: 6,
                minHeight: 90,
              }}
            />
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 11,
                color: t.textSecondary,
                textAlign: "right",
                marginBottom: 28,
              }}
            >
              {noteInput.length}/300
            </Text>

            {/* Generate button */}
            <TouchableOpacity
              onPress={handleGenerate}
              activeOpacity={0.8}
              disabled={isGenerating}
              style={{
                backgroundColor: BURGUNDY,
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
                opacity: isGenerating ? 0.7 : 1,
              }}
            >
              {isGenerating ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text
                    style={{
                      fontFamily: fonts.semibold,
                      fontSize: 16,
                      color: "#fff",
                    }}
                  >
                    {generatingPhase === "creating"
                      ? "Creating summary…"
                      : "Analyzing…"}
                  </Text>
                </>
              ) : (
                <>
                  {/* <Sparkles size={18} color="#fff" strokeWidth={2} /> */}
                  <Text
                    style={{
                      fontFamily: fonts.semibold,
                      fontSize: 16,
                      color: "#fff",
                    }}
                  >
                    Generate Summary
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </BottomSheetScrollView>
        )}
      </BottomSheet>

      {/* Summary created modal — same one used at the end of the "New" flow
          on the Health Summary screen. The recap stays open behind it; both
          the modal and the sheet close together once the user acts. */}
      <Modal
        visible={!!createdUrl}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setCreatedUrl(null);
          handleClose();
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.45)",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          <View
            style={{
              backgroundColor: t.surface,
              borderRadius: 20,
              padding: 24,
              width: "100%",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
              }}
            >
              <Sparkles size={18} color={BURGUNDY} strokeWidth={2} />
              <Text
                style={{ fontFamily: fonts.bold, fontSize: 17, color: t.text }}
              >
                Summary ready
              </Text>
            </View>
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 13,
                color: t.textSecondary,
                marginBottom: 16,
              }}
            >
              Share this link with your doctor or care team. They'll see an
              AI-interpreted report of your health data.
            </Text>

            <View
              style={{
                backgroundColor: t.isDark ? `${t.text}0A` : BG,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: t.isDark ? `${t.text}18` : BORDER,
                paddingHorizontal: 14,
                paddingVertical: 12,
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 13,
                  color: t.text,
                }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {createdUrl}
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={async () => {
                  await Clipboard.setStringAsync(createdUrl);
                  posthog?.capture("summary_link_copied", {
                    source: "recap_sheet_creation_modal",
                  });
                  setCreatedUrl(null);
                  handleClose();
                }}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  backgroundColor: t.isDark ? `${t.text}10` : "#fff",
                  borderRadius: 12,
                  paddingVertical: 13,
                  borderWidth: 1,
                  borderColor: t.isDark ? `${t.text}18` : BORDER,
                }}
              >
                <Copy size={16} color={BURGUNDY} strokeWidth={2} />
                <Text
                  style={{
                    fontFamily: fonts.semibold,
                    fontSize: 15,
                    color: t.text,
                  }}
                >
                  Copy
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  try {
                    await Share.share({
                      message: createdUrl,
                      title: "Hemo Health Summary",
                    });
                    posthog?.capture("summary_link_shared", {
                      source: "recap_sheet_creation_modal",
                    });
                  } catch {
                    // dismissed
                  }
                  setCreatedUrl(null);
                  handleClose();
                }}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  backgroundColor: BURGUNDY,
                  borderRadius: 12,
                  paddingVertical: 13,
                }}
              >
                <Share2 size={16} color="#fff" strokeWidth={2} />
                <Text
                  style={{
                    fontFamily: fonts.semibold,
                    fontSize: 15,
                    color: "#fff",
                  }}
                >
                  Share
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
