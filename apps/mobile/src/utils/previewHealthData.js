// DEV-ONLY sample dataset for visually reviewing the Step 5 insights hub and
// recap screens (weekly/monthly cards, "Your patterns") without depending on
// real Supabase data. Wired in behind a PREVIEW_MODE flag in
// app/health-insights.jsx and app/recap.jsx — never true in a shipped build.
// Delete this file (and the two call sites) once the review is done.

function seededRand(seed) {
  let s = seed;
  return (min, max) => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return min + (s % (max - min + 1));
  };
}

function toLocalDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// [daysAgoStart, daysAgoEnd] inclusive — high-pain / low-hydration / poor-sleep
// clusters, spaced out so several land inside the last 60 days (for "Your
// patterns") and inside individual weeks (so some weekly cards show a flag).
const FLARES = [
  [92, 95],
  [78, 81],
  [61, 64],
  [44, 47],
  [27, 30],
  [12, 15],
];
const SKIPPED = new Set([97, 83, 68, 52, 36, 21, 9, 2]);

function inFlare(daysAgo) {
  return FLARES.some(([lo, hi]) => daysAgo >= lo && daysAgo <= hi);
}

export function generatePreviewHealthData(daysBack = 100) {
  const rand = seededRand(11);
  const today = new Date();
  const data = [];

  for (let daysAgo = daysBack - 1; daysAgo >= 0; daysAgo--) {
    if (SKIPPED.has(daysAgo)) continue;
    const date = new Date(today);
    date.setDate(today.getDate() - daysAgo);

    let painLevel, hydration, mood, steps, sleepHours;
    if (inFlare(daysAgo)) {
      painLevel = rand(7, 9);
      // Every third flare day gets decent hydration so the hub's dot-row
      // receipts show a realistic filled/hollow mix instead of a uniform
      // "every hard day was low-hydration" wall.
      hydration = daysAgo % 3 === 0 ? rand(2500, 3000) : rand(700, 1400);
      mood = rand(1, 2);
      steps = rand(600, 2500);
      sleepHours = rand(35, 58) / 10;
    } else {
      painLevel = rand(0, 3);
      hydration = rand(2200, 3200);
      mood = rand(3, 5);
      steps = rand(4500, 9500);
      sleepHours = rand(65, 90) / 10;
    }

    data.push({
      date: toLocalDateStr(date),
      painLevel,
      hydration,
      mood,
      steps,
      sleepHours,
      heartRate: rand(64, 92),
    });
  }

  return data;
}

// Feeds the trigger-frequency "Your patterns" insight — mirrors the shape
// fetchTriggersInRange() returns ({ label: count }), top item ≥3 selections.
export const PREVIEW_TRIGGER_COUNTS = {
  "Poor sleep": 6,
  "Stress": 4,
  "Cold weather": 2,
};
