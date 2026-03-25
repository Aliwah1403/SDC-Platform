import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/utils/auth/store';
import {
  fetchEmergencyContacts,
  addEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
} from '@/services/supabaseQueries';

function useUserId() {
  return useAuthStore((s) => s.auth?.user?.id);
}

export function useEmergencyContactsQuery() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['emergencyContacts', userId],
    queryFn: () => fetchEmergencyContacts(userId),
    enabled: !!userId,
  });
}

export function useAddEmergencyContactMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (contact) => addEmergencyContact(userId, contact),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergencyContacts', userId] });
    },
  });
}

export function useUpdateEmergencyContactMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }) => updateEmergencyContact(userId, id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergencyContacts', userId] });
    },
  });
}

export function useDeleteEmergencyContactMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteEmergencyContact(userId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergencyContacts', userId] });
    },
  });
}
