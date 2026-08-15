import { supabase } from '@/utils/auth/supabase';
import { toCamelCase, toSnakeCase } from '@/utils/caseMapping';


// ============================================================
// HYDRATION CONTAINERS (Step 9 amendment — Supabase-backed, synced across
// a user's devices; see supabase/migrations/20260719000000_hydration_containers.sql
// for the table, RLS policies, and the two atomic RPCs used below)
// ============================================================

export async function fetchHydrationContainers(userId) {
  const { data, error } = await supabase
    .from('hydration_containers')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data || []).map(toCamelCase);
}
export async function addHydrationContainer(userId, { name, ml, icon, sortOrder }) {
  const { data, error } = await supabase
    .from('hydration_containers')
    .insert({ user_id: userId, name, ml, icon, is_default: false, sort_order: sortOrder })
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data);
}

export async function updateHydrationContainer(id, fields) {
  const { error } = await supabase
    .from('hydration_containers')
    .update({ ...toSnakeCase(fields), updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

// Atomic RPC (see migration) — deletes the container and, if it was the
// default, promotes the next remaining one. Returns false (no-op) if this
// would remove the user's last container.
export async function removeHydrationContainer(id) {
  const { data, error } = await supabase.rpc('remove_hydration_container', {
    p_container_id: id,
  });
  if (error) throw error;
  return data;
}

// Atomic RPC (see migration) — makes exactly one container the default in a
// single statement so "exactly one default" is never transiently violated.
export async function setDefaultHydrationContainer(id) {
  const { error } = await supabase.rpc('set_default_hydration_container', {
    p_container_id: id,
  });
  if (error) throw error;
}
