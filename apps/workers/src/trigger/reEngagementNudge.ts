import { schedules } from "@trigger.dev/sdk";
import { supabase } from "../lib/supabase";
import { triggerNovu } from "../lib/novu";
import { Sentry } from "../lib/sentry";

const WORKFLOW_ID = "hemo-re-engagement";
const GAP_DAYS = 3;
const NOVU_BATCH_SIZE = 25;

export const reEngagementNudge = schedules.task({
  id: "re-engagement-nudge",
  // Daily at 10:00 UTC
  cron: "0 10 * * *",
  run: async () => {
    const today = new Date();
    const cutoffDate = new Date(today);
    cutoffDate.setDate(cutoffDate.getDate() - GAP_DAYS);
    const cutoffStr = cutoffDate.toISOString().split("T")[0];

    // Get all users with push tokens
    const { data: tokenRows, error: tokenError } = await supabase
      .from("push_tokens")
      .select("user_id");
    if (tokenError) throw tokenError;

    const allUserIds = (tokenRows ?? []).map((r) => r.user_id as string);
    if (allUserIds.length === 0) return { nudged: 0 };

    // For each user, find the most recent health_log date
    const { data: recentLogs, error: logError } = await supabase
      .from("health_logs")
      .select("user_id, date")
      .in("user_id", allUserIds)
      .gte("date", cutoffStr);
    if (logError) throw logError;

    // Users with a log within the last GAP_DAYS days
    const recentUserSet = new Set((recentLogs ?? []).map((r) => r.user_id));

    // Users with no log in GAP_DAYS days (or ever)
    const lapsedIds = allUserIds.filter((id) => !recentUserSet.has(id));
    if (lapsedIds.length === 0) return { nudged: 0 };

    // Get last log date for each lapsed user to compute exact day count
    // (one row per user, reduced at the DB level)
    const { data: lastLogs, error: lastLogError } = await supabase
      .from("health_logs")
      .select("user_id, last_date:date.max()")
      .in("user_id", lapsedIds);
    if (lastLogError) throw lastLogError;

    const lastLogByUser = new Map<string, string>();
    for (const row of lastLogs ?? []) {
      if (row.last_date) {
        lastLogByUser.set(row.user_id as string, row.last_date as string);
      }
    }

    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, nickname")
      .in("user_id", lapsedIds);
    if (profileError) throw profileError;

    const nicknameMap = new Map(
      (profiles ?? []).map((p) => [p.user_id, p.nickname as string | null])
    );

    let nudged = 0;
    for (let i = 0; i < lapsedIds.length; i += NOVU_BATCH_SIZE) {
      const batch = lapsedIds.slice(i, i + NOVU_BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async (userId) => {
          const lastDate = lastLogByUser.get(userId);
          const daysWithoutLog = lastDate
            ? Math.floor(
                (today.getTime() - new Date(lastDate).getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : null;

          await triggerNovu(WORKFLOW_ID, userId, {
            nickname: nicknameMap.get(userId) ?? "there",
            daysWithoutLog,
          });
        })
      );

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          nudged++;
          return;
        }

        const failedUserId = batch[index] ?? "unknown";
        console.error(
          `[re-engagement-nudge] Failed to trigger Novu for user ${failedUserId}:`,
          result.reason
        );
        Sentry.captureException(result.reason, {
          tags: { task: "re-engagement-nudge" },
          extra: { userId: failedUserId },
        });
      });
    }

    console.log(`[re-engagement-nudge] Nudged ${nudged} users`);
    return { nudged };
  },
});
