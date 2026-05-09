import * as Notifications from "expo-notifications";
import { posthog } from "@/utils/analytics";

function parseTimeToHourMinute(timeStr) {
  const match = timeStr?.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return null;
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return { hour, minute };
}

function offsetTime({ hour, minute }, offsetMinutes) {
  const rawTotalMinutes = hour * 60 + minute + offsetMinutes;
  const dayShift = Math.floor(rawTotalMinutes / 1440);
  const totalMinutes = ((rawTotalMinutes % 1440) + 1440) % 1440; // wrap around midnight
  return {
    hour: Math.floor(totalMinutes / 60),
    minute: totalMinutes % 60,
    dayShift,
  };
}

function weekdayTrigger(weekday, hour, minute) {
  return {
    type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
    weekday,
    hour,
    minute,
  };
}

function dailyTrigger(hour, minute) {
  return {
    type: Notifications.SchedulableTriggerInputTypes.DAILY,
    hour,
    minute,
  };
}

export async function scheduleMedicationNotifications(med) {
  await cancelMedicationNotifications(med.id);

  const isAsNeeded = med.frequency === "As Needed" || med.frequency === "As needed";
  if (isAsNeeded) return;

  // Prefer new times[] array, fall back to splitting legacy time string
  const timesArray =
    Array.isArray(med.times) && med.times.length > 0
      ? med.times
      : med.time?.split(",").map((t) => t.trim()).filter(Boolean) ?? [];

  if (timesArray.length === 0) return;

  const isSpecificDays =
    med.frequency === "Specific Days" || med.frequency === "Weekly";

  // For specific days, build the list of weekdays to schedule; null = daily
  const fallbackWeekday = new Date().getDay() + 1;
  const scheduleDays = isSpecificDays
    ? Array.isArray(med.selectedDays) && med.selectedDays.length > 0
      ? med.selectedDays
      : med.weekday
        ? [med.weekday]
        : [fallbackWeekday]
    : null;

  const reminders = Array.isArray(med.reminders) ? med.reminders : [];

  for (const timeStr of timesArray) {
    const parsed = parseTimeToHourMinute(timeStr);
    if (!parsed) continue;

    const dayLoop = scheduleDays ?? [null];

    for (const day of dayLoop) {
      const dayKey = day != null ? `-d${day}` : "";
      const makeTrigger = (h, m) =>
        day != null ? weekdayTrigger(day, h, m) : dailyTrigger(h, m);

      // Main dose notification
      await Notifications.scheduleNotificationAsync({
        identifier: `med-${med.id}-${timeStr}${dayKey}-dose`,
        content: {
          title: `Time for ${med.name}`,
          body: med.dosage ? `Take your ${med.dosage} dose` : "Take your dose",
          data: { type: "medication", medicationId: med.id },
          sound: true,
        },
        trigger: makeTrigger(parsed.hour, parsed.minute),
      });
      posthog.capture("medication_reminder_sent", {
        medication_category: med.category,
        trigger_type: day != null ? "weekly" : "daily",
        offset_minutes: 0,
        notification_variant: "dose",
      });

      // "Remind before" notifications
      for (const r of reminders.filter((r) => r.direction === "before")) {
        const t = offsetTime(parsed, -r.offsetMinutes);
        const adjDay =
          day != null ? ((((day - 1 + t.dayShift) % 7) + 7) % 7) + 1 : null;
        await Notifications.scheduleNotificationAsync({
          identifier: `med-${med.id}-${timeStr}${dayKey}-before-${r.offsetMinutes}`,
          content: {
            title: `${med.name} in ${r.offsetMinutes} min`,
            body: `A gentle reminder: your dose is soon.`,
            data: { type: "medication", medicationId: med.id },
            sound: true,
          },
          trigger:
            adjDay != null
              ? weekdayTrigger(adjDay, t.hour, t.minute)
              : dailyTrigger(t.hour, t.minute),
        });
      }

      // "Remind if missed" notifications
      for (const r of reminders.filter((r) => r.direction === "after")) {
        const t = offsetTime(parsed, r.offsetMinutes);
        const adjDay =
          day != null ? ((((day - 1 + t.dayShift) % 7) + 7) % 7) + 1 : null;
        await Notifications.scheduleNotificationAsync({
          identifier: `med-${med.id}-${timeStr}${dayKey}-after-${r.offsetMinutes}`,
          content: {
            title: `Did you take ${med.name}?`,
            body: `Just checking in on your ${timeStr} dose.`,
            data: { type: "medication", medicationId: med.id },
            sound: true,
          },
          trigger:
            adjDay != null
              ? weekdayTrigger(adjDay, t.hour, t.minute)
              : dailyTrigger(t.hour, t.minute),
        });
      }
    }
  }
}

export async function cancelMedicationNotifications(medId) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const toCancel = scheduled
    .filter((n) => n.content.data?.medicationId === medId)
    .map((n) => n.identifier);
  await Promise.all(
    toCancel.map((id) => Notifications.cancelScheduledNotificationAsync(id)),
  );
}
