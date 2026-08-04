import { Platform, AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import {
  initialize,
  requestPermission,
  getGrantedPermissions,
  readRecords,
  insertRecords,
  openHealthConnectSettings,
  getSdkStatus,
  SdkAvailabilityStatus,
} from "react-native-health-connect";
import { supabase } from "@/utils/auth/supabase";
import { checkAlerts } from "./healthKitService";

// Re-export the shared alert engine so healthService.js can use either service interchangeably
export { checkAlerts };

// ─── Permission lists ────────────────────────────────────────────────────────

const READ_PERMISSIONS = [
  { accessType: "read", recordType: "Steps" },
  { accessType: "read", recordType: "HeartRate" },
  { accessType: "read", recordType: "RestingHeartRate" },
  { accessType: "read", recordType: "OxygenSaturation" },
  { accessType: "read", recordType: "BodyTemperature" },
  { accessType: "read", recordType: "RespiratoryRate" },
  { accessType: "read", recordType: "SleepSession" },
  { accessType: "read", recordType: "ExerciseSession" },
];

const WRITE_PERMISSIONS = [
  { accessType: "write", recordType: "Hydration" },
  { accessType: "write", recordType: "Height" },
  { accessType: "write", recordType: "Weight" },
];

// Special Health Connect permissions. Requested but never required for the
// "connected" check — the user can decline them and sync still works:
//   ReadHealthDataHistory      — read data older than 30 days before first grant
//   BackgroundAccessPermission — read while the app is in the background
// Note: the request result does not echo ReadHealthDataHistory back even when
// granted (library quirk), so these must stay out of any granted-set check.
const SPECIAL_PERMISSIONS = [
  { accessType: "read", recordType: "ReadHealthDataHistory" },
  { accessType: "read", recordType: "BackgroundAccessPermission" },
];

// Sleep stage values considered "asleep" (excludes AWAKE=1, AWAKE_IN_BED=5)
const ASLEEP_STAGES = new Set([2, 3, 4, 6]); // LIGHT, DEEP, REM, SLEEPING

// Maps Health Connect sleep stage values to the 4 hypnogram buckets used by MetricChart
const SLEEP_STAGE_BUCKET = { 1: "awake", 5: "awake", 2: "core", 6: "core", 3: "deep", 4: "rem" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dateStr(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function isoDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d;
}

// Native requestPermission resolves only when Health Connect's permission
// screen returns. If the native side ever fails to settle the promise (e.g.
// the MainActivity permission delegate wasn't registered, so the launcher
// throws inside an unguarded coroutine), the JS await would hang forever and
// the connect button would spin indefinitely. This bounds any single native
// call so the UI can always recover and report the failure.
function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// ─── Public API ───────────────────────────────────────────────────────────────

// Mirrors isHKAvailable — returns false on iOS (HealthKit handles that side)
export function isHKAvailable() {
  return Platform.OS === "android";
}

// Health Connect availability on this device. Unlike HealthKit (which is built
// into every iPhone), Health Connect is a separate app on Android 13 and below,
// and can be present-but-outdated on any version. Returns:
//   "available"        — SDK present and usable
//   "update_required"  — provider app installed but too old, must be updated
//   "not_installed"    — provider app missing, must be installed from the Play Store
//   "unsupported"      — not Android (iOS uses HealthKit)
export async function getHealthConnectStatus() {
  if (Platform.OS !== "android") return "unsupported";
  try {
    const status = await getSdkStatus();
    if (status === SdkAvailabilityStatus.SDK_AVAILABLE) return "available";
    if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED)
      return "update_required";
    return "not_installed";
  } catch (e) {
    console.error("[HC] getSdkStatus threw:", e?.message ?? e);
    return "not_installed";
  }
}

// Re-export so callers can open Health Connect settings (e.g. to let the user
// grant a permission they previously denied — HC never re-prompts).
export { openHealthConnectSettings };

let _initialized = false;

async function ensureInitialized() {
  if (_initialized) return true;
  // Bail out early with a clean signal if the provider isn't available, so we
  // never hit HealthConnectClient.getOrCreate() (which throws) on a device
  // without a usable Health Connect install.
  const status = await getHealthConnectStatus();
  if (status !== "available") {
    return false;
  }
  try {
    const result = await initialize();
    _initialized = result;
    return result;
  } catch (e) {
    console.error("[HC] initialize() threw:", e?.message ?? e);
    return false;
  }
}

// Check if Health Connect permissions have been granted in a previous session.
// We consider it connected if all read permissions are granted.
export async function checkExistingHKAuthorization() {
  if (Platform.OS !== "android") return false;
  try {
    const ok = await ensureInitialized();
    if (!ok) return false;
    const granted = await getGrantedPermissions();
    const grantedSet = new Set(granted.map((p) => `${p.accessType}:${p.recordType}`));
    return READ_PERMISSIONS.every((p) => grantedSet.has(`${p.accessType}:${p.recordType}`));
  } catch {
    return false;
  }
}

// Request Health Connect read + write permissions.
// Returns true if all read permissions were granted, false if the user denied.
// Throws if Health Connect is unavailable or the native request never settles —
// callers should surface that to the user rather than spin forever.
export async function requestHKAuthorization() {
  if (Platform.OS !== "android") return false;
  const ok = await ensureInitialized();
  if (!ok) throw new Error("Health Connect is not available on this device.");
  // 90s is generous for a user reading and tapping through the permission
  // screen, but still guarantees the promise settles if the native side hangs.
  let result;
  try {
    result = await withTimeout(
      requestPermission([...READ_PERMISSIONS, ...WRITE_PERMISSIONS, ...SPECIAL_PERMISSIONS]),
      90000,
      "Health Connect permission request",
    );
  } catch (e) {
    console.error("[HC] requestPermission threw:", e?.message ?? e);
    throw e;
  }
  const grantedSet = new Set(result.map((p) => `${p.accessType}:${p.recordType}`));
  return READ_PERMISSIONS.every((p) => grantedSet.has(`${p.accessType}:${p.recordType}`));
}

// Fetch all Health Connect metrics for the last `daysBack` days.
// Returns { "YYYY-MM-DD": { steps, heartRate, sleepHours, spO2, temperature, respiratoryRate } }
export async function fetchHealthKitRange(daysBack = 30, prefs = {}) {
  if (Platform.OS !== "android") return {};

  const ok = await ensureInitialized();
  if (!ok) return {};

  const p = {
    readSteps: true, readHeartRate: true, readSpO2: true,
    readTemperature: true, readRespiratoryRate: true, readSleep: true, ...prefs,
  };

  const today = new Date();
  const from = isoDate(-daysBack);
  const timeRangeFilter = {
    operator: "between",
    startTime: startOfDay(from),
    endTime: endOfDay(today),
  };

  const result = {};
  const merge = (key, data) => { result[key] = { ...(result[key] ?? {}), ...data }; };

  if (p.readSteps) {
    try {
      const { records } = await readRecords("Steps", { timeRangeFilter });
      // Aggregate per day (Health Connect returns individual step records)
      const byDate = {};
      for (const r of records) {
        const key = dateStr(r.startTime);
        byDate[key] = (byDate[key] ?? 0) + (r.count ?? 0);
      }
      for (const [key, steps] of Object.entries(byDate)) {
        merge(key, { steps: Math.round(steps) });
      }
    } catch {}
  }

  if (p.readHeartRate) {
    // Prefer RestingHeartRate, fill gaps with average HeartRate
    const datesWithResting = new Set();
    try {
      const { records } = await readRecords("RestingHeartRate", { timeRangeFilter });
      for (const r of records) {
        if (r.beatsPerMinute != null) {
          const key = dateStr(r.time);
          merge(key, { heartRate: Math.round(r.beatsPerMinute) });
          datesWithResting.add(key);
        }
      }
    } catch {}
    try {
      const { records } = await readRecords("HeartRate", { timeRangeFilter });
      // Average HR per day for dates not covered by resting HR
      const byDate = {};
      for (const r of records) {
        for (const sample of r.samples ?? []) {
          if (sample.beatsPerMinute != null) {
            const key = dateStr(sample.time);
            if (!datesWithResting.has(key)) {
              if (!byDate[key]) byDate[key] = [];
              byDate[key].push(sample.beatsPerMinute);
            }
          }
        }
      }
      for (const [key, values] of Object.entries(byDate)) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        merge(key, { heartRate: Math.round(avg) });
      }
    } catch {}
  }

  if (p.readSpO2) {
    try {
      const { records } = await readRecords("OxygenSaturation", { timeRangeFilter });
      // Average SpO2 per day
      const byDate = {};
      for (const r of records) {
        if (r.percentage != null) {
          const key = dateStr(r.time);
          if (!byDate[key]) byDate[key] = [];
          // Health Connect stores as fraction (0.97) or percent (97) — normalise to 0-100
          const val = r.percentage <= 1 ? r.percentage * 100 : r.percentage;
          byDate[key].push(val);
        }
      }
      for (const [key, values] of Object.entries(byDate)) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        merge(key, { spO2: Math.round(avg * 10) / 10 });
      }
    } catch {}
  }

  if (p.readTemperature) {
    try {
      const { records } = await readRecords("BodyTemperature", { timeRangeFilter });
      const byDate = {};
      for (const r of records) {
        const tempC = r.temperature?.inCelsius;
        if (tempC != null) {
          const key = dateStr(r.time);
          if (!byDate[key]) byDate[key] = [];
          byDate[key].push(tempC);
        }
      }
      for (const [key, values] of Object.entries(byDate)) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        merge(key, { temperature: Math.round(avg * 10) / 10 });
      }
    } catch {}
  }

  if (p.readRespiratoryRate) {
    try {
      const { records } = await readRecords("RespiratoryRate", { timeRangeFilter });
      const byDate = {};
      for (const r of records) {
        if (r.rate != null) {
          const key = dateStr(r.time);
          if (!byDate[key]) byDate[key] = [];
          byDate[key].push(r.rate);
        }
      }
      for (const [key, values] of Object.entries(byDate)) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        merge(key, { respiratoryRate: Math.round(avg * 10) / 10 });
      }
    } catch {}
  }

  if (p.readSleep) {
    try {
      // Extend lower bound by 1 day to catch overnight sessions starting just before the window
      const sleepFilter = {
        operator: "between",
        startTime: startOfDay(isoDate(-daysBack - 1)),
        endTime: endOfDay(today),
      };
      const { records } = await readRecords("SleepSession", { timeRangeFilter: sleepFilter });
      const sleepByDate = {};
      const stagesByDate = {};
      const segmentsByDate = {};
      for (const r of records) {
        // Attribute to wake-up date (endTime), matching the HealthKit convention
        const key = dateStr(r.endTime);
        let sessionHours = 0;
        if (r.stages?.length) {
          for (const stage of r.stages) {
            if (ASLEEP_STAGES.has(stage.stage)) {
              const hours = (new Date(stage.endTime) - new Date(stage.startTime)) / 3600000;
              sessionHours += hours;
            }
            const bucket = SLEEP_STAGE_BUCKET[stage.stage];
            if (bucket) {
              const hours = (new Date(stage.endTime) - new Date(stage.startTime)) / 3600000;
              stagesByDate[key] = stagesByDate[key] ?? { awake: 0, core: 0, deep: 0, rem: 0 };
              stagesByDate[key][bucket] += hours;
              segmentsByDate[key] = segmentsByDate[key] ?? [];
              segmentsByDate[key].push({ start: stage.startTime, end: stage.endTime, stage: bucket });
            }
          }
        } else {
          // No stage breakdown — use full session duration
          sessionHours = (new Date(r.endTime) - new Date(r.startTime)) / 3600000;
        }
        sleepByDate[key] = (sleepByDate[key] ?? 0) + sessionHours;
      }
      for (const [key, hours] of Object.entries(sleepByDate)) {
        merge(key, { sleepHours: Math.round(hours * 10) / 10 });
      }
      for (const [key, stages] of Object.entries(stagesByDate)) {
        merge(key, {
          sleepStages: {
            awake: Math.round(stages.awake * 10) / 10,
            core: Math.round(stages.core * 10) / 10,
            deep: Math.round(stages.deep * 10) / 10,
            rem: Math.round(stages.rem * 10) / 10,
          },
        });
      }
      for (const [key, segments] of Object.entries(segmentsByDate)) {
        merge(key, { sleepSegments: segments.sort((a, b) => new Date(a.start) - new Date(b.start)) });
      }
    } catch {}
  }

  return result;
}

