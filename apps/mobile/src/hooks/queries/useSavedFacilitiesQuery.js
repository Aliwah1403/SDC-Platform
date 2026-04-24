import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/utils/auth/store';
import { fetchSavedFacilities } from '@/services/supabaseQueries';

export function useSavedFacilitiesQuery() {
  const userId = useAuthStore((s) => s.auth?.user?.id);
  return useQuery({
    queryKey: ['savedFacilities', userId],
    queryFn: () => fetchSavedFacilities(userId),
    enabled: !!userId,
  });
}
