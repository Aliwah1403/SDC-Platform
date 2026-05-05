import { schedules } from "@trigger.dev/sdk";
import { supabase } from "../lib/supabase";
import { triggerNovu } from "../lib/novu";

const WORKFLOW_ID = "hemo-streak-at-risk-gcuin8u2";

function localToUTCMinutes(hh: number, mm: number, tz: string): number {
  const now = new Date();
  const utcMs = new Date(now.toLocaleString("en-US", { timeZone: "UTC" })).getTime();
  const localMs = new Date(now.toLocaleString("en-US", { timeZone: tz })).getTime();
  const offsetMin = (utcMs - localMs) / 60000;
  return ((hh * 60 + mm) + offsetMin + 1440) % 1440;
}

export const streakAtRisk = schedules.task({
  id: "streak-at-risk",
  // Daily at 20:00 UTC — by this time most users' check-in window has passed
  cron: "0 20 * * *",
  run: async () => {
    const today = new Date().toISOString().split("T")[0];
    const nowUTC = new Date();
    const currentHourUTC = nowUTC.getUTCHours() * 60 + nowUTC.getUTCMinutes();

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

    // Filter to users whose check_in_time has already passed today
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, check_in_time, nickname, timezone")
      .in("user_id", notLoggedIds);
    if (profileError) throw profileError;

    let nudged = 0;
    for (const profile of profiles ?? []) {
      const checkInTime = profile.check_in_time as string | null;
      if (checkInTime) {
        const [hh, mm] = checkInTime.split(":").map(Number);
        const tz = (profile.timezone as string | null) ?? "UTC";
        const checkInMinutesUTC = localToUTCMinutes(hh, mm ?? 0, tz);
        // Only nudge if check-in time has passed
        if (currentHourUTC < checkInMinutesUTC) continue;
      }

      await triggerNovu(WORKFLOW_ID, profile.user_id, {
        nickname: profile.nickname ?? "there",
      });
      nudged++;
    }

    console.log(`[streak-at-risk] Nudged ${nudged} users`);
    return { nudged };
  },
});