// Write hydration to Health Connect. Symptoms are NOT written (HC has no symptom types).
export async function writeDailyLog({ hydrationMl = 0, prefs = {} }) {
  if (Platform.OS !== "android") return;
  const ok = await ensureInitialized();
  if (!ok) return;

  const p = { writeHydration: true, ...prefs };

  if (p.writeHydration && hydrationMl > 0) {
    try {
      const now = new Date().toISOString();
      const start = new Date(Date.now() - 60000).toISOString();
      await insertRecords([{
        recordType: "Hydration",
        startTime: start,
        endTime: now,
        volume: { inLiters: hydrationMl / 1000 },
      }]);
    } catch {}
  }
}

// Write height (cm) and/or weight (kg) to Health Connect.
export async function writeBodyStats({ heightCm, weightKg, prefs = {} }) {
  if (Platform.OS !== "android") return;
  const ok = await ensureInitialized();
  if (!ok) return;

  const p = { writeHeight: true, writeWeight: true, ...prefs };
  const now = new Date().toISOString();

  if (p.writeHeight && heightCm != null) {
    try {
      await insertRecords([{
        recordType: "Height",
        time: now,
        height: { inMeters: heightCm / 100 },
      }]);
    } catch (e) {
      console.error("[HC] Failed to write Height:", e);
      throw e;
    }
  }

  if (p.writeWeight && weightKg != null) {
    try {
      await insertRecords([{
        recordType: "Weight",
        time: now,
        weight: { inKilograms: weightKg },
      }]);
    } catch (e) {
      console.error("[HC] Failed to write Weight:", e);
      throw e;
    }
  }
}

