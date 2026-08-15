import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
  ActivityIndicator,
  Modal,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import {
  ArrowLeft,
  Link2,
  Copy,
  Trash2,
  Plus,
  Clock,
  Eye,
  Share2,
  Sparkles,
} from "lucide-react-native";
import { fonts } from "@/utils/fonts";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/utils/auth/supabase";
import { useAuthStore } from "@/utils/auth/store";
import { usePostHog } from "posthog-react-native";

const BURGUNDY = "#A9334D";
const BORDER = "#F0E4E1";
const BG = "#F8F4F0";
const WEB_BASE_URL = __DEV__ ? "http://localhost:5173" : "https://hemo-scd.com";

const PERIOD_PRESETS = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "60 days", days: 60 },
];

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

function isExpired(expiresAt) {
  return new Date(expiresAt) < new Date();
}

// Recap shares carry a human label ("June 2026", "Week of 9 Jun 2026") set
// at creation time — falls back to the old "N-day summary" wording for
// summaries created from the trailing-window presets above, which have no
// label.
function summaryTitle(s) {
  return s.label || `${s.period_days}-day summary`;
}

function StatusBadge({ summary: s }) {
  const t = useTheme();
  if (!s.is_active) {
    return (
      <View
        style={{
          backgroundColor: `${t.textSecondary}18`,
          borderRadius: 6,
          paddingHorizontal: 8,
          paddingVertical: 3,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.semibold,
            fontSize: 11,
            color: t.textSecondary,
          }}
        >
          Revoked
        </Text>
      </View>
    );
  }
  if (isExpired(s.expires_at)) {
    return (
      <View
        style={{
          backgroundColor: "#FEF3C7",
          borderRadius: 6,
          paddingHorizontal: 8,
          paddingVertical: 3,
        }}
      >
        <Text
          style={{ fontFamily: fonts.semibold, fontSize: 11, color: "#92400E" }}
        >
          Expired
        </Text>
      </View>
    );
  }
  return (
    <View
      style={{
        backgroundColor: "#D1FAE5",
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
      }}
    >
      <Text
        style={{ fontFamily: fonts.semibold, fontSize: 11, color: "#065F46" }}
      >
        Active
      </Text>
    </View>
  );
}

