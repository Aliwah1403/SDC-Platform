import { useState, useMemo, useEffect, useRef } from "react";
import { useTheme } from "@/hooks/useTheme";
import { View, Text, TouchableOpacity, Alert, Dimensions, PanResponder } from "react-native";
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
  ChevronRight,
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
  Pencil,
} from "lucide-react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { BarChart } from "react-native-gifted-charts";
import { useMedicationsQuery, useToggleMedicationTakenMutation, useDeleteMedicationMutation, useUpdateMedicationMutation, useDrugInfoQuery, useMedicationHistoryQuery, useAddMedicationLogMutation } from "@/hooks/queries/useMedicationsQuery";
import { cancelMedicationNotifications } from "@/utils/medicationNotifications";
import { fonts } from "@/utils/fonts";
import MedicationBottle from "@/components/MedicationBottle";

const C = {
  accent: "#A9334D",
  success: "#059669",
};

const CATEGORY_COLORS = {
  "Disease-modifying": "#A9334D",
  "Iron chelation": "#F0531C",
  Supportive: "#059669",
};

const SCREEN_WIDTH = Dimensions.get("window").width;

const WEEKDAYS = [
  { label: "Mon", value: 2 },
  { label: "Tue", value: 3 },
  { label: "Wed", value: 4 },
  { label: "Thu", value: 5 },
  { label: "Fri", value: 6 },
  { label: "Sat", value: 7 },
  { label: "Sun", value: 1 },
];

// ── helpers ────────────────────────────────────────────────────────────────

