// Shared math for Step 5's recap screens (weekly/monthly narrative + charts)
// and the insights hub's evergreen "Your patterns" section — kept separate
// from any UI so `app/recap.jsx` and `app/health-insights.jsx` compute the
// exact same numbers off the exact same rules.

export function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateStr(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function startOfWeekMonday(date) {
  const daysSinceMonday = (date.getDay() + 6) % 7; // 0=Mon … 6=Sun
  return addDays(date, -daysSinceMonday);
}

export function weekRange(monday) {
  return { start: monday, end: addDays(monday, 6) };
}

export function prevWeekRange(monday) {
  const start = addDays(monday, -7);
  return { start, end: addDays(start, 6) };
}

export function monthRange(firstOfMonth) {
  const start = new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth(), 1);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  return { start, end };
}

export function prevMonthRange(firstOfMonth) {
  const start = new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth() - 1, 1);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  return { start, end };
}

export function formatWeekLabel(start, end) {
  const short = (d) => d.toLocaleDateString("en-US", { month: "short" });
  return start.getMonth() === end.getMonth()
    ? `${short(start)} ${start.getDate()} – ${end.getDate()}`
    : `${short(start)} ${start.getDate()} – ${short(end)} ${end.getDate()}`;
}

export function formatMonthLabel(date) {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// Zero-filled day array between start and end inclusive, in chronological order.
export function buildDayRange(healthData, start, end) {
  const days = [];
  let cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (cur <= last) {
    const dateStr = toDateStr(cur);
    const entry = healthData.find((e) => e.date === dateStr);
    days.push({
      date: new Date(cur),
      dateStr,
      painLevel: entry?.painLevel || 0,
      hydration: entry?.hydration || 0,
      mood: entry?.mood || 0,
      steps: entry?.steps || 0,
      sleepHours: entry?.sleepHours || 0,
    });
    cur = addDays(cur, 1);
  }
  return days;
}

export function countLogged(days) {
  return days.filter((d) => d.painLevel > 0 || d.hydration > 0 || d.mood > 0).length;
}

export const MONTHS_TO_SCAN = 4;

// Starts at i=1 — the current, still-in-progress month is deliberately excluded.
// A monthly recap only unlocks once the month is complete (e.g. July's recap
// unlocks Aug 1), matching the home card's "previous complete month" rule.
// Shared by the insights hub's carousel and the monthly recap's own
// "other months" carousel so both list exactly the same set of months.
export function buildMonthlyRecaps(healthData, monthsToScan = MONTHS_TO_SCAN) {
  const today = new Date();
  const months = [];
  for (let i = 1; i <= monthsToScan; i++) {
    const start = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    const days = buildDayRange(healthData, start, end);
    const daysLogged = countLogged(days);
    if (daysLogged === 0) continue;
    months.push({
      key: `month-${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
      start,
      monthName: start.toLocaleDateString("en-US", { month: "long" }),
      daysLogged,
      totalDays: days.length,
    });
  }
  return months;
}

// "Good day" = a logged day with pain ≤ 3.
export function countGoodDays(days) {
  return days.filter((d) => d.painLevel > 0 && d.painLevel <= 3).length;
}

export function countHighPainDays(days) {
  return days.filter((d) => d.painLevel >= 7).length;
}

// "Good mood day" = a logged day with mood ≥ 4.
export function countGoodMoodDays(days) {
  return days.filter((d) => d.mood >= 4).length;
}

export function avgPain(days) {
  const logged = days.filter((d) => d.painLevel > 0);
  if (!logged.length) return null;
  return logged.reduce((s, d) => s + d.painLevel, 0) / logged.length;
}

export function countHydrationGoalDays(days, goalMl) {
  return days.filter((d) => d.hydration >= goalMl).length;
}

// Longest run of consecutive low-pain days (pain 1–4). Unlogged days (0)
// don't break the streak; a high-pain day (≥5) resets it. Scoped to
// whatever day array is passed in — the caller decides the window.
export function crisisFreeLongestStretch(days) {
  let current = 0;
  let longest = 0;
  days.forEach((d) => {
    if (d.painLevel === 0) return;
    if (d.painLevel < 5) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  });
  return longest;
}

// Absolute, worded count delta — never a percentage. Returns null when
// there's no valid previous-period comparison to make.
export function wordedCountDelta(current, previous, singular, plural, periodLabel) {
  if (previous == null) return null;
  const diff = current - previous;
  if (diff === 0) return `same as last ${periodLabel}`;
  const noun = Math.abs(diff) === 1 ? singular : plural;
  return diff > 0
    ? `${diff} more ${noun} than last ${periodLabel}`
    : `${Math.abs(diff)} fewer ${noun} than last ${periodLabel}`;
}

export function wordedPainDelta(curAvg, prevAvg, periodLabel) {
  if (curAvg == null || prevAvg == null) return null;
  const diff = Math.round((curAvg - prevAvg) * 10) / 10;
  if (Math.abs(diff) < 0.05) return `steady with last ${periodLabel}`;
  return diff > 0
    ? `up ${Math.abs(diff)} from last ${periodLabel}`
    : `down ${Math.abs(diff)} from last ${periodLabel}`;
}

// Weekly recap's highlight/flag picker — evaluates candidates in priority
// order and takes the first that fires. Returns { highlight, flag,
// flagEducation, quiet }. `firstName` is folded into the highlight only
// (the one place it's allowed to appear on this screen).
export function pickWeeklySignal({ days, prevDays, goalMl, firstName }) {
  const loggedCount = countLogged(days);
  const goodDays = countGoodDays(days);
  const hydrationGoalDays = countHydrationGoalDays(days, goalMl);
  const highPainCount = countHighPainDays(days);
  const avg = avgPain(days);

  const hasPrevWeek = countLogged(prevDays) >= 3;
  const prevGoodDays = hasPrevWeek ? countGoodDays(prevDays) : null;
  const prevHydrationGoalDays = hasPrevWeek ? countHydrationGoalDays(prevDays, goalMl) : null;
  const prevAvg = hasPrevWeek ? avgPain(prevDays) : null;

  let highlight = null;
  if (hydrationGoalDays >= 5) {
    highlight = `${firstName}, you hit your hydration goal on ${hydrationGoalDays} of 7 days this week — great consistency.`;
  } else if (goodDays >= 5) {
    highlight = `${firstName}, ${goodDays} of your 7 days were good pain days this week.`;
  } else if (hasPrevWeek && goodDays - prevGoodDays >= 2) {
    highlight = `${firstName}, you had ${goodDays - prevGoodDays} more good pain days than last week.`;
  } else if (hasPrevWeek && hydrationGoalDays - prevHydrationGoalDays >= 2) {
    highlight = `${firstName}, ${hydrationGoalDays - prevHydrationGoalDays} more hydration goal-days than last week.`;
  }

  let flag = null;
  let flagEducation = null;
  if (highPainCount >= 2) {
    flag = `${highPainCount} days this week had high pain (7 or above) — worth mentioning to your care team.`;
    flagEducation = "pain";
  } else if (hydrationGoalDays <= 1 && loggedCount >= 4) {
    flag = "Hydration stayed low most of the week despite logging consistently.";
    flagEducation = "hydration";
  } else if (hasPrevWeek && avg != null && prevAvg != null && avg - prevAvg >= 2.0) {
    flag = `Average pain rose by ${(avg - prevAvg).toFixed(1)} from last week.`;
    flagEducation = "pain";
  }

  return { highlight, flag, flagEducation, quiet: !highlight && !flag };
}

// Monday-first weekday names — shared by the weekday-pain pattern and its
// evidence label. Index matches startOfWeekMonday's (getDay()+6)%7 math.
const WEEKDAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function weekdayIndexMonFirst(date) {
  return (date.getDay() + 6) % 7;
}

// "Your patterns" engine — used both by the hub (60-day rolling window) and
// the monthly recap (scoped to that calendar month). `triggerCounts` is a
// { label: count } map already aggregated for the same window.
// Each pattern carries a `metric` key ("hydration" | "sleep" | "mood" | "pain"
// | "trigger") so the UI can pick an icon/color, a short bold `headline`
// written TO the user, and a supporting `body` sentence with the numbers
// spelled out. All numbers come from the deterministic guards below — no LLM.
// Two extra fields feed the hub's redesigned rows (recap.jsx ignores both and
// keeps working off headline/body/educationTopic only):
//   - `support` (number) — count of supporting days/selections, used to sort.
//   - `evidence` (object) — small "receipt" visual data, one of:
//       { type: "dots", filled, total }
//       { type: "bars", items: [{ label, count }] }
//       { type: "weekdays", counts: [7 numbers, Monday-first] }
export function computePatterns(days, { goalMl, triggerCounts } = {}) {
  const patterns = [];
  const loggedCount = countLogged(days);
  const highPainDays = days.filter((d) => d.painLevel >= 7);

  // Correlational patterns (hydration/sleep/mood/weekday vs. pain) all share
  // the same ≥14-logged-days guard — below that, a handful of flares is too
  // thin a sample to call a "pattern" without it reading like noise.
  if (loggedCount >= 14) {
    const lowHydrationSupport = highPainDays.filter((d) => d.hydration > 0 && d.hydration < goalMl).length;
    if (lowHydrationSupport >= 3) {
      patterns.push({
        id: "hydration-pain",
        metric: "hydration",
        headline: "You drank less on your hardest days",
        body: `On ${lowHydrationSupport} of your ${highPainDays.length} highest-pain days, you were below your hydration goal.`,
        educationTopic: "hydration",
        support: lowHydrationSupport,
        evidence: { type: "dots", filled: lowHydrationSupport, total: highPainDays.length },
      });
    }

    const sleepDataExists = days.some((d) => d.sleepHours > 0);
    if (sleepDataExists) {
      const lowSleepSupport = highPainDays.filter((d) => d.sleepHours > 0 && d.sleepHours < 7).length;
      if (lowSleepSupport >= 3) {
        patterns.push({
          id: "sleep-pain",
          metric: "sleep",
          headline: "Short nights show up before your hard days",
          body: `You slept under 7 hours on ${lowSleepSupport} of your ${highPainDays.length} highest-pain days.`,
          educationTopic: null,
          support: lowSleepSupport,
          evidence: { type: "dots", filled: lowSleepSupport, total: highPainDays.length },
        });
      }
    }

    // Fires at ≥3 supporting days, same threshold as hydration/sleep above.
    const moodDipSupport = highPainDays.filter((d) => d.mood > 0 && d.mood <= 2).length;
    if (moodDipSupport >= 3) {
      patterns.push({
        id: "mood-pain",
        metric: "mood",
        headline: "Tough pain days weigh on your mood",
        body: `Your mood dipped on ${moodDipSupport} of your ${highPainDays.length} highest-pain days.`,
        educationTopic: null,
        support: moodDipSupport,
        evidence: { type: "dots", filled: moodDipSupport, total: highPainDays.length },
      });
    }

    // An "honest cluster, not noise" guard: needs ≥4 high-pain days total,
    // the top weekday needs ≥3 of them, AND that weekday needs to account for
    // at least half of all high-pain days — otherwise a slight lean on one
    // weekday out of a small spread would get over-called as a pattern.
    const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
    highPainDays.forEach((d) => {
      weekdayCounts[weekdayIndexMonFirst(d.date)]++;
    });
    const totalHighPain = highPainDays.length;
    const topWeekdayCount = Math.max(...weekdayCounts);
    const topWeekdayIndex = weekdayCounts.indexOf(topWeekdayCount);
    if (totalHighPain >= 4 && topWeekdayCount >= 3 && topWeekdayCount >= totalHighPain / 2) {
      const weekdayName = WEEKDAY_NAMES[topWeekdayIndex];
      patterns.push({
        id: "weekday-pain",
        metric: "pain",
        headline: `Your hardest days often land on ${weekdayName}s`,
        body: `${topWeekdayCount} of your ${totalHighPain} high-pain days this period were ${weekdayName}s.`,
        educationTopic: null,
        support: topWeekdayCount,
        evidence: { type: "weekdays", counts: weekdayCounts },
      });
    }
  }

  if (triggerCounts && Object.keys(triggerCounts).length) {
    const sortedTriggers = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1]);
    const [topTrigger, topCount] = sortedTriggers[0];
    if (topCount >= 3) {
      patterns.push({
        id: "trigger-frequency",
        metric: "trigger",
        headline: `${topTrigger} keeps coming up for you`,
        body: `You've logged it ${topCount} times in this period — more than any other contributor.`,
        educationTopic: null,
        support: topCount,
        evidence: {
          type: "bars",
          items: sortedTriggers.slice(0, 3).map(([label, count]) => ({ label, count })),
        },
      });
    }
  }

  return patterns.sort((a, b) => b.support - a.support).slice(0, 4);
}

