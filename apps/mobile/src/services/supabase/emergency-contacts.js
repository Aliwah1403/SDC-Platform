import { supabase } from '@/utils/auth/supabase';
import { toCamelCase, toSnakeCase } from '@/utils/caseMapping';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';


// ============================================================
// EMERGENCY CONTACTS
// ============================================================

export async function fetchEmergencyContacts(userId) {
  const { data, error } = await supabase
    .from('emergency_contacts')
    .select('*')
    .eq('user_id', userId)
    .order('is_primary', { ascending: false });
  if (error) throw error;
  return (data || []).map(toCamelCase);
}
export async function addEmergencyContact(userId, contact) {
  const { data, error } = await supabase
    .from('emergency_contacts')
    .insert({
      user_id: userId,
      name: contact.name,
      relationship: contact.relationship || null,
      phone: contact.phone,
      is_primary: contact.isPrimary ?? false,
      photo_url: contact.photoUrl ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data);
}

export async function uploadContactPhoto(userId, contactId, localUri) {
  // Normalize URI and get base64 — avoids fetch().blob() which is unreliable in Hermes/RN
  const result = await manipulateAsync(localUri, [], {
    format: SaveFormat.JPEG,
    compress: 0.8,
    base64: true,
  });

  // Decode base64 → Uint8Array for a reliable binary upload
  const binaryStr = atob(result.base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  const path = `${userId}/${contactId}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from('contact-photos')
    .upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from('contact-photos').getPublicUrl(path);
  return data.publicUrl;
}

export async function fetchContactCallLogs(userId, contactId) {
  const { data, error } = await supabase
    .from('contact_call_logs')
    .select('id, called_at')
    .eq('user_id', userId)
    .eq('contact_id', contactId)
    .order('called_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data || []).map(toCamelCase);
}

export async function recordContactCall(userId, contactId) {
  const calledAt = new Date().toISOString();

  // 1. Update aggregate fields — always runs, never blocked by log insert
  const { data: row, error: fetchError } = await supabase
    .from('emergency_contacts')
    .select('call_count')
    .eq('id', contactId)
    .eq('user_id', userId)
    .single();
  if (fetchError) throw fetchError;

  const { error: updateError } = await supabase
    .from('emergency_contacts')
    .update({
      call_count: (row.call_count ?? 0) + 1,
      last_called_at: calledAt,
    })
    .eq('id', contactId)
    .eq('user_id', userId);
  if (updateError) throw updateError;

  // 2. Insert call log — best-effort (table may not exist until migration is run)
  await supabase
    .from('contact_call_logs')
    .insert({ user_id: userId, contact_id: contactId, called_at: calledAt });
}

export async function updateEmergencyContact(userId, id, updates) {
  const { error } = await supabase
    .from('emergency_contacts')
    .update({ ...toSnakeCase(updates), updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteEmergencyContact(userId, id) {
  const { error } = await supabase
    .from('emergency_contacts')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}
