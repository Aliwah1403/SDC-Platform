import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import {
  requestAuthorization,
  isHealthDataAvailable,
  getRequestStatusForAuthorization,
  queryStatisticsCollectionForQuantity,
  queryCategorySamples,
  queryWorkoutSamples,
  saveQuantitySample,
  saveCategorySample,
  enableBackgroundDelivery,
  subscribeToChanges,
  getMostRecentQuantitySample,
} from "@kingstinct/react-native-healthkit";
import {
  CategoryValueSeverity,
  CategoryValueSleepAnalysis,
  CategoryValue,
  UpdateFrequency,
  AuthorizationRequestStatus,
} from "@kingstinct/react-native-healthkit";
import { supabase } from "@/utils/auth/supabase";

// ─── Identifier constants ─────────────────────────────────────────────────────

const QT = {
  STEPS: "HKQuantityTypeIdentifierStepCount",
  RESTING_HR: "HKQuantityTypeIdentifierRestingHeartRate",
  HEART_RATE: "HKQuantityTypeIdentifierHeartRate",
  SPO2: "HKQuantityTypeIdentifierOxygenSaturation",
  TEMPERATURE: "HKQuantityTypeIdentifierBodyTemperature",
  RESP_RATE: "HKQuantityTypeIdentifierRespiratoryRate",
  WATER: "HKQuantityTypeIdentifierDietaryWater",
};

const CT = {
  SLEEP: "HKCategoryTypeIdentifierSleepAnalysis",
  MINDFUL: "HKCategoryTypeIdentifierMindfulSession",
  FATIGUE: "HKCategoryTypeIdentifierFatigue",
  SHORTNESS_OF_BREATH: "HKCategoryTypeIdentifierShortnessOfBreath",
  DIZZINESS: "HKCategoryTypeIdentifierDizziness",
  HEADACHE: "HKCategoryTypeIdentifierHeadache",
  NAUSEA: "HKCategoryTypeIdentifierNausea",
  FEVER: "HKCategoryTypeIdentifierFever",
  CHEST_TIGHTNESS: "HKCategoryTypeIdentifierChestTightnessOrPain",
};

const WORKOUT_TYPE = "HKWorkoutTypeIdentifier";

const READ_TYPES = [
  QT.STEPS, QT.RESTING_HR, QT.HEART_RATE,
  QT.SPO2, QT.TEMPERATURE, QT.RESP_RATE,
  CT.SLEEP, WORKOUT_TYPE,
];

const WRITE_TYPES = [
  QT.WATER,
  CT.MINDFUL,
  CT.FATIGUE, CT.SHORTNESS_OF_BREATH, CT.DIZZINESS,
  CT.HEADACHE, CT.NAUSEA, CT.FEVER, CT.CHEST_TIGHTNESS,
];

// Maps Hemo symptom labels → HealthKit category identifiers
const SYMPTOM_TO_HK = {
  "Fatigue": CT.FATIGUE,
  "Shortness of breath": CT.SHORTNESS_OF_BREATH,
  "Dizziness": CT.DIZZINESS,
  "Headache": CT.HEADACHE,
  "Nausea": CT.NAUSEA,
  "Fever": CT.FEVER,
  "Chest tightness": CT.CHEST_TIGHTNESS,
};

