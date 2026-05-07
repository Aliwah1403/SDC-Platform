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

  // "As needed" meds have no fixed schedule
  if (!med.time || med.frequency === "As needed") return;

  const isWeekly = med.frequency === "Weekly";
  // Sunday = 1 in expo-notifications weekday convention
  const fallbackWeekday = new Date().getDay() + 1;
  const baseWeekday =
    Number.isInteger(med.weekday) && med.weekday >= 1 && med.weekday <= 7
      ? med.weekday
      : fallbackWeekday;
  const times = med.time
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  for (const timeStr of times) {
    const parsed = parseTimeToHourMinute(timeStr);
    if (!parsed) continue;

    const trigger = isWeekly
      ? weekdayTrigger(baseWeekday, parsed.hour, parsed.minute)
      : dailyTrigger(parsed.hour, parsed.minute);

    // Main dose notification
    await Notifications.scheduleNotificationAsync({
      identifier: `med-${med.id}-${timeStr}-dose`,
      content: {
        title: `Time for ${med.name}`,
        body: med.dosage ? `Take your ${med.dosage} dose` : "Take your dose",
        data: { type: "medication", medicationId: med.id },
        sound: true,
      },
      trigger,
    });
    posthog.capture('medication_reminder_sent', {
      medication_name: med.name,
      trigger_type: isWeekly ? 'weekly' : 'daily',
      offset_minutes: 0,
      notification_variant: 'dose',
    });

    const reminders = Array.isArray(med.reminders) ? med.reminders : [];

    // "Remind before" notifications
    for (const r of reminders.filter((r) => r.direction === "before")) {
      const t = offsetTime(parsed, -r.offsetMinutes);
      const reminderWeekday =
        ((((baseWeekday - 1 + t.dayShift) % 7) + 7) % 7) + 1;
      await Notifications.scheduleNotificationAsync({
        identifier: `med-${med.id}-${timeStr}-before-${r.offsetMinutes}`,
        content: {
          title: `${med.name} in ${r.offsetMinutes} min`,
          body: `A gentle reminder: your dose is soon.`,
          data: { type: "medication", medicationId: med.id },
          sound: true,
        },
        trigger: isWeekly
          ? weekdayTrigger(reminderWeekday, t.hour, t.minute)
          : dailyTrigger(t.hour, t.minute),
      });
    }

    // "Remind if missed" notifications
    for (const r of reminders.filter((r) => r.direction === "after")) {
      const t = offsetTime(parsed, r.offsetMinutes);
      const reminderWeekday =
        ((((baseWeekday - 1 + t.dayShift) % 7) + 7) % 7) + 1;
      await Notifications.scheduleNotificationAsync({
        identifier: `med-${med.id}-${timeStr}-after-${r.offsetMinutes}`,
        content: {
          title: `Did you take ${med.name}?`,
          body: `Just checking in on your ${timeStr} dose.`,
          data: { type: "medication", medicationId: med.id },
          sound: true,
        },
        trigger: isWeekly
          ? weekdayTrigger(reminderWeekday, t.hour, t.minute)
          : dailyTrigger(t.hour, t.minute),
      });
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
