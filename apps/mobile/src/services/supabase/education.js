import { supabase } from '@/utils/auth/supabase';
import { toCamelCase } from '@/utils/caseMapping';


// ============================================================
// EDUCATION CONTENT
// ============================================================
// Public reference tables (RLS: anon/authenticated select, articles gated
// on published = true). No user_id — same data for everyone. See
// EDUCATION-CONTENT-PLAN.md Phase 2.

export async function fetchEducationCategories() {
  const { data, error } = await supabase
    .from('education_categories')
    .select('*')
    .order('sort_order');
  if (error) throw error;
  return toCamelCase(data);
}
export async function fetchEducationArticles() {
  const { data, error } = await supabase
    .from('education_articles')
    .select('*')
    .eq('published', true)
    .order('sort_order');
  if (error) throw error;
  return toCamelCase(data);
}