function parseTimes(timeStr) {
  if (!timeStr) return [];
  return timeStr
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function getMedTimes(med) {
  if (Array.isArray(med.times) && med.times.length > 0) return med.times;
  return parseTimes(med.time);
}

function isAsNeeded(f) {
  return f === "As Needed" || f === "As needed";
}

function nextDoseLabel(med) {
  if (isAsNeeded(med.frequency)) return null;
  const first = getMedTimes(med)[0];
  if (!first) return null;
  if (!med.taken) return `Today at ${first}`;
  return `Tomorrow at ${first}`;
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

function getBaseDate(period, offset) {
  const base = new Date();
  if (offset === 0) return base;
  switch (period) {
    case "D":  base.setDate(base.getDate() - offset); break;
    case "W":  base.setDate(base.getDate() - offset * 7); break;
    case "M":  base.setDate(base.getDate() - offset * 28); break;
    case "6M": base.setMonth(base.getMonth() - offset * 6); break;
    case "Y":  base.setFullYear(base.getFullYear() - offset); break;
  }
  return base;
}

// logDates: Set<string> of "YYYY-MM-DD" strings from medication_logs
function getAdherenceChartData(period, med, logDates, baseDate, logCountByDate) {
  const now = baseDate ?? new Date();
  const today = new Date(); // always real today — for med.taken check
  // Normalise to start of local day — created_at timestamps carry a time component
  // that can cause d >= startDate checks to fail earlier in the day.
  const startDate = med.startDate
    ? (() => { const d = new Date(med.startDate); d.setHours(0, 0, 0, 0); return d; })()
    : null;

  const toDateStr = (d) => d.toISOString().slice(0, 10);

  const dayLogCount = (d) => {
    if (startDate && d < startDate) return 0;

    const dateStr = toDateStr(d);
    const countFromHistory = logCountByDate.get(dateStr) ?? 0;

    if (d.toDateString() === today.toDateString()) {
      const countFromMed = Array.isArray(med.logs) ? med.logs.length : 0;
      if (countFromMed > 0 || countFromHistory > 0) {
        return Math.max(countFromMed, countFromHistory);
      }
      return med.taken ? 1 : 0;
    }

    return countFromHistory > 0 || logDates.has(dateStr) ? Math.max(1, countFromHistory) : 0;
  };

  const dayTaken = (d) => {
    return dayLogCount(d) > 0;
  };

  const isActive = (d) => !startDate || d >= startDate;

  if (period === "D") {
    const times = getMedTimes(med);
    const slots = times.length > 0 ? times : ["Today"];
    const todayCount = Math.min(dayLogCount(now), slots.length);
    const takenCount = todayCount;
    const bars = slots.map((label, i) => {
      const taken = i < todayCount;
      return { value: taken ? 100 : 0, label };
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
    let activeDays = 0;
    const bars = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const active = isActive(d);
      if (active) activeDays++;
      const taken = active && dayTaken(d);
      if (taken) takenCount++;
      return {
        value: taken ? 100 : 0,
        label: d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 3),
      };
    });
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    return {
      bars,
      takenCount,
      missedCount: activeDays - takenCount,
      pct: activeDays > 0 ? Math.round((takenCount / activeDays) * 100) : 0,
      dateRange: `${fmtShort(start)} – ${fmtShort(now)}`,
      missedLabel: "DAYS MISSED",
    };
  }

  if (period === "M") {
    let totalTaken = 0;
    let totalActive = 0;
    const bars = Array.from({ length: 4 }, (_, wi) => {
      const wEnd = new Date(now);
      wEnd.setDate(wEnd.getDate() - (3 - wi) * 7);
      const wStart = new Date(wEnd);
      wStart.setDate(wStart.getDate() - 6);
      let taken = 0, total = 0;
      for (let d = new Date(wStart); d <= wEnd; d.setDate(d.getDate() + 1)) {
        if (isActive(d)) {
          total++;
          if (dayTaken(new Date(d))) { taken++; totalTaken++; }
        }
      }
      totalActive += total;
      return { value: total > 0 ? Math.round((taken / total) * 100) : 0, label: fmtShort(wEnd) };
    });
    const start = new Date(now);
    start.setDate(start.getDate() - 27);
    return {
      bars,
      takenCount: totalTaken,
      missedCount: totalActive - totalTaken,
      pct: totalActive > 0 ? Math.round((totalTaken / totalActive) * 100) : 0,
      dateRange: `${fmtShort(start)} – ${fmtShort(now)}`,
      missedLabel: "DAYS MISSED",
    };
  }

  const months = period === "6M" ? 6 : 12;
  let totalTaken = 0, totalDays = 0;
  const bars = Array.from({ length: months }, (_, i) => {
    const mStart = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const mEnd = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i) + 1, 0);
    let taken = 0, total = 0;
    for (let d = new Date(mStart); d <= mEnd && d <= now; d.setDate(d.getDate() + 1)) {
      if (isActive(d)) {
        total++;
        if (dayTaken(new Date(d))) { taken++; totalTaken++; }
      }
    }
    totalDays += total;
    const showLabel = months === 6 || i % 2 === 0;
    return {
      value: total > 0 ? Math.round((taken / total) * 100) : 0,
      label: showLabel ? mStart.toLocaleDateString("en-US", { month: "short" }) : "",
    };
  });
  const pStart = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  return {
    bars,
    takenCount: totalTaken,
    missedCount: totalDays - totalTaken,
    pct: totalDays > 0 ? Math.round((totalTaken / totalDays) * 100) : 0,
    dateRange: `${pStart.toLocaleDateString("en-US", { month: "short", year: "numeric" })} – ${now.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`,
    missedLabel: "DAYS MISSED",
  };
}

// ── sub-components ─────────────────────────────────────────────────────────

