import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/utils/auth/store';
import {
  fetchAppointments,
  addAppointment,
  updateAppointment,
  deleteAppointment,
} from '@/services/supabaseQueries';

function useUserId() {
  return useAuthStore((s) => s.auth?.user?.id);
}

export function useAppointmentsQuery() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['appointments', userId],
    queryFn: () => fetchAppointments(userId),
    enabled: !!userId,
  });
}

export function useAddAppointmentMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (appt) => addAppointment(userId, appt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', userId] });
    },
  });
}

export function useUpdateAppointmentMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changes }) => updateAppointment(userId, id, changes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', userId] });
    },
  });
}

export function useDeleteAppointmentMutation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteAppointment(userId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', userId] });
    },
  });
}
