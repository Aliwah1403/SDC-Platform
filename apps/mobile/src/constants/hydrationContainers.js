// Shared hydration-container constants — split out from
// hooks/queries/useHydrationContainersQuery.js so utils/notificationActions.js
// can read FALLBACK_CONTAINERS without creating an import cycle (the query
// hook file also needs to call into notificationActions.js on mutation
// success — see Step 10). This file has no dependencies of its own.

export const MAX_CONTAINERS = 8;

// Containers are identified by an icon key (rendered by components/ContainerIcon.jsx)
// rather than an emoji. Kept dependency-free here so both the pure fallback
// mapping and the query layer can read it without pulling in react-native-svg.
export const DEFAULT_ICON_KEY = 'glass-water';

// Maps the legacy emoji column (pre-2026-07-28) to an icon key, so containers
// created before the icon migration still render an icon in the UI even if the
// backfill hasn't reached a given row yet. Anything unmapped falls back to the
// default glass.
const EMOJI_TO_ICON = {
  '🥛': 'glass-water',
  '🚰': 'glass-water',
  '💧': 'glass-water',
  '🍶': 'bottle',
  '🫙': 'carton',
  '🍵': 'mug',
  '☕': 'mug',
  '🧋': 'boba',
};

export function emojiToIconKey(emoji) {
  return EMOJI_TO_ICON[emoji] ?? DEFAULT_ICON_KEY;
}

// Resolves a container's icon key regardless of which column populated it —
// prefers the new `icon` field, falls back to deriving one from a legacy emoji.
export function containerIconKey(container) {
  return container?.icon ?? emojiToIconKey(container?.emoji);
}

// Used only if the fetched list is empty/still loading (e.g. offline on first
// launch before the onboarding seed or migration backfill has synced) — keeps
// the quick-add UI functional even when the network read hasn't resolved yet.
// Matches the seed every account gets in Supabase, so this is invisible in
// the common case.
export const FALLBACK_CONTAINERS = [
  { id: 'glass', name: 'Glass', ml: 250, icon: 'glass-water', isDefault: true },
  { id: 'bottle', name: 'Bottle', ml: 500, icon: 'bottle', isDefault: false },
  { id: 'mug', name: 'Mug', ml: 350, icon: 'mug', isDefault: false },
  { id: 'carton', name: 'Carton', ml: 1000, icon: 'carton', isDefault: false },
];
