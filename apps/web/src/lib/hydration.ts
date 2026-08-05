/**
 * Hydration is stored as canonical millilitres (see the 20260716 ml migration).
 *
 * Reports deliberately ignore the app's `displayUnit` preference (glasses / ml /
 * L / fl oz): that preference is device-local and never synced, and these pages
 * are read by a haematologist or GP, for whom "8 glasses" is not a unit. Every
 * hydration figure in the summary and export views goes through here.
 */

const ML_PER_L = 1000;

/** "750 ml" below a litre, "2.0 L" at or above it. */
export function formatMl(ml: number | null | undefined): string {
  if (ml == null) return "—";
  return ml >= ML_PER_L
    ? `${(ml / ML_PER_L).toFixed(1)} L`
    : `${Math.round(ml)} ml`;
}

/** Number and unit split apart, for stat cards that style them separately. */
export function mlNumberAndUnit(
  ml: number | null | undefined,
): { value: string; unit: string } {
  if (ml == null) return { value: "—", unit: "" };
  return ml >= ML_PER_L
    ? { value: (ml / ML_PER_L).toFixed(1), unit: "L" }
    : { value: String(Math.round(ml)), unit: "ml" };
}
