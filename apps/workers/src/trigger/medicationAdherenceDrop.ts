import { schedules } from "@trigger.dev/sdk";
import { supabase } from "../lib/supabase";
import { triggerNovu } from "../lib/novu";

const WORKFLOW_ID = "hemo-adherence-drop";
const ADHERENCE_THRESHOLD = 0.7;
const LOOKBACK_DAYS = 7;

export const medicationAdherenceDrop = schedules.task({
  id: "medication-adherence-drop",
  // Every Monday at 08:00 UTC
  cron: "0 8 * * 1",
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

    // Get active medications per user (not archived)
    const { data: medications, error: medError } = await supabase
      .from("medications")
      .select("id, user_id")
      .in("user_id", allUserIds)
      .is("archived_at", null);
    if (medError) throw medError;

    // Group by user
    const medsByUser = new Map<string, string[]>();
    for (const med of medications ?? []) {
      const existing = medsByUser.get(med.user_id) ?? [];
      existing.push(med.id as string);
      medsByUser.set(med.user_id, existing);
    }

    // Only process users who have at least one active medication
    const usersWithMeds = [...medsByUser.keys()];
    if (usersWithMeds.length === 0) return { nudged: 0 };

    // Get medication_logs for the past week
    const { data: logs, error: logError } = await supabase
      .from("medication_logs")
      .select("user_id, medication_id, date")
      .in("user_id", usersWithMeds)
      .gte("date", weekAgoStr);
    if (logError) throw logError;

    // Count distinct taken (user_id, medication_id, date) combos
    const takenSet = new Set<string>();
    for (const log of logs ?? []) {
      takenSet.add(`${log.user_id}|${log.medication_id}|${log.date}`);
    }

    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, nickname")
      .in("user_id", usersWithMeds);
    if (profileError) throw profileError;

    const nicknameMap = new Map(
      (profiles ?? []).map((p) => [p.user_id, p.nickname as string | null])
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
        adherencePercent: Math.round(adherence * 100),
      });
      nudged++;
    }

    console.log(`[medication-adherence-drop] Nudged ${nudged} users`);
    return { nudged };
  },
});
