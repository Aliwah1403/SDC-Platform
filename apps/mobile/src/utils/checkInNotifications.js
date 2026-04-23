import * as Notifications from 'expo-notifications';
import { CHECK_IN_SCHEDULE } from '@/constants/checkInSchedule';

const NOTIFICATION_TAG = 'checkin';

export async function scheduleCheckInReminders(frequency = 2) {
  // Cancel any existing check-in reminders before re-scheduling
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const checkinIds = scheduled
    .filter((n) => n.content.data?.type === NOTIFICATION_TAG)
    .map((n) => n.identifier);
  await Promise.all(checkinIds.map((id) => Notifications.cancelScheduledNotificationAsync(id)));

  const slots = CHECK_IN_SCHEDULE[frequency] ?? CHECK_IN_SCHEDULE[2];
  for (const { hour, minute } of slots) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time to log 🩸',
        body: 'How are you feeling today? Take a moment to log your health check-in.',
        data: { type: NOTIFICATION_TAG },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
    });
  }
}

export async function cancelCheckInReminders() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const checkinIds = scheduled
    .filter((n) => n.content.data?.type === NOTIFICATION_TAG)
    .map((n) => n.identifier);
  await Promise.all(checkinIds.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}
