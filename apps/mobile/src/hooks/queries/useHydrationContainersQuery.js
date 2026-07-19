import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/utils/auth/store';
import {
  fetchHydrationContainers,
  addHydrationContainer,
  updateHydrationContainer,
  removeHydrationContainer,
  setDefaultHydrationContainer,
} from '@/services/supabaseQueries';

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

function useUserId() {
  return useAuthStore((s) => s.auth?.user?.id);
}

export function useHydrationContainersQuery() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['hydrationContainers', userId],
    queryFn: () => fetchHydrationContainers(userId),
    enabled: !!userId,
  });
}

function useInvalidateHydrationContainers() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['hydrationContainers', userId] });
}

export function useAddHydrationContainerMutation() {
  const userId = useUserId();
  const invalidate = useInvalidateHydrationContainers();
  return useMutation({
    mutationFn: (fields) => addHydrationContainer(userId, fields),
    onSuccess: invalidate,
  });
}

export function useUpdateHydrationContainerMutation() {
  const invalidate = useInvalidateHydrationContainers();
  return useMutation({
    mutationFn: ({ id, fields }) => updateHydrationContainer(id, fields),
    onSuccess: invalidate,
  });
}

export function useRemoveHydrationContainerMutation() {
  const invalidate = useInvalidateHydrationContainers();
  return useMutation({
    mutationFn: (id) => removeHydrationContainer(id),
    onSuccess: invalidate,
  });
}

export function useSetDefaultHydrationContainerMutation() {
  const invalidate = useInvalidateHydrationContainers();
  return useMutation({
    mutationFn: (id) => setDefaultHydrationContainer(id),
    onSuccess: invalidate,
  });
}