// ─── Workout fetch ────────────────────────────────────────────────────────────

const EXERCISE_TYPE_LABELS = {
  2: "Biking",
  4: "Boxing",
  7: "Calisthenics",
  8: "Circuit Training",
  10: "CrossFit",
  11: "Curling",
  13: "Dancing",
  16: "Elliptical",
  17: "Fencing",
  20: "Frisbee Disc",
  22: "Golf",
  23: "Guided Breathing",
  24: "Gymnastics",
  25: "Handball",
  27: "High Intensity Training",
  28: "Hiking",
  29: "Ice Hockey",
  30: "Ice Skating",
  31: "Martial Arts",
  35: "Paddling",
  36: "Para Gliding",
  37: "Pilates",
  38: "Racquetball",
  39: "Rock Climbing",
  40: "Roller Hockey",
  41: "Rowing",
  42: "Rowing Machine",
  43: "Rugby",
  44: "Running",
  46: "Sailing",
  47: "Scuba Diving",
  48: "Skating",
  49: "Skiing",
  50: "Snowboarding",
  53: "Soccer",
  54: "Softball",
  55: "Squash",
  56: "Stair Climbing",
  57: "Stair Climbing Machine",
  59: "Strength Training",
  61: "Surfing",
  62: "Swimming Open Water",
  63: "Swimming Pool",
  64: "Table Tennis",
  65: "Tennis",
  66: "Volleyball",
  67: "Walking",
  68: "Water Polo",
  69: "Weightlifting",
  71: "Yoga",
};

