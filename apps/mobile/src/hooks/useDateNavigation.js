import { useCallback, useMemo, useRef } from "react";

export function useDateNavigation() {
  // Stable today reference — won't change across re-renders
  const today = useRef(new Date()).current;

  const dates = useMemo(() => {
    const result = [];
    for (let i = -7; i <= 6; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      result.push(date);
    }
    return result;
  }, []);

  const formatNavDate = useCallback((date) => {
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  }, []);

  const formatDatePickerDay = useCallback((date) => {
    return date.toLocaleDateString("en-US", { weekday: "short" }).charAt(0);
  }, []);

  const formatDatePickerDate = useCallback((date) => {
    return date.getDate();
  }, []);

  const isToday = useCallback(
    (date) => date.toDateString() === today.toDateString(),
    []
  );

  const isFuture = useCallback((date) => date > today, []);

  const isSelected = useCallback(
    (date, selectedDate) => date.toDateString() === selectedDate.toDateString(),
    []
  );

  return {
    dates,
    today,
    formatNavDate,
    formatDatePickerDay,
    formatDatePickerDate,
    isToday,
    isFuture,
    isSelected,
  };
}
