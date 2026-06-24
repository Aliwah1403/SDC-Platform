import { useEffect, useMemo } from "react";
import { Platform } from "react-native";
import { useHealthDataQuery } from "@/hooks/queries/useHealthDataQuery";
import { useAppStore } from "@/store/appStore";
import { buildMergedMap, computeBaselines } from "@/services/baselineService";
import { checkAlerts } from "@/services/healthKitService";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Unified hook — works on both iOS (HealthKit) and Android (Health Connect).
// Returns { alertState, baselines, isConnected, healthData, manualBaselines }
export function useHealthService() {
  const { data: healthData = [] } = useHealthDataQuery();

  const isIOS = Platform.OS === "ios";

  const {
    // iOS fields
    healthKitData,
    healthKitConnected,
    healthKitManualBaselines,
    setHealthKitBaselines,
    setComputedAlertState,
    // Android fields
    healthConnectData,
    healthConnectConnected,
    healthConnectManualBaselines,
  } = useAppStore();

  const isConnected = isIOS ? healthKitConnected : healthConnectConnected;
  const platformData = isIOS ? healthKitData : healthConnectData;
  const manualBaselines = isIOS ? healthKitManualBaselines : healthConnectManualBaselines;

  const mergedMap = useMemo(
    () => buildMergedMap(healthData, platformData),
    [healthData, platformData]
  );

  const baselines = useMemo(
    () => computeBaselines(mergedMap, manualBaselines),
    [mergedMap, manualBaselines]
  );

  const today = todayStr();
  const todayEntry = mergedMap[today] ?? null;

  const recentSymptoms = useMemo(
    () => todayEntry?.symptoms ?? [],
    [todayEntry]
  );

  const baselinesStr = JSON.stringify(baselines);
  useEffect(() => {
    if (isConnected && isIOS) {
      setHealthKitBaselines(baselines);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, isIOS, baselinesStr]);

  useEffect(() => {
    if (!isConnected) {
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
  }, [isConnected, todayEntry, recentSymptoms, baselines]);

  return {
    alertState: useAppStore((s) => s.computedAlertState),
    baselines,
    isConnected,
    mergedMap,
    manualBaselines,
  };
}
