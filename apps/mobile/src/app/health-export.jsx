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
} from "lucide-react-native";
import { fonts } from "@/utils/fonts";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/utils/auth/supabase";
import { buildPublicShareUrl } from "@/utils/publicShareLinks";
import { useAuthStore } from "@/utils/auth/store";
import { usePostHog } from "posthog-react-native";

const BURGUNDY = "#A9334D";
const BORDER = "#F0E4E1";
const BG = "#F8F4F0";
const DATE_PRESETS = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "3 months", days: 90 },
  { label: "6 months", days: 180 },
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

function StatusBadge({ export: exp }) {
  const t = useTheme();
  if (!exp.is_active) {
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
  if (isExpired(exp.expires_at)) {
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

export default function HealthExportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const sheetRef = useRef(null);
  const posthog = usePostHog();
  const { auth } = useAuthStore();
  const userId = auth?.user?.id;

  const [view, setView] = useState("list"); // "list" | "create"
  const [exports, setExports] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedExport, setSelectedExport] = useState(null);

  const [selectedDays, setSelectedDays] = useState(DATE_PRESETS[1]); // 30 days default
  const [selectedExpiry, setSelectedExpiry] = useState(EXPIRY_PRESETS[0]); // 7 days default
  const [labelInput, setLabelInput] = useState("");
  const [createdUrl, setCreatedUrl] = useState(null);

  const activeCount = exports.filter(
    (e) => e.is_active && !isExpired(e.expires_at),
  ).length;

  const loadExports = useCallback(async () => {
    setLoadingList(true);
    try {
      const { data, error } = await supabase
        .from("export_tokens")
        .select(
          "token, label, date_range_start, date_range_end, expires_at, is_active, first_viewed_at, created_at",
        )
        .eq("mode", "full_export")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("loadExports error:", error.message);
      } else {
        setExports(data ?? []);
      }
    } catch (err) {
      console.error("loadExports unexpected error:", err);
    } finally {
      setLoadingList(false);
    }
  }, [userId]);

  // Re-fetch every time we land on the list view
  useEffect(() => {
    if (view === "list") loadExports();
  }, [view, loadExports]);

  const handleCreate = async () => {
    if (activeCount >= 5) {
      Alert.alert(
        "Limit reached",
        "You have 5 active exports. Revoke one to create a new one.",
      );
      return;
    }
    setCreating(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - selectedDays.days);
      const startDate = d.toISOString().split("T")[0];

      const { data, error } = await supabase.functions.invoke(
        "create-export-token",
        {
          body: {
            mode: "full_export",
            date_range_start: startDate,
            date_range_end: today,
            expires_in_days: selectedExpiry.value,
            label: labelInput.trim() || null,
          },
        },
      );

      if (error || !data?.data?.url) {
        Alert.alert("Error", "Failed to create export link. Please try again.");
        return;
      }

      setLabelInput("");
      setCreatedUrl(buildPublicShareUrl("export", data.data.token));
      posthog?.capture("export_link_created", {
        date_range: selectedDays.label,
        expires_in_days: selectedExpiry.value,
        has_label: !!labelInput.trim(),
      });
    } catch (err) {
      console.error("handleCreate unexpected error:", err);
      Alert.alert("Error", "Failed to create export link. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleCardPress = (exp) => {
    setSelectedExport(exp);
    sheetRef.current?.expand();
  };

  const handleShare = async () => {
    sheetRef.current?.close();
    const url = buildPublicShareUrl("export", selectedExport.token);
    try {
      await Share.share({ message: url, title: "Hemo Health Export" });
      posthog?.capture("export_link_shared", { source: "bottom_sheet" });
    } catch {
      // dismissed
    }
  };

  const handleCopyLink = async () => {
    sheetRef.current?.close();
    const url = buildPublicShareUrl("export", selectedExport.token);
    await Clipboard.setStringAsync(url);
    posthog?.capture("export_link_copied", { source: "bottom_sheet" });
    Alert.alert("Copied", "Export link copied to clipboard.");
  };

  const handleRevoke = () => {
    sheetRef.current?.close();
    Alert.alert(
      "Revoke this link?",
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
              .eq("token", selectedExport.token)
              .eq("user_id", userId);
            if (!error) {
              setExports((prev) =>
                prev.map((e) =>
                  e.token === selectedExport.token ? { ...e, is_active: false } : e,
                ),
              );
              posthog?.capture("export_link_revoked");
              setSelectedExport(null);
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
            {view === "create" ? "New Export Link" : "Export Health Data"}
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
              ? "Choose a date range and link expiry"
              : `${activeCount} active export${activeCount !== 1 ? "s" : ""}`}
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
          {/* Date range */}
          <Text
            style={{
              fontFamily: fonts.semibold,
              fontSize: 13,
              color: t.textSecondary,
              marginBottom: 10,
              letterSpacing: 0.4,
            }}
          >
            DATE RANGE
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 24,
            }}
          >
            {DATE_PRESETS.map((preset) => {
              const active = selectedDays.label === preset.label;
              return (
                <TouchableOpacity
                  key={preset.label}
                  onPress={() => setSelectedDays(preset)}
                  activeOpacity={0.7}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 10,
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

          {/* Link expiry */}
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
              marginBottom: 32,
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

          {/* Optional label */}
          <Text
            style={{
              fontFamily: fonts.semibold,
              fontSize: 13,
              color: t.textSecondary,
              marginBottom: 10,
              letterSpacing: 0.4,
            }}
          >
            LABEL <Text style={{ fontFamily: fonts.regular, letterSpacing: 0 }}>(optional)</Text>
          </Text>
          <TextInput
            value={labelInput}
            onChangeText={setLabelInput}
            placeholder={`e.g. For Dr. ${"—"} May 2026`}
            placeholderTextColor={t.textSecondary}
            maxLength={60}
            style={{
              fontFamily: fonts.regular,
              fontSize: 14,
              color: t.text,
              backgroundColor: t.isDark ? `${t.text}08` : "#fff",
              borderWidth: 1,
              borderColor: t.isDark ? `${t.text}18` : BORDER,
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 12,
              marginBottom: 24,
            }}
          />

          {/* Info note */}
          <View
            style={{
              backgroundColor: t.isDark ? `${BURGUNDY}18` : "#FDF2F4",
              borderRadius: 10,
              padding: 14,
              marginBottom: 32,
              borderWidth: 1,
              borderColor: t.isDark ? `${BURGUNDY}30` : "#F5C2CC",
            }}
          >
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 13,
                color: t.text,
                lineHeight: 20,
              }}
            >
              Anyone with the link can view your health data for the selected
              period. You can revoke the link at any time from this screen.
            </Text>
          </View>

          {/* Create button */}
          <TouchableOpacity
            onPress={handleCreate}
            activeOpacity={0.8}
            disabled={creating}
            style={{
              backgroundColor: BURGUNDY,
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
              opacity: creating ? 0.7 : 1,
            }}
          >
            {creating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Link2 size={18} color="#fff" strokeWidth={2} />
            )}
            <Text
              style={{
                fontFamily: fonts.semibold,
                fontSize: 16,
                color: "#fff",
              }}
            >
              {creating ? "Creating link…" : "Create Export Link"}
            </Text>
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
                You have 5 active exports. Revoke one to create a new one.
              </Text>
            </View>
          )}

          {loadingList ? (
            <View style={{ paddingTop: 60, alignItems: "center" }}>
              <ActivityIndicator size="large" color={BURGUNDY} />
            </View>
          ) : exports.length === 0 ? (
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
                <Link2 size={24} color={t.textSecondary} strokeWidth={1.5} />
              </View>
              <Text
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: 16,
                  color: t.text,
                  textAlign: "center",
                }}
              >
                No export links yet
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
                Create a link to share your health data with your doctor or care
                team.
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
                  Create your first link
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {exports.map((exp) => {
                const active = exp.is_active && !isExpired(exp.expires_at);
                return (
                  <TouchableOpacity
                    key={exp.token}
                    onPress={() => active && handleCardPress(exp)}
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
                      <View style={{ flex: 1, marginRight: 8 }}>
                        {exp.label ? (
                          <>
                            <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: t.text }}>
                              {exp.label}
                            </Text>
                            <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: t.textSecondary, marginTop: 1 }}>
                              {fmt(exp.date_range_start)} – {fmt(exp.date_range_end)}
                            </Text>
                          </>
                        ) : (
                          <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: t.text }}>
                            {fmt(exp.date_range_start)} – {fmt(exp.date_range_end)}
                          </Text>
                        )}
                      </View>
                      <StatusBadge export={exp} />
                    </View>

                    <View style={{ flexDirection: "row", gap: 16 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                        <Clock size={13} color={t.textSecondary} strokeWidth={1.5} />
                        <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: t.textSecondary }}>
                          Expires {fmt(exp.expires_at)}
                        </Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                        <Eye size={13} color={exp.first_viewed_at ? "#10B981" : t.textSecondary} strokeWidth={1.5} />
                        <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: exp.first_viewed_at ? "#10B981" : t.textSecondary }}>
                          {exp.first_viewed_at ? `Seen ${fmt(exp.first_viewed_at)}` : "Not yet viewed"}
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

      {/* Link created modal */}
      <Modal
        visible={!!createdUrl}
        transparent
        animationType="fade"
        onRequestClose={() => { setCreatedUrl(null); setView("list"); }}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          <View style={{ backgroundColor: t.surface, borderRadius: 20, padding: 24, width: "100%" }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 17, color: t.text, marginBottom: 6 }}>
              Export link created
            </Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.textSecondary, marginBottom: 16 }}>
              Share this link with your doctor or care team.
            </Text>

            {/* Link preview */}
            <View style={{ backgroundColor: t.isDark ? `${t.text}0A` : BG, borderRadius: 10, borderWidth: 1, borderColor: t.isDark ? `${t.text}18` : BORDER, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 20 }}>
              <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.text }} numberOfLines={1} ellipsizeMode="tail">
                {createdUrl}
              </Text>
            </View>

            {/* CTAs */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={async () => {
                  await Clipboard.setStringAsync(createdUrl);
                  posthog?.capture("export_link_copied", { source: "creation_modal" });
                  setCreatedUrl(null);
                  setView("list");
                }}
                activeOpacity={0.8}
                style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: t.isDark ? `${t.text}10` : "#fff", borderRadius: 12, paddingVertical: 13, borderWidth: 1, borderColor: t.isDark ? `${t.text}18` : BORDER }}
              >
                <Copy size={16} color={BURGUNDY} strokeWidth={2} />
                <Text style={{ fontFamily: fonts.semibold, fontSize: 15, color: t.text }}>Copy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  try {
                    await Share.share({ message: createdUrl, title: "Hemo Health Export" });
                    posthog?.capture("export_link_shared", { source: "creation_modal" });
                  } catch {}
                  setCreatedUrl(null);
                  setView("list");
                }}
                activeOpacity={0.8}
                style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: BURGUNDY, borderRadius: 12, paddingVertical: 13 }}
              >
                <Share2 size={16} color="#fff" strokeWidth={2} />
                <Text style={{ fontFamily: fonts.semibold, fontSize: 15, color: "#fff" }}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Actions bottom sheet */}
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={["30%"]}
        enablePanDownToClose
        onClose={() => setSelectedExport(null)}
        backgroundStyle={{ backgroundColor: t.surface, borderRadius: 24 }}
        handleIndicatorStyle={{ backgroundColor: t.border, width: 36 }}
      >
        <BottomSheetView style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: insets.bottom + 16 }}>
          {selectedExport && (
            <>
              <Text style={{ fontFamily: fonts.bold, fontSize: 17, color: t.text, marginBottom: 2 }}>
                {selectedExport.label || `${fmt(selectedExport.date_range_start)} – ${fmt(selectedExport.date_range_end)}`}
              </Text>
              <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.textSecondary, marginBottom: 20 }}>
                {selectedExport.label ? `${fmt(selectedExport.date_range_start)} – ${fmt(selectedExport.date_range_end)} · ` : ""}
                Expires {fmt(selectedExport.expires_at)} · {selectedExport.first_viewed_at ? `Seen ${fmt(selectedExport.first_viewed_at)}` : "Not yet viewed"}
              </Text>

              <TouchableOpacity
                onPress={handleShare}
                style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, borderTopWidth: 1, borderTopColor: t.border }}
              >
                <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.background, alignItems: "center", justifyContent: "center" }}>
                  <Share2 size={18} color={BURGUNDY} />
                </View>
                <Text style={{ fontFamily: fonts.semibold, fontSize: 16, color: t.text }}>Share Link</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCopyLink}
                style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, borderTopWidth: 1, borderTopColor: t.border }}
              >
                <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.background, alignItems: "center", justifyContent: "center" }}>
                  <Copy size={18} color={BURGUNDY} />
                </View>
                <Text style={{ fontFamily: fonts.semibold, fontSize: 16, color: t.text }}>Copy to Clipboard</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleRevoke}
                style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, borderTopWidth: 1, borderTopColor: t.border }}
              >
                <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: "#FEF2F2", alignItems: "center", justifyContent: "center" }}>
                  <Trash2 size={18} color="#DC2626" />
                </View>
                <Text style={{ fontFamily: fonts.semibold, fontSize: 16, color: "#DC2626" }}>Revoke Link</Text>
              </TouchableOpacity>
            </>
          )}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}
