import { useState, useRef, useEffect, useMemo } from "react";
import { usePostHog } from "posthog-react-native";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Dimensions,
  TextInput,
  Alert,
  Linking,
} from "react-native";
import Slider from "@react-native-community/slider";
import Svg, { Rect, Defs, ClipPath } from "react-native-svg";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { X, Droplets, Moon, Activity, TriangleAlert, Check, HeartPulse, ShieldCheck, Pencil, ChevronUp, Plus } from "lucide-react-native";
import { useMetricGoalsQuery, useSetGoalMutation } from "@/hooks/queries/useMetricGoalsQuery";
import { useProfileQuery } from "@/hooks/queries/useProfileQuery";
import { useWeatherData } from "@/hooks/useWeatherData";
import { useHydrationStore } from "@/store/hydrationStore";
import {
  useHydrationContainersQuery,
  useAddHydrationContainerMutation,
  useUpdateHydrationContainerMutation,
  useRemoveHydrationContainerMutation,
  useSetDefaultHydrationContainerMutation,
  CONTAINER_EMOJI_OPTIONS,
  MAX_CONTAINERS,
  FALLBACK_CONTAINERS,
} from "@/hooks/queries/useHydrationContainersQuery";
import { getHydrationSuggestion, GLASS_ML, DEFAULT_SUGGESTED_ML } from "@/utils/hydrationGoal";
import {
  HYDRATION_CATEGORY,
  scheduleHydrationReminders,
  cancelHydrationReminders,
  describeHydrationSchedule,
} from "@/utils/hydrationReminders";
import { hydrationNumberAndUnit, formatHydration } from "@/utils/hydrationUnits";
import { fonts } from "@/utils/fonts";
import { useTheme } from "@/hooks/useTheme";
import { colors } from "@/utils/colors";
import { enterTiming, STAGGER_MS } from "@/utils/motion";
import { PressableScale } from "@/components/PressableScale";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SLIDER_WIDTH = SCREEN_WIDTH - 48;

const ML_PER_FLOZ = 29.5735;

// ⚠️ COPY PENDING CLINICAL REVIEW — see CLINICAL-REVIEW-hydration.md
const HYDRATION_BENEFITS = [
  { icon: Droplets, text: "Helps reduce red-cell sickling and lower crisis risk" },
  { icon: HeartPulse, text: "Supports healthy blood flow and circulation" },
  { icon: ShieldCheck, text: "One of the most effective daily habits for SCD management" },
];

const UNIT_OPTIONS = [
  { key: "glasses", label: "Glasses" },
  { key: "ml", label: "mL" },
  { key: "L", label: "L" },
  { key: "floz", label: "fl oz" },
];

function bigValueParts(ml, unit) {
  const { number, unitLabel } = hydrationNumberAndUnit(ml, unit);
  return { number, label: `${unitLabel} per day` };
}

function translationLine(ml) {
  const liters = (ml / 1000).toFixed(1);
  const glasses = Math.round((ml / GLASS_ML) * 10) / 10;
  const glassesLabel = Number.isInteger(glasses) ? glasses.toString() : glasses.toFixed(1);
  const floz = Math.round(ml / ML_PER_FLOZ);
  return `${liters} L · ≈ ${glassesLabel} glass${glasses === 1 ? "" : "es"} · ${floz} fl oz`;
}

function bucketGoalValue(metric, value) {
  if (metric === 'hydration') {
    // value is canonical ml; bucket labels stay glasses-equivalent for analytics continuity.
    if (value <= 1000) return '1-4';
    if (value <= 1750) return '5-7';
    if (value <= 2500) return '8-10';
    return '11-16';
  }
  if (metric === 'sleep') {
    if (value < 6) return 'under_6';
    if (value < 8) return '6-7.9';
    if (value < 10) return '8-9.9';
    return '10-12';
  }
  if (metric === 'steps') {
    if (value < 5000) return 'under_5k';
    if (value < 10000) return '5k-9.9k';
    if (value < 15000) return '10k-14.9k';
    return '15k+';
  }
  return 'unknown';
}

