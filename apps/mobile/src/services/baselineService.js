// ─── Baseline computation ─────────────────────────────────────────────────────
// Pure functions — no HealthKit or React imports.
// Works on the merged health data array (Supabase healthData + healthKitData).
//
// All averages exclude zero and null values because a zero step count on a day
// with no data should not drag down the baseline. Fewer than 3 valid data points
// means the baseline is considered unknown (returns null) to prevent false alerts
// from a thin sample.

function avg(values) {
  const valid = values.filter((v) => v != null && v > 0);
  if (valid.length < 3) return null;
  return valid.reduce((s, v) => s + v, 0) / valid.length;
}

function lastNDays(mergedData, field, n) {
  const today = new Date();
  const results = [];
  for (let i = 1; i <= n; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const entry = mergedData[key];
    if (entry?.[field] != null) results.push(entry[field]);
  }
  return results;
}

// `mergedData` is an object keyed by "YYYY-MM-DD" with all health fields.
// Build it by combining healthData (array from Supabase) and healthKitData (store map).
export function buildMergedMap(healthDataArray, healthKitDataMap) {
  const map = {};
  for (const entry of healthDataArray) {
    map[entry.date] = { ...entry };
  }
  for (const [date, hkFields] of Object.entries(healthKitDataMap)) {
    map[date] = { ...(map[date] ?? {}), ...hkFields };
  }
  return map;
}

export function computeBaselines(mergedMap) {
  return {
    steps:           { avg14d: avg(lastNDays(mergedMap, "steps",           14)),
                       avg30d: avg(lastNDays(mergedMap, "steps",           30)) },
    heartRate:       { avg7d:  avg(lastNDays(mergedMap, "heartRate",        7)) },
    sleepHours:      { avg7d:  avg(lastNDays(mergedMap, "sleepHours",       7)) },
    spO2:            { avg7d:  avg(lastNDays(mergedMap, "spO2",             7)) },
    respiratoryRate: { avg7d:  avg(lastNDays(mergedMap, "respiratoryRate",  7)) },
    temperature:     { avg7d:  avg(lastNDays(mergedMap, "temperature",      7)) },
  };
}
