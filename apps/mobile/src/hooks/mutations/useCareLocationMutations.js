import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/queryKeys';
import { useAuthStore } from '@/utils/auth/store';
import {
  deleteCareLocation,
  saveCareLocation,
  setCareLocationRole,
} from '@/services/supabase/facilities';

export function useCareLocationMutations() {
  const userId = useAuthStore((state) => state.auth?.user?.id);
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.savedFacilities(userId) });

  const saveMutation = useMutation({
    mutationFn: (location) => saveCareLocation(userId, location),
    onSuccess: invalidate,
  });
  const roleMutation = useMutation({
    mutationFn: ({ locationId, role }) => setCareLocationRole(locationId, role),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({
    mutationFn: (locationId) => deleteCareLocation(userId, locationId),
    onSuccess: invalidate,
  });

  return { saveMutation, roleMutation, deleteMutation };
}