const GOAL_META = {
  hydration: {
    goalLabel: "Hydration Goal",
    subtitle: "Set your daily water intake target",
    unit: "ml",
    min: 1000,
    max: 5000,
    step: 250,
    icon: Droplets,
    color: "#3B82F6",
  },
  sleep: {
    goalLabel: "Sleep Goal",
    subtitle: "Set how many hours of sleep you need per night",
    unit: "h",
    min: 4,
    max: 12,
    step: 0.1,
    recommended: { min: 7, max: 9 },
    recommendedLabel: "RECOMMENDED FOR ADULTS  7 – 9 HOURS",
    setter: "slider",
    tip: "To support your health, doctors generally recommend 7 to 9 hours of sleep each night. Quality sleep helps your body recover and reduces the risk of pain episodes.",
    icon: Moon,
    color: "#6366F1",
  },
  steps: {
    goalLabel: "Step Goal",
    subtitle: "Set your daily step count target",
    unit: "steps",
    min: 1000,
    max: 20000,
    step: 500,
    recommended: { min: 7000, max: 10000 },
    recommendedLabel: "RECOMMENDED: 7,000 – 10,000 STEPS",
    setter: "slider",
    tip: "Light to moderate activity is beneficial for circulation with SCD. Find a sustainable step count that keeps you active without overexertion — your safe range is unique to you.",
    icon: Activity,
    color: "#059669",
  },
};

// ─── Icon with sparkle decoration ─────────────────────────────────────────────

function MetricIcon({ icon: Icon, color }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", width: 120, height: 120 }}>
      {/* Sparkle diamonds */}
      <View style={{ position: "absolute", width: 12, height: 12, borderRadius: 2, backgroundColor: color, opacity: 0.5, top: 8, left: 22, transform: [{ rotate: "45deg" }] }} />
      <View style={{ position: "absolute", width: 8, height: 8, borderRadius: 1.5, backgroundColor: color, opacity: 0.35, top: 14, right: 14, transform: [{ rotate: "45deg" }] }} />
      <View style={{ position: "absolute", width: 6, height: 6, borderRadius: 1.5, backgroundColor: color, opacity: 0.4, bottom: 12, right: 20, transform: [{ rotate: "45deg" }] }} />
      <View style={{ position: "absolute", width: 10, height: 10, borderRadius: 2, backgroundColor: color, opacity: 0.3, bottom: 18, left: 12, transform: [{ rotate: "45deg" }] }} />
      <Icon size={42} color={color} strokeWidth={1.5} />
    </View>
  );
}

// ─── Recommended range bar (below slider) ─────────────────────────────────────

function RangeBar({ min, max, recMin, recMax, color }) {
  const t = useTheme();
  const leftFrac = (recMin - min) / (max - min);
  const widthFrac = (recMax - recMin) / (max - min);
  const leftPx = leftFrac * SLIDER_WIDTH;
  const widthPx = widthFrac * SLIDER_WIDTH;

  return (
    <View style={{ width: SLIDER_WIDTH, marginTop: 8 }}>
      {/* Full track */}
      <View style={{ height: 3, backgroundColor: t.border, borderRadius: 2 }}>
        {/* Highlighted recommended segment */}
        <View style={{
          position: "absolute",
          left: leftPx,
          width: widthPx,
          height: 3,
          backgroundColor: color,
          opacity: 0.35,
          borderRadius: 2,
        }} />
      </View>
    </View>
  );
}

// ─── Hydration goal sheet (Phase 2 rebuild) ───────────────────────────────────

function GlassIcon({ fraction, size, color, borderColor, uid }) {
  const W = size;
  const H = Math.round(size * 1.35);
  const clipId = `glassClip-${uid}`;
  const f = Math.max(0, Math.min(1, fraction));
  const fillH = f * (H - 4);
  return (
    <Svg width={W} height={H}>
      <Defs>
        <ClipPath id={clipId}>
          <Rect x={2} y={2} width={W - 4} height={H - 4} rx={3} ry={3} />
        </ClipPath>
      </Defs>
      <Rect x={1} y={1} width={W - 2} height={H - 2} rx={4} ry={4} fill="transparent" stroke={borderColor} strokeWidth={1.3} />
      {f > 0 && (
        <Rect x={2} y={H - 2 - fillH} width={W - 4} height={fillH} fill={color} clipPath={`url(#${clipId})`} />
      )}
    </Svg>
  );
}

function GlassRow({ goalMl, color, t }) {
  const totalGlasses = goalMl / GLASS_ML;
  const count = Math.min(20, Math.max(1, Math.ceil(totalGlasses)));
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5, justifyContent: "center", paddingHorizontal: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <GlassIcon
          key={i}
          uid={i}
          fraction={Math.max(0, Math.min(1, totalGlasses - i))}
          size={13}
          color={color}
          borderColor={t.border}
        />
      ))}
    </View>
  );
}

