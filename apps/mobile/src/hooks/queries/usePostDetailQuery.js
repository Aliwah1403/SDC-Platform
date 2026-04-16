import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/utils/auth/store';
import { fetchPostDetail } from '@/services/supabaseQueries';

function useUserId() {
  return useAuthStore((s) => s.auth?.user?.id);
}

/**
 * Fetches a single post with its comments and replies.
 */
export function usePostDetailQuery(postId) {
  const userId = useUserId();
  return useQuery({
    queryKey: ['post_detail', postId, userId],
    queryFn: () => fetchPostDetail(postId, userId),
    enabled: !!userId && !!postId,
    staleTime: 1000 * 60, // 1 minute
  });
}
