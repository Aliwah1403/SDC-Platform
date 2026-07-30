// ⚠️ PENDING CLINICAL REVIEW — do not change without updating CLINICAL-REVIEW-hydration.md

// Base suggestion: ml of fluid per kg body weight per day.
export const ML_PER_KG = 35;

// Suggestion bounds.
export const MIN_SUGGESTED_ML = 1500;
export const MAX_SUGGESTED_ML = 5000;

// Suggestions round to the nearest quarter-litre (one "glass").
export const ROUND_TO_ML = 250;

// Fallback when the user has not entered a weight (weight is optional in onboarding).
export const DEFAULT_SUGGESTED_ML = 2500;

// Hot-weather advisory bumps, based on today's temperature. Displayed as a "today's
// target" nudge on top of the user's own goal; never stored, never fed into suggestedMl.
export const HEAT_BUMPS = [
  { minTempC: 30, extraMl: 500 },
  { minTempC: 25, extraMl: 250 },
];

// Activity advisory bumps, based on today's synced step count (Step 11). Same
// semantics as HEAT_BUMPS — advisory only, never stored, never fed into suggestedMl.
export const ACTIVITY_BUMPS = [
  { minSteps: 12000, extraMl: 500 },
  { minSteps: 8000, extraMl: 250 },
];

// Heat + activity bumps combine but are capped so a hot, active day shows one
// reasonable nudge instead of stacking to an unreasonable total.
export const MAX_DAILY_BUMP_ML = 750;

export const GLASS_ML = 250;

function roundTo(value, step) {
  return Math.round(value / step) * step;
}

/**
 * The weight-based suggestion shown as the "Suggested for you" anchor in the goal sheet.
 * Never overwrites the user's base goal.
 */
export function getSuggestedMl(weightKg) {
  if (!weightKg) return DEFAULT_SUGGESTED_ML;
  const raw = weightKg * ML_PER_KG;
  const clamped = Math.min(Math.max(raw, MIN_SUGGESTED_ML), MAX_SUGGESTED_ML);
  return roundTo(clamped, ROUND_TO_ML);
}

/**
 * Today's-target advisory bump — layered on top of the base goal only, per the day's
 * temperature. Returns 0 (no mention) when tempC is unavailable.
 */
export function getHeatBumpMl(tempC) {
  if (tempC == null) return 0;
  for (const bump of HEAT_BUMPS) {
    if (tempC >= bump.minTempC) return bump.extraMl;
  }
  return 0;
}

/**
 * Today's-target activity bump — mirrors getHeatBumpMl. Returns 0 (no mention)
 * when stepsToday is unavailable (no wearable permission / nothing synced today).
 */
export function getActivityBumpMl(stepsToday) {
  if (stepsToday == null) return 0;
  for (const bump of ACTIVITY_BUMPS) {
    if (stepsToday >= bump.minSteps) return bump.extraMl;
  }
  return 0;
}

/**
 * Combines heat + activity bumps, capped at MAX_DAILY_BUMP_ML (decision 4) so a
 * hot AND active day shows one reasonable number instead of stacking unchecked.
 */
export function combineBumpMl(heatBumpMl, activityBumpMl) {
  return Math.min((heatBumpMl ?? 0) + (activityBumpMl ?? 0), MAX_DAILY_BUMP_ML);
}

/**
 * Copy suffix naming why today's target is bumped (decision 5 — always phrased
 * retrospectively, e.g. "you've been active", never a morning promise the user
 * could "fail"; no guilt phrasing). Returns '' when neither bump applies.
 */
export function describeBumpReason({ heatBumpMl, activityBumpMl, tempC, stepsToday }) {
  const hasHeat = heatBumpMl > 0 && tempC != null;
  const hasActivity = activityBumpMl > 0 && stepsToday != null;
  if (hasHeat && hasActivity) return `hot day (${Math.round(tempC)}°) + active day`;
  if (hasHeat) return `it's ${Math.round(tempC)}°`;
  if (hasActivity) return `you've been active (${stepsToday.toLocaleString()} steps)`;
  return '';
}

/**
 * Full suggestion payload for the hydration goal sheet + daily advisory.
 * `baseGoalMl` is the user's own fixed goal — the heat/activity bumps apply to
 * it for `todayTargetMl`, but never to `suggestedMl` itself.
 */
export function getHydrationSuggestion({ weightKg, tempC, stepsToday, baseGoalMl } = {}) {
  const suggestedMl = getSuggestedMl(weightKg);
  const heatBumpMl = getHeatBumpMl(tempC);
  const activityBumpMl = getActivityBumpMl(stepsToday);
  const bumpMl = combineBumpMl(heatBumpMl, activityBumpMl);
  const todayTargetMl = baseGoalMl != null ? baseGoalMl + bumpMl : null;

  const explanation = weightKg
    ? `From your weight (${weightKg} kg) and SCD hydration guidance`
    : "A general adult baseline — add your weight in Profile for a personal suggestion";

  return {
    suggestedMl,
    todayTargetMl,
    bumpMl,
    heatBumpMl,
    activityBumpMl,
    inputs: { weightKg: weightKg ?? null, tempC: tempC ?? null, stepsToday: stepsToday ?? null },
    explanation,
  };
}
