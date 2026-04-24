import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/utils/auth/store';
import { supabase } from '@/utils/auth/supabase';
import {
  fetchSystemNotifications,
  markAllSystemNotificationsRead,
} from '@/services/supabaseQueries';

function useUserId() {
  return useAuthStore((s) => s.auth?.user?.id);
}

export function useSystemNotificationsQuery() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['system_notifications', userId],
    queryFn: () => fetchSystemNotifications(userId),
    enabled: !!userId,
    staleTime: 1000 * 60,
  });

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`system_notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['system_notifications', userId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return query;
}

export function useMarkAllSystemReadMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllSystemNotificationsRead(userId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['system_notifications', userId] });
      const prev = queryClient.getQueryData(['system_notifications', userId]);
      queryClient.setQueryData(['system_notifications', userId], (old) =>
        Array.isArray(old) ? old.map((n) => ({ ...n, read: true })) : old,
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(['system_notifications', userId], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['system_notifications', userId] });
    },
  });
}
