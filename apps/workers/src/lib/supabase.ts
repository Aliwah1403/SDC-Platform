import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

function jwtRole(value: string) {
  try {
    const payload = value.split(".")[1];
    if (!payload) return null;
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"))?.role ?? null;
  } catch {
    return null;
  }
}

// A publishable/anon key can query successfully while RLS quietly hides every
// row. Fail during worker startup instead of completing jobs as "not_found".
if (jwtRole(supabaseServiceKey) !== "service_role") {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY must be the service_role JWT, not a publishable/anon key",
  );
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});