// Sleep values considered "asleep" (not awake or in-bed)
const ASLEEP_VALUES = new Set([
  CategoryValueSleepAnalysis.asleepUnspecified,
  CategoryValueSleepAnalysis.asleepCore,
  CategoryValueSleepAnalysis.asleepDeep,
  CategoryValueSleepAnalysis.asleepREM,
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfDay(d) {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function endOfDay(d) {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

// SpO2 from HealthKit can be fraction (0.97) or percent (97.0) depending on
// how the Apple Watch wrote it. Normalise to 0-100 display percentage.
function normaliseSpO2(raw) {
  if (raw == null) return null;
  return raw <= 1 ? Math.round(raw * 1000) / 10 : Math.round(raw * 10) / 10;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function isHKAvailable() {
  if (Platform.OS !== "ios") return false;
  try { return isHealthDataAvailable(); } catch { return false; }
}

// Check if HealthKit permissions have already been granted in a previous session.
// Uses iOS's own authorization status — no local storage needed.
// AuthorizationRequestStatus.unnecessary (2) means permissions were already requested.
export async function checkExistingHKAuthorization() {
  if (!isHKAvailable()) return false;
  try {
    const status = await getRequestStatusForAuthorization({
      toRead: READ_TYPES,
      toShare: WRITE_TYPES,
    });
    return status === AuthorizationRequestStatus.unnecessary;
  } catch {
    return false;
  }
}

// Request HealthKit read + write authorisation.
// Returns true if user granted (note: iOS does not reveal denials — true just
// means the sheet was shown without a system error).
export async function requestHKAuthorization() {
  if (!isHKAvailable()) return false;
  try {
    return await requestAuthorization({ toRead: READ_TYPES, toShare: WRITE_TYPES });
  } catch (e) {
    console.error("[HK] auth error", e);
    return false;
  }
}

// Fetch all HealthKit metrics for the last `daysBack` days.
// Returns { "YYYY-MM-DD": { steps, heartRate, sleepHours, spO2, temperature, respiratoryRate } }
export async function fetchHealthKitRange(daysBack = 30, prefs = {}) {
  if (!isHKAvailable()) return {};

  const p = { readSteps: true, readHeartRate: true, readSpO2: true,
               readTemperature: true, readRespiratoryRate: true, readSleep: true, ...prefs };

  const today = new Date();
  const from = startOfDay(new Date(today.getTime() - daysBack * 86400000));
  const to = endOfDay(today);
  const anchorDate = from;
  const interval = { day: 1 };
  const result = {};

  const merge = (key, data) => {
    result[key] = { ...(result[key] ?? {}), ...data };
  };

  if (p.readSteps) {
    try {
      const col = await queryStatisticsCollectionForQuantity(
        QT.STEPS, ["cumulativeSum"], anchorDate, interval, { from, to, unit: "count" }
      );
      for (const item of col) {
        if (item.sumQuantity?.quantity != null && item.startDate)
          merge(dateStr(item.startDate), { steps: Math.round(item.sumQuantity.quantity) });
      }
    } catch {}
  }

  if (p.readHeartRate) {
    // Prefer RestingHeartRate (Watch-computed, most clinically relevant for SCD).
    // Fall back to daily average HeartRate for any dates where resting HR is missing
    // — covers iPhone-only users and days before Apple Watch computes the nightly value.
    const datesWithRestingHR = new Set();
    try {
      const col = await queryStatisticsCollectionForQuantity(
        QT.RESTING_HR, ["discreteAverage"], anchorDate, interval, { from, to, unit: "count/min" }
      );
      for (const item of col) {
        if (item.averageQuantity?.quantity != null && item.startDate) {
          const key = dateStr(item.startDate);
          merge(key, { heartRate: Math.round(item.averageQuantity.quantity) });
          datesWithRestingHR.add(key);
        }
      }
    } catch {}
    try {
      const col = await queryStatisticsCollectionForQuantity(
        QT.HEART_RATE, ["discreteAverage"], anchorDate, interval, { from, to, unit: "count/min" }
      );
      for (const item of col) {
        if (item.averageQuantity?.quantity != null && item.startDate) {
          const key = dateStr(item.startDate);
          if (!datesWithRestingHR.has(key))
            merge(key, { heartRate: Math.round(item.averageQuantity.quantity) });
        }
      }
    } catch {}
  }

  if (p.readSpO2) {
    try {
      const col = await queryStatisticsCollectionForQuantity(
        QT.SPO2, ["discreteAverage"], anchorDate, interval, { from, to, unit: "%" }
      );
      for (const item of col) {
        const raw = item.averageQuantity?.quantity;
        if (raw != null && item.startDate)
          merge(dateStr(item.startDate), { spO2: normaliseSpO2(raw) });
      }
    } catch {}
  }

  if (p.readTemperature) {
    try {
      const col = await queryStatisticsCollectionForQuantity(
        QT.TEMPERATURE, ["discreteAverage"], anchorDate, interval, { from, to, unit: "degC" }
      );
      for (const item of col) {
        if (item.averageQuantity?.quantity != null && item.startDate)
          merge(dateStr(item.startDate), { temperature: Math.round(item.averageQuantity.quantity * 10) / 10 });
      }
    } catch {}
  }

  if (p.readRespiratoryRate) {
    try {
      const col = await queryStatisticsCollectionForQuantity(
        QT.RESP_RATE, ["discreteAverage"], anchorDate, interval, { from, to, unit: "count/min" }
      );
      for (const item of col) {
        if (item.averageQuantity?.quantity != null && item.startDate)
          merge(dateStr(item.startDate), { respiratoryRate: Math.round(item.averageQuantity.quantity * 10) / 10 });
      }
    } catch {}
  }

  if (p.readSleep) {
    try {
      // Extend the lower bound by 1 day so overnight sessions that start just
      // before the range window (e.g. sleep beginning 11 PM on day -31) are included.
      const sleepFrom = new Date(from.getTime() - 86400000);
      const samples = await queryCategorySamples(CT.SLEEP, {
        filter: { date: { startDate: sleepFrom, endDate: to } },
        limit: -1,
        ascending: true,
      });
      const sleepByDate = {};
      for (const s of samples) {
        if (!ASLEEP_VALUES.has(s.value)) continue;
        // Attribute sleep to the wake-up date (endDate) — matches Apple Health's
        // convention. A session starting 11 PM Tue / ending 7 AM Wed belongs to Wed.
        const key = dateStr(s.endDate);
        const hours = (new Date(s.endDate) - new Date(s.startDate)) / 3600000;
        sleepByDate[key] = (sleepByDate[key] ?? 0) + hours;
      }
      for (const [key, hours] of Object.entries(sleepByDate)) {
        merge(key, { sleepHours: Math.round(hours * 10) / 10 });
      }
    } catch {}
  }

  return result;
}

// Write a completed symptom log entry back to Apple Health.
// Called after a successful Supabase save so HealthKit always mirrors real data.
export async function writeDailyLog({ hydration = 0, symptoms = [], mood, painLevel = 0, prefs = {} }) {
  if (!isHKAvailable()) return;

  const p = { writeHydration: true, writeSymptoms: true, writeMood: true, ...prefs };

  const now = new Date();
  const start = new Date(now.getTime() - 60000); // 1 min duration

  if (p.writeHydration && hydration > 0) {
    try {
      await saveQuantitySample(QT.WATER, "mL", hydration * 237, start, now);
    } catch {}
  }

  if (p.writeSymptoms && symptoms.length > 0) {
    const severity =
      painLevel <= 3 ? CategoryValueSeverity.mild
      : painLevel <= 6 ? CategoryValueSeverity.moderate
      : CategoryValueSeverity.severe;

    for (const symptom of symptoms) {
      const identifier = SYMPTOM_TO_HK[symptom];
      if (identifier) {
        try {
          await saveCategorySample(identifier, severity, start, now);
        } catch {}
      }
    }
  }

  if (p.writeMood && mood) {
    try {
      await saveCategorySample(CT.MINDFUL, CategoryValue.notApplicable, start, now);
    } catch {}
  }
}

// ─── Workout fetch ────────────────────────────────────────────────────────────
// Returns real workout sessions for a given date, normalised for the UI.
// Each item: { id, activityType, label, startDate, endDate, timeLabel,
//             durationMins, calories, distanceKm }

// Maps the most common WorkoutActivityType values to human-readable labels.
// Unmapped types fall back to "Workout".
const WORKOUT_LABELS = {
  13: "Cycling",
  14: "Dance",
  16: "Elliptical",
  20: "Strength Training",
  24: "Hiking",
  29: "Mind & Body",
  30: "Cardio Training",
  33: "Recovery",
  37: "Running",
  39: "Skating",
  44: "Stair Climbing",
  46: "Swimming",
  50: "Strength Training",
  52: "Walking",
  57: "Yoga",
  58: "Barre",
  59: "Core Training",
};

function fmtWorkoutTime(date) {
  const d = new Date(date);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const hh = h % 12 || 12;
  return `${hh}:${m} ${h < 12 ? "AM" : "PM"}`;
}

export async function fetchWorkoutsForDate(date) {
  if (!isHKAvailable()) return [];
  try {
    const samples = await queryWorkoutSamples({
      filter: { date: { startDate: startOfDay(date), endDate: endOfDay(date) } },
      limit: 20,
      ascending: true,
    });

    return samples.map((w) => {
      const activityType = w.workoutActivityType;
      const label = WORKOUT_LABELS[activityType] ?? "Workout";
      const durationMins = Math.round((w.duration?.quantity ?? 0) / 60);
      const calories = w.totalEnergyBurned?.quantity
        ? Math.round(w.totalEnergyBurned.quantity)
        : null;
      // totalDistance is in meters from HealthKit
      const distanceKm = w.totalDistance?.quantity
        ? Math.round(w.totalDistance.quantity / 100) / 10
        : null;

      return {
        id: w.uuid,
        activityType,
        label,
        startDate: w.startDate,
        endDate: w.endDate,
        timeLabel: `${fmtWorkoutTime(w.startDate)} – ${fmtWorkoutTime(w.endDate)}`,
        durationMins,
        calories,
        distanceKm,
      };
    });
  } catch {
    return [];
  }
}

// ─── 4-level alert engine ─────────────────────────────────────────────────────
// Combines HealthKit vitals with Hemo symptom logs and personal baselines.
//
// todayMetrics:   { steps, heartRate, sleepHours, spO2, temperature, respiratoryRate }
// recentSymptoms: string[] from the most recent symptom log (e.g. ["Fatigue", "Chest tightness"])
// baselines:      output of computeBaselines() — null fields mean insufficient data
//
// Returns: { level, triggers, acsRisk, vocRisk, message, callToAction }
// level:  "urgent" | "concern" | "watch" | "info" | null (all clear)
// triggers: [{ type, value, reason }]  — which signals fired

const RESPIRATORY_SYMPTOMS = new Set(["Shortness of breath", "Chest tightness", "Wheezing", "Coughing"]);

export function checkAlerts(todayMetrics = {}, recentSymptoms = [], baselines = {}) {
  const { steps, heartRate, sleepHours, spO2, temperature, respiratoryRate } = todayMetrics;

  const hasSymptom = (...names) => names.some((n) => recentSymptoms.includes(n));
  const triggers = [];

  // ── Collect individual signal firings ──────────────────────────────────────

  // SpO2
  const spO2Baseline = baselines.spO2?.avg7d;
  const spO2CritDrop = spO2 != null && spO2Baseline != null && (spO2Baseline - spO2) >= 3;
  if (spO2 != null) {
    if (spO2 < 92 || spO2CritDrop)
      triggers.push({ type: "spO2", value: spO2, reason: spO2CritDrop ? "3%+ below your baseline" : `${spO2}% — below safe range` });
    else if (spO2 < 94)
      triggers.push({ type: "spO2", value: spO2, reason: `${spO2}% — below your normal SCD range` });
  }

  // Temperature
  if (temperature != null) {
    if (temperature >= 38.0)
      triggers.push({ type: "temperature", value: temperature, reason: `${temperature}°C fever` });
    else if (temperature < 36.0)
      triggers.push({ type: "temperature", value: temperature, reason: `${temperature}°C — low, cold triggers sickling` });
  }

  // Respiratory rate
  if (respiratoryRate != null) {
    if (respiratoryRate > 25)
      triggers.push({ type: "respiratoryRate", value: respiratoryRate, reason: `${respiratoryRate}/min — very elevated` });
    else if (respiratoryRate > 20)
      triggers.push({ type: "respiratoryRate", value: respiratoryRate, reason: `${respiratoryRate}/min — above normal` });
  }

  // Heart rate
  const hrBaseline = baselines.heartRate?.avg7d;
  const hrAboveBaseline = heartRate != null && hrBaseline != null && heartRate > hrBaseline * 1.15;
  if (heartRate != null) {
    if (heartRate > 120 || heartRate < 50)
      triggers.push({ type: "heartRate", value: heartRate, reason: heartRate > 120 ? `${heartRate} bpm — critically elevated` : `${heartRate} bpm — critically low` });
    else if (heartRate > 110 || hrAboveBaseline)
      triggers.push({ type: "heartRate", value: heartRate, reason: hrAboveBaseline ? "elevated above your baseline" : `${heartRate} bpm — elevated` });
  }

  // Steps
  const stepsBaseline = baselines.steps?.avg14d;
  if (steps != null) {
    if (steps < 1500)
      triggers.push({ type: "steps", value: steps, reason: `${steps.toLocaleString()} steps — very low` });
    else if (stepsBaseline != null && steps < stepsBaseline * 0.4)
      triggers.push({ type: "steps", value: steps, reason: `down ${Math.round((1 - steps / stepsBaseline) * 100)}% from your usual` });
  }

  // Sleep
  const sleepBaseline = baselines.sleepHours?.avg7d;
  if (sleepHours != null) {
    if (sleepHours < 6 || (sleepBaseline != null && sleepHours < sleepBaseline * 0.7))
      triggers.push({ type: "sleep", value: sleepHours, reason: `${sleepHours}h — below your usual` });
    else if (sleepHours > 10)
      triggers.push({ type: "sleep", value: sleepHours, reason: `${sleepHours}h — unusually long, may signal fatigue` });
  }

  // Symptoms as minor signals
  if (hasSymptom("Fatigue"))            triggers.push({ type: "symptom", value: null, reason: "fatigue logged" });
  if (hasSymptom("Dizziness"))          triggers.push({ type: "symptom", value: null, reason: "dizziness logged" });
  if (hasSymptom("Nausea"))             triggers.push({ type: "symptom", value: null, reason: "nausea logged" });
  if (hasSymptom("Shortness of breath")) triggers.push({ type: "symptom", value: null, reason: "shortness of breath logged" });
  if (hasSymptom("Chest tightness"))    triggers.push({ type: "symptom", value: null, reason: "chest tightness logged" });
  if (hasSymptom("Fever"))              triggers.push({ type: "symptom", value: null, reason: "fever logged" });

  // ── Crisis detection ────────────────────────────────────────────────────────

  const acsRisk =
    (spO2 != null && (spO2 < 92 || spO2CritDrop)) ||
    (respiratoryRate != null && respiratoryRate > 25) ||
    (temperature != null && temperature >= 38.0) ||
    (hasSymptom("Chest tightness", "Shortness of breath") &&
      ((spO2 != null && spO2 < 94) || (respiratoryRate != null && respiratoryRate > 20)));

  const vocRisk =
    hrAboveBaseline &&
    stepsBaseline != null && steps != null && steps < stepsBaseline * 0.4 &&
    (sleepHours == null || sleepHours < 6 || hasSymptom("Fatigue")) &&
    (hasSymptom("Fatigue") || (todayMetrics.hydration != null && todayMetrics.hydration < 5));

  // ── Level resolution ────────────────────────────────────────────────────────

  // URGENT: any single crisis-level reading, or ACS risk
  const hasUrgentTrigger =
    acsRisk ||
    (spO2 != null && (spO2 < 92 || spO2CritDrop)) ||
    (temperature != null && temperature >= 38.0) ||
    (respiratoryRate != null && respiratoryRate > 25) ||
    (heartRate != null && (heartRate > 120 || heartRate < 50));

  // CONCERN: 3+ signals, or VOC risk
  const majorSignalCount = triggers.filter((t) => t.type !== "symptom").length;
  const totalSignalCount = triggers.length;
  const hasConcern = vocRisk || totalSignalCount >= 3 || (majorSignalCount >= 2 && hasSymptom("Fatigue", "Dizziness", "Nausea"));

  // WATCH: 1 major metric or 2 minor
  const hasWatch = triggers.filter((t) => ["spO2", "respiratoryRate", "heartRate", "temperature"].includes(t.type)).length >= 1
    || totalSignalCount >= 2;

  // INFO: any single drift
  const hasInfo = triggers.length >= 1;

  let level = null;
  if (hasUrgentTrigger) level = "urgent";
  else if (hasConcern)  level = "concern";
  else if (hasWatch)    level = "watch";
  else if (hasInfo)     level = "info";

  if (!level) return null;

  // ── Safe copy per level ─────────────────────────────────────────────────────

  const COPY = {
    urgent: {
      message:      acsRisk
        ? "Your readings are outside a safe range. This pattern can be serious — use Emergency or contact your care team now."
        : "One or more of your readings has shifted significantly from your usual pattern. Contact your care team.",
      callToAction: "Open Emergency",
    },
    concern: {
      message:      vocRisk
        ? "Several things have shifted at once — activity, heart rate, sleep, and how you're feeling. This pattern sometimes comes before a pain flare."
        : "Combined with your symptoms, this pattern is worth checking in on. How are you feeling?",
      callToAction: "Log symptoms",
    },
    watch: {
      message:      "One or more readings have moved from your usual pattern. This may be worth watching.",
      callToAction: "Check in",
    },
    info: {
      message:      `Your ${triggers[0]?.reason ?? "reading"} is different from your usual.`,
      callToAction: null,
    },
  };

  return {
    level,
    triggers,
    acsRisk,
    vocRisk,
    ...COPY[level],
  };
}

// ─── Background delivery ──────────────────────────────────────────────────────
// `onNewData(dateKey, metrics)` — caller should call store.mergeHealthKitDay
// Critical alerts fire push notifications immediately.
//
// Alert deduplication: alerts fire only when crossing INTO the danger zone
// (previous reading was safe or unknown) or when the 4-hour cooldown has expired.
// State is persisted in AsyncStorage so it survives app restarts.

const ALERT_COOLDOWN_MS = 4 * 60 * 60 * 1000;
const ALERT_STATE_KEY = "hk_alert_state";

function isInDangerZone(metricKey, value) {
  if (value == null) return false;
  if (metricKey === "spO2") return value < 92;
  if (metricKey === "temperature") return value >= 38.0;
  if (metricKey === "heartRate") return value > 120 || value < 50;
  return false;
}

async function loadAlertState() {
  try {
    const raw = await AsyncStorage.getItem(ALERT_STATE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveAlertState(state) {
  try {
    await AsyncStorage.setItem(ALERT_STATE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("[HealthKit] Failed to save alert state:", err);
  }
}

export async function setupBackgroundDelivery(onNewData, prefs = {}) {
  if (!isHKAvailable()) return;

  const p = { readSpO2: true, readTemperature: true, readHeartRate: true, ...prefs };

  const watchTypes = [
    p.readSpO2        && QT.SPO2,
    p.readTemperature && QT.TEMPERATURE,
    p.readHeartRate   && QT.RESTING_HR,
  ].filter(Boolean);

  for (const type of watchTypes) {
    try {
      await enableBackgroundDelivery(type, UpdateFrequency.immediate);

      subscribeToChanges(type, async () => {
        try {
          const sample = await getMostRecentQuantitySample(type);
          if (!sample) return;

          const key = dateStr(new Date(sample.startDate ?? Date.now()));
          let value = sample.quantity.quantity;

          if (type === QT.SPO2) value = normaliseSpO2(value);
          else if (type === QT.TEMPERATURE) value = Math.round(value * 10) / 10;
          else value = Math.round(value);

          const metricKey =
            type === QT.RESTING_HR ? "heartRate"
            : type === QT.SPO2 ? "spO2"
            : "temperature";

          onNewData(key, { [metricKey]: value });

          // Background delivery has no baseline/symptom context — check URGENT thresholds only.
          // Only alert when crossing INTO the danger zone or after the 4-hour cooldown expires.
          const inDanger = isInDangerZone(metricKey, value);
          const urgentMsg = !inDanger ? null
            : metricKey === "spO2"
              ? `Blood oxygen at ${value}% — outside a safe range. Contact your care team now.`
            : metricKey === "temperature"
              ? `Temperature ${value}°C — fever in SCD is urgent. Seek care immediately.`
            : `Heart rate ${value} bpm has shifted significantly. Contact your care team.`;

          // Always track the last seen value so re-entry detection works after recovery
          if (!inDanger && value != null) {
            const alertState = await loadAlertState();
            const prev = alertState[metricKey] ?? {};
            await saveAlertState({ ...alertState, [metricKey]: { ...prev, lastValue: value } });
          }

          if (urgentMsg) {
            const alertState = await loadAlertState();
            const prev = alertState[metricKey] ?? {};
            const prevInDanger = isInDangerZone(metricKey, prev.lastValue ?? null);
            const cooldownExpired = !prev.lastAlertAt || (Date.now() - prev.lastAlertAt) >= ALERT_COOLDOWN_MS;
            const isCrossing = !prevInDanger;

            if (!isCrossing && !cooldownExpired) {
              // Already in danger zone and within cooldown — skip
              await saveAlertState({ ...alertState, [metricKey]: { ...prev, lastValue: value } });
            } else {
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: "Health Alert",
                  body: urgentMsg,
                  data: { screen: "metric-detail", metric: metricKey },
                },
                trigger: null,
              });

              await saveAlertState({
                ...alertState,
                [metricKey]: { lastAlertAt: Date.now(), lastValue: value },
              });

              // Write to system_notifications so the alert appears in the unified feed
              try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  const { error: insertError } = await supabase.from("system_notifications").insert({
                    user_id: user.id,
                    type: "health_alert",
                    title: "Health Alert",
                    body: urgentMsg,
                    data: { screen: "metric-detail", metric: metricKey },
                  });
                  if (insertError) {
                    console.error("[HealthKit] system_notifications insert failed:", {
                      error: insertError,
                      userId: user.id,
                      type: "health_alert",
                      metricKey,
                      urgentMsg,
                    });
                  }
                }
              } catch (err) {
                console.error("[HealthKit] system_notifications insert failed:", err);
              }
            }
          }
        } catch {}
      });
    } catch {}
  }
}
