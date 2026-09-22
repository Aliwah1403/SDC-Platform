import { schedules } from "@trigger.dev/sdk";
import { supabase } from "../../lib/supabase";
import { triggerNovuBulk } from "../../lib/novu";
import { Sentry } from "../../lib/sentry";

const WORKFLOW_ID = "hemo-monthly-summary";
const DELIVERY_HOUR = 8;

type LocalDateTime = {
  year: number;
  month: number;
  day: number;
  hour: number;
};

type MonthWindow = {
  start: string;
  end: string;
  name: string;
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

function previousMonth(year: number, month: number): MonthWindow {
  const previousYear = month === 1 ? year - 1 : year;
  const previousMonthNumber = month === 1 ? 12 : month - 1;
  const monthNumber = String(previousMonthNumber).padStart(2, "0");
  const lastDay = new Date(
    Date.UTC(previousYear, previousMonthNumber, 0)
  ).getUTCDate();

  return {
    start: `${previousYear}-${monthNumber}-01`,
    end: `${previousYear}-${monthNumber}-${String(lastDay).padStart(2, "0")}`,
    name: new Intl.DateTimeFormat("en-US", {
      month: "long",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(previousYear, previousMonthNumber - 1, 1))),
  };
}

export const monthlyHealthSummary = schedules.task({
  id: "monthly-health-summary",
  // Check hourly so each user receives the recap at 8 AM on the first day of
  // the month in their saved timezone.
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
      .select("user_id, timezone")
      .in("user_id", userIds);
    if (profileError) throw profileError;

    const recipientsByMonth = new Map<
      string,
      { month: MonthWindow; userIds: string[] }
    >();

    for (const profile of profiles ?? []) {
      const local = localDateTime(
        runAt,
        (profile.timezone as string | null) ?? "UTC"
      );
      if (local.day !== 1 || local.hour !== DELIVERY_HOUR) continue;

      const month = previousMonth(local.year, local.month);
      const key = `${month.start}:${month.end}`;
      const group = recipientsByMonth.get(key) ?? { month, userIds: [] };
      group.userIds.push(profile.user_id as string);
      recipientsByMonth.set(key, group);
    }

    const events: Array<{
      workflowId: string;
      subscriberId: string;
      payload: Record<string, unknown>;
      idempotencyKey: string;
    }> = [];

    for (const { month, userIds: eligibleUserIds } of recipientsByMonth.values()) {
      const { data: summaries, error: summaryError } = await supabase
        .from("daily_summaries")
        .select("user_id, date, pain_level, hydration, mood")
        .in("user_id", eligibleUserIds)
        .gte("date", month.start)
        .lte("date", month.end);
      if (summaryError) throw summaryError;

      const datesByUser = new Map<string, Set<string>>();
      for (const row of summaries ?? []) {
        if (
          (row.pain_level ?? 0) <= 0 &&
          (row.hydration ?? 0) <= 0 &&
          (row.mood ?? 0) <= 0
        ) {
          continue;
        }
        const dates = datesByUser.get(row.user_id as string) ?? new Set<string>();
        dates.add(row.date as string);
        datesByUser.set(row.user_id as string, dates);
      }

      for (const userId of eligibleUserIds) {
        const daysLogged = datesByUser.get(userId)?.size ?? 0;
        if (daysLogged === 0) continue;

        events.push({
          workflowId: WORKFLOW_ID,
          subscriberId: userId,
          payload: {
            type: "monthly_recap",
            monthName: month.name,
            monthStart: month.start,
            daysLogged,
            daysLoggedLabel: `${daysLogged} ${daysLogged === 1 ? "day" : "days"}`,
          },
          idempotencyKey: `${WORKFLOW_ID}:${userId}:${month.start}`,
        });
      }
    }

    if (events.length === 0) {
      return {
        sent: 0,
        eligible: [...recipientsByMonth.values()].reduce(
          (total, group) => total + group.userIds.length,
          0
        ),
      };
    }

    try {
      const { failedCount } = await triggerNovuBulk(events);
      if (failedCount > 0) {
        Sentry.captureException(
          new Error(`${failedCount} monthly recap notifications failed`),
          { tags: { task: "monthly-health-summary" } }
        );
      }

      const sent = events.length - failedCount;
      console.log(`[monthly-health-summary] Sent to ${sent} users`);
      return { sent, eligible: events.length, failed: failedCount };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { task: "monthly-health-summary" },
      });
      throw error;
    }
  },
});
