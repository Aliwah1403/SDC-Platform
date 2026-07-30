import { useRouter } from "expo-router";
import { RecapCard } from "./recapShared";
import { toDateStr } from "@/utils/recapEngine";

export function WeeklySummaryCard({ stats, weekRange, weekStart, onDismiss }) {
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
      onPress={() => router.push(`/recap?period=week&start=${toDateStr(weekStart)}&from=card`)}
    />
  );
}
