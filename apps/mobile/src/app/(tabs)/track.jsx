import { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from "react-native-reanimated";
import { MotiView } from "moti";
import {
  Plus,
  Pill,
  Zap,
  Droplets,
  Smile,
  Meh,
  Frown,
  Activity,
  Moon,
  Heart,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAppStore } from "@/store/appStore";
import { useDateNavigation } from "@/hooks/useDateNavigation";
import { DatePicker } from "@/components/HomeHeader/DatePicker";
import { mockMedications } from "@/types";
import { fonts } from "@/utils/fonts";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DAY_CELL_SIZE = Math.floor(SCREEN_WIDTH / 7);
const WEEK_HEIGHT = 82;
const MONTH_HEIGHT = 334;

const DARK_TEXT = "#781D11";
const ORANGE = "#F0531C";
const WINE = "#A9334D";
const GRADIENT = ["#D09F9A", "#A9334D", "#781D11"];

const MOOD_ICONS = [
  { Icon: Frown, color: "#DC2626" },
  { Icon: Frown, color: "#F59E0B" },
  { Icon: Meh,   color: "#9CA3AF" },
  { Icon: Smile, color: "#059669" },
  { Icon: Smile, color: "#16A34A" },
];
const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function dateToStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getCalendarGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const prevLastDay = new Date(year, month, 0).getDate();
  const days = [];
  for (let i = startDow - 1; i >= 0; i--) {
    days.push({ date: new Date(year, month - 1, prevLastDay - i), current: false });
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push({ date: new Date(year, month, d), current: true });
  }
  const rem = 7 - (days.length % 7);
  if (rem < 7) {
    for (let i = 1; i <= rem; i++) {
      days.push({ date: new Date(year, month + 1, i), current: false });
    }
  }
  return days;
}

// ─── Full Month Calendar ──────────────────────────────────────────────────────

