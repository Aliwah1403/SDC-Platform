import { supabase } from '@/utils/auth/supabase';
import { toCamelCase } from '@/utils/caseMapping';


// ============================================================
// METRIC GOALS
// ============================================================

export async function fetchMetricGoals(userId) {
  const { data, error } = await supabase
    .from('metric_goals')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return toCamelCase(data);
}
export async function updateMetricGoal(userId, metric, value) {
  const { error } = await supabase
    .from('metric_goals')
    .update({ [metric]: value, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
  if (error) throw error;
}
