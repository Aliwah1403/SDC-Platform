import { Platform } from "react-native";
import { useAppStore } from "@/store/appStore";
import { toLocalDateStr } from "@/utils/dateUtils";

/**
 * Today's step count from the platform wearable sync (HealthKit on iOS, Health
 * Connect on Android) — same date-keyed store fields and local-calendar-date
 * lookup used by useHomeData/track/metric-detail. Returns null when no
 * wearable is connected or nothing has synced today (silent-degrade, matching
 * getHeatBumpMl(null) — Step 11 decision 6).
 */
export function useTodaySteps() {
  const healthKitData = useAppStore((s) => s.healthKitData);
  const healthConnectData = useAppStore((s) => s.healthConnectData);
  const platformData = Platform.OS === "ios" ? healthKitData : healthConnectData;
  const todayStr = toLocalDateStr(new Date());
  return platformData?.[todayStr]?.steps ?? null;
}
