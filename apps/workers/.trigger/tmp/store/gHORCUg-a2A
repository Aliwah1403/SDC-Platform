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

// src/trigger/medicationAdherenceDrop.ts
init_esm();
var WORKFLOW_ID = "hemo-adherence-drop";
var ADHERENCE_THRESHOLD = 0.7;
var LOOKBACK_DAYS = 7;
var medicationAdherenceDrop = schedules_exports.task({
  id: "medication-adherence-drop",
  // Every Monday at 08:00 UTC
  cron: "0 8 * * 1",
  run: /* @__PURE__ */ __name(async () => {
    const today = /* @__PURE__ */ new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - LOOKBACK_DAYS);
    const weekAgoStr = weekAgo.toISOString().split("T")[0];
    const { data: tokenRows, error: tokenError } = await supabase.from("push_tokens").select("user_id");
    if (tokenError) throw tokenError;
    const allUserIds = (tokenRows ?? []).map((r) => r.user_id);
    if (allUserIds.length === 0) return { nudged: 0 };
    const { data: medications, error: medError } = await supabase.from("medications").select("id, user_id").in("user_id", allUserIds).is("archived_at", null);
    if (medError) throw medError;
    const medsByUser = /* @__PURE__ */ new Map();
    for (const med of medications ?? []) {
      const existing = medsByUser.get(med.user_id) ?? [];
      existing.push(med.id);
      medsByUser.set(med.user_id, existing);
    }
    const usersWithMeds = [...medsByUser.keys()];
    if (usersWithMeds.length === 0) return { nudged: 0 };
    const { data: logs, error: logError } = await supabase.from("medication_logs").select("user_id, medication_id, date").in("user_id", usersWithMeds).gte("date", weekAgoStr);
    if (logError) throw logError;
    const takenSet = /* @__PURE__ */ new Set();
    for (const log of logs ?? []) {
      takenSet.add(`${log.user_id}|${log.medication_id}|${log.date}`);
    }
    const { data: profiles, error: profileError } = await supabase.from("profiles").select("user_id, nickname").in("user_id", usersWithMeds);
    if (profileError) throw profileError;
    const nicknameMap = new Map(
      (profiles ?? []).map((p) => [p.user_id, p.nickname])
    );
    let nudged = 0;
    for (const [userId, medIds] of medsByUser) {
      const possibleDoses = medIds.length * LOOKBACK_DAYS;
      let takenCount = 0;
      for (const medId of medIds) {
        for (let i = 0; i < LOOKBACK_DAYS; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split("T")[0];
          if (takenSet.has(`${userId}|${medId}|${dateStr}`)) takenCount++;
        }
      }
      const adherence = possibleDoses > 0 ? takenCount / possibleDoses : 1;
      if (adherence >= ADHERENCE_THRESHOLD) continue;
      await triggerNovu(WORKFLOW_ID, userId, {
        nickname: nicknameMap.get(userId) ?? "there",
        adherencePercent: Math.round(adherence * 100)
      });
      nudged++;
    }
    console.log(`[medication-adherence-drop] Nudged ${nudged} users`);
    return { nudged };
  }, "run")
});
export {
  medicationAdherenceDrop
};
//# sourceMappingURL=medicationAdherenceDrop.mjs.map
