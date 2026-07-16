import { useEffect, useState } from "react";
import * as Cellular from "expo-cellular";
import * as Location from "expo-location";
import * as Localization from "expo-localization";
import { useAppStore } from "@/store/appStore";
import { getCachedEmergencyNumbers } from "@/services/emergencyNumbersService";
import bundledEmergencyNumbers from "@/data/emergencyNumbers.json";

const FALLBACK_NUMBER = "112"; // NEVER 911 — this app is used worldwide.

// The SIM/GPS lookups are the expensive, async, physical-location signals —
// they don't change within a session, so we resolve them once and cache the
// result at module scope (undefined = not yet attempted, null = attempted but
// nothing resolved). Override and device-region are cheap/synchronous, so
// those are re-evaluated on every call instead of being cached here.
let cachedPhysical;

function lookup(isoCountry) {
  if (!isoCountry) return null;
  const iso = isoCountry.toUpperCase();
  const remoteMap = getCachedEmergencyNumbers();
  const entry = remoteMap?.[iso] ?? bundledEmergencyNumbers[iso];
  if (!entry?.ambulance) return null;
  return { number: entry.ambulance, countryCode: iso };
}

async function resolvePhysicalLocation() {
  // 1. SIM country
  try {
    const simIso = await Cellular.getIsoCountryCodeAsync();
    const simMatch = lookup(simIso);
    if (simMatch) return { ...simMatch, source: "sim" };
  } catch {
    // ignore — fall through to GPS
  }

  // 2. GPS country (only if permission already granted — never prompt)
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status === "granted") {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      });
      const places = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      const gpsIso = places?.[0]?.isoCountryCode;
      const gpsMatch = lookup(gpsIso);
      if (gpsMatch) return { ...gpsMatch, source: "gps" };
    }
  } catch {
    // ignore — nothing physical resolved
  }

  return null;
}

/**
 * Resolves the correct AMBULANCE number for the user's country.
 *
 * Resolution priority:
 *  1. SIM country (expo-cellular) — the country of the inserted SIM card.
 *  2. GPS country (expo-location, only if permission was already granted —
 *     never prompts) — the user's actual physical location.
 *  3. Device region (expo-localization) — the phone's configured region.
 *  4. User override (`emergencyNumberOverrideIso` in the store).
 *
 * NOTE: although SIM/GPS/region/override reads like a strict priority list,
 * an EXPLICIT user override is actually checked ahead of the device-region
 * fallback (step 3) below. Device region resolves on virtually every phone,
 * so if the override were checked last (as literally listed above) it would
 * never be reachable — region would always win first. SIM and GPS reflect
 * the traveler's actual physical location and should still beat a home-
 * country override ("physical location beats home country"), but region is
 * just a device setting, not a physical signal, so an explicit override
 * outranks it.
 *
 * If nothing resolves, returns 112 (never 911).
 */
export function useEmergencyNumber() {
  const overrideIso = useAppStore((s) => s.emergencyNumberOverrideIso);
  const [physical, setPhysical] = useState(cachedPhysical ?? null);
  const [isLoading, setIsLoading] = useState(cachedPhysical === undefined);

  useEffect(() => {
    if (cachedPhysical !== undefined) {
      setPhysical(cachedPhysical);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    resolvePhysicalLocation().then((resolved) => {
      cachedPhysical = resolved;
      if (!cancelled) {
        setPhysical(resolved);
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Physical location (SIM/GPS) always wins if we found one.
  if (physical) {
    return { number: physical.number, countryCode: physical.countryCode, source: physical.source, isLoading };
  }

  // No physical signal yet/found — explicit override beats device region.
  const overrideMatch = lookup(overrideIso);
  if (overrideMatch) {
    return { number: overrideMatch.number, countryCode: overrideMatch.countryCode, source: "override", isLoading };
  }

  // Fall back to device region.
  const regionCode = Localization.getLocales()?.[0]?.regionCode;
  const regionMatch = lookup(regionCode);
  if (regionMatch) {
    return { number: regionMatch.number, countryCode: regionMatch.countryCode, source: "region", isLoading };
  }

  // Nothing resolved — safe fallback, NEVER 911.
  return { number: FALLBACK_NUMBER, countryCode: null, source: "fallback", isLoading };
}
