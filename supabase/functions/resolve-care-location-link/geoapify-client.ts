const API_BASE = "https://api.geoapify.com/v2";
const GEOCODE_BASE = "https://api.geoapify.com/v1/geocode";
const REQUEST_TIMEOUT_MS = 4500;
const MAX_RESPONSE_BYTES = 256 * 1024;

function providerError(code: string, message: string) {
  return Object.assign(new Error(message), { code, provider: "geoapify" });
}

async function getJson(path: string, apiKey: string, fetchImpl = fetch) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetchImpl(`${path}${path.includes("?") ? "&" : "?"}apiKey=${encodeURIComponent(apiKey)}`, {
      headers: { "Accept": "application/json", "User-Agent": "Hemo-Care-Location/1.0" },
      signal: controller.signal,
    });
    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > MAX_RESPONSE_BYTES) throw providerError("response_too_large", "Geoapify response was too large");
    const text = await response.text();
    if (new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES) throw providerError("response_too_large", "Geoapify response was too large");
    if (!response.ok) throw providerError(response.status === 429 ? "quota" : "provider_failed", "Geoapify lookup was unavailable");
    try { return JSON.parse(text); } catch { throw providerError("invalid_response", "Geoapify returned invalid data"); }
  } catch (error) {
    if (error?.name === "AbortError") throw providerError("timeout", "Geoapify lookup timed out");
    throw error;
  } finally { clearTimeout(timer); }
}

function property(feature) { return feature && typeof feature === "object" && feature.properties && typeof feature.properties === "object" ? feature.properties : null; }

function safeString(value, maxLength) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed && trimmed.length <= maxLength ? trimmed : null;
}

function safeWebsite(value) {
  const text = safeString(value, 2048);
  if (!text) return null;
  try {
    const url = new URL(text);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? text : null;
  } catch { return null; }
}

export function normalizeFeature(feature) {
  const p = property(feature);
  if (!p) return null;
  const geometry = feature.geometry?.coordinates;
  const lat = Number(p.lat ?? p.latitude ?? (Array.isArray(geometry) ? geometry[1] : NaN));
  const lng = Number(p.lon ?? p.lng ?? p.longitude ?? (Array.isArray(geometry) ? geometry[0] : NaN));
  const rawPhone = p.phone ?? p.datasource?.raw?.contact?.phone ?? p.contact?.phone;
  return {
    id: safeString(p.place_id, 500),
    name: safeString(p.name, 300),
    address: safeString(p.formatted, 500),
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    phone: safeString(rawPhone, 100),
    website: safeWebsite(p.website),
    categories: Array.isArray(p.categories) ? p.categories.map((value) => safeString(value, 100)).filter(Boolean).slice(0, 20) : [],
    countryCode: /^[a-z]{2}$/i.test(p.country_code || "") ? p.country_code.toUpperCase() : null,
  };
}

export async function reverseGeocode(lat: number, lng: number, apiKey: string, fetchImpl = fetch) {
  const data = await getJson(`${GEOCODE_BASE}/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`, apiKey, fetchImpl);
  return normalizeFeature(data?.features?.[0]);
}

export async function nearbyHealthcare(lat: number, lng: number, apiKey: string, fetchImpl = fetch) {
  const path = `${API_BASE}/places?categories=healthcare&filter=circle:${encodeURIComponent(lng)},${encodeURIComponent(lat)},1500&limit=5`;
  const data = await getJson(path, apiKey, fetchImpl);
  return (Array.isArray(data?.features) ? data.features : []).map(normalizeFeature).filter(Boolean);
}

export async function forwardGeocode(text: string, apiKey: string, fetchImpl = fetch, proximity?: { lat: number; lng: number }) {
  const bias = Number.isFinite(proximity?.lat) && Number.isFinite(proximity?.lng)
    ? `&bias=${encodeURIComponent(`proximity:${proximity.lng},${proximity.lat}`)}`
    : "";
  const data = await getJson(`${GEOCODE_BASE}/search?text=${encodeURIComponent(text)}&limit=5&type=amenity${bias}`, apiKey, fetchImpl);
  return (Array.isArray(data?.features) ? data.features : []).map(normalizeFeature).filter(Boolean);
}

export async function placeDetails(id: string, apiKey: string, fetchImpl = fetch) {
  const data = await getJson(`${API_BASE}/place-details?id=${encodeURIComponent(id)}`, apiKey, fetchImpl);
  return normalizeFeature(data?.features?.[0] || data);
}
