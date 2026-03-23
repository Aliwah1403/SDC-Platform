import * as Calendar from "expo-calendar";
import * as Notifications from "expo-notifications";

// Convert "10:30 AM" → "10:30" (24h), with optional minuteOffset for end time
export function convertTo24h(timeStr, minuteOffset = 0) {
  const [time, period] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  const total = hours * 60 + minutes + minuteOffset;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Add appointment to the device's default calendar
// Returns calendarEventId string or null if permission denied
export async function addToDeviceCalendar(appt) {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== "granted") return null;

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const writableCal = calendars.find((c) => c.allowsModifications) ?? calendars[0];
    if (!writableCal) return null;

    const startDate = new Date(`${appt.date}T${convertTo24h(appt.time)}:00`);
    const endDate = new Date(`${appt.date}T${convertTo24h(appt.time, 60)}:00`);

    const eventId = await Calendar.createEventAsync(writableCal.id, {
      title: appt.doctor
        ? `${appt.title} — Dr. ${appt.doctor}`
        : appt.title,
      location: appt.facility,
      startDate,
      endDate,
      notes: appt.notes || "",
      alarms: [{ relativeOffset: -60 }, { relativeOffset: -1440 }],
    });

    return eventId;
  } catch {
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

// Schedule push notification reminders for an appointment
// options: { hour: boolean, day: boolean }
// Returns array of notification IDs (store these to cancel later)
export async function scheduleReminders(appt, options = { hour: true, day: true }) {
  const ids = [];
  try {
    const apptDate = new Date(`${appt.date}T${convertTo24h(appt.time)}:00`);
    const now = new Date();

    if (options.day) {
      const trigger = new Date(apptDate.getTime() - 24 * 60 * 60 * 1000);
      if (trigger > now) {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: "Appointment tomorrow",
            body: `${appt.title}${appt.doctor ? ` with Dr. ${appt.doctor}` : ""} at ${appt.time}`,
            data: { appointmentId: appt.id },
          },
          trigger,
        });
        ids.push(id);
      }
    }

    if (options.hour) {
      const trigger = new Date(apptDate.getTime() - 60 * 60 * 1000);
      if (trigger > now) {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: "Appointment in 1 hour",
            body: `${appt.title}${appt.facility ? ` at ${appt.facility}` : ""}`,
            data: { appointmentId: appt.id },
          },
          trigger,
        });
        ids.push(id);
      }
    }
  } catch {
    // Notification scheduling failed (permission denied etc.) — return empty
  }
  return ids;
}

// Cancel scheduled notifications for an appointment
export async function cancelReminders(reminderIds = []) {
  await Promise.all(
    reminderIds.map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => {})
    )
  );
}
