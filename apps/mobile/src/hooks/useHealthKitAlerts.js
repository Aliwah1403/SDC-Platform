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
    setHealthKitBaselines,
    setComputedAlertState,
  } = useAppStore();

  // Build a date-keyed map merging Supabase + HealthKit data
  const mergedMap = useMemo(
    () => buildMergedMap(healthData, healthKitData),
    [healthData, healthKitData]
  );

  // Compute baselines from the merged map
  const baselines = useMemo(() => computeBaselines(mergedMap), [mergedMap]);

  // Today's merged entry — HealthKit fields overlay manual log fields
  const today = todayStr();
  const todayEntry = mergedMap[today] ?? null;

  // Most recent symptom log — use today's logged symptoms if present
  const recentSymptoms = useMemo(
    () => todayEntry?.symptoms ?? [],
    [todayEntry]
  );

  useEffect(() => {
    if (!healthKitConnected) {
      setComputedAlertState(null);
      return;
    }

    setHealthKitBaselines(baselines);

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
