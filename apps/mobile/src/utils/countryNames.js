let regionNames;
try {
  regionNames = new Intl.DisplayNames(["en"], { type: "region" });
} catch {
  regionNames = null;
}

/**
 * Human-readable country name for an ISO 3166-1 alpha-2 code, e.g. "GB" -> "United Kingdom".
 * Falls back to the raw code if Intl.DisplayNames is unavailable or the code is unrecognized.
 */
export function getCountryName(isoCountry) {
  if (!isoCountry) return null;
  try {
    return regionNames?.of(isoCountry.toUpperCase()) ?? isoCountry;
  } catch {
    return isoCountry;
  }
}
