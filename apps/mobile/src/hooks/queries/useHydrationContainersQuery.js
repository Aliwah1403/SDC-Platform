import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/utils/auth/store';
import {
  fetchHydrationContainers,
  addHydrationContainer,
  updateHydrationContainer,
  removeHydrationContainer,
  setDefaultHydrationContainer,
} from '@/services/supabase/hydration';
import { registerNotificationCategories } from '@/utils/notificationActions';

// Re-exported for backward compatibility — every existing importer of these
// three constants points at this file. Values live in constants/hydrationContainers.js
// so utils/notificationActions.js (which this file also imports) can read
// FALLBACK_CONTAINERS without an import cycle.
export {
  DEFAULT_ICON_KEY,
  MAX_CONTAINERS,
  FALLBACK_CONTAINERS,
  emojiToIconKey,
  containerIconKey,
} from '@/constants/hydrationContainers';

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
  // The hydration notification category's primary action title embeds the
  // default container's name/ml (Step 10 decision 4) — re-register it any
  // time a container write settles so a stale name/ml never lingers on an
  // already-scheduled category.
  return async () => {
    // Awaited so the active query's cache is fresh by the time we read the
    // default container back out of it below — invalidateQueries' promise
    // resolves once the resulting refetch settles.
    await queryClient.invalidateQueries({ queryKey: ['hydrationContainers', userId] });
    registerNotificationCategories({ queryClient, userId }).catch((err) => {
      console.error('[HydrationContainers] Failed to re-register notification categories:', err);
    });
  };
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
