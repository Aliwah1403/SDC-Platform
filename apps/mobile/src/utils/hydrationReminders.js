import * as Notifications from 'expo-notifications';

// Category identifier for the hydration reminder's notification actions.
// Defined here (not in utils/notificationActions.js) so this file has zero
// dependency on that one — notificationActions.js imports it back, which
// keeps the dependency graph one-directional (it also needs
// cancelRemainingTodayHydrationReminders / maybeSilenceHydrationReminders
// from this file for the notification-action path).
export const HYDRATION_CATEGORY = 'hydration_reminder';

// Tag stored in each notification's `data.type`, used to find our own
// scheduled hydration reminders among all scheduled local notifications.
const NOTIFICATION_TAG = 'hydration_reminder';

// Step 10 decision 2 — device-local time, same daily-trigger mechanism as
// utils/checkInNotifications.js. No custom time editing in this step.
const SCHEDULES = {
  gentle: [
    { hour: 11, minute: 0 },
    { hour: 16, minute: 0 },
  ],
  regular: [
    { hour: 10, minute: 0 },
    { hour: 13, minute: 0 },
    { hour: 16, minute: 0 },
    { hour: 19, minute: 0 },
  ],
};

// Supportive, no-guilt copy that rotates across a day's slots so back-to-back
// reminders don't repeat verbatim. Decision 8 — never "you've only had...",
// never "don't forget again", no streak-guilt phrasing. A heat-bump variant
// ("it's warm today...") was scoped for this list too, but getHeatBumpMl
// needs today's temperature, which is only available via the useWeatherData
// hook (location permission + network fetch) inside a component — not
// trivially accessible from this plain scheduling module. It's also a poor
// fit for a repeating DAILY trigger: whatever body text is set here repeats
// every day until the reminder is rescheduled, so baking in "today is hot"
// would go stale and read as wrong on the next cool day. Skipped — see task
// report.
const BODY_VARIANTS = [
  "A little water break sounds good right about now.",
  "Quick nudge to sip some water when you get a chance.",
  "Staying hydrated helps with SCD management — grab a drink?",
];

function formatSlot({ hour, minute }) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const paddedMinute = String(minute).padStart(2, '0');
  return minute === 0 ? `${h12} ${period}` : `${h12}:${paddedMinute} ${period}`;
}

/** Human-readable sublabel for the goal sheet's Reminders row, e.g. "11 AM & 4 PM". */
export function describeHydrationSchedule(frequency) {
  const slots = SCHEDULES[frequency];
  if (!slots) return '';
  return slots.map(formatSlot).join(' & ');
}

async function getOwnScheduledIds() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled
    .filter((n) => n.content.data?.type === NOTIFICATION_TAG)
    .map((n) => n.identifier);
}

/**
 * Schedules the daily hydration reminders for a frequency ('gentle' | 'regular').
 * Always cancels existing hydration reminders first, so changing frequency —
 * or simply re-running this on every launch/background refresh — never leaves
 * duplicate or stale slots scheduled.
 */
export async function scheduleHydrationReminders(frequency) {
  await cancelHydrationReminders();
  const slots = SCHEDULES[frequency];
  if (!slots) return; // 'off' (or anything unrecognized) — nothing to schedule

  await Promise.all(
    slots.map((slot, i) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: 'Time for some water',
          body: BODY_VARIANTS[i % BODY_VARIANTS.length],
          data: { type: NOTIFICATION_TAG },
          categoryIdentifier: HYDRATION_CATEGORY,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: slot.hour, minute: slot.minute },
      }),
    ),
  );
}

export async function cancelHydrationReminders() {
  const ids = await getOwnScheduledIds();
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

/**
 * Step 10 decision 3 — cancels the rest of TODAY's hydration reminders once
 * the user's hit their goal. expo-notifications has no concept of "cancel
 * just today's instance" of a repeating DAILY trigger — the scheduled DAILY
 * trigger IS the recurring rule, there's no single fire-date to remove. So
 * "cancel the rest of today" is implemented as cancel-all-and-let-the-next
 * launch/background refresh reschedule for tomorrow (see the launch effect in
 * _layout.jsx and utils/backgroundNotificationRefresh.js, both of which
 * reschedule whenever the stored preference isn't 'off').
 */
export async function cancelRemainingTodayHydrationReminders() {
  await cancelHydrationReminders();
}

/**
 * Best-effort goal-aware silencing — call after any successful hydration
 * write with today's new running total and the user's BASE goal (never the
 * heat-bumped goal, per the Step 11 note). Never throws: a failure here
 * should never surface as an error on the write that triggered it.
 */
export async function maybeSilenceHydrationReminders(totalMlToday, baseGoalMl) {
  try {
    if (totalMlToday == null || baseGoalMl == null) return;
    if (totalMlToday >= baseGoalMl) {
      await cancelRemainingTodayHydrationReminders();
    }
  } catch (err) {
    console.error('[HydrationReminders] Failed to silence reminders after goal met:', err);
  }
}
