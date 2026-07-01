import { useRouter } from "expo-router";
import { RecapCard } from "./recapShared";

export function MonthlySummaryCard({ stats, dayCount, monthName, onDismiss }) {
  const router = useRouter();
  return (
    <RecapCard
      kicker="MONTHLY RECAP"
      title={monthName}
      titleSize={32}
      subtitle={`${stats.daysLogged} of ${dayCount} days logged`}
      gradient={["#D09F9A", "#A9334D", "#781D11"]}
      badgeBg="rgba(255,255,255,0.92)"
      badgeColor="#A9334D"
      onDismiss={onDismiss}
      onPress={() => router.push("/health-insights")}
    />
  );
}
