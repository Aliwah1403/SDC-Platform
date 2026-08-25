import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/utils/auth/store';
import { queryKeys } from '@/hooks/queryKeys';
import { fetchSavedFacilities } from '@/services/supabase/facilities';

export function useSavedFacilitiesQuery() {
  const userId = useAuthStore((s) => s.auth?.user?.id);
  return useQuery({
    queryKey: queryKeys.savedFacilities(userId),
    queryFn: () => fetchSavedFacilities(userId),
    enabled: !!userId,
  });
}
