import { supabase } from '@/utils/auth/supabase';
import { toCamelCase, toSnakeCase } from '@/utils/caseMapping';


// ============================================================
// APPOINTMENTS
// ============================================================

export async function fetchAppointments(userId) {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });
  if (error) throw error;
  return (data || []).map(toCamelCase);
}
export async function addAppointment(userId, appt) {
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      user_id: userId,
      title: appt.title,
      doctor: appt.doctor || null,
      specialty: appt.specialty || null,
      facility: appt.facility || null,
      date: appt.date,
      time: appt.time || null,
      type: appt.type || 'routine',
      notes: appt.notes || null,
      status: appt.status || 'upcoming',
      added_to_calendar: appt.addedToCalendar ?? false,
      calendar_event_id: appt.calendarEventId || null,
      reminder_ids: appt.reminderIds ?? [],
      reminder_offsets: appt.reminderOffsets ?? [],
    })
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data);
}

export async function updateAppointment(userId, id, changes) {
  const { error } = await supabase
    .from('appointments')
    .update({ ...toSnakeCase(changes), updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteAppointment(userId, id) {
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}
