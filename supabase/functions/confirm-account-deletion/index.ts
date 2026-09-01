import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { CORS_HEADERS, deleteAccountForUser, response } from "../_shared/account-deletion.ts";

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== "POST") return response({ error: "Method not allowed" }, 405);
  let token = "";
  try { const body = await req.json(); token = typeof body?.token === "string" ? body.token : ""; }
  catch { return response({ error: "This deletion link is invalid or has expired." }, 400); }
  if (token.length < 64 || token.length > 100) return response({ error: "This deletion link is invalid or has expired." }, 400);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return response({ error: "Account deletion is temporarily unavailable." }, 503);
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: request, error: requestError } = await admin.from("account_deletion_requests").select("user_id, expires_at").eq("token_hash", await sha256(token)).maybeSingle();
  if (requestError || !request || new Date(request.expires_at).getTime() < Date.now()) return response({ error: "This deletion link is invalid or has expired." }, 400);
  const { data: userResult, error: userError } = await admin.auth.admin.getUserById(request.user_id);
  if (userError || !userResult.user) return response({ error: "This deletion link is invalid or has expired." }, 400);
  try {
    const { emailSent } = await deleteAccountForUser(admin, userResult.user);
    return response({ deleted: true, email_sent: emailSent });
  } catch (error) {
    console.error("[confirm-account-deletion] Deletion failed:", error);
    return response({ error: "Could not delete account. Please try again." }, 500);
  }
});