function FullMonthCalendar({ selectedDate, setSelectedDate, loggedDates, isToday, isFuture, isSelected }) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const grid = getCalendarGrid(viewYear, viewMonth);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  return (
    <View>
      {/* Month navigation */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, height: 44 }}>
        <TouchableOpacity onPress={prevMonth} hitSlop={8}>
          <ChevronLeft color="rgba(255,255,255,0.75)" size={20} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: "#fff" }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </Text>
        <TouchableOpacity onPress={nextMonth} hitSlop={8}>
          <ChevronRight color="rgba(255,255,255,0.75)" size={20} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Day-of-week headers */}
      <View style={{ flexDirection: "row", paddingBottom: 4 }}>
        {DAY_LETTERS.map((l, i) => (
          <View key={i} style={{ width: DAY_CELL_SIZE, alignItems: "center" }}>
            <Text style={{ fontFamily: fonts.medium, fontSize: 11, color: "rgba(255,255,255,0.45)", letterSpacing: 0.4 }}>{l}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {grid.map((item, i) => {
          const { date, current } = item;
          const future = isFuture(date);
          const today = isToday(date);
          const selected = isSelected(date, selectedDate);
          const hasLog = loggedDates.has(dateToStr(date));

          return (
            <TouchableOpacity
              key={i}
              onPress={() => { if (!future && current) setSelectedDate(date); }}
              disabled={future || !current}
              style={{ width: DAY_CELL_SIZE, height: 40, alignItems: "center", justifyContent: "center", opacity: !current ? 0 : future ? 0.3 : 1 }}
            >
              <View style={{
                width: 28, height: 28, borderRadius: 14,
                backgroundColor: selected ? ORANGE : today ? "rgba(255,255,255,0.18)" : "transparent",
                alignItems: "center", justifyContent: "center",
              }}>
                <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: selected ? "#fff" : "rgba(255,255,255,0.85)" }}>
                  {date.getDate()}
                </Text>
              </View>
              {hasLog && !selected && (
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: ORANGE, marginTop: 1 }} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Expandable Calendar ─────────────────────────────────────────────────────

function ExpandableCalendar({ selectedDate, setSelectedDate, loggedDates, isToday, isFuture, isSelected }) {
  const [expanded, setExpanded] = useState(false);
  const calendarHeight = useSharedValue(WEEK_HEIGHT);

  function toggle() {
    const next = !expanded;
    setExpanded(next);
    calendarHeight.value = withSpring(next ? MONTH_HEIGHT : WEEK_HEIGHT, {
      damping: 20, stiffness: 90,
    });
  }

  const animStyle = useAnimatedStyle(() => ({ height: calendarHeight.value }));

  return (
    <View>
      <Animated.View style={[{ overflow: "hidden" }, animStyle]}>
        {expanded ? (
          <FullMonthCalendar
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            loggedDates={loggedDates}
            isToday={isToday}
            isFuture={isFuture}
            isSelected={isSelected}
          />
        ) : (
          <DatePicker
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            isToday={isToday}
            isFuture={isFuture}
            isSelected={isSelected}
          />
        )}
      </Animated.View>

      {/* Drag handle */}
      <TouchableOpacity onPress={toggle} style={{ alignItems: "center", paddingTop: 6, paddingBottom: 10 }}>
        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.3)" }} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Log Today Card ───────────────────────────────────────────────────────────

function LogTodayCard() {
  const router = useRouter();
  return (
    <MotiView
      from={{ opacity: 0, translateY: -8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 300 }}
      style={{
        backgroundColor: "#F8E9E7",
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 16,
        marginTop: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: "#781D11", marginBottom: 2 }}>
          How are you feeling today?
        </Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: "#9CA3AF" }}>
          Log your symptoms now
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => router.push("/log-symptoms")}
        style={{
          backgroundColor: WINE,
          borderRadius: 20,
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          paddingHorizontal: 14,
          paddingVertical: 10,
          marginLeft: 12,
        }}
      >
        <Plus color="#fff" size={15} strokeWidth={2.5} />
        <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: "#fff" }}>Log Entry</Text>
      </TouchableOpacity>
    </MotiView>
  );
}

// ─── Medications ──────────────────────────────────────────────────────────────

function MedicationItem({ medication, taken, onToggle }) {
  return (
    <View style={{
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#fff",
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      borderLeftWidth: 3,
      borderLeftColor: taken ? WINE : "#E5D5D3",
    }}>
      <View style={{
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: taken ? "#FBE8EC" : "#F3F4F6",
        alignItems: "center", justifyContent: "center",
        marginRight: 12,
      }}>
        <Pill color={taken ? WINE : "#9CA3AF"} size={18} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.semibold, fontSize: 15, color: DARK_TEXT, marginBottom: 1 }}>
          {medication.name}
        </Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: "#9CA3AF" }}>
          {medication.dosage} · {medication.time}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onToggle}
        style={{
          width: 28, height: 28, borderRadius: 8,
          borderWidth: 2,
          borderColor: taken ? WINE : "#D1D5DB",
          backgroundColor: taken ? WINE : "transparent",
          alignItems: "center", justifyContent: "center",
        }}
      >
        {taken && <Check color="#fff" size={13} strokeWidth={2.5} />}
      </TouchableOpacity>
    </View>
  );
}

function MedicationsSection({ selectedDate, medTaken, setMedTaken }) {
  const dateLabel = selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return (
    <View style={{ marginTop: 24, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: DARK_TEXT }}>Medications due</Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: "#9CA3AF" }}>{dateLabel}</Text>
      </View>
      {mockMedications.map((med) => (
        <MedicationItem
          key={med.id}
          medication={med}
          taken={!!medTaken[med.id]}
          onToggle={() => setMedTaken((prev) => ({ ...prev, [med.id]: !prev[med.id] }))}
        />
      ))}
    </View>
  );
}

// ─── Metrics Grid ─────────────────────────────────────────────────────────────

const METRIC_CONFIGS = [
  { key: "pain",      label: "Pain Level",  icon: Zap,      color: "#DC2626", unit: "/10",    source: "manual", dataField: "painLevel",  maxValue: 10,    getValue: (e) => (e?.painLevel  != null ? e.painLevel              : null) },
  { key: "hydration", label: "Hydration",   icon: Droplets,  color: "#3B82F6", unit: "glasses",source: "manual", dataField: "hydration",  maxValue: 16,    getValue: (e) => (e?.hydration  != null ? e.hydration              : null) },
  { key: "mood",      label: "Mood",        icon: Smile,     color: "#7C3AED", unit: "",       source: "manual", dataField: "mood",       maxValue: 5,     getValue: (e) => (e?.mood       != null ? e.mood                   : null) },
  { key: "steps",     label: "Steps",       icon: Activity,  color: "#059669", unit: "steps",  source: "apple",  dataField: "steps",      maxValue: 15000, getValue: (e) => (e?.steps      != null ? e.steps                  : null) },
  { key: "sleep",     label: "Sleep",       icon: Moon,      color: "#6366F1", unit: "h",      source: "apple",  dataField: "sleepHours", maxValue: 10,    getValue: (e) => (e?.sleepHours != null ? Number(e.sleepHours.toFixed(1)) : null) },
  { key: "heartrate", label: "Heart Rate",  icon: Heart,     color: "#EF4444", unit: "bpm",    source: "apple",  dataField: "heartRate",  maxValue: 120,   getValue: (e) => (e?.heartRate  != null ? e.heartRate              : null) },
];

