import { useMemo } from "react";

export function useChartData(healthData) {
  return useMemo(() => {
    const today = new Date();
    const chartData = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayData = healthData.find((d) => d.date === dateStr);

      chartData.push({
        date: date,
        painLevel: dayData?.painLevel || 0,
        hydration: dayData?.hydration || 0,
        mood: dayData?.mood || 0,
      });
    }

    const painLevelData = chartData.map((d) => ({ date: d.date, value: d.painLevel }));
    const hydrationData = chartData.map((d) => ({ date: d.date, value: d.hydration }));
    const moodData = chartData.map((d) => ({ date: d.date, value: d.mood }));

    let currentStreak = 0;
    let longestStreak = 0;
    chartData.forEach((day) => {
      if (day.painLevel < 5 && day.painLevel > 0) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else if (day.painLevel >= 5) {
        currentStreak = 0;
      }
    });
    const crisisPeriods = { current: currentStreak, longest: longestStreak };

    const painDays = chartData.filter((d) => d.painLevel > 0);
    const avgPainLevel = painDays.length > 0
      ? (painDays.reduce((sum, d) => sum + d.painLevel, 0) / painDays.length).toFixed(1)
      : "0.0";

    const hydrationDays = chartData.filter((d) => d.hydration > 0);
    const avgHydration = hydrationDays.length > 0
      ? (hydrationDays.reduce((sum, d) => sum + d.hydration, 0) / hydrationDays.length).toFixed(1)
      : "0.0";

    return { chartData, painLevelData, hydrationData, moodData, crisisPeriods, avgPainLevel, avgHydration };
  }, [healthData]);
}