function fmtTime(isoStr) {
  const d = new Date(isoStr);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const hh = h % 12 || 12;
  return `${hh}:${m} ${h < 12 ? "AM" : "PM"}`;
}

export async function fetchWorkoutsForDate(date) {
  if (Platform.OS !== "android") return [];
  const ok = await ensureInitialized();
  if (!ok) return [];
  try {
    const { records } = await readRecords("ExerciseSession", {
      timeRangeFilter: {
        operator: "between",
        startTime: startOfDay(date),
        endTime: endOfDay(date),
      },
    });

    return records.map((r) => {
      const label = EXERCISE_TYPE_LABELS[r.exerciseType] ?? "Workout";
      const durationMins = Math.round(
        (new Date(r.endTime) - new Date(r.startTime)) / 60000
      );
      return {
        id: r.metadata?.id ?? `${r.startTime}`,
        activityType: r.exerciseType,
        label,
        startDate: r.startTime,
        endDate: r.endTime,
        timeLabel: `${fmtTime(r.startTime)} – ${fmtTime(r.endTime)}`,
        durationMins,
        calories: null,
        distanceKm: null,
      };
    });
  } catch {
    return [];
  }
}

// ─── Background polling ───────────────────────────────────────────────────────
// Health Connect has no native observer (unlike HealthKit). We poll whenever
// the app comes back to the foreground, with a 15-minute minimum interval.
// `onNewData(dateKey, metrics)` → caller calls store.mergeHealthConnectDay.

