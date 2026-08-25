import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/utils/auth/store';
import { queryKeys } from '@/hooks/queryKeys';
import { fetchCommunityFeed } from '@/services/supabase/community';
import { useCategoryPrefsQuery } from './useCategoryPrefsQuery';

function useUserId() {
  return useAuthStore((s) => s.auth?.user?.id);
}

/**
 * Fetches the community feed for a given filter tab.
 * Category preferences (followed/blocked) are loaded from useCategoryPrefsQuery.
 *
 * filter: 'popular' | 'recent' | 'following' | 'mine' | 'saved'
 */
export function useCommunityFeedQuery(filter = 'popular') {
  const userId = useUserId();
  const { data: prefs } = useCategoryPrefsQuery();
  const followedCategoryIds = prefs?.followedCategoryIds ?? [];
  const blockedCategoryIds = prefs?.blockedCategoryIds ?? [];

  return useQuery({
    queryKey: queryKeys.community.feed(userId, filter, { followedCategoryIds, blockedCategoryIds }),
    queryFn: () =>
      fetchCommunityFeed({ userId, filter, followedCategoryIds, blockedCategoryIds }),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Fetches posts for a single category page, scoped to categoryId on the server.
 * Unlike useCommunityFeedQuery, this does NOT apply follow/block filtering —
 * you're browsing a specific category explicitly.
 */
export function useCategoryFeedQuery(categoryId) {
  const userId = useUserId();

  return useQuery({
    queryKey: queryKeys.community.feed(userId, 'category', { categoryId }),
    queryFn: () =>
      fetchCommunityFeed({ userId, filter: 'category', categoryId }),
    enabled: !!userId && !!categoryId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
