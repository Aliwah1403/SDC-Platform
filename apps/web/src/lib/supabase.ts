import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const stagingSupabaseUrl = import.meta.env.VITE_STAGING_SUPABASE_URL;
const stagingSupabaseAnonKey = import.meta.env.VITE_STAGING_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

const stagingSupabase =
  stagingSupabaseUrl && stagingSupabaseAnonKey
    ? createClient(stagingSupabaseUrl, stagingSupabaseAnonKey)
    : null;

export function getPublicTokenSupabase(search?: string) {
  const currentSearch =
    search ?? (typeof window !== "undefined" ? window.location.search : "");
  const env = new URLSearchParams(currentSearch).get("env");
  if (env === "staging") return stagingSupabase;
  return supabase;
}
