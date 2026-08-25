import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/utils/auth/store';
import { queryKeys } from '@/hooks/queryKeys';
import {
  fetchProfile,
  updateProfile,
  completeOnboarding,
} from '@/services/supabase/profile';

function useUserId() {
  return useAuthStore((s) => s.auth?.user?.id);
}

export function useProfileQuery() {
  const userId = useUserId();
  return useQuery({
    queryKey: queryKeys.profile(userId),
    queryFn: () => fetchProfile(userId),
    enabled: !!userId,
  });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) });
    },
  });
}