function SuggestedNotch({ min, max, suggestedMl, t }) {
  const frac = Math.max(0, Math.min(1, (suggestedMl - min) / (max - min)));
  const leftPx = frac * SLIDER_WIDTH;
  return (
    <View style={{ width: SLIDER_WIDTH, height: 22 }}>
      <View style={{ position: "absolute", left: Math.max(0, leftPx - 1), top: 0, width: 2, height: 8, backgroundColor: colors.burgundy, borderRadius: 1 }} />
      <Text
        style={{
          position: "absolute",
          left: Math.min(Math.max(leftPx - 34, 0), SLIDER_WIDTH - 68),
          top: 9,
          width: 68,
          textAlign: "center",
          fontFamily: fonts.semibold,
          fontSize: 9,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: t.textTertiary,
        }}
      >
        Suggested
      </Text>
    </View>
  );
}

function SuggestionPill({ value, suggestedMl, t }) {
  const diff = value - suggestedMl;
  let label, positive;
  if (diff < -250) {
    label = "Below your suggested amount";
    positive = false;
  } else if (diff > 250) {
    label = "Comfortably above your suggestion";
    positive = true;
  } else {
    label = "Right on your suggested mark";
    positive = true;
  }

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        alignSelf: "center",
        backgroundColor: positive ? colors.burgundyTint : t.surfaceElevated,
        borderWidth: 1,
        borderColor: positive ? colors.burgundyBorder : t.border,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
      }}
    >
      {positive && <Check size={13} color={colors.darkBurgundy} strokeWidth={2.5} />}
      <Text
        style={{
          fontFamily: fonts.semibold,
          fontSize: 12,
          color: positive ? colors.darkBurgundy : t.textSecondary,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function DisplayUnitRow({ displayUnit, onChange, t }) {
  return (
    <View>
      <Text
        style={{
          fontFamily: fonts.semibold,
          fontSize: 11,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: t.textTertiary,
          marginBottom: 10,
        }}
      >
        Display Unit
      </Text>
      <View style={{ flexDirection: "row", backgroundColor: t.surfaceElevated, borderRadius: 12, padding: 3 }}>
        {UNIT_OPTIONS.map((opt) => {
          const active = displayUnit === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => {
                if (!active) {
                  Haptics.selectionAsync();
                  onChange(opt.key);
                }
              }}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 9,
                alignItems: "center",
                backgroundColor: active ? "#3B82F6" : "transparent",
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: 13,
                  color: active ? "#fff" : t.textSecondary,
                }}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function SectionDivider({ t }) {
  return <View style={{ height: 1, backgroundColor: t.divider, marginVertical: 24 }} />;
}

// Shared name/capacity/emoji fields for both editing an existing container and
// adding a new one (Step 9).
function ContainerEditorFields({ name, setName, ml, setMl, emoji, setEmoji, displayUnit, t }) {
  return (
    <>
      <TextInput
        value={name}
        onChangeText={(v) => setName(v.slice(0, 16))}
        placeholder="Name"
        placeholderTextColor={t.textTertiary}
        style={{
          fontFamily: fonts.medium,
          fontSize: 15,
          color: t.text,
          borderBottomWidth: 1,
          borderBottomColor: t.border,
          paddingVertical: 6,
          marginBottom: 14,
        }}
      />
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <TouchableOpacity
          onPress={() => setMl((v) => Math.max(100, v - 50))}
          style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: "#3B82F6", alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ fontFamily: fonts.bold, fontSize: 20, color: "#3B82F6" }}>−</Text>
        </TouchableOpacity>
        <Text style={{ fontFamily: fonts.bold, fontSize: 17, color: t.text }}>
          {formatHydration(ml, displayUnit)}
        </Text>
        <TouchableOpacity
          onPress={() => setMl((v) => Math.min(2000, v + 50))}
          style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: "#3B82F6", alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ fontFamily: fonts.bold, fontSize: 20, color: "#3B82F6" }}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {CONTAINER_EMOJI_OPTIONS.map((e) => (
          <TouchableOpacity
            key={e}
            onPress={() => {
              Haptics.selectionAsync();
              setEmoji(e);
            }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: emoji === e ? colors.burgundyTint : "transparent",
              borderWidth: emoji === e ? 1.5 : 0,
              borderColor: "#3B82F6",
            }}
          >
            <Text style={{ fontSize: 18 }}>{e}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
}

function ContainerRow({ container, displayUnit, isExpanded, onToggleExpand, onSetDefault, onSave, onRemove, canRemove, pending, t }) {
  const [name, setName] = useState(container.name);
  const [ml, setMl] = useState(container.ml);
  const [emoji, setEmoji] = useState(container.emoji);
  const isDefault = container.isDefault;

  return (
    <View style={{ marginBottom: 10, borderRadius: 14, backgroundColor: t.surfaceElevated, padding: 14, opacity: pending ? 0.6 : 1 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <PressableScale
          disabled={pending}
          onPress={() => {
            if (!isDefault) {
              Haptics.selectionAsync();
              onSetDefault(container.id);
            }
          }}
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            borderWidth: 1.5,
            borderColor: isDefault ? "#3B82F6" : t.border,
            backgroundColor: isDefault ? "#3B82F6" : "transparent",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isDefault && <Check size={13} color="#fff" strokeWidth={3} />}
        </PressableScale>
        <Text style={{ fontSize: 22 }}>{container.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.semibold, fontSize: 15, color: t.text }}>{container.name}</Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: t.textSecondary }}>
            {formatHydration(container.ml, displayUnit)}{isDefault ? " · Default" : ""}
          </Text>
        </View>
        <PressableScale disabled={pending} onPress={onToggleExpand} style={{ padding: 6 }}>
          {isExpanded ? <ChevronUp size={18} color={t.textSecondary} /> : <Pencil size={16} color={t.textSecondary} />}
        </PressableScale>
      </View>

      {isExpanded && (
        <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: t.border }}>
          <ContainerEditorFields
            name={name} setName={setName}
            ml={ml} setMl={setMl}
            emoji={emoji} setEmoji={setEmoji}
            displayUnit={displayUnit} t={t}
          />
          <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
            {canRemove && (
              <PressableScale
                disabled={pending}
                onPress={() => onRemove(container.id)}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: "#DC2626" }}
              >
                <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: "#DC2626" }}>Delete</Text>
              </PressableScale>
            )}
            <PressableScale
              disabled={pending}
              onPress={() => {
                onSave(container.id, { name: name.trim() || container.name, ml, emoji });
                onToggleExpand();
              }}
              style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", backgroundColor: "#3B82F6" }}
            >
              <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: "#fff" }}>Save</Text>
            </PressableScale>
          </View>
        </View>
      )}
    </View>
  );
}

