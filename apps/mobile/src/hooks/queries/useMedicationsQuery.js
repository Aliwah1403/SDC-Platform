import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { useAuthStore } from '@/utils/auth/store';
import { queryKeys } from '@/hooks/queryKeys';
import {
  fetchMedications,
  fetchMedicationHistory,
  addMedication,
  updateMedication,
  deleteMedication,
  toggleMedicationTaken,
  addMedicationLog,
  deleteMedicationLogById,
  deleteLatestMedicationLog,
  markGroupTaken,
} from '@/services/supabase/medications';
import { fetchDrugInfo } from '@/services/supabase/drug-info';

function useUserId() {
  return useAuthStore((s) => s.auth?.user?.id);
}

export function useMedicationsQuery() {
  const userId = useUserId();
  return useQuery({
    queryKey: queryKeys.medications(userId),
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
      queryClient.invalidateQueries({ queryKey: queryKeys.medications(userId) });
    },
  });
}

export function useUpdateMedicationMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }) => updateMedication(userId, id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.medications(userId) });
    },
  });
}

export function useDeleteMedicationMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteMedication(userId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.medications(userId) });
    },
  });
}

/**
 * Optimistic toggle — flips `taken` instantly, rolls back on error.
 */
export function useToggleMedicationTakenMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const queryKey = queryKeys.medications(userId);

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
    onSettled: (_data, _err, medId) => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: queryKeys.medicationHistory(userId, medId) });
    },
  });
}

/**
 * Optimistic bulk mark-taken.
 */
export function useAddMedicationLogMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const queryKey = queryKeys.medications(userId);

  return useMutation({
    mutationFn: ({ medId, scheduledTime = null }) =>
      addMedicationLog(userId, medId, scheduledTime),
    onMutate: async ({ medId, scheduledTime = null }) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData(queryKey);
      const now = new Date().toISOString();
      queryClient.setQueryData(queryKey, (old) =>
        (old || []).map((m) =>
          m.id === medId
            ? {
                ...m,
                taken: true,
                logs: [
                  ...(m.logs ?? []),
                  { id: `temp-${now}`, takenAt: now, scheduledTime },
                ],
              }
            : m
        )
      );
      return { prev };
    },
    onError: (_err, _variables, ctx) => {
      queryClient.setQueryData(queryKey, ctx.prev);
      Alert.alert('Couldn\'t log dose', 'Something went wrong. Please try again.');
    },
    onSettled: (_data, _err, { medId }) => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: queryKeys.medicationHistory(userId, medId) });
    },
  });
}

export function useDeleteLatestMedicationLogMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const queryKey = queryKeys.medications(userId);

  return useMutation({
    mutationFn: (medId) => deleteLatestMedicationLog(userId, medId),
    onMutate: async (medId) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old) =>
        (old || []).map((m) => {
          if (m.id !== medId) return m;
          const newLogs = (m.logs ?? []).slice(0, -1);
          return { ...m, logs: newLogs, taken: newLogs.length > 0 };
        })
      );
      return { prev };
    },
    onError: (_err, _medId, ctx) => {
      queryClient.setQueryData(queryKey, ctx.prev);
    },
    onSettled: (_data, _err, medId) => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: queryKeys.medicationHistory(userId, medId) });
    },
  });
}

export function useDeleteMedicationLogByIdMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const queryKey = queryKeys.medications(userId);

  return useMutation({
    mutationFn: ({ logId }) => deleteMedicationLogById(logId),
    onMutate: async ({ medId, logId }) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old) =>
        (old || []).map((m) => {
          if (m.id !== medId) return m;
          const newLogs = (m.logs ?? []).filter((l) => l.id !== logId);
          return { ...m, logs: newLogs, taken: newLogs.length > 0 };
        })
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(queryKey, ctx.prev);
    },
    onSettled: (_data, _err, { medId }) => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: queryKeys.medicationHistory(userId, medId) });
    },
  });
}

export function useMedicationHistoryQuery(medicationId) {
  const userId = useUserId();
  return useQuery({
    queryKey: queryKeys.medicationHistory(userId, medicationId),
    queryFn: () => fetchMedicationHistory(userId, medicationId),
    enabled: !!userId && !!medicationId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDrugInfoQuery(drugName) {
  return useQuery({
    queryKey: queryKeys.drugInfo(drugName),
    queryFn: () => fetchDrugInfo(drugName),
    enabled: !!drugName,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000,
  });
}

export function useMarkGroupTakenMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const queryKey = queryKeys.medications(userId);

  return useMutation({
    mutationFn: (doses) => markGroupTaken(userId, doses),
    onMutate: async (doses) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData(queryKey);
      const now = new Date().toISOString();
      queryClient.setQueryData(queryKey, (old) =>
        (old || []).map((m) => {
          const matchingDoses = doses.filter((dose) => dose.medicationId === m.id);
          if (matchingDoses.length === 0) return m;
          return {
            ...m,
            taken: true,
            takenAt: now,
            logs: [
              ...(m.logs ?? []),
              ...matchingDoses.map((dose, index) => ({
                id: `temp-${now}-${index}`,
                takenAt: now,
                scheduledTime: dose.scheduledTime ?? null,
              })),
            ],
          };
        })
      );
      return { prev };
    },
    onError: (_err, _doses, ctx) => {
      queryClient.setQueryData(queryKey, ctx.prev);
    },
    onSettled: (_data, _err, doses) => {
      queryClient.invalidateQueries({ queryKey });
      [...new Set((doses ?? []).map((dose) => dose.medicationId))].forEach((id) =>
        queryClient.invalidateQueries({ queryKey: queryKeys.medicationHistory(userId, id) })
      );
    },
  });
}
