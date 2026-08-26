import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/utils/auth/store';
import { queryKeys } from '@/hooks/queryKeys';
import {
  fetchCategoryPreferences,
  upsertCategoryPreference,
  deleteCategoryPreference,
} from '@/services/supabase/community';

function useUserId() {
  return useAuthStore((s) => s.auth?.user?.id);
}

export function useCategoryPrefsQuery() {
  const userId = useUserId();
  return useQuery({
    queryKey: queryKeys.categoryPrefs(userId),
    queryFn: () => fetchCategoryPreferences(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 10, // 10 minutes — preferences change infrequently
  });
}

/**
 * Follow a category. Auto-removes any block on the same category.
 */
export function useFollowCategoryMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId) => upsertCategoryPreference(userId, categoryId, 'follow'),
    onMutate: async (categoryId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.categoryPrefs(userId) });
      const prev = queryClient.getQueryData(queryKeys.categoryPrefs(userId));
      queryClient.setQueryData(queryKeys.categoryPrefs(userId), (old) => ({
        followedCategoryIds: Array.from(new Set([...(old?.followedCategoryIds ?? []), categoryId])),
        blockedCategoryIds: (old?.blockedCategoryIds ?? []).filter((id) => id !== categoryId),
      }));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(queryKeys.categoryPrefs(userId), ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categoryPrefs(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.community.root(userId) });
    },
  });
}

/**
 * Block a category. Auto-removes any follow on the same category.
 */
export function useBlockCategoryMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId) => upsertCategoryPreference(userId, categoryId, 'block'),
    onMutate: async (categoryId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.categoryPrefs(userId) });
      const prev = queryClient.getQueryData(queryKeys.categoryPrefs(userId));
      queryClient.setQueryData(queryKeys.categoryPrefs(userId), (old) => ({
        blockedCategoryIds: [...(old?.blockedCategoryIds ?? []), categoryId],
        followedCategoryIds: (old?.followedCategoryIds ?? []).filter((id) => id !== categoryId),
      }));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(queryKeys.categoryPrefs(userId), ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categoryPrefs(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.community.root(userId) });
    },
  });
}

/**
 * Unfollow or unblock a category.
 */
export function useRemoveCategoryPrefMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId) => deleteCategoryPreference(userId, categoryId),
    onMutate: async (categoryId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.categoryPrefs(userId) });
      const prev = queryClient.getQueryData(queryKeys.categoryPrefs(userId));
      queryClient.setQueryData(queryKeys.categoryPrefs(userId), (old) => ({
        followedCategoryIds: (old?.followedCategoryIds ?? []).filter((id) => id !== categoryId),
        blockedCategoryIds: (old?.blockedCategoryIds ?? []).filter((id) => id !== categoryId),
      }));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(queryKeys.categoryPrefs(userId), ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categoryPrefs(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.community.root(userId) });
    },
  });
}
