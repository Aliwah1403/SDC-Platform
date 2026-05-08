import { useCallback, useMemo } from "react";

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export function useDateNavigation() {
  const todayKey = new Date().toDateString();
  const dates = useMemo(() => {
    const now = new Date();
    const result = [];
    for (let i = -7; i <= 6; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + i);
      result.push(date);
    }
    return result;
  }, [todayKey]);

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
    (date) => date.toDateString() === new Date().toDateString(),
    []
  );

  const isFuture = useCallback(
    (date) => startOfDay(date) > startOfDay(new Date()),
    []
  );

  const isSelected = useCallback(
    (date, selectedDate) => date.toDateString() === selectedDate.toDateString(),
    []
  );

  return {
    dates,
    today: new Date(),
    formatNavDate,
    formatDatePickerDay,
    formatDatePickerDate,
    isToday,
    isFuture,
    isSelected,
  };
}
