const GOOGLE_SHORT_HOSTS = new Set(["maps.app.goo.gl", "goo.gl"]);
const APPLE_HOSTS = new Set(["maps.apple.com"]);
const MAX_URL_LENGTH = 2048;

function isGoogleMapsHost(hostname) {
  const labels = hostname.toLowerCase().split(".");
  if (labels[0] === "www" || labels[0] === "maps") labels.shift();
  if (labels.shift() !== "google") return false;
  if (labels.length === 1) return /^[a-z]{2,63}$/.test(labels[0]) || labels[0] === "com";
  return labels.length === 2 && ["com", "co"].includes(labels[0]) && /^[a-z]{2}$/.test(labels[1]);
}

export function classifyMapsUrl(rawUrl) {
  if (typeof rawUrl !== "string" || rawUrl.length > MAX_URL_LENGTH) return null;
  let url;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (APPLE_HOSTS.has(hostname)) return { provider: "apple_maps", isShort: false, url };
  if (GOOGLE_SHORT_HOSTS.has(hostname)) {
    if (hostname === "goo.gl" && !url.pathname.startsWith("/maps")) return null;
    return { provider: "google_maps", isShort: true, url };
  }
  if (isGoogleMapsHost(hostname) && (hostname.startsWith("maps.") || url.pathname.startsWith("/maps"))) {
    return { provider: "google_maps", isShort: false, url };
  }
  return null;
}

