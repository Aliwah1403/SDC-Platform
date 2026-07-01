import { useRouter } from "expo-router";
import { RecapCard } from "./recapShared";

export function WeeklySummaryCard({ stats, weekRange, onDismiss }) {
  const router = useRouter();
  return (
    <RecapCard
      kicker="WEEKLY RECAP"
      title={weekRange}
      titleSize={26}
      subtitle={`${stats.daysLogged} of 7 days logged`}
      gradient={["#A9334D", "#781D11", "#4A1309"]}
      badgeBg="#F0531C"
      badgeColor="#FFFFFF"
      onDismiss={onDismiss}
      onPress={() => router.push("/health-insights")}
    />
  );
}
