const GOOGLE_SHORT_HOSTS = new Set(['maps.app.goo.gl', 'goo.gl']);

function isGoogleMapsHost(hostname) {
  const labels = hostname.toLowerCase().split('.');
  if (labels[0] === 'www' || labels[0] === 'maps') labels.shift();
  if (labels.shift() !== 'google') return false;
  if (labels.length === 1) return /^[a-z]{2,63}$/.test(labels[0]) || labels[0] === 'com';
  return labels.length === 2 && ['com', 'co'].includes(labels[0]) && /^[a-z]{2}$/.test(labels[1]);
}

export function mapsProviderForUrl(value) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    const host = url.hostname.toLowerCase().replace(/\.$/, '');
    if (host === 'maps.apple.com') return 'apple_maps';
    if (GOOGLE_SHORT_HOSTS.has(host)) return host !== 'goo.gl' || url.pathname.startsWith('/maps') ? 'google_maps' : null;
    if (isGoogleMapsHost(host) && (host.startsWith('maps.') || url.pathname.startsWith('/maps'))) return 'google_maps';
  } catch {}
  return null;
}

/** Return the first supported Maps URL embedded in arbitrary shared text. */
export function selectCareLocationMapsUrl(...values) {
  for (const value of values) {
    if (typeof value !== 'string' || !value.trim()) continue;
    const candidates = value.match(/https?:\/\/[^\s<>"'`]+/gi) || [];
    for (const candidate of candidates) {
      const cleaned = candidate.replace(/[),.;!?]+$/g, '');
      if (mapsProviderForUrl(cleaned)) return cleaned;
    }
  }
  return null;
}

/** Shared-map imports do not have Care Locations beneath them in the navigation stack. */
export function isCareLocationShareImport(shareUrl, locationId) {
  const value = Array.isArray(shareUrl) ? shareUrl[0] : shareUrl;
  return typeof value === 'string' && value.trim().length > 0 && !locationId;
}
