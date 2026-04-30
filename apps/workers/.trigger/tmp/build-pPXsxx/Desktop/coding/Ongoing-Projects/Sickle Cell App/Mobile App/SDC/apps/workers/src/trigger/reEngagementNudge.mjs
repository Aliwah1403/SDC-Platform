import {
  supabase,
  triggerNovu
} from "../../../../../../../../../../chunk-B7B3ZFLJ.mjs";
import {
  schedules_exports
} from "../../../../../../../../../../chunk-MSDQ3ZGU.mjs";
import "../../../../../../../../../../chunk-NKWTELV4.mjs";
import {
  __name,
  init_esm
} from "../../../../../../../../../../chunk-NHMRKCAE.mjs";

// src/trigger/reEngagementNudge.ts
init_esm();
var WORKFLOW_ID = "hemo-re-engagement";
var GAP_DAYS = 3;
var reEngagementNudge = schedules_exports.task({
  id: "re-engagement-nudge",
  // Daily at 10:00 UTC
  cron: "0 10 * * *",
  run: /* @__PURE__ */ __name(async () => {
    const today = /* @__PURE__ */ new Date();
    const cutoffDate = new Date(today);
    cutoffDate.setDate(cutoffDate.getDate() - GAP_DAYS);
    const cutoffStr = cutoffDate.toISOString().split("T")[0];
    const { data: tokenRows, error: tokenError } = await supabase.from("push_tokens").select("user_id");
    if (tokenError) throw tokenError;
    const allUserIds = (tokenRows ?? []).map((r) => r.user_id);
    if (allUserIds.length === 0) return { nudged: 0 };
    const { data: recentLogs, error: logError } = await supabase.from("health_logs").select("user_id, date").in("user_id", allUserIds).gte("date", cutoffStr);
    if (logError) throw logError;
    const recentUserSet = new Set((recentLogs ?? []).map((r) => r.user_id));
    const lapsedIds = allUserIds.filter((id) => !recentUserSet.has(id));
    if (lapsedIds.length === 0) return { nudged: 0 };
    const { data: lastLogs, error: lastLogError } = await supabase.from("health_logs").select("user_id, date").in("user_id", lapsedIds).order("date", { ascending: false });
    if (lastLogError) throw lastLogError;
    const lastLogByUser = /* @__PURE__ */ new Map();
    for (const row of lastLogs ?? []) {
      if (!lastLogByUser.has(row.user_id)) {
        lastLogByUser.set(row.user_id, row.date);
      }
    }
    const { data: profiles, error: profileError } = await supabase.from("profiles").select("user_id, nickname").in("user_id", lapsedIds);
    if (profileError) throw profileError;
    const nicknameMap = new Map(
      (profiles ?? []).map((p) => [p.user_id, p.nickname])
    );
    let nudged = 0;
    for (const userId of lapsedIds) {
      const lastDate = lastLogByUser.get(userId);
      const daysWithoutLog = lastDate ? Math.floor(
        (today.getTime() - new Date(lastDate).getTime()) / (1e3 * 60 * 60 * 24)
      ) : null;
      await triggerNovu(WORKFLOW_ID, userId, {
        nickname: nicknameMap.get(userId) ?? "there",
        daysWithoutLog
      });
      nudged++;
    }
    console.log(`[re-engagement-nudge] Nudged ${nudged} users`);
    return { nudged };
  }, "run")
});
export {
  reEngagementNudge
};
//# sourceMappingURL=reEngagementNudge.mjs.map
