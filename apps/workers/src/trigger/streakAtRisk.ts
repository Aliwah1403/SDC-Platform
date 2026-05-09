import { schedules } from "@trigger.dev/sdk";
import { supabase } from "../lib/supabase";
import { triggerNovu } from "../lib/novu";

const WORKFLOW_ID = "hemo-streak-at-risk-gcuin8u2";

function localHour(tz: string): number {
  try {
    return parseInt(
      new Date().toLocaleString("en-US", { timeZone: tz, hour: "numeric", hour12: false }),
      10,
    );
  } catch {
    return parseInt(
      new Date().toLocaleString("en-US", { timeZone: "UTC", hour: "numeric", hour12: false }),
      10,
    );
  }
}

export const streakAtRisk = schedules.task({
  id: "streak-at-risk",
  // Runs every hour — fires for each user when it's 11 PM in their local timezone
  cron: "0 * * * *",
  run: async () => {
    const today = new Date().toISOString().split("T")[0];

    // Get all users with push tokens (i.e. active devices)
    const { data: tokenRows, error: tokenError } = await supabase
      .from("push_tokens")
      .select("user_id");
    if (tokenError) throw tokenError;

    const allUserIds = (tokenRows ?? []).map((r) => r.user_id as string);
    if (allUserIds.length === 0) return { nudged: 0 };

    // Find users who already logged today
    const { data: loggedToday, error: logError } = await supabase
      .from("daily_summaries")
      .select("user_id")
      .eq("date", today)
      .in("user_id", allUserIds);
    if (logError) throw logError;

    const loggedSet = new Set((loggedToday ?? []).map((r) => r.user_id));
    const notLoggedIds = allUserIds.filter((id) => !loggedSet.has(id));
    if (notLoggedIds.length === 0) return { nudged: 0 };

    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, nickname, timezone")
      .in("user_id", notLoggedIds);
    if (profileError) throw profileError;

    let nudged = 0;
    for (const profile of profiles ?? []) {
      const tz = (profile.timezone as string | null) ?? "UTC";
      // Only nudge users where it is currently 11 PM in their timezone
      if (localHour(tz) !== 23) continue;

      try {
        await triggerNovu(WORKFLOW_ID, profile.user_id, {
          nickname: profile.nickname ?? "there",
        });
        nudged++;
      } catch (err) {
        console.error(`[streak-at-risk] Failed to nudge user ${profile.user_id}:`, err);
      }
    }

    console.log(`[streak-at-risk] Nudged ${nudged} users`);
    return { nudged };
  },
});
