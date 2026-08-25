import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/utils/auth/store';
import { useHydrationStore } from '@/store/hydrationStore';
import { supabase } from '@/utils/auth/supabase';
import { addHydrationQuickly } from '@/services/supabase/health';
import { addMedicationLog } from '@/services/supabase/medications';
import { fetchHydrationContainers } from '@/services/supabase/hydration';
import { fetchMetricGoals } from '@/services/supabase/goals';
import { FALLBACK_CONTAINERS } from '@/constants/hydrationContainers';
import { formatHydration, glassesFromMl } from '@/utils/hydrationUnits';
import { DEFAULT_SUGGESTED_ML } from '@/utils/hydrationGoal';
import { posthog } from '@/utils/analytics';
import { HYDRATION_CATEGORY, maybeSilenceHydrationReminders } from '@/utils/hydrationReminders';
import { queryKeys } from '@/hooks/queryKeys';

export { HYDRATION_CATEGORY };
export const MEDICATION_CATEGORY = 'medication';

export const HYDRATION_LOG_ACTION = 'hydration_log';
export const HYDRATION_OPEN_ACTION = 'hydration_open';
export const MEDICATION_TAKEN_ACTION = 'medication_taken';

// Small AsyncStorage LRU so a re-delivered notification response (e.g. cold-start
// recovery replaying the same getLastNotificationResponseAsync() result across
// launches) can never double-log (Step 10 decision 7).
const PROCESSED_IDS_KEY = 'hemo_processed_notification_response_ids';
const MAX_PROCESSED_IDS = 50;

