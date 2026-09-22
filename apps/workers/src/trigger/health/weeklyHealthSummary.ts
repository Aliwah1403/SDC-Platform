import { schedules } from "@trigger.dev/sdk";
import { supabase } from "../../lib/supabase";
import { triggerNovuBulk } from "../../lib/novu";
import { Sentry } from "../../lib/sentry";

const WORKFLOW_ID = "hemo-weekly-summary";
const DELIVERY_HOUR = 8;

type HydrationUnit = "glasses" | "ml" | "L" | "floz";

type LocalDateTime = {
  year: number;
  month: number;
  day: number;
  hour: number;
};

type WeekWindow = {
  start: string;
  end: string;
};

type SummaryRow = {
  user_id: string;
  date: string;
  pain_level: number | null;
  hydration: number | null;
  mood: number | null;
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
    }).formatToParts(at);

  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = format(timezone);
  } catch {
    parts = format("UTC");
  }

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
  };
}

function isMonday(local: LocalDateTime) {
  return new Date(
    Date.UTC(local.year, local.month - 1, local.day)
  ).getUTCDay() === 1;
}

function previousCompleteWeek(local: LocalDateTime): WeekWindow {
  const currentMonday = new Date(
    Date.UTC(local.year, local.month - 1, local.day)
  );
  const start = new Date(currentMonday);
  start.setUTCDate(start.getUTCDate() - 7);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function formatHydrationForNotification(
  ml: number | null,
  unit: HydrationUnit
) {
  if (ml == null) {
    return {
      value: null,
      unitLabel:
        unit === "ml" ? "ml" : unit === "L" ? "L" : unit === "floz" ? "fl oz" : "glasses",
    };
  }

  switch (unit) {
    case "ml":
      return { value: Math.round(ml), unitLabel: "ml" };
    case "L":
      return { value: Math.round((ml / 1000) * 10) / 10, unitLabel: "L" };
    case "floz":
      return { value: Math.round(ml / 29.5735), unitLabel: "fl oz" };
    case "glasses":
    default:
      return {
        value: Math.round((ml / 250) * 10) / 10,
        unitLabel: "glasses",
      };
  }
}

export const weeklyHealthSummary = schedules.task({
  id: "weekly-health-summary",
  // Check hourly so each user receives the completed Monday-Sunday recap at
  // 8 AM Monday in their saved timezone.
  cron: "0 * * * *",
  run: async (payload) => {
    const runAt = new Date(payload.timestamp);

    const { data: tokenRows, error: tokenError } = await supabase
      .from("push_tokens")
      .select("user_id");
    if (tokenError) throw tokenError;

    const userIds = [
      ...new Set((tokenRows ?? []).map((row) => row.user_id as string)),
    ];
    if (userIds.length === 0) return { sent: 0, eligible: 0 };

    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, nickname, timezone, hydration_display_unit")
      .in("user_id", userIds);
    if (profileError) throw profileError;

    const recipientsByWeek = new Map<
      string,
      { week: WeekWindow; profiles: typeof profiles }
    >();

    for (const profile of profiles ?? []) {
      const local = localDateTime(
        runAt,
        (profile.timezone as string | null) ?? "UTC"
      );
      if (!isMonday(local) || local.hour !== DELIVERY_HOUR) continue;

      const week = previousCompleteWeek(local);
      const key = `${week.start}:${week.end}`;
      const group = recipientsByWeek.get(key) ?? { week, profiles: [] };
      group.profiles.push(profile);
      recipientsByWeek.set(key, group);
    }

    const events: Array<{
      workflowId: string;
      subscriberId: string;
      payload: Record<string, unknown>;
      idempotencyKey: string;
    }> = [];

    for (const { week, profiles: eligibleProfiles } of recipientsByWeek.values()) {
      const eligibleUserIds = eligibleProfiles.map(
        (profile) => profile.user_id as string
      );
      const { data: summaries, error: summaryError } = await supabase
        .from("daily_summaries")
        .select("user_id, date, pain_level, hydration, mood")
        .in("user_id", eligibleUserIds)
        .gte("date", week.start)
        .lte("date", week.end)
        .order("date", { ascending: true });
      if (summaryError) throw summaryError;

      const rowsByUser = new Map<string, SummaryRow[]>();
      for (const row of (summaries ?? []) as SummaryRow[]) {
        const rows = rowsByUser.get(row.user_id) ?? [];
        rows.push(row);
        rowsByUser.set(row.user_id, rows);
      }

      for (const profile of eligibleProfiles) {
        const userId = profile.user_id as string;
        const rows = rowsByUser.get(userId) ?? [];
        const loggedDates = new Set(
          rows
            .filter(
              (row) =>
                (row.pain_level ?? 0) > 0 ||
                (row.hydration ?? 0) > 0 ||
                (row.mood ?? 0) > 0
            )
            .map((row) => row.date)
        );
        const daysLogged = loggedDates.size;
        if (daysLogged === 0) continue;

        const painValues = rows
          .map((row) => row.pain_level)
          .filter((value): value is number => value != null && value > 0);
        const hydrationValues = rows
          .map((row) => row.hydration)
          .filter((value): value is number => value != null && value > 0);
        const avgPain =
          painValues.length > 0
            ? Math.round(
                (painValues.reduce((total, value) => total + value, 0) /
                  painValues.length) *
                  10
              ) / 10
            : null;
        const avgHydrationMl =
          hydrationValues.length > 0
            ? hydrationValues.reduce((total, value) => total + value, 0) /
              hydrationValues.length
            : null;
        const hydration = formatHydrationForNotification(
          avgHydrationMl,
          (profile.hydration_display_unit as HydrationUnit | null) ?? "glasses"
        );

        events.push({
          workflowId: WORKFLOW_ID,
          subscriberId: userId,
          payload: {
            type: "weekly_recap",
            weekStart: week.start,
            nickname: profile.nickname ?? "there",
            // The existing Novu template calls this "days logged". Keep the
            // field for compatibility while making it match the recap card.
            streak: daysLogged,
            logsThisWeek: daysLogged,
            avgPain,
            avgHydration: hydration.value,
            hydrationUnit: hydration.unitLabel,
          },
          idempotencyKey: `${WORKFLOW_ID}:${userId}:${week.start}`,
        });
      }
    }

    if (events.length === 0) {
      return {
        sent: 0,
        eligible: [...recipientsByWeek.values()].reduce(
          (total, group) => total + group.profiles.length,
          0
        ),
      };
    }

    try {
      const { failedCount } = await triggerNovuBulk(events);
      if (failedCount > 0) {
        Sentry.captureException(
          new Error(`${failedCount} weekly recap notifications failed`),
          { tags: { task: "weekly-health-summary" } }
        );
      }

      const sent = events.length - failedCount;
      console.log(`[weekly-health-summary] Sent to ${sent} users`);
      return { sent, eligible: events.length, failed: failedCount };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { task: "weekly-health-summary" },
      });
      throw error;
    }
  },
});
