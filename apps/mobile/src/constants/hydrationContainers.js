// Shared hydration-container constants — split out from
// hooks/queries/useHydrationContainersQuery.js so utils/notificationActions.js
// can read FALLBACK_CONTAINERS without creating an import cycle (the query
// hook file also needs to call into notificationActions.js on mutation
// success — see Step 10). This file has no dependencies of its own.

// Curated emoji picker for containers — not a full keyboard (Step 9 decision 2).
export const CONTAINER_EMOJI_OPTIONS = ['🥛', '🍶', '🚰', '💧', '🍵', '☕', '🧋', '🫙'];
export const MAX_CONTAINERS = 4;

// Used only if the fetched list is empty/still loading (e.g. offline on first
// launch before the onboarding seed or migration backfill has synced) — keeps
// the quick-add UI functional even when the network read hasn't resolved yet.
// Matches the seed every account gets in Supabase, so this is invisible in
// the common case.
export const FALLBACK_CONTAINERS = [
  { id: 'glass', name: 'Glass', ml: 250, emoji: '🥛', isDefault: true },
  { id: 'bottle', name: 'Bottle', ml: 500, emoji: '🍶', isDefault: false },
  { id: 'large', name: 'Large', ml: 1000, emoji: '🫙', isDefault: false },
];
