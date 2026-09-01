import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { CORS_HEADERS, response } from "../_shared/account-deletion.ts";

const SUCCESS_MESSAGE = "If an account exists for that email address, we’ve sent a confirmation link.";

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function deletionUrl(token: string) {
  const base = (Deno.env.get("WEB_BASE_URL") ?? "https://hemo-scd.com").replace(/\/$/, "");
  const url = new URL(`${base}/delete-account`);
  if (Deno.env.get("HEMO_APP_ENV") === "staging") url.searchParams.set("env", "staging");
  url.searchParams.set("token", token);
  return url.toString();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== "POST") return response({ error: "Method not allowed" }, 405);
  let email = "";
  try { const body = await req.json(); email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""; }
  catch { return response({ error: "Enter a valid email address." }, 400); }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) return response({ error: "Enter a valid email address." }, 400);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!supabaseUrl || !serviceRoleKey || !resendApiKey) return response({ error: "Account deletion is temporarily unavailable." }, 503);
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: profile, error: profileError } = await admin.from("profiles").select("user_id, email").ilike("email", email).maybeSingle();
  if (profileError) { console.error("[request-account-deletion] Profile lookup failed:", profileError.message); return response({ error: "Account deletion is temporarily unavailable." }, 503); }
  if (!profile?.user_id) return response({ message: SUCCESS_MESSAGE });

  const token = `${crypto.randomUUID()}${crypto.randomUUID()}`;
  const tokenHash = await sha256(token);
  const { error: requestError } = await admin.from("account_deletion_requests").upsert({ user_id: profile.user_id, email, token_hash: tokenHash, expires_at: new Date(Date.now() + 86_400_000).toISOString() }, { onConflict: "user_id" });
  if (requestError) { console.error("[request-account-deletion] Request write failed:", requestError.message); return response({ error: "Account deletion is temporarily unavailable." }, 503); }

  const confirmationUrl = deletionUrl(token);
  const sendResult = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json", "Idempotency-Key": `account-deletion-request/${profile.user_id}/${tokenHash.slice(0, 12)}` },
    body: JSON.stringify({
      from: "Hemo <hello@info.hemo-scd.com>", to: [email], subject: "Confirm your Hemo account deletion request",
      html: `<p>Hi,</p><p>We received a request to permanently delete your Hemo account and associated health data.</p><p>This cannot be undone. If you made this request, use the link below within 24 hours to confirm it.</p><p><a href="${confirmationUrl}">Confirm account deletion</a></p><p>If you did not make this request, you can safely ignore this email. Your account will remain unchanged.</p><p>The Hemo Team</p>`,
      text: `Hi,\n\nWe received a request to permanently delete your Hemo account and associated health data. This cannot be undone.\n\nIf you made this request, confirm it within 24 hours:\n${confirmationUrl}\n\nIf you did not make this request, you can safely ignore this email. Your account will remain unchanged.\n\nThe Hemo Team`,
    }),
  });
  if (!sendResult.ok) { console.error("[request-account-deletion] Confirmation email failed:", sendResult.status); return response({ error: "Could not send the confirmation email. Please try again." }, 502); }
  return response({ message: SUCCESS_MESSAGE });
});
