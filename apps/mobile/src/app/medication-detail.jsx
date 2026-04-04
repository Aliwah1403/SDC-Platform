import { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, Alert, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ChevronLeft,
  MoreHorizontal,
  Clock,
  Calendar,
  User,
  FileText,
  Check,
  Plus,
  Archive,
  Trash2,
  Bell,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useMedicationsQuery, useToggleMedicationTakenMutation, useDeleteMedicationMutation, useUpdateMedicationMutation, useDrugInfoQuery } from "@/hooks/queries/useMedicationsQuery";
import { fonts } from "@/utils/fonts";
import MedicationBottle from "@/components/MedicationBottle";

const C = {
  bg: "#F8F4F0",
  card: "#ffffff",
  border: "#F0E4E1",
  divider: "#F0E4E1",
  dark: "#09332C",
  muted: "rgba(9,51,44,0.45)",
  accent: "#A9334D",
  success: "#059669",
};

const CATEGORY_COLORS = {
  "Disease-modifying": "#A9334D",
  "Iron chelation": "#F0531C",
  Supportive: "#059669",
};

const SCREEN_WIDTH = Dimensions.get("window").width;

// ── helpers ────────────────────────────────────────────────────────────────

function parseTimes(timeStr) {
  if (!timeStr) return [];
  return timeStr
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function nextDoseLabel(med) {
  if (!med.taken && med.time)
    return `Today at ${parseTimes(med.time)[0] ?? med.time}`;
  if (med.time) return `Tomorrow at ${parseTimes(med.time)[0] ?? med.time}`;
  return null;
}

function formatLogTime(isoString) {
  return new Date(isoString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── adherence chart helpers ─────────────────────────────────────────────────

function fmtShort(d) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function hashInt(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++)
    h = (((h << 5) + h) ^ str.charCodeAt(i)) >>> 0;
  return h;
}

function deterministicTaken(medId, date, takenToday) {
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return !!takenToday;
  const seed = hashInt(
    `${medId}-${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
  );
  return seed % 100 < 82;
}

function getAdherenceChartData(period, med) {
  const now = new Date();
  const startDate = med.startDate ? new Date(med.startDate) : null;
  const isBefore = (d) => startDate && new Date(d) < startDate;
  const dayTaken = (d) =>
    !isBefore(d) && deterministicTaken(med.id ?? "med", d, med.taken);

  if (period === "D") {
    const times = parseTimes(med.time);
    const slots = times.length > 0 ? times : ["Today"];
    let takenCount = 0;
    const bars = slots.map((label, i) => {
      const taken = i === 0 && !!med.taken;
      if (taken) takenCount++;
      return { value: taken ? 1 : 0, label };
    });
    return {
      bars,
      takenCount,
      missedCount: slots.length - takenCount,
      pct: Math.round((takenCount / slots.length) * 100),
      dateRange: now.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
      missedLabel: "DOSES MISSED",
    };
  }

  if (period === "W") {
    let takenCount = 0;
    const bars = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const taken = dayTaken(d);
      if (taken) takenCount++;
      return {
        value: taken ? 1 : 0,
        label: d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 3),
      };
    });
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    return {
      bars,
      takenCount,
      missedCount: 7 - takenCount,
      pct: Math.round((takenCount / 7) * 100),
      dateRange: `${fmtShort(start)} – ${fmtShort(now)}`,
      missedLabel: "DAYS MISSED",
    };
  }

  if (period === "M") {
    let totalTaken = 0;
    const bars = Array.from({ length: 4 }, (_, wi) => {
      const wEnd = new Date(now);
      wEnd.setDate(wEnd.getDate() - (3 - wi) * 7);
      const wStart = new Date(wEnd);
      wStart.setDate(wStart.getDate() - 6);
      let taken = 0,
        total = 0;
      for (let d = new Date(wStart); d <= wEnd; d.setDate(d.getDate() + 1)) {
        if (!isBefore(d)) {
          total++;
          if (dayTaken(new Date(d))) {
            taken++;
            totalTaken++;
          }
        }
      }
      return { value: total > 0 ? taken / total : 0, label: fmtShort(wStart) };
    });
    const start = new Date(now);
    start.setDate(start.getDate() - 27);
    return {
      bars,
      takenCount: totalTaken,
      missedCount: 28 - totalTaken,
      pct: Math.round((totalTaken / 28) * 100),
      dateRange: `${fmtShort(start)} – ${fmtShort(now)}`,
      missedLabel: "DAYS MISSED",
    };
  }

  const months = period === "6M" ? 6 : 12;
  let totalTaken = 0,
    totalDays = 0;
  const bars = Array.from({ length: months }, (_, i) => {
    const mStart = new Date(
      now.getFullYear(),
      now.getMonth() - (months - 1 - i),
      1,
    );
    const mEnd = new Date(
      now.getFullYear(),
      now.getMonth() - (months - 1 - i) + 1,
      0,
    );
    let taken = 0,
      total = 0;
    for (
      let d = new Date(mStart);
      d <= mEnd && d <= now;
      d.setDate(d.getDate() + 1)
    ) {
      if (!isBefore(d)) {
        total++;
        if (dayTaken(new Date(d))) {
          taken++;
          totalTaken++;
        }
      }
    }
    totalDays += total;
    const showLabel = months === 6 || i % 2 === 0;
    return {
      value: total > 0 ? taken / total : 0,
      label: showLabel
        ? mStart.toLocaleDateString("en-US", { month: "short" })
        : "",
    };
  });
  const pStart = new Date(
    now.getFullYear(),
    now.getMonth() - (months - 1),
    1,
  );
  return {
    bars,
    takenCount: totalTaken,
    missedCount: totalDays - totalTaken,
    pct: totalDays > 0 ? Math.round((totalTaken / totalDays) * 100) : 0,
    dateRange: `${pStart.toLocaleDateString("en-US", { month: "short", year: "numeric" })} – ${now.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`,
    missedLabel: "DAYS MISSED",
  };
}

// ── AdherenceBarChart ───────────────────────────────────────────────────────

const CHART_H = 120;
const Y_W = 34;
const DASH = 3;
const GAP = 4;

function AdherenceBarChart({ bars, color, width }) {
  const barsW = width - Y_W;
  const count = bars.length;
  const slotW = barsW / count;
  const barFrac = count <= 3 ? 0.38 : count <= 7 ? 0.5 : 0.6;
  const barW = Math.max(4, slotW * barFrac);
  const barOff = (slotW - barW) / 2;
  const radius = Math.min(barW / 2, 7);
  const dashCount = Math.floor(CHART_H / (DASH + GAP));

  const showGridAt = (i) => i > 0;

  return (
    <View style={{ width }}>
      <View style={{ flexDirection: "row", height: CHART_H }}>
        {/* Chart body */}
        <View style={{ width: barsW, height: CHART_H, position: "relative" }}>
          {/* Horizontal ref lines */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 1,
              backgroundColor: C.border,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: CHART_H * 0.5,
              left: 0,
              right: 0,
              height: 1,
              backgroundColor: `${C.border}99`,
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 1,
              backgroundColor: C.border,
            }}
          />

          {/* Vertical dashed grid lines */}
          {bars.map((_, i) =>
            showGridAt(i) ? (
              <View
                key={`g${i}`}
                style={{
                  position: "absolute",
                  left: Math.round(i * slotW),
                  top: 0,
                  width: 1,
                  height: CHART_H,
                  overflow: "hidden",
                }}
              >
                {Array.from({ length: dashCount }, (__, j) => (
                  <View
                    key={j}
                    style={{
                      height: DASH,
                      width: 1,
                      backgroundColor: C.border,
                      marginBottom: GAP,
                    }}
                  />
                ))}
              </View>
            ) : null,
          )}

          {/* Bars — only render where value > 0 */}
          {bars.map((bar, i) => {
            if (bar.value <= 0) return null;
            const barH = Math.max(6, bar.value * (CHART_H - 1));
            return (
              <View
                key={`b${i}`}
                style={{
                  position: "absolute",
                  bottom: 1,
                  left: i * slotW + barOff,
                  width: barW,
                  height: barH,
                  backgroundColor: color,
                  borderRadius: radius,
                }}
              />
            );
          })}
        </View>

        {/* Y-axis labels on right */}
        <View
          style={{
            width: Y_W,
            height: CHART_H,
            justifyContent: "space-between",
            alignItems: "flex-end",
            paddingRight: 2,
          }}
        >
          <Text style={{ fontFamily: fonts.regular, fontSize: 10, color: C.muted }}>
            100%
          </Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 10, color: C.muted }}>
            50%
          </Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 10, color: C.muted }}>
            0%
          </Text>
        </View>
      </View>

      {/* X-axis labels */}
      <View
        style={{ width: barsW, height: 20, position: "relative", marginTop: 6 }}
      >
        {bars.map((bar, i) =>
          bar.label ? (
            <Text
              key={`l${i}`}
              style={{
                position: "absolute",
                left: i * slotW,
                width: slotW,
                fontFamily: fonts.regular,
                fontSize: count > 9 ? 9 : 10,
                color: C.muted,
                textAlign: "center",
              }}
            >
              {bar.label}
            </Text>
          ) : null,
        )}
      </View>
    </View>
  );
}

// ── sub-components ─────────────────────────────────────────────────────────

function SectionLabel({ title }) {
  return (
    <Text
      style={{
        fontFamily: fonts.semibold,
        fontSize: 11,
        color: C.muted,
        letterSpacing: 0.8,
        textTransform: "uppercase",
        marginBottom: 8,
        marginLeft: 2,
      }}
    >
      {title}
    </Text>
  );
}

function Card({ children }) {
  return (
    <View
      style={{
        backgroundColor: C.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: C.border,
        overflow: "hidden",
        marginBottom: 24,
      }}
    >
      {children}
    </View>
  );
}

function Divider() {
  return (
    <View style={{ height: 1, backgroundColor: C.divider, marginLeft: 62 }} />
  );
}

function InfoRow({ icon: Icon, iconColor, label, value, last }) {
  if (!value) return null;
  return (
    <>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 14,
          paddingHorizontal: 16,
        }}
      >
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            backgroundColor: "#F2EFEC",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Icon size={17} color={iconColor} />
        </View>
        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: 14,
            color: C.muted,
            flex: 1,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontFamily: fonts.medium,
            fontSize: 14,
            color: C.dark,
            maxWidth: "52%",
            textAlign: "right",
          }}
        >
          {value}
        </Text>
      </View>
      {!last && <Divider />}
    </>
  );
}

// ── dose row ───────────────────────────────────────────────────────────────

function DoseRow({
  color,
  timeLabel,
  isTaken,
  takenTime,
  onMark,
  isExtra,
  last,
}) {
  return (
    <>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 14,
          paddingHorizontal: 16,
        }}
      >
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            backgroundColor: `${color}14`,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Clock size={17} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{ fontFamily: fonts.semibold, fontSize: 15, color: C.dark }}
          >
            {timeLabel}
          </Text>
          {isTaken ? (
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 12,
                color: C.success,
                marginTop: 2,
              }}
            >
              {takenTime ? `Taken at ${takenTime}` : "Taken"}
            </Text>
          ) : (
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 12,
                color: C.muted,
                marginTop: 2,
              }}
            >
              Not yet
            </Text>
          )}
        </View>
        {isTaken ? (
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "#D1FAE5",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Check size={16} color={C.success} strokeWidth={2.5} />
          </View>
        ) : (
          !isExtra && (
            <TouchableOpacity
              onPress={onMark}
              activeOpacity={0.7}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: `${color}18`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Plus size={18} color={color} strokeWidth={2.5} />
            </TouchableOpacity>
          )
        )}
      </View>
      {!last && <Divider />}
    </>
  );
}

// ── main screen ────────────────────────────────────────────────────────────

export default function MedicationDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { medicationId } = useLocalSearchParams();
  const { data: medications = [] } = useMedicationsQuery();
  const toggleTaken = useToggleMedicationTakenMutation();
  const deleteMed = useDeleteMedicationMutation();
  const updateMed = useUpdateMedicationMutation();

  const [adherencePeriod, setAdherencePeriod] = useState("W");
  const [heroHeight, setHeroHeight] = useState(insets.top + 280);

  const scrollY = useSharedValue(0);
  const NAV_HEIGHT = insets.top + 56;

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const heroAnimStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, heroHeight - NAV_HEIGHT],
          [0, -(heroHeight - NAV_HEIGHT)],
          "clamp",
        ),
      },
    ],
  }));

  const compactNavStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [heroHeight * 0.45, heroHeight * 0.75],
      [0, 1],
      "clamp",
    ),
  }));

  const med = medications.find((m) => m.id === medicationId);
  const { data: drugInfo, isLoading: drugInfoLoading } = useDrugInfoQuery(med?.name);

  if (!med) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: C.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{ fontFamily: fonts.medium, fontSize: 16, color: C.muted }}
        >
          Medication not found
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 16 }}
        >
          <Text
            style={{ fontFamily: fonts.medium, fontSize: 15, color: C.accent }}
          >
            Go back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const color = CATEGORY_COLORS[med.category] ?? C.accent;
  const times = parseTimes(med.time);
  const extraLogs = med.logs ?? [];
  const adherenceResult = useMemo(
    () => getAdherenceChartData(adherencePeriod, med),
    [adherencePeriod, med.id, med.taken],
  );
  const CHART_WIDTH = SCREEN_WIDTH - 64;

  const handleMarkTaken = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleTaken.mutate(med.id);
  };

  const handleAddLog = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleTaken.mutate(med.id);
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Medication",
      `Remove ${med.name} from your medication list?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteMed.mutate(med.id);
            router.back();
          },
        },
      ],
    );
  };

  const handleArchive = () => {
    updateMed.mutate({ id: med.id, updates: { isActive: false } });
    router.back();
  };

  const handleMore = () => {
    Alert.alert(med.name, undefined, [
      {
        text: "Edit",
        onPress: () =>
          router.push({
            pathname: "/add-medication",
            params: { medicationId: med.id },
          }),
      },
      { text: "Archive", onPress: handleArchive },
      { text: "Delete", style: "destructive", onPress: handleDelete },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // Floating action button shared style
  const floatBtn = {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.88)",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* ── Hero (absolutely positioned, slides up on scroll) ── */}
      <Animated.View
        style={[
          { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 },
          heroAnimStyle,
        ]}
        onLayout={(e) => setHeroHeight(e.nativeEvent.layout.height)}
      >
        <View
          style={{
            backgroundColor: `${color}14`,
            paddingTop: insets.top + 20,
            paddingBottom: 32,
            paddingHorizontal: 16,
            alignItems: "center",
          }}
        >
          {/* Floating nav buttons inside hero */}
          <View
            style={{
              position: "absolute",
              top: insets.top + 12,
              left: 16,
              right: 16,
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              style={floatBtn}
            >
              <ChevronLeft size={20} color={C.dark} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleMore}
              activeOpacity={0.7}
              style={floatBtn}
            >
              <MoreHorizontal size={20} color={C.dark} />
            </TouchableOpacity>
          </View>

          {/* Bottle illustration */}
          <View style={{ alignItems: "center", marginBottom: 12 }}>
            <MedicationBottle
              type={med.type ?? "tablet"}
              color={color}
              drugName={med.name}
              size={180}
            />
          </View>

          {/* Name */}
          <Text
            numberOfLines={2}
            style={{
              fontFamily: fonts.bold,
              fontSize: 26,
              color: C.dark,
              textAlign: "center",
              marginBottom: 10,
            }}
          >
            {med.name}
          </Text>

          {/* Dosage + category */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {med.dosage ? (
              <View
                style={{
                  backgroundColor: `${color}20`,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                }}
              >
                <Text
                  style={{ fontFamily: fonts.semibold, fontSize: 13, color }}
                >
                  {med.dosage}
                </Text>
              </View>
            ) : null}
            {med.category ? (
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 13,
                  color: C.muted,
                }}
              >
                {med.category}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Gradient fade into page bg */}
        <LinearGradient colors={[`${color}08`, C.bg]} style={{ height: 28 }} />
      </Animated.View>

      {/* ── Compact sticky nav (fades in on scroll) ── */}
      <Animated.View
        pointerEvents="box-none"
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 20,
            height: NAV_HEIGHT,
            backgroundColor: "rgba(248,244,240,0.96)",
            borderBottomWidth: 1,
            borderBottomColor: C.border,
            flexDirection: "row",
            alignItems: "flex-end",
            paddingHorizontal: 12,
            paddingBottom: 10,
          },
          compactNavStyle,
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={floatBtn}
        >
          <ChevronLeft size={20} color={C.dark} />
        </TouchableOpacity>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: fonts.semibold,
            fontSize: 16,
            color: C.dark,
            flex: 1,
            textAlign: "center",
            marginHorizontal: 8,
          }}
        >
          {med.name}
        </Text>
        <TouchableOpacity
          onPress={handleMore}
          activeOpacity={0.7}
          style={floatBtn}
        >
          <MoreHorizontal size={20} color={C.dark} />
        </TouchableOpacity>
      </Animated.View>

      {/* ── Scrollable content ── */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: heroHeight,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ padding: 16, paddingTop: 24 }}>
          {/* Today's Log */}
          <SectionLabel title="Today's Log" />
          <Card>
            {times.length > 0 ? (
              times.map((t, idx) => {
                const takenTime =
                  med.taken && med.takenAt ? formatLogTime(med.takenAt) : null;
                const isLast =
                  idx === times.length - 1 && extraLogs.length === 0;
                return (
                  <DoseRow
                    key={t}
                    color={color}
                    timeLabel={t}
                    isTaken={med.taken}
                    takenTime={takenTime}
                    onMark={handleMarkTaken}
                    last={isLast}
                  />
                );
              })
            ) : (
              <DoseRow
                color={color}
                timeLabel={med.frequency ?? "As scheduled"}
                isTaken={med.taken}
                takenTime={
                  med.taken && med.takenAt ? formatLogTime(med.takenAt) : null
                }
                onMark={handleMarkTaken}
                last={extraLogs.length === 0}
              />
            )}

            {/* Extra ad-hoc logs */}
            {extraLogs.map((log, idx) => (
              <DoseRow
                key={log.time}
                color={color}
                timeLabel="Extra dose"
                isTaken
                takenTime={formatLogTime(log.time)}
                isExtra
                last={idx === extraLogs.length - 1}
              />
            ))}

            {/* Add another log row */}
            <Divider />
            <TouchableOpacity
              onPress={handleAddLog}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 14,
                paddingHorizontal: 16,
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  backgroundColor: `${color}14`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Plus size={17} color={color} />
              </View>
              <Text style={{ fontFamily: fonts.medium, fontSize: 14, color }}>
                Add another log
              </Text>
            </TouchableOpacity>
          </Card>

          {/* Adherence */}
          <SectionLabel title="Adherence" />
          <Card>
            {/* Period selector — full-width pill strip */}
            <View
              style={{
                flexDirection: "row",
                backgroundColor: `${color}0E`,
                margin: 12,
                marginBottom: 0,
                borderRadius: 22,
                padding: 3,
              }}
            >
              {["D", "W", "M", "6M", "Y"].map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setAdherencePeriod(p)}
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    paddingVertical: 7,
                    borderRadius: 18,
                    backgroundColor: adherencePeriod === p ? color : "transparent",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: fonts.semibold,
                      fontSize: 13,
                      color: adherencePeriod === p ? "#fff" : C.muted,
                    }}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ padding: 16 }}>
              {/* Stats */}
              <View style={{ flexDirection: "row", marginBottom: 4 }}>
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                      marginBottom: 2,
                    }}
                  >
                    <View
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 4,
                        backgroundColor: color,
                      }}
                    />
                    <Text
                      style={{
                        fontFamily: fonts.semibold,
                        fontSize: 10,
                        color: C.muted,
                        letterSpacing: 0.6,
                        textTransform: "uppercase",
                      }}
                    >
                      Adherence
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontFamily: fonts.bold,
                      fontSize: 30,
                      color: C.dark,
                      lineHeight: 34,
                    }}
                  >
                    {adherenceResult.pct}
                    <Text
                      style={{
                        fontFamily: fonts.regular,
                        fontSize: 14,
                        color: C.muted,
                      }}
                    >
                      %
                    </Text>
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                      marginBottom: 2,
                    }}
                  >
                    <View
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 4,
                        backgroundColor: "#C4B8B3",
                      }}
                    />
                    <Text
                      style={{
                        fontFamily: fonts.semibold,
                        fontSize: 10,
                        color: C.muted,
                        letterSpacing: 0.6,
                        textTransform: "uppercase",
                      }}
                    >
                      {adherenceResult.missedLabel}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontFamily: fonts.bold,
                      fontSize: 30,
                      color: C.dark,
                      lineHeight: 34,
                    }}
                  >
                    {adherenceResult.missedCount}
                  </Text>
                </View>
              </View>
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 12,
                  color: C.muted,
                  marginBottom: 20,
                }}
              >
                {adherenceResult.dateRange}
              </Text>

              {/* Custom chart */}
              <AdherenceBarChart
                bars={adherenceResult.bars}
                color={color}
                width={CHART_WIDTH}
              />
            </View>
          </Card>

          {/* Schedule */}
          <SectionLabel title="Schedule" />
          <Card>
            <InfoRow
              icon={Calendar}
              iconColor="#F0531C"
              label="Frequency"
              value={med.frequency}
            />
            <InfoRow
              icon={Clock}
              iconColor={color}
              label="Time"
              value={med.time}
            />
            <InfoRow
              icon={Bell}
              iconColor="#781D11"
              label="Next dose"
              value={nextDoseLabel(med)}
              last
            />
          </Card>

          {/* Details */}
          <SectionLabel title="Details" />
          <Card>
            <InfoRow
              icon={Calendar}
              iconColor="#781D11"
              label="Start date"
              value={
                med.startDate
                  ? new Date(med.startDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "Not set"
              }
            />
            <InfoRow
              icon={FileText}
              iconColor={C.muted}
              label="Notes"
              value={med.notes || undefined}
              last
            />
          </Card>

          {/* Quick Info Row */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
            {[
              { label: "Category", value: med.category },
              { label: "Form", value: med.type ? med.type.charAt(0).toUpperCase() + med.type.slice(1) : "Tablet" },
              { label: "Status", value: med.isActive === false ? "Archived" : "Active" },
            ].map(({ label, value }) => (
              <View
                key={label}
                style={{
                  flex: 1,
                  backgroundColor: C.card,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: C.border,
                  padding: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontFamily: fonts.semibold, fontSize: 16, color: C.dark, marginBottom: 4 }}>
                  {value}
                </Text>
                <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: C.muted, textAlign: "center" }}>
                  {label}
                </Text>
              </View>
            ))}
          </View>

          {/* About This Medication */}
          <SectionLabel title="About This Medication" />
          <Card>
            {drugInfoLoading ? (
              <View style={{ padding: 16, gap: 10 }}>
                {[80, 60, 90, 50].map((w, i) => (
                  <View key={i} style={{ height: 12, width: `${w}%`, backgroundColor: "#F0EBE8", borderRadius: 6 }} />
                ))}
              </View>
            ) : drugInfo?.indications || drugInfo?.description || drugInfo?.mechanism ? (
              <View style={{ padding: 16, gap: 14 }}>
                {drugInfo.indications && (
                  <View>
                    <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: C.dark, marginBottom: 4 }}>
                      What it's for
                    </Text>
                    <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: C.muted, lineHeight: 21 }} numberOfLines={5}>
                      {drugInfo.indications}
                    </Text>
                  </View>
                )}
                {drugInfo.mechanism && (
                  <View>
                    <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: C.dark, marginBottom: 4 }}>
                      How it works
                    </Text>
                    <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: C.muted, lineHeight: 21 }} numberOfLines={4}>
                      {drugInfo.mechanism}
                    </Text>
                  </View>
                )}
                {drugInfo.description && !drugInfo.indications && (
                  <View>
                    <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: C.dark, marginBottom: 4 }}>
                      Description
                    </Text>
                    <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: C.muted, lineHeight: 21 }} numberOfLines={5}>
                      {drugInfo.description}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={{ padding: 16 }}>
                <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: C.muted }}>
                  No additional information available for this medication.
                </Text>
              </View>
            )}
          </Card>

          {/* Side Effects & Warnings */}
          {(drugInfoLoading || drugInfo?.sideEffects || drugInfo?.warnings) && (
            <>
              <SectionLabel title="Side Effects & Warnings" />
              <Card>
                {drugInfoLoading ? (
                  <View style={{ padding: 16, gap: 10 }}>
                    {[70, 55, 80].map((w, i) => (
                      <View key={i} style={{ height: 12, width: `${w}%`, backgroundColor: "#F0EBE8", borderRadius: 6 }} />
                    ))}
                  </View>
                ) : (
                  <View style={{ padding: 16, gap: 14 }}>
                    {drugInfo?.sideEffects && (
                      <View>
                        <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: C.dark, marginBottom: 4 }}>
                          Common Side Effects
                        </Text>
                        <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: C.muted, lineHeight: 21 }} numberOfLines={6}>
                          {drugInfo.sideEffects}
                        </Text>
                      </View>
                    )}
                    {drugInfo?.warnings && (
                      <View style={{ backgroundColor: "#FEF3C7", borderRadius: 10, padding: 12 }}>
                        <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: "#92400E", marginBottom: 4 }}>
                          Warnings
                        </Text>
                        <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: "#78350F", lineHeight: 20 }} numberOfLines={5}>
                          {drugInfo.warnings}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </Card>
            </>
          )}

          {/* Drug Interactions */}
          {drugInfo?.drugInteractions && (
            <>
              <SectionLabel title="Drug Interactions" />
              <Card>
                <View style={{ padding: 16 }}>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: C.muted, lineHeight: 21 }} numberOfLines={6}>
                    {drugInfo.drugInteractions}
                  </Text>
                </View>
              </Card>
            </>
          )}

          {/* Options — centered text links, no card */}
          <SectionLabel title="Options" />
          <View style={{ gap: 4, marginBottom: 24 }}>
            <TouchableOpacity
              onPress={handleArchive}
              activeOpacity={0.6}
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                paddingVertical: 14,
              }}
            >
              <Archive size={17} color={C.muted} />
              <Text
                style={{
                  fontFamily: fonts.medium,
                  fontSize: 15,
                  color: C.muted,
                }}
              >
                Archive medication
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              activeOpacity={0.6}
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                paddingVertical: 14,
              }}
            >
              <Trash2 size={17} color="#EF4444" />
              <Text
                style={{
                  fontFamily: fonts.medium,
                  fontSize: 15,
                  color: "#EF4444",
                }}
              >
                Delete medication
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}
