import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/utils/auth/store';
import {
  fetchMedications,
  addMedication,
  updateMedication,
  deleteMedication,
  toggleMedicationTaken,
  markGroupTaken,
  fetchDrugInfo,
} from '@/services/supabaseQueries';

function useUserId() {
  return useAuthStore((s) => s.auth?.user?.id);
}

export function useMedicationsQuery() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['medications', userId],
    queryFn: () => fetchMedications(userId),
    enabled: !!userId,
  });
}

export function useAddMedicationMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (med) => addMedication(userId, med),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications', userId] });
    },
  });
}

export function useUpdateMedicationMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }) => updateMedication(userId, id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications', userId] });
    },
  });
}

export function useDeleteMedicationMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteMedication(userId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications', userId] });
    },
  });
}

/**
 * Optimistic toggle — flips `taken` instantly, rolls back on error.
 */
export function useToggleMedicationTakenMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const queryKey = ['medications', userId];

  return useMutation({
    mutationFn: (medId) => toggleMedicationTaken(userId, medId),
    onMutate: async (medId) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old) =>
        (old || []).map((m) =>
          m.id === medId
            ? { ...m, taken: !m.taken, takenAt: !m.taken ? new Date().toISOString() : null }
            : m
        )
      );
      return { prev };
    },
    onError: (_err, _medId, ctx) => {
      queryClient.setQueryData(queryKey, ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

/**
 * Optimistic bulk mark-taken.
 */
export function useDrugInfoQuery(drugName) {
  return useQuery({
    queryKey: ['drugInfo', drugName?.toLowerCase()],
    queryFn: () => fetchDrugInfo(drugName),
    enabled: !!drugName,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000,
  });
}

export function useMarkGroupTakenMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const queryKey = ['medications', userId];

  return useMutation({
    mutationFn: (medIds) => markGroupTaken(userId, medIds),
    onMutate: async (medIds) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData(queryKey);
      const now = new Date().toISOString();
      queryClient.setQueryData(queryKey, (old) =>
        (old || []).map((m) =>
          medIds.includes(m.id) ? { ...m, taken: true, takenAt: now } : m
        )
      );
      return { prev };
    },
    onError: (_err, _ids, ctx) => {
      queryClient.setQueryData(queryKey, ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
