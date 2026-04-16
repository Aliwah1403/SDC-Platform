import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/utils/auth/store';
import { fetchCommunityFeed } from '@/services/supabaseQueries';
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
    queryKey: ['community_feed', userId, filter, followedCategoryIds, blockedCategoryIds],
    queryFn: () =>
      fetchCommunityFeed({ userId, filter, followedCategoryIds, blockedCategoryIds }),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