function parseCoordinatePair(value) {
  if (!value) return null;
  const match = String(value).trim().match(/^\s*(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function cleanText(value) {
  if (!value) return null;
  const cleaned = String(value).replace(/\+/g, " ").replace(/\s+/g, " ").trim();
  return cleaned && cleaned.length <= 500 ? cleaned : null;
}

function decodedPathSegment(value) {
  if (!value) return null;
  try {
    return cleanText(decodeURIComponent(value));
  } catch {
    return cleanText(value);
  }
}

function googlePathName(url) {
  const segments = url.pathname.split("/").filter(Boolean);
  const placeIndex = segments.indexOf("place");
  if (placeIndex >= 0) return decodedPathSegment(segments[placeIndex + 1]);
  return null;
}

function googleCoordinates(url) {
  for (const key of ["query", "destination", "center", "ll"]) {
    const coordinates = parseCoordinatePair(url.searchParams.get(key));
    if (coordinates) return coordinates;
  }
  const pathMatch = url.pathname.match(/@(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/);
  if (pathMatch) return parseCoordinatePair(`${pathMatch[1]},${pathMatch[2]}`);
  const data = url.searchParams.get("data") || url.pathname;
  const dataMatch = data.match(/!3d(-?\d{1,3}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/);
  return dataMatch ? parseCoordinatePair(`${dataMatch[1]},${dataMatch[2]}`) : null;
}

function appleCoordinates(url) {
  for (const key of ["coordinate", "ll", "center", "sll"]) {
    const coordinates = parseCoordinatePair(url.searchParams.get(key));
    if (coordinates) return coordinates;
  }
  return null;
}

function firstTextParam(url, keys) {
  for (const key of keys) {
    const value = cleanText(url.searchParams.get(key));
    if (value && !parseCoordinatePair(value)) return value;
  }
  return null;
}

export function parseMapsUrl(rawUrl) {
  const classified = classifyMapsUrl(rawUrl);
  if (!classified) throw Object.assign(new Error("Unsupported maps link"), { code: "unsupported_url" });
  const { provider, url } = classified;
  const coordinates = provider === "apple_maps" ? appleCoordinates(url) : googleCoordinates(url);
  let name = null;
  let address = null;
  let providerPlaceId = null;

  if (provider === "apple_maps") {
    name = firstTextParam(url, ["name", "q"]);
    address = firstTextParam(url, ["address", "daddr"]);
    providerPlaceId = cleanText(url.searchParams.get("place-id") || url.searchParams.get("muid"));
  } else {
    name = googlePathName(url) || firstTextParam(url, ["query", "q"]);
    address = firstTextParam(url, ["destination", "daddr"]);
    providerPlaceId = cleanText(
      url.searchParams.get("query_place_id") ||
      url.searchParams.get("destination_place_id") ||
      url.searchParams.get("place_id"),
    );
  }

  return {
    provider,
    name,
    address,
    lat: coordinates?.lat ?? null,
    lng: coordinates?.lng ?? null,
    providerPlaceId,
    sourceUrl: url.toString(),
    confidence: {
      name: name ? "high" : "unavailable",
      address: address ? "high" : "unavailable",
      coordinates: coordinates ? "high" : "unavailable",
      providerPlaceId: providerPlaceId ? "high" : "unavailable",
    },
  };
}

function parseIpv4(ip) {
  const parts = ip.split(".");
  if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part))) return null;
  const values = parts.map(Number);
  return values.some((part) => part > 255) ? null : values;
}

export function isPrivateOrLocalIp(ip) {
  const normalized = String(ip).trim().toLowerCase().replace(/^\[|\]$/g, "").split("%")[0];
  const v4 = parseIpv4(normalized);
  if (v4) {
    const [a, b] = v4;
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || a >= 224;
  }
  if (!normalized.includes(":")) return true;
  if (normalized === "::" || normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  if (/^fe[89ab]/.test(normalized)) return true;
  if (normalized.startsWith("::ffff:")) return isPrivateOrLocalIp(normalized.slice(7));
  return false;
}

export async function assertPublicHostname(hostname, resolveHost = defaultResolveHost) {
  const addresses = await resolveHost(hostname);
  if (!Array.isArray(addresses) || addresses.length === 0 || addresses.some(isPrivateOrLocalIp)) {
    throw Object.assign(new Error("Maps host did not resolve to a public address"), { code: "unsafe_target" });
  }
}

async function defaultResolveHost(hostname) {
  const results = [];
  for (const type of ["A", "AAAA"]) {
    try {
      results.push(...await Deno.resolveDns(hostname, type));
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
  }
  return results;
}

export async function resolveMapsLink(rawUrl, {
  fetchImpl = fetch,
  resolveHost = defaultResolveHost,
  maxRedirects = 4,
  timeoutMs = 8000,
  maxResponseBytes = 65536,
} = {}) {
  let classified = classifyMapsUrl(rawUrl);
  if (!classified) throw Object.assign(new Error("Paste a Google Maps or Apple Maps HTTPS link"), { code: "unsupported_url" });
  let currentUrl = classified.url;
  const originalUrl = currentUrl.toString();
  const deadline = Date.now() + timeoutMs;

  if (classified.isShort) {
    for (let redirect = 0; redirect <= maxRedirects; redirect += 1) {
      classified = classifyMapsUrl(currentUrl.toString());
      if (!classified) throw Object.assign(new Error("The maps link redirected outside supported map providers"), { code: "unsafe_redirect" });
      await assertPublicHostname(currentUrl.hostname, resolveHost);
      if (!classified.isShort) break;
      const remaining = deadline - Date.now();
      if (remaining <= 0) throw Object.assign(new Error("Maps link resolution timed out"), { code: "timeout" });
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), remaining);
      let response;
      try {
        response = await fetchImpl(currentUrl, {
          method: "GET",
          redirect: "manual",
          signal: controller.signal,
          headers: { "Range": "bytes=0-0", "User-Agent": "Hemo-Care-Location-Resolver/1.0" },
        });
      } catch (error) {
        if (error?.name === "AbortError") throw Object.assign(new Error("Maps link resolution timed out"), { code: "timeout" });
        throw Object.assign(new Error("Could not resolve this maps link"), { code: "resolve_failed" });
      } finally {
        clearTimeout(timer);
      }
      const contentLength = Number(response.headers.get("content-length") || 0);
      if (contentLength > maxResponseBytes) {
        await response.body?.cancel();
        throw Object.assign(new Error("Maps response was too large"), { code: "response_too_large" });
      }
      const location = response.headers.get("location");
      await response.body?.cancel();
      if (response.status >= 300 && response.status < 400 && location) {
        if (redirect === maxRedirects) throw Object.assign(new Error("Maps link redirected too many times"), { code: "too_many_redirects" });
        currentUrl = new URL(location, currentUrl);
        continue;
      }
      if (!response.ok) throw Object.assign(new Error("Could not resolve this maps link"), { code: "resolve_failed" });
      break;
    }
  }

  const candidate = parseMapsUrl(currentUrl.toString());
  return { ...candidate, originalUrl, sourceUrl: currentUrl.toString() };
}