function AddContainerRow({ displayUnit, onAdd, pending, t }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [ml, setMl] = useState(250);
  const [emoji, setEmoji] = useState(CONTAINER_EMOJI_OPTIONS[0]);

  const cancel = () => {
    setAdding(false);
    setName("");
    setMl(250);
    setEmoji(CONTAINER_EMOJI_OPTIONS[0]);
  };

  if (!adding) {
    return (
      <PressableScale
        onPress={() => setAdding(true)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingVertical: 14,
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: t.border,
          borderStyle: "dashed",
        }}
      >
        <Plus size={16} color="#3B82F6" />
        <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: "#3B82F6" }}>Add container</Text>
      </PressableScale>
    );
  }

  const save = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim().slice(0, 16), ml, emoji });
    cancel();
  };

  return (
    <View style={{ borderRadius: 14, backgroundColor: t.surfaceElevated, padding: 14, opacity: pending ? 0.6 : 1 }}>
      <ContainerEditorFields
        name={name} setName={setName}
        ml={ml} setMl={setMl}
        emoji={emoji} setEmoji={setEmoji}
        displayUnit={displayUnit} t={t}
      />
      <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
        <PressableScale disabled={pending} onPress={cancel} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: t.border }}>
          <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: t.textSecondary }}>Cancel</Text>
        </PressableScale>
        <PressableScale disabled={pending} onPress={save} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", backgroundColor: "#3B82F6" }}>
          <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: "#fff" }}>Save</Text>
        </PressableScale>
      </View>
    </View>
  );
}

