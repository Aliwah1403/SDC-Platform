import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/utils/auth/store';
import { queryKeys } from '@/hooks/queryKeys';
import {
  fetchProfile,
  updateProfile,
  completeOnboarding,
} from '@/services/supabase/profile';
import { cacheOnboardingStatus } from '@/utils/auth/profileBootstrap';

function useUserId() {
  return useAuthStore((s) => s.auth?.user?.id);
}

export function useProfileQuery() {
  const userId = useUserId();
  const query = useQuery({
    queryKey: queryKeys.profile(userId),
    queryFn: () => fetchProfile(userId),
    enabled: !!userId,
  });

  // Keep only the routing-critical bit in encrypted SecureStore. The full
  // profile remains network-backed until the encrypted local repository ships.
  useEffect(() => {
    const profileUserId = query.data?.userId ?? query.data?.user_id;
    if (
      query.data &&
      userId &&
      useAuthStore.getState().auth?.user?.id === userId &&
      (!profileUserId || profileUserId === userId) &&
      typeof query.data.onboardingComplete === 'boolean'
    ) {
      cacheOnboardingStatus(userId, query.data.onboardingComplete);
    }
  }, [query.data, userId]);

  return query;
}

export function useUpdateProfileMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fields) => updateProfile(userId, fields),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) });
    },
  });
}

export function useCompleteOnboardingMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (onboardingData) => completeOnboarding(userId, onboardingData),
    onSuccess: () => {
      // The completion write is authoritative even before the invalidated
      // profile query gets a chance to refetch (important across a cold start).
      cacheOnboardingStatus(userId, true);
      queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) });
    },
  });
}
