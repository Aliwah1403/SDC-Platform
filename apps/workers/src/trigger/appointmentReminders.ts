import { schedules } from "@trigger.dev/sdk";
import { supabase } from "../lib/supabase";
import { triggerNovu } from "../lib/novu";

const WORKFLOW_ID = "hemo-appointment-reminder";

// Reminder windows: fires when appointment is ~24h or ~1h away (±15 min)
const WINDOWS = [
  { label: "24 hours", targetMs: 24 * 60 * 60 * 1000, windowMs: 15 * 60 * 1000 },
  { label: "1 hour", targetMs: 60 * 60 * 1000, windowMs: 15 * 60 * 1000 },
] as const;

export const appointmentReminders = schedules.task({
  id: "appointment-reminders",
  // Every 30 minutes
  cron: "*/30 * * * *",
  run: async () => {
    const now = new Date();

    // Collect all appointment datetimes we care about across both windows
    const appointmentDatetimesToQuery: Date[] = [];
    for (const window of WINDOWS) {
      const targetTime = new Date(now.getTime() + window.targetMs);
      appointmentDatetimesToQuery.push(targetTime);
    }

    // Query appointments in the broadest possible range (1h from now to 25h from now)
    const rangeStart = new Date(now.getTime() + 45 * 60 * 1000); // 45 min from now
    const rangeEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000); // 25 hours from now

    const rangeStartDate = rangeStart.toISOString().split("T")[0];
    const rangeEndDate = rangeEnd.toISOString().split("T")[0];

    const { data: appointments, error } = await supabase
      .from("appointments")
      .select("id, user_id, title, doctor, date, time")
      .gte("date", rangeStartDate)
      .lte("date", rangeEndDate);
    if (error) throw error;
    if (!appointments || appointments.length === 0) return { reminded: 0 };

    const userIds = [...new Set(appointments.map((a) => a.user_id as string))];
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, nickname")
      .in("user_id", userIds);
    if (profileError) throw profileError;

    const nicknameMap = new Map(
      (profiles ?? []).map((p) => [p.user_id, p.nickname as string | null])
    );

    let reminded = 0;
    for (const appt of appointments) {
      if (!appt.date) continue;

      // Build appointment datetime (use noon UTC if no time provided)
      const timeStr = (appt.time as string | null) ?? "12:00";
      const apptDatetime = new Date(`${appt.date}T${timeStr}:00Z`);
      const msUntil = apptDatetime.getTime() - now.getTime();

      for (const window of WINDOWS) {
        const diff = Math.abs(msUntil - window.targetMs);
        if (diff <= window.windowMs) {
          await triggerNovu(WORKFLOW_ID, appt.user_id, {
            nickname: nicknameMap.get(appt.user_id) ?? "there",
            title: appt.title,
            doctor: appt.doctor ?? null,
            timeLabel: window.label,
          });
          reminded++;
          break; // Only send one window reminder per appointment per run
        }
      }
    }

    console.log(`[appointment-reminders] Sent ${reminded} reminders`);
    return { reminded };
  },
});