function ContainersSection({ displayUnit, t }) {
  const posthog = usePostHog();
  const { data: containersData } = useHydrationContainersQuery();
  const containers = containersData?.length ? containersData : FALLBACK_CONTAINERS;
  const [expandedId, setExpandedId] = useState(null);

  const addMutation = useAddHydrationContainerMutation();
  const updateMutation = useUpdateHydrationContainerMutation();
  const removeMutation = useRemoveHydrationContainerMutation();
  const setDefaultMutation = useSetDefaultHydrationContainerMutation();

  return (
    <View>
      <Text
        style={{
          fontFamily: fonts.semibold,
          fontSize: 11,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: t.textTertiary,
          marginBottom: 10,
        }}
      >
        Containers
      </Text>
      {containers.map((c) => (
        <ContainerRow
          key={c.id}
          container={c}
          displayUnit={displayUnit}
          isExpanded={expandedId === c.id}
          onToggleExpand={() => setExpandedId((id) => (id === c.id ? null : c.id))}
          onSetDefault={(id) => {
            setDefaultMutation.mutate(id, {
              onSuccess: () => posthog?.capture("hydration_container_default_changed", { ml: c.ml }),
            });
          }}
          onSave={(id, fields) => updateMutation.mutate({ id, fields })}
          onRemove={(id) => {
            removeMutation.mutate(id, { onSuccess: () => setExpandedId(null) });
          }}
          canRemove={containers.length > 1}
          pending={
            (setDefaultMutation.isPending && setDefaultMutation.variables === c.id) ||
            (updateMutation.isPending && updateMutation.variables?.id === c.id) ||
            (removeMutation.isPending && removeMutation.variables === c.id)
          }
          t={t}
        />
      ))}
      {containers.length < MAX_CONTAINERS && (
        <AddContainerRow
          displayUnit={displayUnit}
          t={t}
          pending={addMutation.isPending}
          onAdd={({ name, ml, emoji }) => {
            addMutation.mutate(
              { name, ml, emoji, sortOrder: containers.length },
              { onSuccess: () => posthog?.capture("hydration_container_added", { ml }) },
            );
          }}
        />
      )}
    </View>
  );
}

const REMINDER_OPTIONS = [
  { key: "off", label: "Off" },
  { key: "gentle", label: "Gentle" },
  { key: "regular", label: "Regular" },
];

// Dev-only spike harness (Step 10 prerequisite): fires a one-off 10s local
// notification carrying the full hydration category, so the actions can be
// tested foregrounded / backgrounded / killed, and mirrored to a paired
// Apple Watch, without waiting for a real scheduled slot.
function HydrationReminderDevTestButton({ t }) {
  const fireTestReminder = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Time for some water",
          body: "Dev test reminder — spike harness for Step 10 action taps.",
          data: { type: "hydration_reminder" },
          categoryIdentifier: HYDRATION_CATEGORY,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 10, repeats: false },
      });
    } catch (err) {
      console.error("[HydrationReminders] Failed to fire test reminder:", err);
    }
  };

  return (
    <PressableScale onPress={fireTestReminder} style={{ marginTop: 14, paddingVertical: 8, alignItems: "center" }}>
      <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: t.textTertiary }}>
        Dev: fire test reminder (10s)
      </Text>
    </PressableScale>
  );
}