async function hasBeenProcessed(identifier) {
  try {
    const raw = await AsyncStorage.getItem(PROCESSED_IDS_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    return ids.includes(identifier);
  } catch (err) {
    console.error('[NotificationActions] Failed to read processed-ids cache:', err);
    return false;
  }
}

async function markProcessed(identifier) {
  try {
    const raw = await AsyncStorage.getItem(PROCESSED_IDS_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    const next = [...ids, identifier].slice(-MAX_PROCESSED_IDS);
    await AsyncStorage.setItem(PROCESSED_IDS_KEY, JSON.stringify(next));
  } catch (err) {
    console.error('[NotificationActions] Failed to persist processed-ids cache:', err);
  }
}

// On a killed-app cold start, this can run before the containers/goals
// queries have ever fetched — getQueryData would silently return undefined
// and fall back to FALLBACK_CONTAINERS even though the user has real data.
// ensureQueryData returns the cache when it's already fresh (the common
// foregrounded/backgrounded case — no extra network call) but performs and
// awaits a real fetch when it's missing, so cold-start recovery gets the
// user's actual default container instead of silently guessing wrong.
async function getDefaultContainer(queryClient, userId) {
  const fallback = FALLBACK_CONTAINERS.find((c) => c.isDefault) ?? FALLBACK_CONTAINERS[0];
  if (!queryClient || !userId) return fallback;
  try {
    const containers = await queryClient.ensureQueryData({
      queryKey: queryKeys.hydrationContainers(userId),
      queryFn: () => fetchHydrationContainers(userId),
    });
    const list = containers?.length ? containers : FALLBACK_CONTAINERS;
    return list.find((c) => c.isDefault) ?? list[0];
  } catch (err) {
    console.error('[NotificationActions] Failed to load hydration containers, using fallback:', err);
    return fallback;
  }
}

async function getBaseGoalMl(queryClient, userId) {
  if (!queryClient || !userId) return DEFAULT_SUGGESTED_ML;
  try {
    const goals = await queryClient.ensureQueryData({
      queryKey: queryKeys.metricGoals(userId),
      queryFn: () => fetchMetricGoals(userId),
    });
    return goals?.hydration ?? DEFAULT_SUGGESTED_ML;
  } catch (err) {
    console.error('[NotificationActions] Failed to load metric goals, using default:', err);
    return DEFAULT_SUGGESTED_ML;
  }
}

/**
 * Builds and registers both notification categories. Reads the default
 * container from the React Query cache (falling back to FALLBACK_CONTAINERS
 * when missing/empty, per the Step 10 storage amendment) and the current
 * displayUnit from the hydration store. Cheap — safe to call on every app
 * start plus after any container/displayUnit write.
 */
export async function registerNotificationCategories({ queryClient, userId } = {}) {
  const container = await getDefaultContainer(queryClient, userId);
  const displayUnit = useHydrationStore.getState().displayUnit;

  await Notifications.setNotificationCategoryAsync(HYDRATION_CATEGORY, [
    {
      identifier: HYDRATION_LOG_ACTION,
      buttonTitle: `Log ${container.name} · +${formatHydration(container.ml, displayUnit)}`,
      options: { opensAppToForeground: false },
    },
    {
      identifier: HYDRATION_OPEN_ACTION,
      buttonTitle: 'Open Hemo',
      options: { opensAppToForeground: true },
    },
  ]);

  await Notifications.setNotificationCategoryAsync(MEDICATION_CATEGORY, [
    {
      identifier: MEDICATION_TAKEN_ACTION,
      buttonTitle: 'Mark as taken',
      options: { opensAppToForeground: false },
    },
  ]);
}

// medication_logs / daily_summaries date columns are keyed by this exact
// UTC-derived string (see the health service's `today()` behavior) — matched here so
// same-day comparisons agree with how the rest of the app writes "today".
function isoDateString(date) {
  return date.toISOString().split('T')[0];
}

async function isMedicationTakenToday(medicationId, scheduledTime, todayStr) {
  let query = supabase
    .from('medication_logs')
    .select('id')
    .eq('medication_id', medicationId)
    .eq('date', todayStr);

  query = scheduledTime
    ? query.eq('scheduled_time', scheduledTime)
    : query.is('scheduled_time', null);

  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error('[NotificationActions] Failed to check medication taken status:', error);
    return false;
  }
  return !!data;
}

async function handleHydrationLogAction({ userId, queryClient }) {
  const container = await getDefaultContainer(queryClient, userId);
  const baseGoalMl = await getBaseGoalMl(queryClient, userId);
  const result = await addHydrationQuickly(userId, container.ml);
  queryClient?.invalidateQueries({ queryKey: queryKeys.dailySummaries(userId) });
  posthog.capture('hydration_logged', {
    amount_glasses: Math.round(glassesFromMl(container.ml)),
    amount_ml: container.ml,
    goal_ml: baseGoalMl,
    goal_met: result.hydration >= baseGoalMl,
    source: 'notification_action',
  });
  await maybeSilenceHydrationReminders(result.hydration, baseGoalMl);
}

async function handleMedicationTakenAction({ userId, medicationId, scheduledTime, queryClient, todayStr }) {
  if (!medicationId) return;
  // The action is idempotent per scheduled dose. A medication can have several
  // daily reminders, so checking only medication_id would incorrectly block a
  // later dose after an earlier one was logged.
  const alreadyTaken = await isMedicationTakenToday(medicationId, scheduledTime, todayStr);
  if (alreadyTaken) return;
  await addMedicationLog(userId, medicationId, scheduledTime);
  queryClient?.invalidateQueries({ queryKey: queryKeys.medications(userId) });
  posthog.capture('medication_marked_taken', { source: 'notification_action' });
}

// On a cold start from an action tap, the live response listener AND
// getLastNotificationResponseAsync can both deliver the same response. The
// AsyncStorage dedupe alone can't stop that — both callers can pass the async
// read before either writes — so this synchronous in-flight set closes the
// race (decision 7: a tap must never double-log).
const inFlightIds = new Set();

/**
 * The shared handler for both the live notification-response listener and
 * cold-start recovery (`getLastNotificationResponseAsync`). Dedupes on the
 * notification's own identifier, drops anything not from today (decision 6),
 * and never auto-marks anything — only ever runs in response to an explicit
 * action tap.
 */
export async function processNotificationResponse(response, { queryClient } = {}) {
  const identifier = response?.notification?.request?.identifier;
  if (!identifier) return;
  if (inFlightIds.has(identifier)) return;
  inFlightIds.add(identifier);

  try {
    if (await hasBeenProcessed(identifier)) return;

    const userId = useAuthStore.getState().auth?.user?.id;
    if (!userId) {
      // Transient: on cold start the auth store may not have rehydrated yet.
      // Leave the response unprocessed so the userId-gated recovery effect in
      // _layout.jsx can retry once auth is ready — marking it processed here
      // would permanently swallow a real tap.
      inFlightIds.delete(identifier);
      return;
    }

    const data = response.notification.request.content.data ?? {};
    // `notification.date` is epoch SECONDS on iOS (timeIntervalSince1970) but
    // epoch MILLISECONDS on Android — treat anything past ~2001-in-ms as ms.
    const rawDate = response.notification.date;
    const deliveredAt = rawDate == null ? new Date() : new Date(rawDate > 1e12 ? rawDate : rawDate * 1000);
    const todayStr = isoDateString(new Date());
    if (isoDateString(deliveredAt) !== todayStr) {
      await markProcessed(identifier); // decision 6 — never backfill the wrong day
      return;
    }

    if (response.actionIdentifier === HYDRATION_LOG_ACTION) {
      await handleHydrationLogAction({ userId, queryClient });
    } else if (response.actionIdentifier === MEDICATION_TAKEN_ACTION) {
      await handleMedicationTakenAction({
        userId,
        medicationId: data.medicationId,
        scheduledTime: data.scheduledTime ?? null,
        queryClient,
        todayStr,
      });
    }
    await markProcessed(identifier);
  } catch (err) {
    console.error('[NotificationActions] Failed to process notification action:', err);
    // Not marked processed: a transient failure (e.g. network) may still
    // succeed on a same-day retry from the next cold start. Kept in
    // inFlightIds so it won't re-run within this session.
  }
}
