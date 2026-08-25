import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/utils/auth/store';
import { queryKeys } from '@/hooks/queryKeys';
import { supabase } from '@/utils/auth/supabase';
import {
  fetchCommunityNotifications,
  markAllCommunityNotificationsRead,
} from '@/services/supabase/community';

function useUserId() {
  return useAuthStore((s) => s.auth?.user?.id);
}

// Supabase's `.channel(topic)` returns the existing channel if one with the
// same topic is already open, rather than creating a new one. Since this hook
// mounts in multiple screens at once (stack navigation keeps prior screens
// mounted), a naive per-instance subscribe/unsubscribe races: a second mount
// calls `.on()` on a channel the first mount already subscribed, which throws.
// Reference-count a single shared channel per user instead.
const notificationChannels = new Map();

function acquireNotificationChannel(userId, invalidate) {
  let entry = notificationChannels.get(userId);
  if (!entry) {
    const channel = supabase
      .channel(`community_notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'community_notifications',
        filter: `user_id=eq.${userId}`,
      }, invalidate)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'community_notifications',
        filter: `user_id=eq.${userId}`,
      }, invalidate)
      .subscribe();
    entry = { channel, refCount: 0 };
    notificationChannels.set(userId, entry);
  }
  entry.refCount += 1;
  return entry;
}

function releaseNotificationChannel(userId) {
  const entry = notificationChannels.get(userId);
  if (!entry) return;
  entry.refCount -= 1;
  if (entry.refCount <= 0) {
    supabase.removeChannel(entry.channel);
    notificationChannels.delete(userId);
  }
}

export function useCommunityNotificationsQuery() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.community.notifications(userId),
    queryFn: () => fetchCommunityNotifications(userId),
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
  });

  // Realtime badge: subscribe to INSERT on community_notifications for this user.
  // When a new notification arrives, invalidate the query so the badge updates live.
  useEffect(() => {
    if (!userId) return;

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.community.notifications(userId) });
    };

    acquireNotificationChannel(userId, invalidate);

    return () => {
      releaseNotificationChannel(userId);
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
      await queryClient.cancelQueries({ queryKey: queryKeys.community.notifications(userId) });
      const prev = queryClient.getQueryData(queryKeys.community.notifications(userId));
      // Optimistically mark all as read
      queryClient.setQueryData(queryKeys.community.notifications(userId), (old) =>
        Array.isArray(old) ? old.map((n) => ({ ...n, read: true })) : old,
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(queryKeys.community.notifications(userId), ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.community.notifications(userId) });
    },
  });
}
