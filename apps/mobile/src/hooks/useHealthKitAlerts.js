import { useEffect, useMemo } from "react";
import { useHealthDataQuery } from "@/hooks/queries/useHealthDataQuery";
import { useAppStore } from "@/store/appStore";
import { buildMergedMap, computeBaselines } from "@/services/baselineService";
import { checkAlerts } from "@/services/healthKitService";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function useHealthKitAlerts() {
  const { data: healthData = [] } = useHealthDataQuery();
  const {
    healthKitData,
    healthKitConnected,
    healthKitManualBaselines,
    setHealthKitBaselines,
    setComputedAlertState,
  } = useAppStore();

  // Build a date-keyed map merging Supabase + HealthKit data
  const mergedMap = useMemo(
    () => buildMergedMap(healthData, healthKitData),
    [healthData, healthKitData]
  );

  // Compute baselines, applying any user-supplied overrides for chronic values
  const baselines = useMemo(
    () => computeBaselines(mergedMap, healthKitManualBaselines),
    [mergedMap, healthKitManualBaselines]
  );

  // Today's merged entry — HealthKit fields overlay manual log fields
  const today = todayStr();
  const todayEntry = mergedMap[today] ?? null;

  // Most recent symptom log — use today's logged symptoms if present
  const recentSymptoms = useMemo(
    () => todayEntry?.symptoms ?? [],
    [todayEntry]
  );

  // Sync baselines to the store using a stringified dependency to avoid
  // infinite loops when baselines get new object references on each render
  // (e.g. during React Query cache invalidation on sign-out).
  const baselinesStr = JSON.stringify(baselines);
  useEffect(() => {
    if (healthKitConnected) {
      setHealthKitBaselines(baselines);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [healthKitConnected, baselinesStr]);

  useEffect(() => {
    if (!healthKitConnected) {
      setComputedAlertState(null);
      return;
    }

    if (!todayEntry) {
      setComputedAlertState(null);
      return;
    }

    const result = checkAlerts(todayEntry, recentSymptoms, baselines);
    setComputedAlertState(
      result ? { ...result, computedAt: new Date().toISOString() } : null
    );
  }, [healthKitConnected, todayEntry, recentSymptoms, baselines]);

  return {
    alertState: useAppStore((s) => s.computedAlertState),
    baselines,
  };
}
