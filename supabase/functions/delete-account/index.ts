import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { CORS_HEADERS, deleteAccountForUser, response } from "../_shared/account-deletion.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== "POST") return response({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return response({ error: "Unauthorized" }, 401);
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return response({ error: "Account deletion is temporarily unavailable" }, 503);
  }

  const caller = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: userError } = await caller.auth.getUser();
  if (userError || !user) return response({ error: "Unauthorized" }, 401);

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  try {
    const { emailSent } = await deleteAccountForUser(admin, user);
    return response({ deleted: true, email_sent: emailSent });
  } catch (error) {
    console.error("[delete-account] Deletion failed:", error);
    return response({ error: "Could not delete account. Please try again." }, 500);
  }
});