const METRIC_CONFIG_MAP = Object.fromEntries(METRIC_CONFIGS.map((c) => [c.key, c]));

// Layout rows: single key = full width, two keys = side-by-side
const METRIC_ROWS = [["pain"], ["hydration", "mood"], ["steps"], ["sleep", "heartrate"]];

const FULL_CARD_W = SCREEN_WIDTH - 32;
const HALF_CARD_W = (SCREEN_WIDTH - 44) / 2;

function getLast7(healthData, dataField) {
  const today = new Date();
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const entry = healthData.find((e) => e.date === dateToStr(d));
    result.push(entry?.[dataField] ?? 0);
  }
  return result;
}

function getStatus(metricKey, value) {
  if (!value) return null;
  switch (metricKey) {
    case "pain":
      if (value <= 2) return { label: "Low", color: "#059669" };
      if (value <= 5) return { label: "Moderate", color: "#F59E0B" };
      return { label: "High", color: "#DC2626" };
    case "hydration":
      if (value >= 8) return { label: "On track", color: "#059669" };
      if (value >= 5) return { label: "Fair", color: "#F59E0B" };
      return { label: "Low", color: "#DC2626" };
    case "mood":
      if (value >= 4) return { label: "Great", color: "#059669" };
      if (value >= 3) return { label: "Okay", color: "#F59E0B" };
      return { label: "Low", color: "#DC2626" };
    case "steps":
      if (value >= 8000) return { label: "Active", color: "#059669" };
      if (value >= 5000) return { label: "Moderate", color: "#F59E0B" };
      return { label: "Low", color: "#EF4444" };
    case "sleep":
      if (value >= 8) return { label: "Great", color: "#059669" };
      if (value >= 7) return { label: "Good", color: "#059669" };
      if (value >= 6) return { label: "Fair", color: "#F59E0B" };
      return { label: "Low", color: "#DC2626" };
    case "heartrate":
      if (value >= 60 && value <= 100) return { label: "Normal", color: "#059669" };
      if (value > 100) return { label: "Elevated", color: "#DC2626" };
      return { label: "Low", color: "#F59E0B" };
    default: return null;
  }
}

function MiniSparkline({ data, color, maxValue }) {
  const max = Math.max(maxValue, Math.max(...data, 1));
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 3 }}>
      {data.map((val, i) => (
        <View
          key={i}
          style={{
            width: 6,
            borderRadius: 3,
            height: Math.max(3, (val / max) * 44),
            backgroundColor: color,
            opacity: 0.25 + (i / (data.length - 1)) * 0.75,
          }}
        />
      ))}
    </View>
  );
}