export default function ShareSummaryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const sheetRef = useRef(null);
  const posthog = usePostHog();
  const { auth } = useAuthStore();
  const userId = auth?.user?.id;

  const [view, setView] = useState("list"); // "list" | "create"
  const [summaries, setSummaries] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [generatingPhase, setGeneratingPhase] = useState(null); // null | "creating" | "analysing"
  const [selectedSummary, setSelectedSummary] = useState(null);

  const [selectedPeriod, setSelectedPeriod] = useState(PERIOD_PRESETS[1]); // 30 days default
  const [selectedExpiry, setSelectedExpiry] = useState(EXPIRY_PRESETS[0]); // 7 days default
  const [noteInput, setNoteInput] = useState("");
  const [createdUrl, setCreatedUrl] = useState(null);

  const activeCount = summaries.filter(
    (s) => s.is_active && !isExpired(s.expires_at),
  ).length;

  const loadSummaries = useCallback(async () => {
    if (!userId) return;
    setLoadingList(true);
    try {
      const { data, error } = await supabase
        .from("export_tokens")
        .select(
          "token, period_days, label, expires_at, is_active, first_viewed_at, created_at",
        )
        .eq("mode", "health_summary")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("loadSummaries error:", error.message);
      } else {
        setSummaries(data ?? []);
      }
    } catch (err) {
      console.error("loadSummaries unexpected error:", err);
    } finally {
      setLoadingList(false);
    }
  }, [userId]);

  useEffect(() => {
    if (view === "list") loadSummaries();
  }, [view, loadSummaries]);

  const handleGenerate = async () => {
    if (activeCount >= 5) {
      Alert.alert(
        "Limit reached",
        "You have 5 active summaries. Revoke one to create a new one.",
      );
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
            period_days: selectedPeriod.days,
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
        period_days: selectedPeriod.days,
        expires_in_days: selectedExpiry.value,
        has_note: !!noteInput.trim(),
      });
    } catch (err) {
      console.error("handleGenerate create error:", err);
      Alert.alert("Error", "Failed to create summary. Please try again.");
      return;
    } finally {
      if (!token) setGeneratingPhase(null);
    }

    // Phase 2: run AI enrichment
    setGeneratingPhase("analysing");
    try {
      const { data: aiData, error: aiError } = await supabase.functions.invoke(
        "generate-health-summary",
        {
          body: { token },
        },
      );
      if (aiError) {
        console.warn("AI enrichment failed (non-fatal):", aiError.message);
        posthog?.capture("summary_ai_failed");
      } else if (aiData?.data?.queued) {
        posthog?.capture("summary_ai_queued", {
          period_days: selectedPeriod.days,
        });
      } else {
        posthog?.capture("summary_ai_generated", {
          period_days: selectedPeriod.days,
        });
      }
    } catch (err) {
      console.warn("AI enrichment unexpected error (non-fatal):", err);
    }

    setNoteInput("");
    setCreatedUrl(`${WEB_BASE_URL}/summary/${token}`);
    setGeneratingPhase(null);
  };

  const handleCardPress = (s) => {
    setSelectedSummary(s);
    sheetRef.current?.expand();
  };

  const handleShare = async () => {
    sheetRef.current?.close();
    const url = `${WEB_BASE_URL}/summary/${selectedSummary.token}`;
    try {
      await Share.share({ message: url, title: "Hemo Health Summary" });
      posthog?.capture("summary_link_shared", { source: "bottom_sheet" });
    } catch {
      // dismissed
    }
  };

  const handleCopyLink = async () => {
    sheetRef.current?.close();
    const url = `${WEB_BASE_URL}/summary/${selectedSummary.token}`;
    await Clipboard.setStringAsync(url);
    posthog?.capture("summary_link_copied", { source: "bottom_sheet" });
    Alert.alert("Copied", "Summary link copied to clipboard.");
  };

  const handleRevoke = () => {
    sheetRef.current?.close();
    Alert.alert(
      "Revoke this summary?",
      "Anyone with the link will no longer be able to view it.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Revoke",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("export_tokens")
              .update({ is_active: false })
              .eq("token", selectedSummary.token)
              .eq("user_id", userId);
            if (!error) {
              setSummaries((prev) =>
                prev.map((s) =>
                  s.token === selectedSummary.token
                    ? { ...s, is_active: false }
                    : s,
                ),
              );
              posthog?.capture("summary_link_revoked");
              setSelectedSummary(null);
            } else {
              Alert.alert(
                "Couldn't revoke link",
                "Something went wrong. Please try again.",
                [{ text: "OK" }],
              );
            }
          },
        },
      ],
    );
  };

  const isGenerating = generatingPhase !== null;
  const canCreate = activeCount < 5;

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <StatusBar style={t.isDark ? "light" : "dark"} />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          borderBottomWidth: 1,
          borderBottomColor: t.isDark ? `${t.text}14` : BORDER,
          backgroundColor: t.background,
        }}
      >
        <TouchableOpacity
          onPress={() => (view === "create" ? setView("list") : router.back())}
          activeOpacity={0.7}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: `${t.text}10`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowLeft size={20} color={t.text} strokeWidth={2} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: t.text }}>
            {view === "create" ? "New Health Summary" : "Health Summary"}
          </Text>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 12,
              color: t.textSecondary,
              marginTop: 1,
            }}
          >
            {view === "create"
              ? "AI-enriched snapshot for your care team"
              : `${activeCount} active summar${activeCount !== 1 ? "ies" : "y"}`}
          </Text>
        </View>

        {view === "list" && canCreate && (
          <TouchableOpacity
            onPress={() => setView("create")}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: BURGUNDY,
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 8,
            }}
          >
            <Plus size={14} color="#fff" strokeWidth={2.5} />
            <Text
              style={{
                fontFamily: fonts.semibold,
                fontSize: 13,
                color: "#fff",
              }}
            >
              New
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {view === "create" ? (
        <ScrollView
          contentContainerStyle={{
            padding: 20,
            paddingBottom: insets.bottom + 32,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Period */}
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
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 24,
            }}
          >
            {PERIOD_PRESETS.map((preset) => {
              const active = selectedPeriod.days === preset.days;
              return (
                <TouchableOpacity
                  key={preset.days}
                  onPress={() => setSelectedPeriod(preset)}
                  activeOpacity={0.7}
                  style={{
                    paddingHorizontal: 20,
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
                      fontSize: 14,
                      color: active ? "#fff" : t.text,
                    }}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
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
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 12,
              color: t.textSecondary,
              marginBottom: 10,
            }}
          >
            This will appear prominently in the summary your doctor sees.
          </Text>
          <TextInput
            value={noteInput}
            onChangeText={(v) => setNoteInput(v.slice(0, 300))}
            placeholder="e.g. My pain has been worse in the mornings. I've also noticed…"
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
              minHeight: 100,
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

          {/* AI badge */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              backgroundColor: t.isDark ? `${BURGUNDY}18` : "#FDF2F4",
              borderRadius: 12,
              padding: 14,
              marginBottom: 32,
              borderWidth: 1,
              borderColor: t.isDark ? `${BURGUNDY}30` : "#F5C2CC",
            }}
          >
            <Sparkles size={16} color={BURGUNDY} strokeWidth={2} />
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 13,
                color: t.text,
                flex: 1,
                lineHeight: 20,
              }}
            >
              Hemo's AI will interpret your data into plain clinical language —
              so your doctor gets context, not just numbers.
            </Text>
          </View>

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
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: 20,
            paddingBottom: insets.bottom + 32,
          }}
        >
          {!canCreate && (
            <View
              style={{
                backgroundColor: t.isDark ? `${t.text}0A` : BG,
                borderRadius: 10,
                padding: 14,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: t.isDark ? `${t.text}14` : BORDER,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 13,
                  color: t.textSecondary,
                }}
              >
                You have 5 active summaries. Revoke one to create a new one.
              </Text>
            </View>
          )}

          {loadingList ? (
            <View style={{ paddingTop: 60, alignItems: "center" }}>
              <ActivityIndicator size="large" color={BURGUNDY} />
            </View>
          ) : summaries.length === 0 ? (
            <View style={{ paddingTop: 60, alignItems: "center", gap: 12 }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: t.isDark ? `${t.text}10` : BG,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sparkles size={24} color={t.textSecondary} strokeWidth={1.5} />
              </View>
              <Text
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: 16,
                  color: t.text,
                  textAlign: "center",
                }}
              >
                No summaries yet
              </Text>
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 13,
                  color: t.textSecondary,
                  textAlign: "center",
                  maxWidth: 260,
                }}
              >
                Generate an AI-enriched summary to share with your doctor or
                care team.
              </Text>
              <TouchableOpacity
                onPress={() => setView("create")}
                activeOpacity={0.8}
                style={{
                  marginTop: 8,
                  backgroundColor: BURGUNDY,
                  borderRadius: 10,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.semibold,
                    fontSize: 14,
                    color: "#fff",
                  }}
                >
                  Generate your first summary
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {summaries.map((s) => {
                const active = s.is_active && !isExpired(s.expires_at);
                return (
                  <TouchableOpacity
                    key={s.token}
                    onPress={() => active && handleCardPress(s)}
                    activeOpacity={active ? 0.7 : 1}
                    style={{
                      backgroundColor: t.isDark ? `${t.text}08` : "#fff",
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: t.isDark ? `${t.text}14` : BORDER,
                      padding: 16,
                      opacity: active ? 1 : 0.6,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: fonts.semibold,
                          fontSize: 14,
                          color: t.text,
                        }}
                      >
                        {summaryTitle(s)}
                      </Text>
                      <StatusBadge summary={s} />
                    </View>

                    <View style={{ flexDirection: "row", gap: 16 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <Clock
                          size={13}
                          color={t.textSecondary}
                          strokeWidth={1.5}
                        />
                        <Text
                          style={{
                            fontFamily: fonts.regular,
                            fontSize: 12,
                            color: t.textSecondary,
                          }}
                        >
                          Expires {fmt(s.expires_at)}
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <Eye
                          size={13}
                          color={
                            s.first_viewed_at ? "#10B981" : t.textSecondary
                          }
                          strokeWidth={1.5}
                        />
                        <Text
                          style={{
                            fontFamily: fonts.regular,
                            fontSize: 12,
                            color: s.first_viewed_at
                              ? "#10B981"
                              : t.textSecondary,
                          }}
                        >
                          {s.first_viewed_at
                            ? `Seen ${fmt(s.first_viewed_at)}`
                            : "Not yet viewed"}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* Summary created modal */}
      <Modal
        visible={!!createdUrl}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setCreatedUrl(null);
          setView("list");
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
                    source: "creation_modal",
                  });
                  setCreatedUrl(null);
                  setView("list");
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
                      source: "creation_modal",
                    });
                  } catch {}
                  setCreatedUrl(null);
                  setView("list");
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

      {/* Actions bottom sheet */}
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={["28%"]}
        enablePanDownToClose
        onClose={() => setSelectedSummary(null)}
        backgroundStyle={{ backgroundColor: t.surface, borderRadius: 24 }}
        handleIndicatorStyle={{ backgroundColor: t.border, width: 36 }}
      >
        <BottomSheetView
          style={{
            paddingHorizontal: 24,
            paddingTop: 8,
            paddingBottom: insets.bottom + 16,
          }}
        >
          {selectedSummary && (
            <>
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 17,
                  color: t.text,
                  marginBottom: 2,
                }}
              >
                {summaryTitle(selectedSummary)}
              </Text>
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 13,
                  color: t.textSecondary,
                  marginBottom: 20,
                }}
              >
                Expires {fmt(selectedSummary.expires_at)} ·{" "}
                {selectedSummary.first_viewed_at
                  ? `Seen ${fmt(selectedSummary.first_viewed_at)}`
                  : "Not yet viewed"}
              </Text>

              <TouchableOpacity
                onPress={handleShare}
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
                onPress={handleCopyLink}
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
                onPress={handleRevoke}
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
                    backgroundColor: "#FEF2F2",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Trash2 size={18} color="#DC2626" />
                </View>
                <Text
                  style={{
                    fontFamily: fonts.semibold,
                    fontSize: 16,
                    color: "#DC2626",
                  }}
                >
                  Revoke Link
                </Text>
              </TouchableOpacity>
            </>
          )}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}
