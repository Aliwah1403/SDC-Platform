import { schedules } from "@trigger.dev/sdk";
import { supabase } from "../../lib/supabase";
import { triggerNovuBulk } from "../../lib/novu";
import { Sentry } from "../../lib/sentry";

const WORKFLOW_ID = "hemo-adherence-drop";
const ADHERENCE_THRESHOLD = 0.7;
const DELIVERY_WEEKDAY = 4; // Thursday, where Sunday is 0.
const DELIVERY_HOUR = 18;

type LocalDateTime = {
  year: number;
  month: number;
  day: number;
  hour: number;
  weekday: number;
};

type MedicationRow = {
  id: string;
  user_id: string;
  frequency: string | null;
  time: string | null;
  times: unknown;
  selected_days: unknown;
  weekday: number | null;
  start_date: string | null;
  created_at: string;
};

type MedicationLogRow = {
  id: string;
  user_id: string;
  medication_id: string;
  date: string;
};

type AdherenceWindow = {
  start: string;
  end: string;
};

function localDateTime(at: Date, timezone: string): LocalDateTime {
  const format = (timeZone: string) =>
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
      weekday: "short",
    }).formatToParts(at);

  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = format(timezone);
  } catch {
    parts = format("UTC");
  }

  const numeric = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  const weekdayName = parts.find((part) => part.type === "weekday")?.value;
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return {
    year: numeric("year"),
    month: numeric("month"),
    day: numeric("day"),
    hour: numeric("hour"),
    weekday: Math.max(0, weekdays.indexOf(weekdayName ?? "Sun")),
  };
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function currentWeekToDate(local: LocalDateTime): AdherenceWindow {
  const end = new Date(Date.UTC(local.year, local.month - 1, local.day));
  const start = new Date(end);
  const daysSinceMonday = (local.weekday + 6) % 7;
  start.setUTCDate(start.getUTCDate() - daysSinceMonday);
  return { start: isoDate(start), end: isoDate(end) };
}

function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = new Date(`${start}T00:00:00.000Z`);
  const last = new Date(`${end}T00:00:00.000Z`);
  while (current <= last) {
    dates.push(isoDate(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

function numberArray(value: unknown): number[] {
  return Array.isArray(value)
    ? value.filter((item): item is number => Number.isInteger(item))
    : [];
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === "string" && item.length > 0))]
    : [];
}

function scheduledDoseCount(medication: MedicationRow, date: string): number {
  const frequency = medication.frequency ?? "Every Day";
  if (frequency === "As Needed" || frequency === "As needed") return 0;

  const medicationStart = (medication.start_date ?? medication.created_at).slice(0, 10);
  if (date < medicationStart) return 0;

  const isSpecificDays = frequency === "Specific Days" || frequency === "Weekly";
  if (isSpecificDays) {
    const selectedDays = numberArray(medication.selected_days);
    const scheduledDays = selectedDays.length > 0
      ? selectedDays
      : medication.weekday != null
        ? [medication.weekday]
        : [];
    const expoWeekday = new Date(`${date}T00:00:00.000Z`).getUTCDay() + 1;
    if (!scheduledDays.includes(expoWeekday)) return 0;
  }

  const times = stringArray(medication.times);
  if (times.length > 0) return times.length;

  const legacyTimes = medication.time
    ?.split(",")
    .map((time) => time.trim())
    .filter(Boolean) ?? [];
  if (legacyTimes.length > 0) return legacyTimes.length;
  if (frequency === "Twice daily") return 2;
  if (frequency === "Three times daily") return 3;
  return 1;
}

function calculateAdherence(
  medications: MedicationRow[],
  logs: MedicationLogRow[],
  window: AdherenceWindow
) {
  const logCountByMedicationDate = new Map<string, number>();
  for (const log of logs) {
    const key = `${log.medication_id}|${log.date}`;
    logCountByMedicationDate.set(key, (logCountByMedicationDate.get(key) ?? 0) + 1);
  }

  let scheduledDoses = 0;
  let takenDoses = 0;
  for (const medication of medications) {
    for (const date of dateRange(window.start, window.end)) {
      const scheduledForDate = scheduledDoseCount(medication, date);
      scheduledDoses += scheduledForDate;
      takenDoses += Math.min(
        scheduledForDate,
        logCountByMedicationDate.get(`${medication.id}|${date}`) ?? 0
      );
    }
  }

  return {
    scheduledDoses,
    takenDoses,
    adherence: scheduledDoses > 0 ? takenDoses / scheduledDoses : 1,
  };
}

