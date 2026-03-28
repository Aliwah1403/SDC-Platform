import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/utils/auth/store';
import {
  fetchEmergencyContacts,
  addEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
  recordContactCall,
  fetchContactCallLogs,
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

export function useRecordContactCallMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (contactId) => recordContactCall(userId, contactId),

    onMutate: async (contactId) => {
      // Cancel any in-flight refetches so they don't overwrite our optimistic data
      await queryClient.cancelQueries({ queryKey: ['contactCallLogs', userId, contactId] });
      await queryClient.cancelQueries({ queryKey: ['emergencyContacts', userId] });

      // Snapshot current values for rollback
      const previousLogs = queryClient.getQueryData(['contactCallLogs', userId, contactId]);
      const previousContacts = queryClient.getQueryData(['emergencyContacts', userId]);

      const calledAt = new Date().toISOString();

      // Optimistically prepend new log entry
      queryClient.setQueryData(['contactCallLogs', userId, contactId], (old = []) => [
        { id: `optimistic-${Date.now()}`, calledAt, contactId, userId },
        ...old,
      ]);

      // Optimistically update call_count + last_called_at on the contact
      queryClient.setQueryData(['emergencyContacts', userId], (old = []) =>
        old.map((c) =>
          c.id === contactId
            ? { ...c, callCount: (c.callCount ?? 0) + 1, lastCalledAt: calledAt }
            : c,
        ),
      );

      return { previousLogs, previousContacts };
    },

    onError: (_err, contactId, context) => {
      // Roll back both caches on failure
      if (context?.previousLogs !== undefined) {
        queryClient.setQueryData(['contactCallLogs', userId, contactId], context.previousLogs);
      }
      if (context?.previousContacts !== undefined) {
        queryClient.setQueryData(['emergencyContacts', userId], context.previousContacts);
      }
    },

    onSettled: (_, __, contactId) => {
      // Always sync with server after the mutation resolves (success or error)
      queryClient.invalidateQueries({ queryKey: ['emergencyContacts', userId] });
      queryClient.invalidateQueries({ queryKey: ['contactCallLogs', userId, contactId] });
    },
  });
}

export function useContactCallLogsQuery(contactId) {
  const userId = useUserId();
  return useQuery({
    queryKey: ['contactCallLogs', userId, contactId],
    queryFn: () => fetchContactCallLogs(userId, contactId),
    enabled: !!userId && !!contactId,
  });
}
