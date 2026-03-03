export function useChartData(healthData) {
  // Prepare chart data from healthData (last 30 days)
  const getLast30DaysData = () => {
    const data = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayData = healthData.find((d) => d.date === dateStr);

      data.push({
        date: date,
        painLevel: dayData?.painLevel || 0,
        hydration: dayData?.hydration || 0,
        mood: dayData?.mood || 0,
      });
    }

    return data;
  };

  const chartData = getLast30DaysData();

  // Prepare data for each chart
  const painLevelData = chartData.map((d) => ({
    date: d.date,
    value: d.painLevel,
  }));
  const hydrationData = chartData.map((d) => ({
    date: d.date,
    value: d.hydration,
  }));
  const moodData = chartData.map((d) => ({ date: d.date, value: d.mood }));

  // Calculate crisis-free days (consecutive days with pain level < 5)
  const calculateCrisisPeriods = () => {
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

    return { current: currentStreak, longest: longestStreak };
  };

  const crisisPeriods = calculateCrisisPeriods();

  // Calculate stats
  const avgPainLevel =
    chartData.filter((d) => d.painLevel > 0).length > 0
      ? (
          chartData.reduce((sum, d) => sum + d.painLevel, 0) /
          chartData.filter((d) => d.painLevel > 0).length
        ).toFixed(1)
      : "0.0";

  const avgHydration =
    chartData.filter((d) => d.hydration > 0).length > 0
      ? (
          chartData.reduce((sum, d) => sum + d.hydration, 0) /
          chartData.filter((d) => d.hydration > 0).length
        ).toFixed(1)
      : "0.0";

  return {
    chartData,
    painLevelData,
    hydrationData,
    moodData,
    crisisPeriods,
    avgPainLevel,
    avgHydration,
  };
}
