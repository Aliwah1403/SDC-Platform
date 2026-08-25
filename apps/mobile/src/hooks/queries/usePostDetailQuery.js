import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/utils/auth/store';
import { queryKeys } from '@/hooks/queryKeys';
import { fetchPostDetail } from '@/services/supabase/community';

function useUserId() {
  return useAuthStore((s) => s.auth?.user?.id);
}

/**
 * Fetches a single post with its comments and replies.
 */
export function usePostDetailQuery(postId) {
  const userId = useUserId();
  return useQuery({
    queryKey: queryKeys.community.post(postId, userId),
    queryFn: () => fetchPostDetail(postId, userId),
    enabled: !!userId && !!postId,
    staleTime: 1000 * 60, // 1 minute
  });
}
