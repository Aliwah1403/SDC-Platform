import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/utils/auth/store';
import { queryKeys } from '@/hooks/queryKeys';
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
} from '@/services/supabase/community';

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
      queryClient.invalidateQueries({ queryKey: queryKeys.community.root(userId) });
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
      await queryClient.cancelQueries({ queryKey: queryKeys.community.root(userId) });
      const previousFeed = queryClient.getQueriesData({ queryKey: queryKeys.community.root(userId) });
      queryClient.setQueriesData({ queryKey: queryKeys.community.root(userId) }, (old) =>
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
      queryClient.invalidateQueries({ queryKey: queryKeys.community.root(userId) });
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
      await queryClient.cancelQueries({ queryKey: queryKeys.community.root(userId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.community.post(postId, userId) });
      const previousFeed = queryClient.getQueriesData({ queryKey: queryKeys.community.root(userId) });
      const previousPost = queryClient.getQueryData(queryKeys.community.post(postId, userId));
      const newLiked = !isLiked;
      // Optimistically update all cached queries that contain this post
      queryClient.getQueriesData({ queryKey: queryKeys.community.root(userId) }).forEach(([key]) => {
        updateLikeInCache(key, postId, newLiked);
      });
      updateLikeInCache(queryKeys.community.post(postId, userId), postId, newLiked);
      return { previousFeed, previousPost };
    },

    onError: (_err, _variables, context) => {
      context?.previousFeed?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      if (context?.previousPost !== undefined) {
        queryClient.setQueryData(queryKeys.community.post(_variables.postId, userId), context.previousPost);
      }
    },

    onSettled: (_data, _error, { postId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.community.root(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.community.post(postId, userId) });
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
      await queryClient.cancelQueries({ queryKey: queryKeys.community.root(userId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.community.post(postId, userId) });
      const previousFeed = queryClient.getQueriesData({ queryKey: queryKeys.community.root(userId) });
      const previousPost = queryClient.getQueryData(queryKeys.community.post(postId, userId));
      const newSaved = !isSaved;
      queryClient.getQueriesData({ queryKey: queryKeys.community.root(userId) }).forEach(([key]) => {
        updateSaveInCache(key, postId, newSaved);
      });
      updateSaveInCache(queryKeys.community.post(postId, userId), postId, newSaved);
      return { previousFeed, previousPost };
    },

    onError: (_err, variables, context) => {
      context?.previousFeed?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      if (context?.previousPost !== undefined) {
        queryClient.setQueryData(queryKeys.community.post(variables.postId, userId), context.previousPost);
      }
    },

    onSettled: (_data, _error, { postId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.community.root(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.community.post(postId, userId) });
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
      // Partial key match so any userId variation still hits the right query
      queryClient.invalidateQueries({ queryKey: queryKeys.community.postRoot(postId) });
      // Bump comment_count in feed caches
      queryClient.getQueriesData({ queryKey: queryKeys.community.root(userId) }).forEach(([key]) => {
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
      queryClient.invalidateQueries({ queryKey: queryKeys.community.postRoot(postId) });
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
        queryClient.invalidateQueries({ queryKey: queryKeys.community.post(postId, userId) });
        // Decrement commentCount in all feed caches so PostCards stay in sync
        queryClient.getQueriesData({ queryKey: queryKeys.community.root(userId) }).forEach(([key]) => {
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
      await queryClient.cancelQueries({ queryKey: queryKeys.community.root(userId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.community.post(postId, userId) });
      const previousFeed = queryClient.getQueriesData({ queryKey: queryKeys.community.root(userId) });
      const previousPost = queryClient.getQueryData(queryKeys.community.post(postId, userId));
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
      queryClient.setQueryData(queryKeys.community.post(postId, userId), (old) => {
        if (!old?.poll) return old;
        return { ...old, poll: applyVote(old.poll) };
      });

      // Update all feed caches so the PostCard reflects the vote immediately
      queryClient.setQueriesData({ queryKey: queryKeys.community.root(userId) }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((p) => {
          if (p.id !== postId || !p.poll) return p;
          return { ...p, poll: applyVote(p.poll) };
        });
      });
      return { previousFeed, previousPost };
    },
    onError: (_error, { postId }, context) => {
      context?.previousFeed?.forEach(([key, data]) => queryClient.setQueryData(key, data));
      if (context?.previousPost !== undefined) {
        queryClient.setQueryData(queryKeys.community.post(postId, userId), context.previousPost);
      }
    },
    onSettled: (_data, _err, { postId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.community.post(postId, userId) });
    },
  });
}
