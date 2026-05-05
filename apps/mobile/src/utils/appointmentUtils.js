import * as Calendar from "expo-calendar";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { Sentry } from "@/utils/sentry";

// Convert "10:30 AM" → "10:30" (24h), with optional minuteOffset for end time.
// Uses regex to handle both regular space and narrow no-break space (U+202F)
// which iOS 16+ toLocaleTimeString emits between the time and AM/PM.
export function convertTo24h(timeStr, minuteOffset = 0) {
  const match = timeStr.match(/(\d+):(\d+)\s*([AaPp][Mm])/);
  if (!match) return "00:00";
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  const total = hours * 60 + minutes + minuteOffset;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Add appointment to the device's default calendar
// Returns calendarEventId string or null if permission denied / creation fails
export async function addToDeviceCalendar(appt) {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== "granted") {
      console.warn("[Calendar] Permission not granted:", status);
      return null;
    }

    // iOS: use the system default calendar (respects the user's chosen default in Settings)
    // Android: find the primary writable calendar
    let calendarId;
    if (Platform.OS === "ios") {
      const defaultCal = await Calendar.getDefaultCalendarAsync();
      calendarId = defaultCal?.id;
    }
    if (!calendarId) {
      const all = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const writable =
        all.find((c) => c.allowsModifications && c.isPrimary) ??
        all.find((c) => c.allowsModifications);
      calendarId = writable?.id;
    }
    if (!calendarId) {
      console.warn("[Calendar] No writable calendar found");
      return null;
    }

    const startDate = new Date(`${appt.date}T${convertTo24h(appt.time)}:00`);
    const endDate = new Date(`${appt.date}T${convertTo24h(appt.time, 60)}:00`);

    const eventId = await Calendar.createEventAsync(calendarId, {
      title: appt.doctor ? `${appt.title} — Dr. ${appt.doctor}` : appt.title,
      location: appt.facility,
      startDate,
      endDate,
      notes: appt.notes || "",
      alarms: [{ relativeOffset: -60 }, { relativeOffset: -1440 }],
    });

    return eventId;
  } catch (err) {
    console.error("[Calendar] createEventAsync failed:", err);
    Sentry.captureException(err);
    return null;
  }
}

// Remove a previously-created calendar event
export async function removeFromDeviceCalendar(calendarEventId) {
  if (!calendarEventId) return;
  try {
    await Calendar.deleteEventAsync(calendarEventId);
  } catch {
    // Event may already be deleted — ignore
  }
}

function minutesToLabel(minutes) {
  if (minutes === 0) return "now";
  if (minutes < 60) return `${minutes} minutes`;
  if (minutes === 60) return "1 hour";
  if (minutes < 1440) return `${minutes / 60} hours`;
  if (minutes === 1440) return "1 day";
  return `${minutes / 1440} days`;
}

// Schedule push notification reminders for an appointment.
// minuteOffsets: number[] — how many minutes before the appointment each reminder fires.
// Returns array of notification IDs (store these to cancel later).
export async function scheduleReminders(appt, minuteOffsets = [], nickname = "there") {
  const ids = [];
  try {
    const apptDate = new Date(`${appt.date}T${convertTo24h(appt.time)}:00`);
    const now = new Date();

    for (const minutes of minuteOffsets) {
      const trigger = new Date(apptDate.getTime() - minutes * 60 * 1000);
      if (trigger <= now) continue;
      const timeLabel = minutesToLabel(minutes);
      const isNow = minutes === 0;
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: isNow ? `Your ${appt.title} is starting now!` : `Heads up — ${appt.title} in ${timeLabel}!`,
          body: isNow
            ? `Hey ${nickname}, your appointment is starting. Hope it goes well!`
            : `Hey ${nickname}, just a friendly reminder about your ${appt.title} appointment. Hope it goes smoothly!`,
          data: { type: "appointment", appointmentId: appt.id },
        },
        trigger,
      });
      ids.push(id);
    }
  } catch (err) {
    Sentry.captureException(err);
  }
  return ids;
}

// Cancel scheduled notifications for an appointment
export async function cancelReminders(reminderIds = []) {
  await Promise.all(
    reminderIds.map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => {}),
    ),
  );
}
