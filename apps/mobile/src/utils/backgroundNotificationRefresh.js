import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchProfile } from '@/services/supabase/profile';
import { fetchMedications } from '@/services/supabase/medications';
import { scheduleCheckInReminders } from '@/utils/checkInNotifications';
import { scheduleHydrationReminders } from '@/utils/hydrationReminders';
import { scheduleMedicationNotifications } from '@/utils/medicationNotifications';
import { supabase } from '@/utils/auth/supabase';

const TASK_NAME = 'checkin-notification-refresh';

// zustand-persist's storage key for store/hydrationStore.js. Read directly
// here — this task runs headlessly (no React tree mounted), so zustand-persist
// may not have rehydrated and useHydrationStore.getState() cannot be trusted.
const HYDRATION_STORE_KEY = 'hydration-store';

async function getPersistedHydrationReminderFrequency() {
  try {
    const raw = await AsyncStorage.getItem(HYDRATION_STORE_KEY);
    if (!raw) return 'off';
    const parsed = JSON.parse(raw);
    return parsed?.state?.hydrationReminderFrequency ?? 'off';
  } catch {
    return 'off';
  }
}

// Must be module-level — TaskManager needs this defined when the JS bundle
// loads in the background, before any React component mounts.
TaskManager.defineTask(TASK_NAME, async () => {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const hasCheckins = scheduled.some((n) => n.content.data?.type === 'checkin');
    const hasHydrationReminders = scheduled.some((n) => n.content.data?.type === 'hydration_reminder');
    const hasMedicationReminders = scheduled.some((n) => n.content.data?.type === 'medication');

    if (!hasHydrationReminders) {
      const frequency = await getPersistedHydrationReminderFrequency();
      if (frequency !== 'off') {
        await scheduleHydrationReminders(frequency);
      }
    }

    // Nothing else here needs the network — bail early once check-in AND
    // medication reminders are both intact.
    if (hasCheckins && hasMedicationReminders) return BackgroundTask.BackgroundTaskResult.Success;

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return BackgroundTask.BackgroundTaskResult.Success;

    if (!hasCheckins) {
      const profile = await fetchProfile(userId);
      if (profile?.notificationsEnabled) {
        await scheduleCheckInReminders(profile.checkInFrequency ?? 2);
      }
    }

    // iOS can silently clear scheduled locals after restore/reinstall — restore
    // medication reminders (with their "Mark as taken" action) if they're gone.
    if (!hasMedicationReminders) {
      const meds = await fetchMedications(userId);
      for (const med of meds ?? []) {
        await scheduleMedicationNotifications(med, { trackAnalytics: false });
      }
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
