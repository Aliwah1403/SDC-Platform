import { createClient } from "jsr:@supabase/supabase-js@2";

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_URL = "https://api.resend.com";
const NOVU_API_URL = "https://api.novu.co/v1";
const USER_STORAGE_BUCKETS = ["avatars", "contact-photos", "community-images", "medical-documents"];

export type DeletionUser = { id: string; email?: string; user_metadata?: Record<string, unknown> };

export function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
}

function firstName(user: DeletionUser) {
  const fullName = user.user_metadata?.full_name;
  return typeof fullName === "string" && fullName.trim() ? fullName.trim().split(/\s+/)[0] : "there";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character);
}

async function removeUserStorage(supabase: ReturnType<typeof createClient>, bucket: string, userId: string) {
  for (let page = 0; page < 100; page += 1) {
    const { data, error } = await supabase.storage.from(bucket).list(userId, { limit: 1000, offset: 0 });
    if (error) {
      if (/bucket not found/i.test(error.message)) return;
      throw new Error(`Could not inspect ${bucket} storage: ${error.message}`);
    }
    if (!data?.length) return;
    const paths = data.filter((item) => item.name && item.name !== ".emptyFolderPlaceholder").map((item) => `${userId}/${item.name}`);
    if (!paths.length) return;
    const { error: removeError } = await supabase.storage.from(bucket).remove(paths);
    if (removeError) throw new Error(`Could not remove ${bucket} storage: ${removeError.message}`);
  }
  throw new Error(`Could not clear ${bucket} storage after 100 pages`);
}

async function removeResendContact(email?: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey || !email) return;
  const result = await fetch(`${RESEND_API_URL}/contacts/${encodeURIComponent(email)}`, { method: "DELETE", headers: { Authorization: `Bearer ${apiKey}` } });
  if (result.ok || result.status === 404) return;
  throw new Error(`Could not remove Resend contact: ${result.status}`);
}

async function removeNovuSubscriber(userId: string) {
  const apiKey = Deno.env.get("NOVU_API_KEY");
  if (!apiKey) return;
  const result = await fetch(`${NOVU_API_URL}/subscribers/${encodeURIComponent(userId)}`, { method: "DELETE", headers: { Authorization: `ApiKey ${apiKey}` } });
  if (result.ok || result.status === 404) return;
  throw new Error(`Could not remove Novu subscriber: ${result.status}`);
}

async function sendFarewellEmail(user: DeletionUser) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey || !user.email) return false;
  const name = firstName(user);
  const result = await fetch(`${RESEND_API_URL}/emails`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `account-deleted/${user.id}` },
    body: JSON.stringify({
      from: "Hemo <hello@info.hemo-scd.com>", to: [user.email], subject: "We’re sorry to see you go",
      html: `<p>Hi ${escapeHtml(name)},</p><p>We’re sad to see you go. Your Hemo account and associated health data have been permanently deleted.</p><p>If you’re open to sharing, reply to this email and tell us what led to your decision or what we could have done better. Your perspective helps us make Hemo more useful and trustworthy for the sickle cell community.</p><p>Wishing you well,<br />The Hemo Team</p>`,
      text: `Hi ${name},\n\nWe’re sad to see you go. Your Hemo account and associated health data have been permanently deleted.\n\nIf you’re open to sharing, reply to this email and tell us what led to your decision or what we could have done better.\n\nWishing you well,\nThe Hemo Team`,
    }),
  });
  if (!result.ok) { console.error("[account-deletion] Farewell email failed:", result.status); return false; }
  return true;
}

/** Permanently remove the account, its files, and third-party identities. */
export async function deleteAccountForUser(admin: ReturnType<typeof createClient>, user: DeletionUser) {
  // If a provider unexpectedly fails, retain the app account so the user can retry.
  await removeResendContact(user.email);
  await removeNovuSubscriber(user.id);
  for (const bucket of USER_STORAGE_BUCKETS) await removeUserStorage(admin, bucket, user.id);
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) throw new Error(error.message);
  return { emailSent: await sendFarewellEmail(user) };
}