export const medicationAdherenceDrop = schedules.task({
  id: "medication-adherence-drop",
  // Check hourly so each user receives the nudge at 6 PM Thursday in their
  // saved timezone, while there is still time to act during the current week.
  cron: "0 * * * *",
  run: async (payload) => {
    const runAt = new Date(payload.timestamp);

    const { data: tokenRows, error: tokenError } = await supabase
      .from("push_tokens")
      .select("user_id");
    if (tokenError) throw tokenError;

    const allUserIds = [
      ...new Set((tokenRows ?? []).map((row) => row.user_id as string)),
    ];
    if (allUserIds.length === 0) return { nudged: 0, eligible: 0 };

    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, nickname, timezone")
      .in("user_id", allUserIds);
    if (profileError) throw profileError;

    const eligibleProfiles: Array<{
      userId: string;
      nickname: string;
      window: AdherenceWindow;
    }> = [];

    for (const profile of profiles ?? []) {
      const local = localDateTime(
        runAt,
        (profile.timezone as string | null) ?? "UTC"
      );
      if (local.weekday !== DELIVERY_WEEKDAY || local.hour !== DELIVERY_HOUR) continue;

      eligibleProfiles.push({
        userId: profile.user_id as string,
        nickname: (profile.nickname as string | null) ?? "there",
        window: currentWeekToDate(local),
      });
    }

    if (eligibleProfiles.length === 0) return { nudged: 0, eligible: 0 };

    const eligibleUserIds = eligibleProfiles.map((profile) => profile.userId);
    const { data: medications, error: medError } = await supabase
      .from("medications")
      .select("id, user_id, frequency, time, times, selected_days, weekday, start_date, created_at")
      .in("user_id", eligibleUserIds)
      .eq("is_active", true);
    if (medError) throw medError;

    const earliestStart = eligibleProfiles.reduce(
      (earliest, profile) => profile.window.start < earliest ? profile.window.start : earliest,
      eligibleProfiles[0].window.start
    );
    const latestEnd = eligibleProfiles.reduce(
      (latest, profile) => profile.window.end > latest ? profile.window.end : latest,
      eligibleProfiles[0].window.end
    );

    const { data: logs, error: logError } = await supabase
      .from("medication_logs")
      .select("id, user_id, medication_id, date")
      .in("user_id", eligibleUserIds)
      .gte("date", earliestStart)
      .lte("date", latestEnd);
    if (logError) throw logError;

    const medicationsByUser = new Map<string, MedicationRow[]>();
    for (const medication of (medications ?? []) as MedicationRow[]) {
      const rows = medicationsByUser.get(medication.user_id) ?? [];
      rows.push(medication);
      medicationsByUser.set(medication.user_id, rows);
    }

    const logsByUser = new Map<string, MedicationLogRow[]>();
    for (const log of (logs ?? []) as MedicationLogRow[]) {
      const rows = logsByUser.get(log.user_id) ?? [];
      rows.push(log);
      logsByUser.set(log.user_id, rows);
    }

    const events = eligibleProfiles.flatMap(({ userId, nickname, window }) => {
      const adherence = calculateAdherence(
        medicationsByUser.get(userId) ?? [],
        logsByUser.get(userId) ?? [],
        window
      );
      if (
        adherence.scheduledDoses === 0 ||
        adherence.adherence >= ADHERENCE_THRESHOLD
      ) {
        return [];
      }

      return [{
        workflowId: WORKFLOW_ID,
        subscriberId: userId,
        payload: {
          nickname,
          adherencePercent: Math.round(adherence.adherence * 100),
          takenDoses: adherence.takenDoses,
          scheduledDoses: adherence.scheduledDoses,
        },
        idempotencyKey: `${WORKFLOW_ID}:${userId}:${window.end}`,
      }];
    });

    if (events.length === 0) {
      return { nudged: 0, eligible: eligibleProfiles.length };
    }

    try {
      const { failedCount } = await triggerNovuBulk(events);
      if (failedCount > 0) {
        Sentry.captureException(
          new Error(`${failedCount} medication adherence notifications failed`),
          { tags: { task: "medication-adherence-drop" } }
        );
      }

      const nudged = events.length - failedCount;
      console.log(`[medication-adherence-drop] Nudged ${nudged} users`);
      return {
        nudged,
        eligible: eligibleProfiles.length,
        failed: failedCount,
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { task: "medication-adherence-drop" },
      });
      throw error;
    }
  },
});
