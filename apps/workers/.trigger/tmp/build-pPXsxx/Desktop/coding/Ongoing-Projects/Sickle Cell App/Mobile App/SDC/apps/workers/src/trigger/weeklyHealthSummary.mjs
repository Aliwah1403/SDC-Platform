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

// src/trigger/weeklyHealthSummary.ts
init_esm();
var WORKFLOW_ID = "hemo-weekly-summary";
var LOOKBACK_DAYS = 7;
var weeklyHealthSummary = schedules_exports.task({
  id: "weekly-health-summary",
  // Every Sunday at 18:00 UTC
  cron: "0 18 * * 0",
  run: /* @__PURE__ */ __name(async () => {
    const today = /* @__PURE__ */ new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - LOOKBACK_DAYS);
    const weekAgoStr = weekAgo.toISOString().split("T")[0];
    const { data: tokenRows, error: tokenError } = await supabase.from("push_tokens").select("user_id");
    if (tokenError) throw tokenError;
    const allUserIds = (tokenRows ?? []).map((r) => r.user_id);
    if (allUserIds.length === 0) return { nudged: 0 };
    const { data: summaries, error: summaryError } = await supabase.from("daily_summaries").select("user_id, date, pain_level, hydration").in("user_id", allUserIds).gte("date", weekAgoStr).order("date", { ascending: true });
    if (summaryError) throw summaryError;
    const summariesByUser = /* @__PURE__ */ new Map();
    for (const row of summaries ?? []) {
      const existing = summariesByUser.get(row.user_id) ?? [];
      existing.push(row);
      summariesByUser.set(row.user_id, existing);
    }
    const activeUserIds = [...summariesByUser.keys()];
    if (activeUserIds.length === 0) return { nudged: 0 };
    const { data: profiles, error: profileError } = await supabase.from("profiles").select("user_id, nickname").in("user_id", activeUserIds);
    if (profileError) throw profileError;
    const nicknameMap = new Map(
      (profiles ?? []).map((p) => [p.user_id, p.nickname])
    );
    let nudged = 0;
    for (const [userId, rows] of summariesByUser) {
      const loggedDates = new Set(rows.map((r) => r.date));
      let streak = 0;
      for (let i = 0; i < LOOKBACK_DAYS; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        if (loggedDates.has(dateStr)) streak++;
        else break;
      }
      const painValues = rows.map((r) => r.pain_level).filter((v) => v != null);
      const hydrationValues = rows.map((r) => r.hydration).filter((v) => v != null);
      const avgPain = painValues.length > 0 ? Math.round(
        painValues.reduce((a, b) => a + b, 0) / painValues.length * 10
      ) / 10 : null;
      const avgHydration = hydrationValues.length > 0 ? Math.round(
        hydrationValues.reduce((a, b) => a + b, 0) / hydrationValues.length * 10
      ) / 10 : null;
      await triggerNovu(WORKFLOW_ID, userId, {
        nickname: nicknameMap.get(userId) ?? "there",
        streak,
        logsThisWeek: rows.length,
        avgPain,
        avgHydration
      });
      nudged++;
    }
    console.log(`[weekly-health-summary] Sent to ${nudged} users`);
    return { nudged };
  }, "run")
});
export {
  weeklyHealthSummary
};
//# sourceMappingURL=weeklyHealthSummary.mjs.map
