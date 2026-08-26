import { schedules } from "@trigger.dev/sdk";
import { supabase } from "../../lib/supabase";
import { triggerNovu } from "../../lib/novu";
import { Sentry } from "../../lib/sentry";

const WORKFLOW_ID = "hemo-weekly-summary";
const LOOKBACK_DAYS = 7;

type HydrationUnit = "glasses" | "ml" | "L" | "floz";

function formatHydrationForNotification(ml: number | null, unit: HydrationUnit) {
  if (ml == null) return { value: null, unitLabel: unit === "ml" ? "ml" : unit === "L" ? "L" : unit === "floz" ? "fl oz" : "glasses" };

  switch (unit) {
    case "ml":
      return { value: Math.round(ml), unitLabel: "ml" };
    case "L":
      return { value: Math.round((ml / 1000) * 10) / 10, unitLabel: "L" };
    case "floz":
      return { value: Math.round(ml / 29.5735), unitLabel: "fl oz" };
    case "glasses":
    default:
      return { value: Math.round((ml / 250) * 10) / 10, unitLabel: "glasses" };
  }
}

export const weeklyHealthSummary = schedules.task({
  id: "weekly-health-summary",
  // Every Sunday at 18:00 UTC
  cron: "0 18 * * 0",
  run: async () => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - LOOKBACK_DAYS);
    const weekAgoStr = weekAgo.toISOString().split("T")[0];

    // Get all users with push tokens
    const { data: tokenRows, error: tokenError } = await supabase
      .from("push_tokens")
      .select("user_id");
    if (tokenError) throw tokenError;

    const allUserIds = (tokenRows ?? []).map((r) => r.user_id as string);
    if (allUserIds.length === 0) return { nudged: 0 };

    // Get daily_summaries for the past 7 days per user
    const { data: summaries, error: summaryError } = await supabase
      .from("daily_summaries")
      .select("user_id, date, pain_level, hydration")
      .in("user_id", allUserIds)
      .gte("date", weekAgoStr)
      .order("date", { ascending: true });
    if (summaryError) throw summaryError;

    // Group by user
    const summariesByUser = new Map<
      string,
      { date: string; pain_level: number | null; hydration: number | null }[]
    >();
    for (const row of summaries ?? []) {
      const existing = summariesByUser.get(row.user_id) ?? [];
      existing.push(row as { date: string; pain_level: number | null; hydration: number | null });
      summariesByUser.set(row.user_id, existing);
    }

    // Only send to users who logged at least once this week
    const activeUserIds = [...summariesByUser.keys()];
    if (activeUserIds.length === 0) return { nudged: 0 };

    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, nickname, hydration_display_unit")
      .in("user_id", activeUserIds);
    if (profileError) throw profileError;

    const profileMap = new Map(
      (profiles ?? []).map((p) => [
        p.user_id as string,
        {
          nickname: p.nickname as string | null,
          hydrationDisplayUnit: (p.hydration_display_unit as HydrationUnit | null) ?? "glasses",
        },
      ])
    );

    let nudged = 0;
    for (const [userId, rows] of summariesByUser) {
      // Compute streak: count consecutive days ending today with a log
      const loggedDates = new Set(rows.map((r) => r.date));
      let streak = 0;
      for (let i = 0; i < LOOKBACK_DAYS; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        if (loggedDates.has(dateStr)) streak++;
        else break;
      }

      // Averages (exclude nulls)
      const painValues = rows
        .map((r) => r.pain_level)
        .filter((v): v is number => v != null);
      const hydrationValues = rows
        .map((r) => r.hydration)
        .filter((v): v is number => v != null);

      const avgPain =
        painValues.length > 0
          ? Math.round(
              (painValues.reduce((a, b) => a + b, 0) / painValues.length) * 10
            ) / 10
          : null;
      const avgHydration =
        hydrationValues.length > 0
          ? Math.round(
              (hydrationValues.reduce((a, b) => a + b, 0) /
                hydrationValues.length) *
                10
            ) / 10
          : null;

      try {
        const profile = profileMap.get(userId);
        const hydration = formatHydrationForNotification(
          avgHydration,
          profile?.hydrationDisplayUnit ?? "glasses"
        );
        await triggerNovu(WORKFLOW_ID, userId, {
          nickname: profile?.nickname ?? "there",
          streak,
          logsThisWeek: rows.length,
          avgPain,
          avgHydration: hydration.value,
          hydrationUnit: hydration.unitLabel,
        });
        nudged++;
      } catch (err) {
        console.error(`[weeklyHealthSummary] error for user ${userId}:`, err);
        Sentry.captureException(err, {
          tags: { task: "weekly-health-summary" },
          extra: { userId },
        });
      }
    }

    console.log(`[weekly-health-summary] Sent to ${nudged} users`);
    return { nudged };
  },
});
