import { MMKV } from "react-native-mmkv";
import { supabase } from "@/utils/auth/supabase";

const mmkv = new MMKV({ id: "hemo-emergency-numbers" });
const CACHE_KEY = "emergencyNumbersMap";

// Module-level cache so repeated getters within the same session don't hit MMKV.
let memoryCache = null;

/**
 * Fetches the full `emergency_numbers` reference table from Supabase (public
 * read, no auth required) and caches it to MMKV so it survives app restarts
 * even without network access. Safe to call multiple times — cheap no-op if
 * already cached this session, and fails silently on network errors (the
 * bundled emergencyNumbers.json is the offline fallback used by
 * useEmergencyNumber).
 */
export async function fetchAndCacheEmergencyNumbers() {
  try {
    const { data, error } = await supabase.from("emergency_numbers").select("*");
    if (error || !data) return;

    const map = {};
    for (const row of data) {
      map[row.iso_country] = { ambulance: row.ambulance, notes: row.notes ?? undefined };
    }
    memoryCache = map;
    mmkv.set(CACHE_KEY, JSON.stringify(map));
  } catch {
    // Offline or Supabase unreachable — bundled JSON fallback covers this.
  }
}

/**
 * Returns the cached remote emergency-numbers map (iso country -> { ambulance, notes }),
 * or null if nothing has been fetched/cached yet.
 */
export function getCachedEmergencyNumbers() {
  if (memoryCache) return memoryCache;
  const raw = mmkv.getString(CACHE_KEY);
  if (!raw) return null;
  try {
    memoryCache = JSON.parse(raw);
    return memoryCache;
  } catch {
    return null;
  }
}
