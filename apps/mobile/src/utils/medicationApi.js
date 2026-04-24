import { SCD_MEDICATIONS } from "@/utils/scdDrugs";

const SCD_DRUG_MAP = new Map(
  SCD_MEDICATIONS.map((d) => [d.name.toLowerCase(), d])
);

/**
 * Drug barcodes are UPC-A (12 digits) or EAN-13 (13 digits).
 * The NDC is embedded inside — extract it and build candidate strings
 * in the formats openFDA uses (e.g. "12547-6165-10").
 *
 * UPC-A: strip leading '3' and trailing check digit → 10 NDC digits
 * EAN-13: strip leading 2 chars and trailing check digit → 10 NDC digits
 */
function buildNDCCandidates(rawBarcode) {
  const digits = rawBarcode.replace(/\D/g, "");
  const candidates = [];

  let ndc10 = null;
  if (digits.length === 12 && digits[0] === "3") {
    ndc10 = digits.slice(1, 11);
  } else if (digits.length === 13) {
    ndc10 = digits.slice(2, 12);
  } else if (digits.length === 10) {
    ndc10 = digits;
  }

  if (ndc10) {
    // 5-4-1 split  → XXXXX-XXXX-X   (most common on Rx bottles)
    candidates.push(`${ndc10.slice(0, 5)}-${ndc10.slice(5, 9)}-${ndc10.slice(9)}`);
    // 5-3-2 split  → XXXXX-XXX-XX
    candidates.push(`${ndc10.slice(0, 5)}-${ndc10.slice(5, 8)}-${ndc10.slice(8)}`);
    // product_ndc only (5-4), no package segment
    candidates.push(`${ndc10.slice(0, 5)}-${ndc10.slice(5, 9)}`);
  }

  // Also try the raw value as-is (covers pre-formatted NDC barcodes)
  if (!candidates.includes(digits)) candidates.push(digits);

  return candidates;
}

async function queryOpenFDA(ndc) {
  const encoded = encodeURIComponent(`"${ndc}"`);

  // Try package_ndc (full 3-segment), then product_ndc (2-segment)
  for (const field of ["package_ndc", "product_ndc"]) {
    const url = `https://api.fda.gov/drug/ndc.json?search=${field}:${encoded}&limit=1`;
    const res = await fetch(url);
    if (!res.ok) continue;
    const data = await res.json();
    const result = data?.results?.[0];
    if (result) return result;
  }
  return null;
}

function parseFDAResult(result) {
  const rawName = result.brand_name || result.generic_name || null;
  if (!rawName) return null;

  const name = rawName
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

  const scdMatch = SCD_DRUG_MAP.get(name.toLowerCase());
  const rxcui = result.openfda?.rxcui?.[0] ?? null;

  return {
    name,
    category: scdMatch?.category ?? "Supportive",
    rxcui,
  };
}

/**
 * Look up a medication by NDC/UPC barcode data via openFDA.
 * Returns { name, category, rxcui } or null if not found.
 */
export async function lookupByNDC(rawBarcode) {
  const candidates = buildNDCCandidates(rawBarcode);
  console.log("[NDC] Candidates to try:", candidates);

  for (const ndc of candidates) {
    console.log("[NDC] Querying openFDA for:", ndc);
    const result = await queryOpenFDA(ndc);
    console.log("[NDC] Result for", ndc, "→", result ? result.brand_name || result.generic_name : "null");
    if (result) return parseFDAResult(result);
  }
  return null;
}
