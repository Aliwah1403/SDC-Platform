import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { CORS_HEADERS, response } from "../_shared/account-deletion.ts";
import { escapeLikePattern } from "./email-match.mjs";

const SUCCESS_MESSAGE = "If an account exists for that email address, we’ve sent a confirmation link.";
const EMAIL_LIMIT = 3;
const IP_LIMIT = 20;
const RESEND_TIMEOUT_MS = 10_000;

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

function clientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const cloudflare = req.headers.get("cf-connecting-ip")?.trim();
  const realIp = req.headers.get("x-real-ip")?.trim();
  const candidate = cloudflare || forwarded || realIp;
  // Do not let arbitrary header contents create unbounded rate-limit keys.
  return candidate && /^[0-9a-f:.]{3,64}$/i.test(candidate) ? candidate : "unknown";
}

async function consumeLimit(
  admin: ReturnType<typeof createClient>,
  scope: "email" | "ip",
  identifier: string,
  maxRequests: number,
) {
  const { data, error } = await admin.rpc("consume_account_deletion_request_limit", {
    p_scope: scope,
    p_key_hash: await sha256(`${scope}:${identifier}`),
    p_max_requests: maxRequests,
  });
  if (error) throw error;
  return data === true;
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
  try {
    const [ipAllowed, emailAllowed] = await Promise.all([
      consumeLimit(admin, "ip", clientIp(req), IP_LIMIT),
      consumeLimit(admin, "email", email, EMAIL_LIMIT),
    ]);
    if (!ipAllowed || !emailAllowed) {
      return response({ error: "Too many requests. Please try again in a few minutes." }, 429);
    }
  } catch (rateLimitError) {
    console.error("[request-account-deletion] Rate-limit check failed:", rateLimitError);
    return response({ error: "Account deletion is temporarily unavailable." }, 503);
  }
  const { data: profile, error: profileError } = await admin.from("profiles").select("user_id, email").ilike("email", escapeLikePattern(email)).maybeSingle();
  if (profileError) { console.error("[request-account-deletion] Profile lookup failed:", profileError.message); return response({ error: "Account deletion is temporarily unavailable." }, 503); }
  if (!profile?.user_id) {
    // A matching email continues with a token hash, a DB upsert and an outbound
    // email send before returning this same message. Pad the early return into
    // that same latency band so response timing can't reveal whether the account
    // exists; the random jitter blunts averaging across repeated probes.
    await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 500));
    return response({ message: SUCCESS_MESSAGE });
  }

  const token = `${crypto.randomUUID()}${crypto.randomUUID()}`;
  const tokenHash = await sha256(token);
  const { error: requestError } = await admin.from("account_deletion_requests").upsert({ user_id: profile.user_id, email, token_hash: tokenHash, expires_at: new Date(Date.now() + 86_400_000).toISOString() }, { onConflict: "user_id" });
  if (requestError) { console.error("[request-account-deletion] Request write failed:", requestError.message); return response({ error: "Account deletion is temporarily unavailable." }, 503); }

  const confirmationUrl = deletionUrl(token);
  let sendResult: Response;
  try {
    sendResult = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json", "Idempotency-Key": `account-deletion-request/${profile.user_id}/${tokenHash.slice(0, 12)}` },
      body: JSON.stringify({
        from: "Hemo <hello@info.hemo-scd.com>", to: [email], subject: "Confirm your Hemo account deletion request",
        html: `<p>Hi,</p><p>We received a request to permanently delete your Hemo account and associated health data.</p><p>This cannot be undone. If you made this request, use the link below within 24 hours to confirm it.</p><p><a href="${confirmationUrl}">Confirm account deletion</a></p><p>If you did not make this request, you can safely ignore this email. Your account will remain unchanged.</p><p>The Hemo Team</p>`,
        text: `Hi,\n\nWe received a request to permanently delete your Hemo account and associated health data. This cannot be undone.\n\nIf you made this request, confirm it within 24 hours:\n${confirmationUrl}\n\nIf you did not make this request, you can safely ignore this email. Your account will remain unchanged.\n\nThe Hemo Team`,
      }),
      signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
    });
  } catch (error) {
    console.error("[request-account-deletion] Confirmation email request failed:", error);
    return response({ error: "Could not send the confirmation email. Please try again." }, 502);
  }
  if (!sendResult.ok) { console.error("[request-account-deletion] Confirmation email failed:", sendResult.status); return response({ error: "Could not send the confirmation email. Please try again." }, 502); }
  return response({ message: SUCCESS_MESSAGE });
});
