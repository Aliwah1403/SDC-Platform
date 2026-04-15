import * as Notifications from "expo-notifications";

/**
 * Schedule a repeating check-in notification while crisis mode is active.
 * Returns an array containing the single notification ID (repeating triggers
 * produce one cancellable ID).
 */
export async function scheduleCrisisCheckIns(intervalMinutes = 30) {
  const ids = [];
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Crisis Check-In",
        body: "How are you feeling? Tap to update your crisis status.",
        data: { type: "crisis_checkin" },
        sound: true,
      },
      trigger: {
        seconds: intervalMinutes * 60,
        repeats: true,
      },
    });
    ids.push(id);
  } catch {
    // Permission denied or scheduling failed — fail silently
  }
  return ids;
}

/**
 * Cancel all scheduled crisis notifications by ID.
 */
export async function cancelCrisisNotifications(ids = []) {
  await Promise.all(
    ids.map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => {})
    )
  );
}

/**
 * Fire an immediate one-shot notification when the crisis escalates to a new step.
 */
export async function scheduleEscalationAlert(newStep) {
  const stepLabels = { 2: "Moderate", 3: "Severe" };
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Crisis Escalated — ${stepLabels[newStep] ?? "Severe"}`,
        body:
          newStep === 3
            ? "Your crisis has escalated to Severe. Consider alerting your care team."
            : "Your pain level has increased. Review your crisis protocol.",
        data: { type: "crisis_escalation", step: newStep },
        sound: true,
      },
      trigger: null, // fire immediately
    });
  } catch {
    // Fail silently
  }
}