// Opt-in hydration reminder cadence (Step 10). Mirrors DisplayUnitRow's exact
// segmented-control style; permission handling reuses the same
// request/settings-redirect pattern as the check-in toggle in profile.jsx —
// a denied/blocked permission never leaves the preference claiming to be on.
function RemindersSection({ t }) {
  const posthog = usePostHog();
  const { hydrationReminderFrequency, setHydrationReminderFrequency } = useHydrationStore();
  const [pending, setPending] = useState(false);

  const handleChange = async (nextFrequency) => {
    if (nextFrequency === hydrationReminderFrequency || pending) return;
    Haptics.selectionAsync();
    setPending(true);
    try {
      if (nextFrequency === "off") {
        setHydrationReminderFrequency("off");
        await cancelHydrationReminders();
        posthog?.capture("hydration_reminders_set", { frequency: "off" });
        return;
      }

      const { status } = await Notifications.getPermissionsAsync();
      if (status === "denied") {
        // iOS won't re-prompt after denial — send user to Settings, same as profile.jsx.
        Alert.alert(
          "Enable Notifications",
          "Notifications are blocked. Open Settings to turn them on for Hemo.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }
      if (status !== "granted") {
        const { status: newStatus } = await Notifications.requestPermissionsAsync({
          ios: { allowAlert: true, allowBadge: true, allowSound: true },
        });
        if (newStatus !== "granted") return;
      }

      setHydrationReminderFrequency(nextFrequency);
      await scheduleHydrationReminders(nextFrequency);
      posthog?.capture("hydration_reminders_set", { frequency: nextFrequency });
    } catch (err) {
      console.error("[HydrationReminders] Failed to update reminder frequency:", err);
    } finally {
      setPending(false);
    }
  };

  const sublabel =
    hydrationReminderFrequency !== "off"
      ? `Reminders at ${describeHydrationSchedule(hydrationReminderFrequency)}`
      : "Get gentle nudges to drink water during the day";

  return (
    <View style={{ opacity: pending ? 0.6 : 1 }}>
      <Text
        style={{
          fontFamily: fonts.semibold,
          fontSize: 11,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: t.textTertiary,
          marginBottom: 10,
        }}
      >
        Reminders
      </Text>
      <View style={{ flexDirection: "row", backgroundColor: t.surfaceElevated, borderRadius: 12, padding: 3 }}>
        {REMINDER_OPTIONS.map((opt) => {
          const active = hydrationReminderFrequency === opt.key;
          return (
            <Pressable
              key={opt.key}
              disabled={pending}
              onPress={() => handleChange(opt.key)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 9,
                alignItems: "center",
                backgroundColor: active ? "#3B82F6" : "transparent",
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: 13,
                  color: active ? "#fff" : t.textSecondary,
                }}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: t.textSecondary, marginTop: 8 }}>
        {sublabel}
      </Text>

      {__DEV__ && <HydrationReminderDevTestButton t={t} />}
    </View>
  );
}

function HydrationGoalBody({ value, onSliderChange, meta, onSave, insets }) {
  const t = useTheme();
  const { data: profile } = useProfileQuery();
  const locationEnabled = profile?.locationEnabled ?? false;
  const { weather } = useWeatherData(locationEnabled);
  const { displayUnit, setDisplayUnit } = useHydrationStore();

  const suggestion = useMemo(
    () => getHydrationSuggestion({ weightKg: profile?.weight ?? null, tempC: weather?.temp ?? null, baseGoalMl: value }),
    [profile?.weight, weather?.temp, value],
  );

  const { number, label } = bigValueParts(value, displayUnit);

  const snapToSuggestion = () => {
    if (value === suggestion.suggestedMl) return;
    Haptics.selectionAsync();
    onSliderChange(suggestion.suggestedMl);
  };

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
      {/* Hero: title */}
      <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={enterTiming} style={{ alignItems: "center", marginTop: 24, marginBottom: 20 }}>
        <Text style={{ fontFamily: fonts.bold, fontSize: 24, color: t.text, textAlign: "center", marginBottom: 6 }}>
          {meta.goalLabel}
        </Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: t.textSecondary, textAlign: "center", lineHeight: 20 }}>
          {meta.subtitle}
        </Text>
      </MotiView>

      {/* Big value + translation */}
      <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ ...enterTiming, delay: STAGGER_MS }} style={{ alignItems: "center", marginBottom: 18 }}>
        <Text style={{ fontFamily: fonts.bold, fontSize: 60, color: t.text, lineHeight: 66 }}>{number}</Text>
        <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: t.textSecondary, marginTop: 2, marginBottom: 8 }}>{label}</Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.textTertiary }}>{translationLine(value)}</Text>
      </MotiView>

      {/* Glass row */}
      <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ ...enterTiming, delay: STAGGER_MS * 2 }} style={{ marginBottom: 18 }}>
        <GlassRow goalMl={value} color="#3B82F6" t={t} />
      </MotiView>

      {/* Suggestion pill */}
      <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ ...enterTiming, delay: STAGGER_MS * 3 }} style={{ marginBottom: 24 }}>
        <SuggestionPill value={value} suggestedMl={suggestion.suggestedMl} t={t} />
      </MotiView>

      {/* Slider + suggested notch + suggested-for-you row */}
      <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ ...enterTiming, delay: STAGGER_MS * 4 }} style={{ alignItems: "center" }}>
        <Slider
          style={{ width: SLIDER_WIDTH, height: 40 }}
          minimumValue={meta.min}
          maximumValue={meta.max}
          step={meta.step}
          value={value}
          onValueChange={onSliderChange}
          minimumTrackTintColor="#3B82F6"
          maximumTrackTintColor={t.border}
          thumbTintColor="#3B82F6"
        />
        <SuggestedNotch min={meta.min} max={meta.max} suggestedMl={suggestion.suggestedMl} t={t} />

        <PressableScale onPress={snapToSuggestion} style={{ width: "100%", marginTop: 8 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              backgroundColor: t.surfaceElevated,
              borderRadius: 14,
              padding: 14,
            }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                borderWidth: 1.5,
                borderColor: value === suggestion.suggestedMl ? "#3B82F6" : t.border,
                backgroundColor: value === suggestion.suggestedMl ? "#3B82F6" : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {value === suggestion.suggestedMl && <Check size={13} color="#fff" strokeWidth={3} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: t.text, marginBottom: 2 }}>
                Suggested for you
              </Text>
              <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: t.textSecondary, lineHeight: 16 }}>
                {suggestion.explanation}
              </Text>
            </View>
          </View>
        </PressableScale>
      </MotiView>

      <SectionDivider t={t} />

      {/* Why it matters with SCD */}
      <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ ...enterTiming, delay: STAGGER_MS * 5 }}>
        <Text
          style={{
            fontFamily: fonts.semibold,
            fontSize: 11,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            color: t.textTertiary,
            marginBottom: 14,
          }}
        >
          Why It Matters With SCD
        </Text>
        {HYDRATION_BENEFITS.map((b, i) => {
          const Icon = b.icon;
          return (
            <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: i === HYDRATION_BENEFITS.length - 1 ? 0 : 14 }}>
              <View
                style={{
                  width: 32, height: 32, borderRadius: 16,
                  backgroundColor: colors.burgundyTint,
                  alignItems: "center", justifyContent: "center",
                }}
              >
                <Icon size={16} color={colors.burgundy} strokeWidth={1.8} />
              </View>
              <Text style={{ flex: 1, fontFamily: fonts.regular, fontSize: 14, color: t.text, lineHeight: 20, paddingTop: 6 }}>
                {b.text}
              </Text>
            </View>
          );
        })}
      </MotiView>

      <SectionDivider t={t} />

      {/* Display unit */}
      <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ ...enterTiming, delay: STAGGER_MS * 6 }}>
        <DisplayUnitRow displayUnit={displayUnit} onChange={setDisplayUnit} t={t} />
      </MotiView>

      <SectionDivider t={t} />

      {/* Containers (Step 9) */}
      <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ ...enterTiming, delay: STAGGER_MS * 7 }}>
        <ContainersSection displayUnit={displayUnit} t={t} />
      </MotiView>

      <SectionDivider t={t} />

      {/* Reminders (Step 10) */}
      <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ ...enterTiming, delay: STAGGER_MS * 8 }}>
        <RemindersSection t={t} />
      </MotiView>

      {/* Footnote */}
      <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.textSecondary, lineHeight: 19, textAlign: "center", marginTop: 24, marginBottom: 20 }}>
        Your needs rise with body size and hot weather — all drinks count. Your base goal
        stays fixed; the app suggests extras on hot days instead of moving it.
      </Text>

      {/* Save */}
      <PressableScale onPress={onSave} style={{ backgroundColor: "#3B82F6", borderRadius: 16, paddingVertical: 17, alignItems: "center" }}>
        <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: "#fff" }}>Done</Text>
      </PressableScale>
    </ScrollView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MetricGoalScreen() {
  const posthog = usePostHog();
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { metric } = useLocalSearchParams();
  const { data: metricGoals } = useMetricGoalsQuery();
  const setGoalMutation = useSetGoalMutation();

  const meta = GOAL_META[metric];
  const defaultValue = metric === "hydration" ? DEFAULT_SUGGESTED_ML : (meta?.recommended?.min ?? meta?.min ?? 8);
  const [value, setValue] = useState(defaultValue);
  const initialized = useRef(false);
  const lastHapticValue = useRef(null);

  useEffect(() => {
    if (metricGoals && !initialized.current) {
      initialized.current = true;
      setValue(metricGoals[metric] ?? defaultValue);
    }
  }, [metricGoals]);

  if (!meta) {
    router.back();
    return null;
  }

  const handleSliderChange = (v) => {
    // Fire haptic only when the rounded step value actually changes
    const rounded = Math.round(v / meta.step) * meta.step;
    if (lastHapticValue.current !== rounded) {
      lastHapticValue.current = rounded;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setValue(v);
  };

  const handleSave = () => {
    setGoalMutation.mutate(
      { metric, value },
      {
        onSuccess: () => {
          posthog?.capture('metric_goal_set', { metric_name: metric, goal_value: bucketGoalValue(metric, value) });
          router.back();
        },
      },
    );
  };

  const IconComp = meta.icon;

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      {/* Handle bar */}
      <View style={{ alignItems: "center", paddingTop: 12 }}>
        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: t.border }} />
      </View>

      {/* Close button */}
      <View style={{ position: "absolute", top: 20, right: 20, zIndex: 10 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 34, height: 34, borderRadius: 17,
            backgroundColor: t.surfaceElevated,
            alignItems: "center", justifyContent: "center",
          }}
        >
          <X size={17} color={t.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {metric === "hydration" ? (
        <HydrationGoalBody value={value} onSliderChange={handleSliderChange} meta={meta} onSave={handleSave} insets={insets} />
      ) : (
        <GenericGoalBody
          value={value}
          meta={meta}
          metric={metric}
          onSliderChange={handleSliderChange}
          onSave={handleSave}
          insets={insets}
          t={t}
        />
      )}
    </View>
  );
}

