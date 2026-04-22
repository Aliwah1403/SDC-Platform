import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/utils/auth/store';
import {
  createCommunityPost,
  deleteCommunityPost,
  likePost,
  unlikePost,
  savePost,
  unsavePost,
  reportCommunityPost,
  reportCommunityComment,
  addComment,
  addReply,
  deleteComment,
  voteOnPoll,
} from '@/services/supabaseQueries';

function useUserId() {
  return useAuthStore((s) => s.auth?.user?.id);
}

// ── Post mutations ────────────────────────────────────────────────────────

export function useCreatePostMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (post) => createCommunityPost({ userId, ...post }),
    onSuccess: () => {
      // Invalidate all feed variants so the new post appears
      queryClient.invalidateQueries({ queryKey: ['community_feed', userId] });
    },
  });
}

export function useDeletePostMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId) => {
      if (!userId) return Promise.reject(new Error("Not authenticated"));
      return deleteCommunityPost(postId, userId);
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['community_feed', userId] });
      const previousFeed = queryClient.getQueriesData({ queryKey: ['community_feed', userId] });
      queryClient.setQueriesData({ queryKey: ['community_feed', userId] }, (old) =>
        Array.isArray(old) ? old.filter((p) => p.id !== postId) : old,
      );
      return { previousFeed };
    },
    onError: (_err, _postId, context) => {
      if (context?.previousFeed) {
        context.previousFeed.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['community_feed', userId] });
    },
  });
}

// ── Like mutation (optimistic toggle) ────────────────────────────────────

export function useLikeMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  const updateLikeInCache = (queryKey, postId, liked) => {
    queryClient.setQueryData(queryKey, (old) => {
      if (!old) return old;
      // Feed array
      if (Array.isArray(old)) {
        return old.map((p) =>
          p.id !== postId ? p : { ...p, isLiked: liked, likes: p.likes + (liked ? 1 : -1) },
        );
      }
      // Post detail object
      if (old.id === postId) {
        return { ...old, isLiked: liked, likes: old.likes + (liked ? 1 : -1) };
      }
      return old;
    });
  };

  return useMutation({
    mutationFn: ({ postId, isLiked }) =>
      isLiked ? unlikePost(userId, postId) : likePost(userId, postId),

    onMutate: async ({ postId, isLiked }) => {
      const newLiked = !isLiked;
      // Optimistically update all cached queries that contain this post
      queryClient.getQueriesData({ queryKey: ['community_feed', userId] }).forEach(([key]) => {
        updateLikeInCache(key, postId, newLiked);
      });
      updateLikeInCache(['post_detail', postId, userId], postId, newLiked);
    },

    onError: (_err, { postId, isLiked }) => {
      // Revert
      queryClient.getQueriesData({ queryKey: ['community_feed', userId] }).forEach(([key]) => {
        updateLikeInCache(key, postId, isLiked);
      });
      updateLikeInCache(['post_detail', postId, userId], postId, isLiked);
    },
  });
}

// ── Save mutation (optimistic toggle) ────────────────────────────────────

export function useSaveMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  const updateSaveInCache = (queryKey, postId, saved) => {
    queryClient.setQueryData(queryKey, (old) => {
      if (!old) return old;
      if (Array.isArray(old)) {
        return old.map((p) => (p.id !== postId ? p : { ...p, isSaved: saved }));
      }
      if (old.id === postId) return { ...old, isSaved: saved };
      return old;
    });
  };

  return useMutation({
    mutationFn: ({ postId, isSaved }) =>
      isSaved ? unsavePost(userId, postId) : savePost(userId, postId),

    onMutate: async ({ postId, isSaved }) => {
      const newSaved = !isSaved;
      queryClient.getQueriesData({ queryKey: ['community_feed', userId] }).forEach(([key]) => {
        updateSaveInCache(key, postId, newSaved);
      });
      updateSaveInCache(['post_detail', postId, userId], postId, newSaved);
    },

    onError: (_err, { postId, isSaved }) => {
      queryClient.getQueriesData({ queryKey: ['community_feed', userId] }).forEach(([key]) => {
        updateSaveInCache(key, postId, isSaved);
      });
      updateSaveInCache(['post_detail', postId, userId], postId, isSaved);
    },

    onSettled: () => {
      // Invalidate saved feed so it stays accurate
      queryClient.invalidateQueries({ queryKey: ['community_feed', userId, 'saved'] });
    },
  });
}

// ── Report mutation ───────────────────────────────────────────────────────

export function useReportPostMutation() {
  const userId = useUserId();
  return useMutation({
    mutationFn: ({ postId, reason, description }) =>
      reportCommunityPost(userId, postId, reason, description),
  });
}

export function useReportCommentMutation() {
  const userId = useUserId();
  return useMutation({
    mutationFn: ({ commentId, reason, description }) =>
      reportCommunityComment(userId, commentId, reason, description),
  });
}

// ── Comment mutations ─────────────────────────────────────────────────────

export function useAddCommentMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, content }) => addComment(userId, postId, content),
    onSuccess: (_data, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['post_detail', postId, userId] });
      // Bump comment_count in feed caches
      queryClient.getQueriesData({ queryKey: ['community_feed', userId] }).forEach(([key]) => {
        queryClient.setQueryData(key, (old) =>
          Array.isArray(old)
            ? old.map((p) =>
                p.id !== postId ? p : { ...p, commentCount: (p.commentCount ?? 0) + 1 },
              )
            : old,
        );
      });
    },
  });
}

export function useAddReplyMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, parentCommentId, replyingToName, content }) =>
      addReply(userId, postId, parentCommentId, replyingToName, content),
    onSuccess: (_data, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['post_detail', postId, userId] });
    },
  });
}

export function useDeleteCommentMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId }) => deleteComment(commentId),
    onSuccess: (_data, { postId }) => {
      if (postId) {
        queryClient.invalidateQueries({ queryKey: ['post_detail', postId, userId] });
        // Decrement commentCount in all feed caches so PostCards stay in sync
        queryClient.getQueriesData({ queryKey: ['community_feed', userId] }).forEach(([key]) => {
          queryClient.setQueryData(key, (old) =>
            Array.isArray(old)
              ? old.map((p) =>
                  p.id !== postId ? p : { ...p, commentCount: Math.max(0, (p.commentCount ?? 1) - 1) },
                )
              : old,
          );
        });
      }
    },
  });
}

// ── Poll vote mutation ────────────────────────────────────────────────────

export function useVoteMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, optionId }) => voteOnPoll(userId, postId, optionId),
    onMutate: async ({ postId, optionId, previousOptionId }) => {
      const applyVote = (poll) => ({
        ...poll,
        votedOptionId: optionId,
        options: poll.options.map((o) => ({
          ...o,
          votes:
            o.id === optionId
              ? o.votes + 1
              : o.id === previousOptionId
              ? Math.max(0, o.votes - 1)
              : o.votes,
        })),
      });

      // Update post detail cache
      queryClient.setQueryData(['post_detail', postId, userId], (old) => {
        if (!old?.poll) return old;
        return { ...old, poll: applyVote(old.poll) };
      });

      // Update all feed caches so the PostCard reflects the vote immediately
      queryClient.setQueriesData({ queryKey: ['community_feed', userId] }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((p) => {
          if (p.id !== postId || !p.poll) return p;
          return { ...p, poll: applyVote(p.poll) };
        });
      });
    },
    onSettled: (_data, _err, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['post_detail', postId, userId] });
    },
  });
}
