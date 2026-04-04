import { useState, useEffect, useRef } from "react";
import { useMedicationsQuery } from "@/hooks/queries/useMedicationsQuery";
import { SCD_MEDICATIONS } from "@/utils/scdDrugs";

// RxNorm approximate-term endpoint — free, no API key, maintained by NIH
const RXNORM_URL = "https://rxnav.nlm.nih.gov/REST/approximateTerm.json";

// Map known SCD drug names → category for API result enrichment
const SCD_DRUG_MAP = new Map(
  SCD_MEDICATIONS.map((d) => [d.name.toLowerCase(), d])
);

// Search already-saved medications in the store
function searchSaved(medications, query) {
  const q = query.toLowerCase();
  return medications
    .filter((m) => m.name.toLowerCase().includes(q))
    .map((m) => ({
      name: m.name,
      subtitle: m.dosage || null,
      rxcui: null,
      source: "saved",
      category: m.category,
    }));
}

// Call RxNorm API and normalise response
async function searchRxNorm(query, signal) {
  const url = `${RXNORM_URL}?term=${encodeURIComponent(query)}&maxEntries=15&option=0`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`RxNorm error ${res.status}`);
  const data = await res.json();
  const candidates = data?.approximateGroup?.candidate ?? [];

  // Deduplicate by name (the API sometimes returns the same drug at different ranks)
  const seen = new Set();
  const results = [];
  for (const c of candidates) {
    if (!c.name) continue;
    const key = c.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const scdMatch = SCD_DRUG_MAP.get(key);
    results.push({
      name: c.name,
      subtitle: scdMatch?.subtitle ?? null,
      rxcui: c.rxcui,
      source: scdMatch ? "scd" : "api",
      category: scdMatch?.category ?? "Supportive",
    });
  }
  return results;
}

/**
 * useDrugSearch — live autocomplete for medication names.
 *
 * Strategy:
 *   1. Immediately return matching saved medications (zero latency).
 *   2. After 350 ms debounce, fetch from RxNorm and merge (saved first).
 *
 * Returns: { results, isLoading, error }
 *   results — array of { name, subtitle, rxcui, source, category }
 *   source   — "saved" | "scd" | "api"
 */
export function useDrugSearch(query) {
  const { data: medications = [] } = useMedicationsQuery();
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const abortRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    // Clear on short queries
    if (!query || query.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
      return;
    }

    // Immediate local hit (saved medications)
    const local = searchSaved(medications, query);
    setResults(local);
    setError(null);

    // Debounced API fetch
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      try {
        const apiResults = await searchRxNorm(query, controller.signal);
        const localNames = new Set(local.map((r) => r.name.toLowerCase()));
        const merged = [
          ...local,
          ...apiResults.filter((r) => !localNames.has(r.name.toLowerCase())),
        ];
        setResults(merged);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError("Couldn't reach drug database. Showing local results.");
          // Keep whatever local results we found
        }
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => {
      clearTimeout(timerRef.current);
    };
  }, [query, medications]);

  return { results, isLoading, error };
}
