/**
 * Match today's medication logs to their scheduled dose times.
 *
 * New logs carry `scheduledTime`, so a user can mark an evening dose before a
 * morning one without the UI reassigning it by insertion order. Logs created
 * before that field existed are assigned to the remaining slots in their
 * chronological order, preserving the best available interpretation of legacy
 * data.
 */
export function resolveMedicationDoseLogs(logs = [], scheduledTimes = []) {
  const assigned = new Array(scheduledTimes.length).fill(null);
  const legacyLogs = [];

  for (const log of logs) {
    const slotIndex = log.scheduledTime
      ? scheduledTimes.indexOf(log.scheduledTime)
      : -1;

    if (slotIndex >= 0 && !assigned[slotIndex]) {
      assigned[slotIndex] = log;
    } else if (!log.scheduledTime) {
      legacyLogs.push(log);
    }
  }

  let legacyIndex = 0;
  for (let slotIndex = 0; slotIndex < assigned.length; slotIndex += 1) {
    if (!assigned[slotIndex] && legacyLogs[legacyIndex]) {
      assigned[slotIndex] = legacyLogs[legacyIndex];
      legacyIndex += 1;
    }
  }

  return assigned;
}

export function getExtraMedicationLogs(logs = [], scheduledTimes = []) {
  const assignedIds = new Set(
    resolveMedicationDoseLogs(logs, scheduledTimes)
      .filter(Boolean)
      .map((log) => log.id),
  );

  return logs.filter((log) => !assignedIds.has(log.id));
}
