import { useState, useEffect } from "react";
import { useAppStore } from "@/store/appStore";

export function useHomeData() {
  const {
    currentUser,
    healthStreak,
    healthData,
    getHealthDataForDate,
    detectMissedDay,
    missedDay,
  } = useAppStore();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [repairVisible, setRepairVisible] = useState(false);

  // Check for missed days on mount
  useEffect(() => {
    const hasMissedDay = detectMissedDay();
    if (hasMissedDay) {
      setTimeout(() => {
        setRepairVisible(true);
      }, 500);
    }
  }, [detectMissedDay]);

  // Get data for selected date
  const selectedDateData = getHealthDataForDate(selectedDate);
  const hasLoggedData =
    selectedDateData &&
    (selectedDateData.painLevel > 0 ||
      selectedDateData.mood > 0 ||
      selectedDateData.hydration > 0);

  return {
    currentUser,
    healthStreak,
    healthData,
    selectedDate,
    setSelectedDate,
    selectedDateData,
    hasLoggedData,
    repairVisible,
    setRepairVisible,
    missedDay,
  };
}
