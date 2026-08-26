import { ActionSheetIOS, Alert, Linking, Platform } from 'react-native';

export function directionsDestination(location) {
  if (Number.isFinite(location?.lat) && Number.isFinite(location?.lng)) {
    return `${location.lat},${location.lng}`;
  }
  return location?.address?.trim() || null;
}

export function buildDirectionsUrls(location) {
  const destination = directionsDestination(location);
  if (!destination) return null;
  const encodedDestination = encodeURIComponent(destination);
  const encodedLabel = encodeURIComponent(location?.name || 'Care location');
  const hasCoordinates = Number.isFinite(location?.lat) && Number.isFinite(location?.lng);
  return {
    apple: `https://maps.apple.com/?daddr=${encodedDestination}&q=${encodedLabel}`,
    google: `https://www.google.com/maps/dir/?api=1&destination=${encodedDestination}`,
    waze: hasCoordinates
      ? `https://waze.com/ul?ll=${encodedDestination}&navigate=yes`
      : `https://waze.com/ul?q=${encodedDestination}&navigate=yes`,
    system: Platform.OS === 'android'
      ? `geo:0,0?q=${encodedDestination}(${encodedLabel})`
      : `https://maps.apple.com/?daddr=${encodedDestination}&q=${encodedLabel}`,
  };
}

export function careLocationMapActionLabel(location) {
  if (directionsDestination(location)) return 'Get directions';
  if (location?.sourceUrl) return 'Open in Maps';
  return null;
}

async function safeOpenUrl(url, errorTitle = 'Couldn’t open maps', errorMessage = 'Please check that a maps app is available and try again.') {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    Alert.alert(errorTitle, errorMessage);
    return false;
  }
}

export async function getAvailableDirectionsApps() {
  const candidates = Platform.OS === 'ios'
    ? [
        { key: 'apple', label: 'Apple Maps', scheme: 'maps://' },
        { key: 'google', label: 'Google Maps', scheme: 'comgooglemaps://' },
        { key: 'waze', label: 'Waze', scheme: 'waze://' },
      ]
    : [
        { key: 'system', label: 'Choose maps app', scheme: 'geo:0,0?q=care' },
        { key: 'waze', label: 'Waze', scheme: 'waze://' },
      ];
  const availability = await Promise.all(candidates.map(async (item) => ({
    ...item,
    available: item.key === 'apple' || item.key === 'system' || await Linking.canOpenURL(item.scheme).catch(() => false),
  })));
  return availability.filter((item) => item.available);
}

export async function openDirections(location, { app } = {}) {
  const urls = buildDirectionsUrls(location);
  if (!urls) {
    if (location?.sourceUrl) return safeOpenUrl(location.sourceUrl);
    Alert.alert('Directions unavailable', 'Add an address or map coordinates to this care location first.');
    return false;
  }
  if (app && urls[app]) return safeOpenUrl(urls[app]);

  const availableApps = await getAvailableDirectionsApps();
  if (Platform.OS === 'ios') {
    return new Promise((resolve) => {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', ...availableApps.map((item) => item.label)], cancelButtonIndex: 0, title: 'Get directions with' },
        (index) => {
          if (index === 0) return resolve(false);
          const choice = availableApps[index - 1].key;
          safeOpenUrl(urls[choice]).then(resolve);
        },
      );
    });
  }

  const wazeAvailable = availableApps.some((item) => item.key === 'waze');
  if (!wazeAvailable) return safeOpenUrl(urls.system);
  return new Promise((resolve) => {
    Alert.alert(
      'Get directions with',
      undefined,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Choose maps app', onPress: () => safeOpenUrl(urls.system).then(resolve) },
        { text: 'Waze', onPress: () => safeOpenUrl(urls.waze).then(resolve) },
      ],
    );
  });
}

export function buildExternalSearchUrl(query) {
  const encoded = encodeURIComponent(query);
  return Platform.OS === 'ios'
    ? `https://maps.apple.com/?q=${encoded}`
    : `https://www.google.com/maps/search/?api=1&query=${encoded}`;
}

export async function openExternalMapSearch(query) {
  return safeOpenUrl(buildExternalSearchUrl(query));
}

export async function callCareLocation(phone) {
  const value = phone?.trim();
  if (!value) return false;
  return safeOpenUrl(`tel:${encodeURIComponent(value)}`, 'Couldn’t start the call', 'Check this phone number and try again.');
}
