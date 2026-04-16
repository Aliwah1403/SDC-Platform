import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/utils/auth/store';
import { supabase } from '@/utils/auth/supabase';
import {
  fetchCommunityNotifications,
  markAllCommunityNotificationsRead,
} from '@/services/supabaseQueries';

function useUserId() {
  return useAuthStore((s) => s.auth?.user?.id);
}

export function useCommunityNotificationsQuery() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['community_notifications', userId],
    queryFn: () => fetchCommunityNotifications(userId),
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
  });

  // Realtime badge: subscribe to INSERT on community_notifications for this user.
  // When a new notification arrives, invalidate the query so the badge updates live.
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`community_notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['community_notifications', userId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return query;
}

export function useMarkAllReadMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllCommunityNotificationsRead(userId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['community_notifications', userId] });
      const prev = queryClient.getQueryData(['community_notifications', userId]);
      // Optimistically mark all as read
      queryClient.setQueryData(['community_notifications', userId], (old) =>
        Array.isArray(old) ? old.map((n) => ({ ...n, read: true })) : old,
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(['community_notifications', userId], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['community_notifications', userId] });
    },
  });
}