// "Still watching" rows for the hub — up to 3 patterns that haven't unlocked
// yet, each with a reason-aware, natural-language hint (never "×" notation).
// Deliberately excludes patterns blocked only by "not enough supporting days
// found despite enough logging" — that's an absence of correlation, which is
// a good thing, not a locked feature, so it's not something to dangle as
// "still watching".
export function computeWatchlist(days, { triggerCounts, activeIds = [] } = {}) {
  const isActive = (id) => activeIds.includes(id);
  const rows = [];
  const loggedCount = countLogged(days);
  const sleepDataExists = days.some((d) => d.sleepHours > 0);

  // Specific, concrete blockers first — each names an action the user can
  // plausibly take right now.
  if (!isActive("sleep-pain") && !sleepDataExists) {
    rows.push({ id: "sleep-pain", label: "Sleep and pain", hint: "Add sleep to your logs to unlock this." });
  }

  if (!isActive("trigger-frequency")) {
    const topCount = triggerCounts && Object.keys(triggerCounts).length ? Math.max(...Object.values(triggerCounts)) : 0;
    if (topCount < 3) {
      rows.push({
        id: "trigger-frequency",
        label: "Repeat contributors",
        hint: "Log contributors when symptoms flare and Hemo will watch for repeats.",
      });
    }
  }

  // Generic "hasn't hit the 14-day baseline yet" blocker — shared by every
  // correlational pattern, so it's collapsed to at most 2 rows (most
  // interesting first) rather than repeating the same sentence four times.
  if (loggedCount < 14) {
    const needsMoreDays = 14 - loggedCount;
    const hint = `Needs about ${needsMoreDays} more logged day${needsMoreDays === 1 ? "" : "s"}`;
    const loggingCandidates = [
      { id: "hydration-pain", label: "Hydration and pain" },
      { id: "mood-pain", label: "Mood and pain" },
      { id: "weekday-pain", label: "Weekday patterns" },
      { id: "sleep-pain", label: "Sleep and pain" },
    ].filter((c) => !isActive(c.id) && !rows.some((r) => r.id === c.id));

    loggingCandidates.slice(0, 2).forEach((c) => rows.push({ id: c.id, label: c.label, hint }));
  }

  return rows.slice(0, 3);
}
