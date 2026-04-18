import { useState, useEffect } from "react";
import { useProfileQuery } from "@/hooks/queries/useProfileQuery";
import { useHealthDataQuery } from "@/hooks/queries/useHealthDataQuery";
import { useStreakQuery, useMissedDay, useStreakLost } from "@/hooks/queries/useStreakQuery";

export function useHomeData() {
  const { data: profile } = useProfileQuery();
  const { data: healthData = [] } = useHealthDataQuery();
  const { data: streak } = useStreakQuery();
  const missedDay = useMissedDay();
  const streakLost = useStreakLost();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [repairVisible, setRepairVisible] = useState(false);
  const [lostStreakVisible, setLostStreakVisible] = useState(false);

  // Show repair sheet only when gap is 2-3 days AND streak was >= 3 (guarded in useMissedDay)
  useEffect(() => {
    if (missedDay) {
      setTimeout(() => setRepairVisible(true), 500);
    }
  }, [!!missedDay]);

  // Show lost streak modal when gap > 3 days and user had a meaningful streak
  useEffect(() => {
    if (streakLost) {
      setTimeout(() => setLostStreakVisible(true), 600);
    }
  }, [!!streakLost]);

  // Get data for selected date
  const selectedDateStr = selectedDate.toISOString().split("T")[0];
  const selectedDateData =
    healthData.find((d) => d.date === selectedDateStr) ?? null;
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
    missedDay,
    lostStreakVisible,
    setLostStreakVisible,
    streakLost,
  };
}