function GenericGoalBody({ value, meta, metric, onSliderChange, onSave, insets, t }) {
  const isBelowRecommended = value < meta.recommended.min;

  let displayValue;
  if (metric === "steps") {
    displayValue = value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);
  } else if (metric === "sleep") {
    displayValue = Number.isInteger(value) ? `${value}h` : `${Math.floor(value)}h ${Math.round((value % 1) * 60)}m`;
  } else {
    displayValue = String(value);
  }

  const IconComp = meta.icon;

  return (
    <View style={{ flex: 1, paddingHorizontal: 24, paddingBottom: insets.bottom + 16 }}>
      {/* Icon section */}
      <View style={{ alignItems: "center", marginTop: 24, marginBottom: 16 }}>
        <MetricIcon icon={IconComp} color={meta.color} />
      </View>

      {/* Header */}
      <Text style={{
        fontFamily: fonts.bold,
        fontSize: 26,
        color: t.text,
        textAlign: "center",
        marginBottom: 8,
      }}>
        {meta.goalLabel}
      </Text>
      <Text style={{
        fontFamily: fonts.regular,
        fontSize: 14,
        color: t.textSecondary,
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 32,
      }}>
        {meta.subtitle}
      </Text>

      {/* Large value display */}
      <View style={{ alignItems: "center", marginBottom: 28 }}>
        <Text style={{
          fontFamily: fonts.bold,
          fontSize: 64,
          color: t.text,
          lineHeight: 70,
        }}>
          {displayValue}
        </Text>
        {metric === "steps" && (
          <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: t.textSecondary, marginTop: 2 }}>
            steps per day
          </Text>
        )}
      </View>

      {/* Goal setter */}
      <View style={{ alignItems: "center", marginBottom: 8 }}>
        <Slider
          style={{ width: SLIDER_WIDTH, height: 40 }}
          minimumValue={meta.min}
          maximumValue={meta.max}
          step={meta.step}
          value={value}
          onValueChange={onSliderChange}
          minimumTrackTintColor={isBelowRecommended ? "#F59E0B" : meta.color}
          maximumTrackTintColor={t.border}
          thumbTintColor={isBelowRecommended ? "#F59E0B" : meta.color}
        />
        <RangeBar
          min={meta.min}
          max={meta.max}
          recMin={meta.recommended.min}
          recMax={meta.recommended.max}
          color={meta.color}
        />
        <Text style={{
          fontFamily: fonts.semibold,
          fontSize: 10,
          color: t.textSecondary,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          textAlign: "center",
          marginTop: 10,
        }}>
          {meta.recommendedLabel}
        </Text>
        {isBelowRecommended && (
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: t.isDark ? "rgba(245,158,11,0.12)" : "#FFFBEB",
            borderWidth: 1,
            borderColor: t.isDark ? "rgba(245,158,11,0.3)" : "#FDE68A",
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 8,
            marginTop: 12,
            width: "100%",
          }}>
            <TriangleAlert size={14} color="#D97706" strokeWidth={2} />
            <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "#92400E", flex: 1, lineHeight: 17 }}>
              This is below the recommended {meta.recommended.min}{meta.unit} minimum. You can still save this goal.
            </Text>
          </View>
        )}
      </View>

      {/* Tip paragraph */}
      <View style={{ flex: 1, justifyContent: "flex-end", paddingTop: 16 }}>
        <Text style={{
          fontFamily: fonts.regular,
          fontSize: 13,
          color: t.textSecondary,
          lineHeight: 20,
          textAlign: "center",
          marginBottom: 20,
        }}>
          {meta.tip}
        </Text>

        {/* Save button */}
        <TouchableOpacity
          onPress={onSave}
          style={{
            backgroundColor: meta.color,
            borderRadius: 16,
            paddingVertical: 17,
            alignItems: "center",
          }}
        >
          <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: "#fff" }}>
            Done
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
