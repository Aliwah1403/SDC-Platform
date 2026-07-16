import { GLASS_ML } from "./hydrationGoal";

const ML_PER_L = 1000;
const ML_PER_FLOZ = 29.5735;

// Short unit suffix for surfaces that render the number and label separately
// (e.g. a big number with a small unit label beneath/beside it).
export const HYDRATION_UNIT_LABEL = { glasses: "glasses", ml: "ml", L: "L", floz: "fl oz" };

// A sane sparkline/gauge ceiling per unit, equivalent to ~16 glasses (4 L).
export const HYDRATION_SCALE_MAX = { glasses: 16, ml: 4000, L: 4, floz: 135 };

export function glassesFromMl(ml) {
  return ml / GLASS_ML;
}

export function mlFromGlasses(glasses) {
  return Math.round(glasses * GLASS_ML);
}

/**
 * Bare numeric value (no unit text) in the user's chosen display unit —
 * for surfaces that need the number itself, not a pre-formatted string
 * (chart scales, sparklines, math on the displayed value).
 */
export function hydrationValueInUnit(ml, unit = "glasses") {
  const value = ml ?? 0;
  switch (unit) {
    case "ml":
      return Math.round(value);
    case "L":
      return Math.round((value / ML_PER_L) * 10) / 10;
    case "floz":
      return Math.round(value / ML_PER_FLOZ);
    case "glasses":
    default:
      return Math.round(glassesFromMl(value));
  }
}

/**
 * Format a canonical ml value for display in the user's chosen unit.
 * `unit` is one of "glasses" | "ml" | "L" | "floz".
 */
export function formatHydration(ml, unit = "glasses") {
  const value = ml ?? 0;
  switch (unit) {
    case "ml":
      return `${Math.round(value)} ml`;
    case "L":
      return `${(value / ML_PER_L).toFixed(1)} L`;
    case "floz":
      return `${Math.round(value / ML_PER_FLOZ)} fl oz`;
    case "glasses":
    default: {
      const glasses = Math.round(glassesFromMl(value) * 10) / 10;
      const label = Number.isInteger(glasses) ? glasses.toString() : glasses.toFixed(1);
      return `${label} glass${glasses === 1 ? "" : "es"}`;
    }
  }
}

/**
 * Split a canonical ml value into { number, unitLabel } for surfaces that
 * render a big number with the unit as a separate, smaller piece of text
 * (e.g. "2.5" + "L", or "10" + "glasses"). Unlike HYDRATION_UNIT_LABEL,
 * `unitLabel` pluralizes "glass"/"glasses" based on the actual value.
 */
export function hydrationNumberAndUnit(ml, unit = "glasses") {
  const value = ml ?? 0;
  switch (unit) {
    case "ml":
      return { number: `${Math.round(value)}`, unitLabel: "ml" };
    case "L":
      return { number: (value / ML_PER_L).toFixed(1), unitLabel: "L" };
    case "floz":
      return { number: `${Math.round(value / ML_PER_FLOZ)}`, unitLabel: "fl oz" };
    case "glasses":
    default: {
      const g = Math.round(glassesFromMl(value) * 10) / 10;
      return {
        number: Number.isInteger(g) ? g.toString() : g.toFixed(1),
        unitLabel: `glass${g === 1 ? "" : "es"}`,
      };
    }
  }
}

/**
 * Format a "value / goal" pair in the user's chosen display unit — the shared
 * helper every surface should use instead of hardcoding its own glasses
 * conversion (that per-file duplication is why the display-unit preference
 * only affected the goal sheet until this was centralized).
 */
export function formatHydrationPair(valueMl, goalMl, unit = "glasses") {
  const v = valueMl ?? 0;
  const g = goalMl ?? 0;
  switch (unit) {
    case "ml":
      return `${Math.round(v)} / ${Math.round(g)} ml`;
    case "L":
      return `${(v / ML_PER_L).toFixed(1)} / ${(g / ML_PER_L).toFixed(1)} L`;
    case "floz":
      return `${Math.round(v / ML_PER_FLOZ)} / ${Math.round(g / ML_PER_FLOZ)} fl oz`;
    case "glasses":
    default:
      return `${Math.round(glassesFromMl(v))} / ${Math.round(glassesFromMl(g))}`;
  }
}

/**
 * "X to your goal" phrasing in the user's chosen unit — returns null when the
 * goal is already met (callers should show a "Goal reached" state instead).
 */
export function formatHydrationRemaining(remainingMl, unit = "glasses") {
  if (remainingMl == null || remainingMl <= 0) return null;
  switch (unit) {
    case "ml":
      return `${Math.round(remainingMl)} ml to your goal`;
    case "L":
      return `${(remainingMl / ML_PER_L).toFixed(1)} L to your goal`;
    case "floz":
      return `${Math.round(remainingMl / ML_PER_FLOZ)} fl oz to your goal`;
    case "glasses":
    default: {
      const glasses = Math.ceil(remainingMl / GLASS_ML);
      return `${glasses} glass${glasses === 1 ? "" : "es"} to your goal`;
    }
  }
}