const POLL_INTERVAL_MS = 15 * 60 * 1000;
const ALERT_COOLDOWN_MS = 4 * 60 * 60 * 1000;
const ALERT_STATE_KEY = "hc_alert_state";

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
    console.error("[HC] Failed to save alert state:", err);
  }
}

function isInDangerZone(key, value) {
  if (value == null) return false;
  if (key === "spO2") return value < 92;
  if (key === "temperature") return value >= 38.0;
  if (key === "heartRate") return value > 120 || value < 50;
  return false;
}

export function setupBackgroundDelivery(onNewData, prefs = {}) {
  if (Platform.OS !== "android") return;

  let lastFetchAt = 0;

  const handleAppStateChange = async (nextState) => {
    if (nextState !== "active") return;

    const now = Date.now();
    if (now - lastFetchAt < POLL_INTERVAL_MS) return;
    lastFetchAt = now;

    try {
      const ok = await ensureInitialized();
      if (!ok) return;

      const rangeData = await fetchHealthKitRange(30, prefs);

      // Push each day's data to the store
      for (const [date, metrics] of Object.entries(rangeData)) {
        onNewData(date, metrics);
      }

      // Alert evaluation on today's data
      const today = dateStr(new Date());
      const todayMetrics = rangeData[today];
      if (!todayMetrics) return;

      const alertState = await loadAlertState();
      const nextAlertState = { ...alertState };

      for (const [metricKey, value] of Object.entries(todayMetrics)) {
        if (!isInDangerZone(metricKey, value)) {
          const prev = nextAlertState[metricKey] ?? {};
          nextAlertState[metricKey] = { ...prev, lastValue: value };
          continue;
        }

        const label =
          metricKey === "spO2"         ? `Blood oxygen at ${value}% — outside a safe range. Contact your care team now.`
          : metricKey === "temperature" ? `Temperature ${value}°C — fever in SCD is urgent. Seek care immediately.`
          : metricKey === "heartRate"   ? `Heart rate ${value} bpm has shifted significantly. Contact your care team.`
          : null;

        if (!label) continue;

        const prev = nextAlertState[metricKey] ?? {};
        const prevInDanger = isInDangerZone(metricKey, prev.lastValue ?? null);
        const cooldownExpired = !prev.lastAlertAt || (now - prev.lastAlertAt) >= ALERT_COOLDOWN_MS;

        if (!prevInDanger || cooldownExpired) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Health Alert",
              body: label,
              data: { screen: "metric-detail", metric: metricKey },
            },
            trigger: null,
          });

          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await supabase.from("system_notifications").insert({
                user_id: user.id,
                type: "health_alert",
                title: "Health Alert",
                body: label,
                data: { screen: "metric-detail", metric: metricKey },
              });
            }
          } catch {}

          nextAlertState[metricKey] = { ...prev, lastAlertAt: now, lastValue: value };
        } else {
          nextAlertState[metricKey] = { ...prev, lastValue: value };
        }
      }

      await saveAlertState(nextAlertState);
    } catch {}
  };

  const sub = AppState.addEventListener("change", handleAppStateChange);
  return () => sub.remove();
}
