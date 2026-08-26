import { useRef, useState, useEffect } from "react";
import { useProfileQuery } from "@/hooks/queries/useProfileQuery";
import { useHealthDataQuery } from "@/hooks/queries/useHealthDataQuery";
import {
  useStreakQuery,
  useMissedDay,
  useStreakLost,
  useStreakRepairMutation,
} from "@/hooks/queries/useStreakQuery";
import { useAppStore } from "@/store/appStore";
import { toLocalDateStr } from "@/utils/dateUtils";
import { useWeatherData } from "@/hooks/useWeatherData";

export function useHomeData() {
  const { data: profile } = useProfileQuery();
  const locationEnabled = profile?.locationEnabled ?? false;
  const { weather, isWeatherLoading } = useWeatherData(locationEnabled);
  const { data: healthData = [] } = useHealthDataQuery();
  const { data: streak } = useStreakQuery();
  const missedDay = useMissedDay();
  const streakLost = useStreakLost();
  const repairMutation = useStreakRepairMutation();
  const { healthKitData } = useAppStore();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [repairVisible, setRepairVisible] = useState(false);
  const [repairReceipt, setRepairReceipt] = useState(null);
  const [lostStreakVisible, setLostStreakVisible] = useState(false);
  const autoRepairKeyRef = useRef(null);

  // Automatically protect a streak when the missed days can be covered by the
  // user's repair balance. The bottom sheet is a receipt, not a manual gate.
  useEffect(() => {
    if (!missedDay || repairMutation.isPending) return;

    const repairKey = `${missedDay.dateString}:${missedDay.repairsRequired}`;
    if (autoRepairKeyRef.current === repairKey) return;

    autoRepairKeyRef.current = repairKey;
    const previousStreak = streak?.previousStreak ?? streak?.currentStreak ?? 0;
    const repairsBefore = streak?.repairsAvailable ?? 0;

    repairMutation.mutate(undefined, {
      onSuccess: (data) => {
        const repairsUsed = data?.repairsUsed ?? missedDay.repairsRequired;
        setRepairReceipt({
          restoredStreak: data?.restoredStreak ?? previousStreak,
          repairsUsed,
          repairsBefore,
          repairsRemaining: data?.repairsRemaining ?? Math.max(0, repairsBefore - repairsUsed),
          missedDays: missedDay.missedDays,
        });
        setTimeout(() => setRepairVisible(true), 500);
      },
      onError: () => {
        autoRepairKeyRef.current = null;
      },
    });
  }, [
    !!missedDay,
    missedDay?.dateString,
    missedDay?.repairsRequired,
    repairMutation.isPending,
    streak?.previousStreak,
    streak?.currentStreak,
    streak?.repairsAvailable,
  ]);

  useEffect(() => {
    if (!repairVisible) {
      setRepairReceipt(null);
    }
  }, [repairVisible]);

  // Show lost streak modal when gap > 3 days and user had an active streak.
  useEffect(() => {
    if (streakLost) {
      setTimeout(() => setLostStreakVisible(true), 600);
    }
  }, [!!streakLost]);

  // Get data for selected date, merging HealthKit (steps, sleep, etc.) the same way Track does
  const selectedDateStr = toLocalDateStr(selectedDate);
  const base = healthData.find((d) => d.date === selectedDateStr) ?? null;
  const hkDay = healthKitData?.[selectedDateStr];
  const selectedDateData = hkDay
    ? base
      ? { ...base, ...hkDay }
      : { date: selectedDateStr, ...hkDay }
    : base;
  const hasLoggedData =
    selectedDateData &&
    (selectedDateData.painLevel > 0 ||
      selectedDateData.mood > 0 ||
      selectedDateData.hydration > 0);

  return {
    currentUser: profile,
    healthStreak: streak?.currentStreak ?? 0,
    healthData,
    selectedDate,
    setSelectedDate,
    selectedDateData,
    hasLoggedData,
    repairVisible,
    setRepairVisible,
    repairReceipt,
    missedDay,
    lostStreakVisible,
    setLostStreakVisible,
    streakLost,
    weather,
    isWeatherLoading,
  };
}
