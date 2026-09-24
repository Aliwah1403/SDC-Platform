import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/utils/auth/store';
import { queryKeys } from '@/hooks/queryKeys';
import { fetchSavedFacilities } from '@/services/supabase/facilities';
import { supabase } from '@/utils/auth/supabase';

const careLocationChannels = new Map();

function acquireChannel(userId, invalidate) {
  let entry = careLocationChannels.get(userId);
  if (!entry) {
    const channel = supabase
      .channel(`saved_facilities:${userId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'saved_facilities', filter: `user_id=eq.${userId}`,
      }, invalidate)
      .subscribe();
    entry = { channel, refCount: 0 };
    careLocationChannels.set(userId, entry);
  }
  entry.refCount += 1;
}

function releaseChannel(userId) {
  const entry = careLocationChannels.get(userId);
  if (!entry) return;
  entry.refCount -= 1;
  if (entry.refCount <= 0) {
    supabase.removeChannel(entry.channel);
    careLocationChannels.delete(userId);
  }
}

export function useSavedFacilitiesQuery() {
  const userId = useAuthStore((s) => s.auth?.user?.id);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.savedFacilities(userId),
    queryFn: () => fetchSavedFacilities(userId),
    enabled: !!userId,
    // Realtime is the fast path. Poll while a background job is active so a
    // missed socket event cannot leave the UI showing an endless spinner.
    refetchInterval: (activeQuery) => activeQuery.state.data?.some((location) =>
      ['pending', 'processing'].includes(location.enrichmentStatus)) ? 3_000 : false,
  });
  useEffect(() => {
    if (!userId) return;
    const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.savedFacilities(userId) });
    acquireChannel(userId, invalidate);
    return () => releaseChannel(userId);
  }, [userId, queryClient]);
  return query;
}
