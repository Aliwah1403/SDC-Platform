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

// src/trigger/appointmentReminders.ts
init_esm();
var WORKFLOW_ID = "hemo-appointment-reminder";
var WINDOWS = [
  { label: "24 hours", targetMs: 24 * 60 * 60 * 1e3, windowMs: 15 * 60 * 1e3 },
  { label: "1 hour", targetMs: 60 * 60 * 1e3, windowMs: 15 * 60 * 1e3 }
];
var appointmentReminders = schedules_exports.task({
  id: "appointment-reminders",
  // Every 30 minutes
  cron: "*/30 * * * *",
  run: /* @__PURE__ */ __name(async () => {
    const now = /* @__PURE__ */ new Date();
    const appointmentDatetimesToQuery = [];
    for (const window of WINDOWS) {
      const targetTime = new Date(now.getTime() + window.targetMs);
      appointmentDatetimesToQuery.push(targetTime);
    }
    const rangeStart = new Date(now.getTime() + 45 * 60 * 1e3);
    const rangeEnd = new Date(now.getTime() + 25 * 60 * 60 * 1e3);
    const rangeStartDate = rangeStart.toISOString().split("T")[0];
    const rangeEndDate = rangeEnd.toISOString().split("T")[0];
    const { data: appointments, error } = await supabase.from("appointments").select("id, user_id, title, doctor, date, time").gte("date", rangeStartDate).lte("date", rangeEndDate);
    if (error) throw error;
    if (!appointments || appointments.length === 0) return { reminded: 0 };
    const userIds = [...new Set(appointments.map((a) => a.user_id))];
    const { data: profiles, error: profileError } = await supabase.from("profiles").select("user_id, nickname").in("user_id", userIds);
    if (profileError) throw profileError;
    const nicknameMap = new Map(
      (profiles ?? []).map((p) => [p.user_id, p.nickname])
    );
    let reminded = 0;
    for (const appt of appointments) {
      if (!appt.date) continue;
      const timeStr = appt.time ?? "12:00";
      const apptDatetime = /* @__PURE__ */ new Date(`${appt.date}T${timeStr}:00Z`);
      const msUntil = apptDatetime.getTime() - now.getTime();
      for (const window of WINDOWS) {
        const diff = Math.abs(msUntil - window.targetMs);
        if (diff <= window.windowMs) {
          await triggerNovu(WORKFLOW_ID, appt.user_id, {
            nickname: nicknameMap.get(appt.user_id) ?? "there",
            title: appt.title,
            doctor: appt.doctor ?? null,
            timeLabel: window.label
          });
          reminded++;
          break;
        }
      }
    }
    console.log(`[appointment-reminders] Sent ${reminded} reminders`);
    return { reminded };
  }, "run")
});
export {
  appointmentReminders
};
//# sourceMappingURL=appointmentReminders.mjs.map