function MetricCard({ metricKey, entry, sparkData, wide, animIndex }) {
  const router = useRouter();
  const config = METRIC_CONFIG_MAP[metricKey];
  const rawValue = config.getValue(entry);
  const hasValue = rawValue !== null && rawValue !== undefined;

  let displayValue = "—";
  let moodDisplay = null;
  if (hasValue) {
    if (metricKey === "steps" && rawValue >= 1000) {
      displayValue = `${(rawValue / 1000).toFixed(1)}k`;
    } else if (metricKey === "mood") {
      moodDisplay = MOOD_ICONS[(rawValue ?? 3) - 1];
    } else {
      displayValue = String(rawValue);
    }
  }

  const status = hasValue ? getStatus(metricKey, rawValue) : null;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: animIndex * 60, type: "timing", duration: 280 }}
    >
      <TouchableOpacity
        onPress={() => router.push(`/metric-detail?metric=${metricKey}`)}
        style={{
          width: wide ? FULL_CARD_W : HALF_CARD_W,
          backgroundColor: "#fff",
          borderRadius: 20,
          padding: 18,
          marginBottom: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        {/* Top row: icon + label + AH badge */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 16 }}>
          <config.icon color={config.color} size={13} strokeWidth={2.5} />
          <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: "#9CA3AF", flex: 1 }}>
            {config.label}
          </Text>
          {config.source === "apple" && (
            <View style={{ backgroundColor: "#F3F4F6", borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 }}>
              <Text style={{ fontFamily: fonts.medium, fontSize: 9, color: "#9CA3AF" }}>AH</Text>
            </View>
          )}
        </View>

        {/* Value row + sparkline */}
        <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              {metricKey === "mood" && moodDisplay ? (
                <moodDisplay.Icon size={34} color={moodDisplay.color} strokeWidth={2} />
              ) : (
                <Text style={{
                  fontFamily: fonts.bold,
                  fontSize: hasValue ? ((displayValue?.length ?? 0) > 4 ? 28 : 34) : 28,
                  color: hasValue ? "#1F2937" : "#D1D5DB",
                }}>
                  {displayValue}
                </Text>
              )}
              {hasValue && config.unit && metricKey !== "mood" && (
                <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: "#9CA3AF", marginBottom: 3 }}>
                  {config.unit}
                </Text>
              )}
            </View>
            {status ? (
              <Text style={{ fontFamily: fonts.semibold, fontSize: 12, color: status.color, marginTop: 5 }}>
                {status.label}
              </Text>
            ) : (
              <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: "#D1D5DB", marginTop: 5 }}>
                Not logged
              </Text>
            )}
          </View>

          {wide && sparkData && (
            <MiniSparkline data={sparkData} color={config.color} maxValue={config.maxValue} />
          )}
        </View>
      </TouchableOpacity>
    </MotiView>
  );
}

function MetricsGrid({ entry, healthData }) {
  return (
    <View style={{ paddingHorizontal: 16, marginTop: 24, marginBottom: 8 }}>
      <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: DARK_TEXT, marginBottom: 14 }}>
        Health Metrics
      </Text>
      {METRIC_ROWS.map((row, rowIdx) => {
        const wide = row.length === 1;
        return (
          <View key={rowIdx} style={{ flexDirection: "row", justifyContent: "space-between" }}>
            {row.map((key, colIdx) => {
              const cfg = METRIC_CONFIG_MAP[key];
              return (
                <MetricCard
                  key={key}
                  metricKey={key}
                  entry={entry}
                  sparkData={wide ? getLast7(healthData, cfg.dataField) : null}
                  wide={wide}
                  animIndex={rowIdx * 2 + colIdx}
                />
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TrackScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { healthData } = useAppStore();
  const { isToday, isFuture, isSelected } = useDateNavigation();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [medTaken, setMedTaken] = useState(
    Object.fromEntries(mockMedications.map((m) => [m.id, m.taken]))
  );

  const loggedDates = useMemo(() => new Set(healthData.map((d) => d.date)), [healthData]);

  const entry = useMemo(
    () => healthData.find((d) => d.date === dateToStr(selectedDate)) ?? null,
    [healthData, selectedDate]
  );
  const hasLoggedData = !!entry;

  return (
    <View style={{ flex: 1, backgroundColor: "#FFF9F9" }}>
      {/* Fixed top: header + calendar */}
      <LinearGradient colors={GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        {/* Decorative abstract shapes */}
        <View style={{ position: "absolute", width: 200, height: 200, borderRadius: 999, backgroundColor: "#D09F9A", opacity: 0.15, top: -60, right: -40 }} />
        <View style={{ position: "absolute", width: 140, height: 140, borderRadius: 999, backgroundColor: "#781D11", opacity: 0.15, top: 30, left: -50 }} />

        <View style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingTop: insets.top + 10,
          paddingBottom: 14,
        }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 24, color: "#fff" }}>
            Health Tracker
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/log-symptoms")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 8,
            }}
          >
            <Plus color="#fff" size={15} strokeWidth={2.5} />
            <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: "#fff" }}>Log</Text>
          </TouchableOpacity>
        </View>

        <ExpandableCalendar
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          loggedDates={loggedDates}
          isToday={isToday}
          isFuture={isFuture}
          isSelected={isSelected}
        />
      </LinearGradient>

      {/* Scrollable content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {isToday(selectedDate) && !hasLoggedData && <LogTodayCard />}
        <MedicationsSection
          selectedDate={selectedDate}
          medTaken={medTaken}
          setMedTaken={setMedTaken}
        />
        <MetricsGrid entry={entry} healthData={healthData} />
      </ScrollView>
    </View>
  );
}