function SectionLabel({ title }) {
  const t = useTheme();
  return (
    <Text
      style={{
        fontFamily: fonts.semibold,
        fontSize: 11,
        color: t.textSecondary,
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
  const t = useTheme();
  return (
    <View
      style={{
        backgroundColor: t.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: t.border,
        overflow: "hidden",
        marginBottom: 24,
      }}
    >
      {children}
    </View>
  );
}

function Divider() {
  const t = useTheme();
  return (
    <View style={{ height: 1, backgroundColor: t.divider, marginLeft: 62 }} />
  );
}

function InfoRow({ icon: Icon, iconColor, label, value, last }) {
  const t = useTheme();
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
            backgroundColor: t.isDark ? t.surfaceElevated : "#F2EFEC",
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
            color: t.textSecondary,
            flex: 1,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontFamily: fonts.medium,
            fontSize: 14,
            color: t.text,
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
  const t = useTheme();
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
            style={{ fontFamily: fonts.semibold, fontSize: 15, color: t.text }}
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
                color: t.textSecondary,
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
              backgroundColor: t.isDark ? "rgba(5,150,105,0.2)" : "#D1FAE5",
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
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { medicationId } = useLocalSearchParams();
  const { data: medications = [] } = useMedicationsQuery();
  const toggleTaken = useToggleMedicationTakenMutation();
  const addLog = useAddMedicationLogMutation();
  const deleteMed = useDeleteMedicationMutation();
  const updateMed = useUpdateMedicationMutation();

  const [adherencePeriod, setAdherencePeriod] = useState("W");
  const [offset, setOffset] = useState(0);
  const sheetRef = useRef(null);

  useEffect(() => { setOffset(0); }, [adherencePeriod]);
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
  const { data: logHistory = [] } = useMedicationHistoryQuery(med?.id);

  if (!med) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: t.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{ fontFamily: fonts.medium, fontSize: 16, color: t.textSecondary }}
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
  const times = getMedTimes(med);
  const extraLogs = med.logs?.slice(1) ?? [];

  const logDates = useMemo(
    () => new Set(logHistory.map((l) => l.date)),
    [logHistory],
  );
  const logCountByDate = useMemo(() => {
    const counts = new Map();
    for (const log of logHistory) {
      counts.set(log.date, (counts.get(log.date) ?? 0) + 1);
    }
    return counts;
  }, [logHistory]);

  const baseDate = useMemo(
    () => getBaseDate(adherencePeriod, offset),
    [adherencePeriod, offset],
  );

  const medStartDate = med.startDate ? new Date(med.startDate) : null;
  const canGoBack = !medStartDate || baseDate > medStartDate;

  const canGoBackRef = useRef(canGoBack);
  const offsetRef = useRef(offset);
  canGoBackRef.current = canGoBack;
  offsetRef.current = offset;

  const swipePanHandlers = useRef(
    PanResponder.create({
      // Only claim the gesture when horizontal movement clearly dominates
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5 && Math.abs(gs.dx) > 10,
      onMoveShouldSetPanResponderCapture: (_, gs) =>
        Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5 && Math.abs(gs.dx) > 10,
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < -40 && canGoBackRef.current) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setOffset((o) => o + 1);
        } else if (gs.dx > 40 && offsetRef.current > 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setOffset((o) => Math.max(0, o - 1));
        }
      },
    })
  ).current;

  const adherenceResult = useMemo(
    () => getAdherenceChartData(adherencePeriod, med, logDates, baseDate, logCountByDate),
    [adherencePeriod, med.id, med.taken, med.startDate, med.logs, logDates, logCountByDate, offset],
  );
  const CHART_WIDTH = SCREEN_WIDTH - 64;

  const handleMarkTaken = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleTaken.mutate(med.id);
  };

  const handleAddLog = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addLog.mutate(med.id);
  };

  const handleDelete = () => {
    sheetRef.current?.close();
    Alert.alert(
      "Delete Medication",
      `Remove ${med.name} from your medication list?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelMedicationNotifications(med.id);
              await deleteMed.mutateAsync(med.id);
              router.back();
            } catch (err) {
              Alert.alert("Delete failed", String(err || "Unknown error"));
            }
          },
        },
      ],
    );
  };

  const handleArchive = async () => {
    sheetRef.current?.close();
    try {
      await cancelMedicationNotifications(med.id);
      await updateMed.mutateAsync({ id: med.id, updates: { isActive: false } });
      router.back();
    } catch (err) {
      Alert.alert("Archive failed", String(err || "Unknown error"));
    }
  };

  const handleMore = () => {
    sheetRef.current?.expand();
  };

  // Floating action button shared style
  const floatBtn = {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: t.isDark ? "rgba(30,30,30,0.88)" : "rgba(255,255,255,0.88)",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
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
              <ChevronLeft size={20} color={t.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleMore}
              activeOpacity={0.7}
              style={floatBtn}
            >
              <MoreHorizontal size={20} color={t.text} />
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
              color: t.text,
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
                  color: t.textSecondary,
                }}
              >
                {med.category}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Gradient fade into page bg */}
        <LinearGradient colors={[`${color}08`, t.background]} style={{ height: 28 }} />
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
            backgroundColor: t.isDark ? "rgba(20,20,20,0.96)" : "rgba(248,244,240,0.96)",
            borderBottomWidth: 1,
            borderBottomColor: t.border,
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
          <ChevronLeft size={20} color={t.text} />
        </TouchableOpacity>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: fonts.semibold,
            fontSize: 16,
            color: t.text,
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
          <MoreHorizontal size={20} color={t.text} />
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
              times.map((tm, idx) => {
                const takenTime =
                  med.taken && med.takenAt ? formatLogTime(med.takenAt) : null;
                const isLast =
                  idx === times.length - 1 && extraLogs.length === 0;
                return (
                  <DoseRow
                    key={tm}
                    color={color}
                    timeLabel={tm}
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

            {/* Extra doses logged today */}
            {extraLogs.map((log, idx) => (
              <DoseRow
                key={log.id}
                color={color}
                timeLabel="Extra dose"
                isTaken
                takenTime={formatLogTime(log.takenAt)}
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
                      color: adherencePeriod === p ? "#fff" : t.textSecondary,
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
                        color: t.textSecondary,
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
                      color: t.text,
                      lineHeight: 34,
                    }}
                  >
                    {adherenceResult.pct}
                    <Text
                      style={{
                        fontFamily: fonts.regular,
                        fontSize: 14,
                        color: t.textSecondary,
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
                        backgroundColor: t.textTertiary,
                      }}
                    />
                    <Text
                      style={{
                        fontFamily: fonts.semibold,
                        fontSize: 10,
                        color: t.textSecondary,
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
                      color: t.text,
                      lineHeight: 34,
                    }}
                  >
                    {adherenceResult.missedCount}
                  </Text>
                </View>
              </View>
              {/* Date range nav row */}
              <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 20 }}>
                <TouchableOpacity
                  onPress={() => { if (canGoBack) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setOffset((o) => o + 1); } }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <ChevronLeft size={18} color={canGoBack ? t.text : t.border} />
                </TouchableOpacity>
                <Text style={{ flex: 1, textAlign: "center", fontFamily: fonts.regular, fontSize: 12, color: t.textSecondary }}>
                  {adherenceResult.dateRange}
                </Text>
                <TouchableOpacity
                  onPress={() => { if (offset > 0) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setOffset((o) => o - 1); } }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <ChevronRight size={18} color={offset > 0 ? t.text : t.border} />
                </TouchableOpacity>
              </View>

              {/* Chart */}
              <View {...swipePanHandlers.panHandlers}>
                  {(() => {
                    const chartData = adherenceResult.bars.map((bar) => ({
                      value: bar.value,
                      label: bar.label,
                      frontColor: bar.value > 0 ? color : t.border,
                    }));
                    const cfg = {
                      D:   { barWidth: 52, spacing: 32 },
                      W:   { barWidth: 24, spacing: 13 },
                      M:   { barWidth: 48, spacing: 26 },
                      "6M":{ barWidth: 26, spacing: 16 },
                      Y:   { barWidth: 14, spacing: 8  },
                    }[adherencePeriod] ?? { barWidth: 24, spacing: 13 };
                    return (
                      <BarChart
                        data={chartData}
                        width={CHART_WIDTH}
                        height={200}
                        barWidth={cfg.barWidth}
                        spacing={cfg.spacing}
                        maxValue={101}
                        noOfSections={2}
                        rulesType="dashed"
                        rulesColor={t.border}
                        yAxisLabelTexts={["0%", "50%", "100%"]}
                        yAxisTextStyle={{
                          fontFamily: fonts.regular,
                          fontSize: 10,
                          color: t.textSecondary,
                        }}
                        yAxisLabelWidth={34}
                        yAxisThickness={0}
                        xAxisThickness={1}
                        xAxisColor={t.border}
                        xAxisLabelTextStyle={{
                          fontFamily: fonts.regular,
                          fontSize: adherencePeriod === "Y" ? 9 : 10,
                          color: t.textSecondary,
                        }}
                        barBorderRadius={4}
                        isAnimated
                        animationDuration={400}
                      />
                    );
                  })()}
              </View>
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
            {med.frequency === "Specific Days" && (
              <InfoRow
                icon={Calendar}
                iconColor={color}
                label="Days"
                value={
                  Array.isArray(med.selectedDays) && med.selectedDays.length
                    ? WEEKDAYS.filter((d) =>
                        med.selectedDays.includes(d.value),
                      )
                        .map((d) => d.label)
                        .join(", ")
                    : "—"
                }
              />
            )}
            {!isAsNeeded(med.frequency) && (
              <InfoRow
                icon={Clock}
                iconColor={color}
                label={getMedTimes(med).length > 1 ? "Times" : "Time"}
                value={getMedTimes(med).join(" · ") || "—"}
              />
            )}
            {!isAsNeeded(med.frequency) && (
              <InfoRow
                icon={Bell}
                iconColor="#781D11"
                label="Next dose"
                value={nextDoseLabel(med)}
                last
              />
            )}
            {isAsNeeded(med.frequency) && (
              <InfoRow
                icon={Bell}
                iconColor={color}
                label="Schedule"
                value="Take when required"
                last
              />
            )}
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
                  : "Unknown"
              }
            />
            <InfoRow
              icon={FileText}
              iconColor={t.textSecondary}
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
                  backgroundColor: t.surface,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: t.border,
                  padding: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontFamily: fonts.semibold, fontSize: 16, color: t.text, marginBottom: 4 }}>
                  {value}
                </Text>
                <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: t.textSecondary, textAlign: "center" }}>
                  {label}
                </Text>
              </View>
            ))}
          </View>

          {/* About This Medication */}
          <SectionLabel title={drugInfo?.commonName ? `About ${drugInfo.commonName}` : "About This Medication"} />
          <Card>
            {drugInfoLoading ? (
              <View style={{ padding: 16, gap: 10 }}>
                {[80, 60, 90, 50].map((w, i) => (
                  <View key={i} style={{ height: 12, width: `${w}%`, backgroundColor: t.surfaceElevated, borderRadius: 6 }} />
                ))}
              </View>
            ) : (drugInfo?.humanizedIndications || drugInfo?.indications || drugInfo?.description || drugInfo?.humanizedMechanism || drugInfo?.mechanism) ? (
              <View style={{ padding: 16, gap: 14 }}>
                {(drugInfo.humanizedIndications || drugInfo.indications) && (
                  <View>
                    <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: t.text, marginBottom: 4 }}>
                      What it's for
                    </Text>
                    <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: t.textSecondary, lineHeight: 21 }} numberOfLines={5}>
                      {drugInfo.humanizedIndications || drugInfo.indications}
                    </Text>
                  </View>
                )}
                {(drugInfo.humanizedMechanism || drugInfo.mechanism) && (
                  <View>
                    <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: t.text, marginBottom: 4 }}>
                      How it works
                    </Text>
                    <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: t.textSecondary, lineHeight: 21 }} numberOfLines={4}>
                      {drugInfo.humanizedMechanism || drugInfo.mechanism}
                    </Text>
                  </View>
                )}
                {drugInfo.description && !drugInfo.indications && !drugInfo.humanizedIndications && (
                  <View>
                    <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: t.text, marginBottom: 4 }}>
                      Description
                    </Text>
                    <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: t.textSecondary, lineHeight: 21 }} numberOfLines={5}>
                      {drugInfo.description}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={{ padding: 16 }}>
                <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: t.textSecondary }}>
                  No additional information available for this medication.
                </Text>
              </View>
            )}
          </Card>

          {/* SCD Contraindication Warning */}
          {drugInfo?.scdContraindication?.flagged && (
            <View style={{ backgroundColor: t.isDark ? "rgba(220,38,38,0.12)" : "#FEE2E2", borderRadius: 12, padding: 14, flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: "#DC2626", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                <Text style={{ color: "#fff", fontSize: 12, fontFamily: fonts.bold }}>!</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: t.isDark ? "#EF4444" : "#991B1B", marginBottom: 3 }}>
                  SCD Consideration
                </Text>
                <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.isDark ? "#FCA5A5" : "#7F1D1D", lineHeight: 19 }}>
                  {drugInfo.scdContraindication.reason || "This medication may require special consideration for people with Sickle Cell Disease. Speak with your haematologist before use."}
                </Text>
              </View>
            </View>
          )}

          {/* Side Effects & Warnings */}
          {(drugInfoLoading || drugInfo?.humanizedSideEffects || drugInfo?.sideEffects || drugInfo?.humanizedWarnings || drugInfo?.warnings) && (
            <>
              <SectionLabel title="Side Effects & Warnings" />
              <Card>
                {drugInfoLoading ? (
                  <View style={{ padding: 16, gap: 10 }}>
                    {[70, 55, 80].map((w, i) => (
                      <View key={i} style={{ height: 12, width: `${w}%`, backgroundColor: t.surfaceElevated, borderRadius: 6 }} />
                    ))}
                  </View>
                ) : (
                  <View style={{ padding: 16, gap: 14 }}>
                    {(drugInfo?.humanizedSideEffects || drugInfo?.sideEffects) && (
                      <View>
                        <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: t.text, marginBottom: 4 }}>
                          Common Side Effects
                        </Text>
                        <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: t.textSecondary, lineHeight: 21 }} numberOfLines={6}>
                          {drugInfo.humanizedSideEffects || drugInfo.sideEffects}
                        </Text>
                      </View>
                    )}
                    {(drugInfo?.humanizedWarnings || drugInfo?.warnings) && (
                      <View style={{ backgroundColor: t.isDark ? "rgba(245,158,11,0.12)" : "#FEF3C7", borderRadius: 10, padding: 12 }}>
                        <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: t.isDark ? "#D97706" : "#92400E", marginBottom: 4 }}>
                          Warnings
                        </Text>
                        <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.isDark ? "#FCD34D" : "#78350F", lineHeight: 20 }} numberOfLines={5}>
                          {drugInfo.humanizedWarnings || drugInfo.warnings}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </Card>
            </>
          )}

          {/* Drug Interactions */}
          {(drugInfo?.humanizedInteractions || drugInfo?.drugInteractions) && (
            <>
              <SectionLabel title="Drug Interactions" />
              <Card>
                <View style={{ padding: 16 }}>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: t.textSecondary, lineHeight: 21 }} numberOfLines={6}>
                    {drugInfo.humanizedInteractions || drugInfo.drugInteractions}
                  </Text>
                </View>
              </Card>
            </>
          )}

        </View>
      </Animated.ScrollView>

      {/* Actions Bottom Sheet */}
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={["32%"]}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: t.surface, borderRadius: 24 }}
        handleIndicatorStyle={{ backgroundColor: t.border, width: 36 }}
      >
        <BottomSheetView style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: insets.bottom + 16 }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 17, color: t.text, marginBottom: 2 }}>
            {med.name}
          </Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.textSecondary, marginBottom: 20 }}>
            {med.dosage ? `${med.dosage}  ·  ` : ""}{med.category}
          </Text>

          <TouchableOpacity
            onPress={() => { sheetRef.current?.close(); router.push({ pathname: "/add-medication", params: { medicationId: med.id } }); }}
            style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, borderTopWidth: 1, borderTopColor: t.border }}
          >
            <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.isDark ? t.surfaceElevated : "#F8F4F0", alignItems: "center", justifyContent: "center" }}>
              <Pencil size={18} color={C.accent} />
            </View>
            <Text style={{ fontFamily: fonts.semibold, fontSize: 16, color: t.text }}>Edit Medication</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleArchive}
            style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, borderTopWidth: 1, borderTopColor: t.border }}
          >
            <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.isDark ? t.surfaceElevated : "#F8F4F0", alignItems: "center", justifyContent: "center" }}>
              <Archive size={18} color={t.textSecondary} />
            </View>
            <Text style={{ fontFamily: fonts.semibold, fontSize: 16, color: t.text }}>Archive Medication</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDelete}
            style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, borderTopWidth: 1, borderTopColor: t.border }}
          >
            <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.isDark ? "rgba(220,38,38,0.12)" : "#FEF2F2", alignItems: "center", justifyContent: "center" }}>
              <Trash2 size={18} color="#DC2626" />
            </View>
            <Text style={{ fontFamily: fonts.semibold, fontSize: 16, color: "#DC2626" }}>Delete Medication</Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}
