// Static lookup table for check-in notification times.
// Keys match the check_in_frequency values stored in Supabase (2 | 3 | 5).
// Each entry is an array of { hour, minute } in 24-hour local time.
// The OS fires these at the correct local time regardless of the user's timezone
// — no UTC conversion needed when using expo-notifications local triggers.

export const CHECK_IN_SCHEDULE = {
  2: [
    { hour: 8,  minute: 0 }, // 8:00 AM
    { hour: 20, minute: 0 }, // 8:00 PM
  ],
  3: [
    { hour: 8,  minute: 0 }, // 8:00 AM
    { hour: 14, minute: 0 }, // 2:00 PM
    { hour: 20, minute: 0 }, // 8:00 PM
  ],
  5: [
    { hour: 8,  minute: 0 }, // 8:00 AM
    { hour: 11, minute: 0 }, // 11:00 AM
    { hour: 14, minute: 0 }, // 2:00 PM
    { hour: 17, minute: 0 }, // 5:00 PM
    { hour: 20, minute: 0 }, // 8:00 PM
  ],
};

// Human-readable label for each slot (used in settings UI if needed)
export const CHECK_IN_SCHEDULE_LABELS = {
  2: ["8:00 AM", "8:00 PM"],
  3: ["8:00 AM", "2:00 PM", "8:00 PM"],
  5: ["8:00 AM", "11:00 AM", "2:00 PM", "5:00 PM", "8:00 PM"],
};
