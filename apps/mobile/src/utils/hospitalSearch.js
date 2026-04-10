// Google Places API (New) wrappers for hospital/clinic search
import { FACILITY_TYPES } from "@/data/mockFacilities";

const BASE = "https://places.googleapis.com/v1";
const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY;

// ── Field masks ───────────────────────────────────────────────────────────────
const PLACE_FIELDS = [
  "id",
  "displayName",
  "types",
  "formattedAddress",
  "nationalPhoneNumber",
  "location",
  "rating",
  "regularOpeningHours",
  "photos",
  "websiteUri",
  "editorialSummary",
].join(",");

const LIST_FIELD_MASK = PLACE_FIELDS.split(",")
  .map((f) => `places.${f}`)
  .join(",");

const TEXT_FIELD_MASK = LIST_FIELD_MASK + ",nextPageToken";

// ── Day abbreviation map ──────────────────────────────────────────────────────
const DAY_ABBR = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

// ── Types that are irrelevant to SCD patients — filtered out client-side ───────
const EXCLUDED_PLACE_TYPES = new Set([
  "dental_clinic",
  "dentist",
  "beauty_salon",
  "hair_salon",
  "hair_care",
  "spa",
  "gym",
  "fitness_center",
  "veterinary_care",
  "acupuncturist",
  "optician",
  "laundry",
  "lodging",
  "restaurant",
  "food",
  "store",
]);

// Returns true if ANY of the place's Google types are in the exclusion list
function isIrrelevant(types = []) {
  return types.some((t) => EXCLUDED_PLACE_TYPES.has(t));
}

// ── Type inference from Google place types ────────────────────────────────────
function inferType(types = []) {
  if (types.some((t) => ["hospital", "general_hospital"].includes(t)))
    return FACILITY_TYPES.HOSPITAL;
  if (types.some((t) => ["doctor", "physiotherapist", "medical_clinic"].includes(t)))
    return FACILITY_TYPES.CLINIC;
  return FACILITY_TYPES.HOSPITAL;
}

// ── SCD specialist detection ──────────────────────────────────────────────────
function isScdSpecialist(name = "") {
  const n = name.toLowerCase();
  return (
    n.includes("sickle") ||
    n.includes("haematology") ||
    n.includes("hematology") ||
    n.includes("blood disorder") ||
    n.includes("thalassaemia") ||
    n.includes("thalassemia")
  );
}

// ── Parse Google's weekdayDescriptions into our weeklyHours format ────────────
// Google gives: ["Monday: 9:00 AM – 5:00 PM", "Tuesday: Closed", ...]
function parseWeeklyHours(descriptions = []) {
  return descriptions.map((desc) => {
    const colonIdx = desc.indexOf(": ");
    const dayFull = colonIdx > -1 ? desc.slice(0, colonIdx) : "";
    const hours = colonIdx > -1 ? desc.slice(colonIdx + 2).trim() : desc;
    return { day: DAY_ABBR[dayFull] ?? dayFull.slice(0, 3), hours };
  });
}

// ── Derive today's summary hours string ──────────────────────────────────────
function summaryHours(descriptions = [], openNow) {
  if (!descriptions.length) return openNow ? "Open now" : "Call for hours";
  // Google returns Mon-Sun starting index 0 = Monday
  const dayIndex = new Date().getDay(); // 0=Sun … 6=Sat
  const gIdx = dayIndex === 0 ? 6 : dayIndex - 1; // convert to Mon-based
  const todayDesc = descriptions[gIdx] ?? "";
  const hours = todayDesc.slice(todayDesc.indexOf(": ") + 2).trim();
  return hours || (openNow ? "Open now" : "Call for hours");
}

// ── Normalize a raw Google Places object to the app's facility shape ──────────
export function normalizeFacility(place) {
  const name = place.displayName?.text ?? "Unknown";
  const types = place.types ?? [];
  const oh = place.regularOpeningHours ?? {};
  const descriptions = oh.weekdayDescriptions ?? [];

  return {
    id: place.id,
    placeId: place.id,
    name,
    type: inferType(types),
    scdSpecialist: isScdSpecialist(name),
    address: place.formattedAddress ?? "",
    phone: place.nationalPhoneNumber ?? "",
    lat: place.location?.latitude ?? 0,
    lng: place.location?.longitude ?? 0,
    rating: place.rating ?? null,
    hours: summaryHours(descriptions, oh.openNow),
    weeklyHours: parseWeeklyHours(descriptions),
    website: place.websiteUri ?? null,
    description: place.editorialSummary?.text ?? null,
    // First photo name — used to build a URL via photoUrl()
    photoName: place.photos?.[0]?.name ?? null,
  };
}

// ── Photo URL helper ──────────────────────────────────────────────────────────
// Returns null if no photo or no API key (callers should handle gracefully)
export function photoUrl(photoName, maxSize = 800) {
  if (!photoName || !API_KEY) return null;
  return (
    `${BASE}/${photoName}/media` +
    `?maxHeightPx=${maxSize}&maxWidthPx=${maxSize}&key=${API_KEY}`
  );
}

// ── Nearby Search (no pagination — up to 20 results) ─────────────────────────
export async function searchNearbyFacilities(lat, lng, radiusMeters = 8000) {
  if (!API_KEY) throw new Error("EXPO_PUBLIC_GOOGLE_PLACES_KEY is not set");

  const res = await fetch(`${BASE}/places:searchNearby`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": LIST_FIELD_MASK,
    },
    body: JSON.stringify({
      includedTypes: ["hospital", "doctor", "medical_clinic", "pharmacy", "physiotherapist"],
      excludedTypes: ["dental_clinic", "dentist", "beauty_salon", "hair_salon", "spa", "gym", "fitness_center", "veterinary_care"],
      maxResultCount: 20,
      rankPreference: "DISTANCE",
      locationRestriction: {
        circle: { center: { latitude: lat, longitude: lng }, radius: radiusMeters },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? `Places API ${res.status}`);
  }

  const json = await res.json();
  const relevant = (json.places ?? []).filter((p) => !isIrrelevant(p.types ?? []));
  return { facilities: relevant.map(normalizeFacility), nextPageToken: null };
}

// ── Text Search (paginated — supports user queries + load-more) ───────────────
export async function searchFacilitiesByText(query, lat, lng, pageToken = null) {
  if (!API_KEY) throw new Error("EXPO_PUBLIC_GOOGLE_PLACES_KEY is not set");

  const body = {
    textQuery: query || "hospital clinic urgent care",
    maxResultCount: 20,
    locationBias: {
      circle: { center: { latitude: lat, longitude: lng }, radius: 10000.0 },
    },
  };
  if (pageToken) body.pageToken = pageToken;

  const res = await fetch(`${BASE}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": TEXT_FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? `Places API ${res.status}`);
  }

  const json = await res.json();
  const relevant = (json.places ?? []).filter((p) => !isIrrelevant(p.types ?? []));
  return {
    facilities: relevant.map(normalizeFacility),
    nextPageToken: json.nextPageToken ?? null,
  };
}

// ── Place Details ─────────────────────────────────────────────────────────────
export async function getPlaceDetails(placeId) {
  if (!API_KEY) throw new Error("EXPO_PUBLIC_GOOGLE_PLACES_KEY is not set");

  const res = await fetch(`${BASE}/places/${placeId}`, {
    headers: {
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": PLACE_FIELDS,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? `Places API ${res.status}`);
  }

  return normalizeFacility(await res.json());
}
