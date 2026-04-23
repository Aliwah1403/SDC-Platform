import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { fetchProfile } from '@/services/supabaseQueries';
import { scheduleCheckInReminders } from '@/utils/checkInNotifications';
import { supabase } from '@/utils/auth/supabase';

const TASK_NAME = 'checkin-notification-refresh';

// Must be module-level — TaskManager needs this defined when the JS bundle
// loads in the background, before any React component mounts.
TaskManager.defineTask(TASK_NAME, async () => {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const hasCheckins = scheduled.some((n) => n.content.data?.type === 'checkin');
    if (hasCheckins) return BackgroundTask.BackgroundTaskResult.Success;

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return BackgroundTask.BackgroundTaskResult.Success;

    const profile = await fetchProfile(userId);
    if (profile?.notificationsEnabled) {
      await scheduleCheckInReminders(profile.checkInFrequency ?? 2);
    }
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerNotificationRefreshTask() {
  const status = await BackgroundTask.getStatusAsync();
  if (
    status === BackgroundTask.BackgroundTaskStatus.Restricted ||
    status === BackgroundTask.BackgroundTaskStatus.Denied
  ) return;

  const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
  if (isRegistered) return;

  await BackgroundTask.registerTaskAsync(TASK_NAME, {
    minimumInterval: 60 * 12, // 12 hours in minutes
  });
}
