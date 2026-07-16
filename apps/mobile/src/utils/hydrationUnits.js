import { GLASS_ML } from "./hydrationGoal";

const ML_PER_L = 1000;
const ML_PER_FLOZ = 29.5735;

export function glassesFromMl(ml) {
  return ml / GLASS_ML;
}

export function mlFromGlasses(glasses) {
  return Math.round(glasses * GLASS_ML);
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
