import { getSharedPayloads } from 'expo-sharing';

export async function redirectSystemPath({ path, initial }: { path: string; initial: boolean }) {
  let url: URL;
  try {
    url = new URL(path);
  } catch {
    // Keep malformed ordinary paths on the normal app entry point.
    return path;
  }

  if (url.hostname !== 'expo-sharing') return path;

  // iOS keeps the launch URL across a Fast Refresh/dev reload. The share
  // payload itself is one-shot and has already been cleared, so routing that
  // stale URL back to the handler produces an empty share screen. Warm share
  // intents are always real; only validate initial launch URLs.
  if (!initial) return '/handle-share';
  try {
    return getSharedPayloads().length > 0 ? '/handle-share' : '/';
  } catch {
    // If payload inspection is unavailable, preserve the real share route and
    // let its empty-payload guard recover rather than dropping an incoming item.
    return '/handle-share';
  }
}
