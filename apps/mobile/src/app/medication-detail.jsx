import { useState } from "react";
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
import { BarChart } from "react-native-gifted-charts";
import { useMedicationsQuery, useToggleMedicationTakenMutation, useDeleteMedicationMutation, useUpdateMedicationMutation } from "@/hooks/queries/useMedicationsQuery";
import { fonts } from "@/utils/fonts";
import MedicationIcon from "@/components/MedicationIcon";

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

function generateAdherenceData(taken, days, color) {
  const now = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (days - 1 - i));
    const isTaken = i === days - 1 ? !!taken : (i * 7 + 3) % 5 !== 0;
    const label =
      days <= 7
        ? d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2)
        : i % 7 === 0
          ? `W${Math.floor(i / 7) + 1}`
          : "";
    return {
      value: isTaken ? 1 : 0.12,
      label,
      frontColor: isTaken ? color : `${color}30`,
    };
  });
}

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

  const [adherencePeriod, setAdherencePeriod] = useState(7);
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
  const adherenceData = generateAdherenceData(
    med.taken,
    adherencePeriod,
    color,
  );
  const takenCount = adherenceData.filter((d) => d.value > 0.5).length;
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

          {/* Icon */}
          <View
            style={{
              width: 108,
              height: 108,
              borderRadius: 54,
              backgroundColor: `${color}20`,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 18,
            }}
          >
            <MedicationIcon
              type={med.type ?? "tablet"}
              color={color}
              size={60}
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
            <View style={{ padding: 16 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  marginBottom: 16,
                }}
              >
                {[7, 28].map((p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setAdherencePeriod(p)}
                    activeOpacity={0.7}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 5,
                      borderRadius: 20,
                      backgroundColor:
                        adherencePeriod === p ? color : `${color}12`,
                      marginLeft: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: fonts.semibold,
                        fontSize: 12,
                        color: adherencePeriod === p ? "#fff" : color,
                      }}
                    >
                      {p === 7 ? "7D" : "28D"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <BarChart
                data={adherenceData}
                width={CHART_WIDTH}
                height={90}
                barWidth={adherencePeriod === 7 ? 28 : 10}
                spacing={adherencePeriod === 7 ? 14 : 4}
                maxValue={1}
                hideRules
                hideYAxisText
                hideAxesAndRules
                xAxisLabelTextStyle={{
                  fontFamily: fonts.regular,
                  fontSize: 10,
                  color: C.muted,
                }}
                barBorderRadius={4}
                noOfSections={1}
                isAnimated
              />

              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 13,
                  color: C.muted,
                  marginTop: 10,
                  textAlign: "center",
                }}
              >
                <Text style={{ fontFamily: fonts.semibold, color: C.dark }}>
                  {takenCount}
                </Text>
                {` of ${adherencePeriod} days taken`}
              </Text>
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

          {/* About — plain prose, no card */}
          <SectionLabel title="About" />
          <View style={{ marginBottom: 24, gap: 16 }}>
            <View style={{ paddingHorizontal: 4 }}>
              <Text
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: 14,
                  color: C.dark,
                  marginBottom: 4,
                }}
              >
                Side Effects
              </Text>
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 14,
                  color: C.muted,
                  lineHeight: 20,
                }}
              >
                No information available for this medication.
              </Text>
            </View>
            <View style={{ paddingHorizontal: 4 }}>
              <Text
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: 14,
                  color: C.dark,
                  marginBottom: 4,
                }}
              >
                Drug Class
              </Text>
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 14,
                  color: C.muted,
                  lineHeight: 20,
                }}
              >
                {med.category}
              </Text>
            </View>
          </View>

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
