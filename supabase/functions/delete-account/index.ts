import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_URL = "https://api.resend.com/emails";
const USER_STORAGE_BUCKETS = [
  "avatars",
  "contact-photos",
  "community-images",
  "medical-documents",
];

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function firstName(user: {
  email?: string;
  user_metadata?: Record<string, unknown>;
}) {
  const fullName = user.user_metadata?.full_name;
  if (typeof fullName === "string" && fullName.trim())
    return fullName.trim().split(/\s+/)[0];
  return "there";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>\"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character];
  });
}

async function removeUserStorage(
  supabase: ReturnType<typeof createClient>,
  bucket: string,
  userId: string,
) {
  // All user-uploaded assets are stored directly under a user-id folder. Delete
  // one page at a time so a long-lived account is not limited to 1,000 objects.
  for (let page = 0; page < 100; page += 1) {
    const { data, error } = await supabase.storage.from(bucket).list(userId, {
      limit: 1000,
      offset: 0,
    });

    if (error) {
      // Some local/staging environments may not have every optional bucket.
      // A missing bucket cannot contain user-owned objects, so it is safe to skip.
      if (/bucket not found/i.test(error.message)) return;
      throw new Error(`Could not inspect ${bucket} storage: ${error.message}`);
    }
    if (!data?.length) return;

    const paths = data
      .filter((item) => item.name && item.name !== ".emptyFolderPlaceholder")
      .map((item) => `${userId}/${item.name}`);
    if (!paths.length) return;

    const { error: removeError } = await supabase.storage
      .from(bucket)
      .remove(paths);
    if (removeError)
      throw new Error(
        `Could not remove ${bucket} storage: ${removeError.message}`,
      );
  }

  throw new Error(`Could not clear ${bucket} storage after 100 pages`);
}

async function sendFarewellEmail(user: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey || !user.email) return false;

  const recipientName = firstName(user);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const result = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        // Protect against a network retry sending the farewell message twice.
        "Idempotency-Key": `account-deleted/${user.id}`,
      },
      body: JSON.stringify({
        from: "Hemo <hello@info.hemo-scd.com>",
        to: [user.email],
        subject: "We’re sorry to see you go",
        html: `
          <!DOCTYPE html>
          <html lang="en">
            <body style="background-color:#ffffff;margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color:#ffffff;">
                <tr>
                  <td align="center" style="padding:0;">
                    <table width="600" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width:600px;width:100%;background-color:#ffffff;">
                      <tr>
                        <td align="center" style="padding:20px 16px 32px;">
                          <img src="https://di867tnz6fwga.cloudfront.net/brand-kits/0b06e40e-c16e-4eb6-ae76-6209b4ec6cdf/primary/f336d4b2-3732-4539-9bf2-f7c844495736.png" alt="Hemo SCD Logo" width="200" style="display:block;border:0;max-width:200px;width:200px;height:auto;" />
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0 32px;color:#020304;font-size:16px;line-height:24px;">
                          <p style="margin:0 0 16px;">Hi ${escapeHtml(recipientName)},</p>
                          <p style="margin:0 0 16px;">We’re sad to see you go. Your Hemo account and associated health data have been permanently deleted.</p>
                          <p style="margin:0 0 16px;">Thank you for giving Hemo a place in your care journey. If you’re open to sharing, reply to this email and tell us what led to your decision or what we could have done better. Your perspective helps us make Hemo more useful and trustworthy for the sickle cell community.</p>
                          <p style="margin:0;">Wishing you well,<br />The Hemo Team</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="border-top:1px solid #eaeaea;margin-top:32px;padding:24px 32px 32px;text-align:center;">
                          <img src="https://resend-attachments.s3.amazonaws.com/7e243de0-f0c8-456b-b2ac-9dc2135bd2de" alt="Hemo fingerprint icon" width="65" height="65" style="display:block;border:0;margin:0 auto;" />
                          <p style="color:#666666;font-size:12px;line-height:16px;margin:16px 0 8px;">You’re receiving this because you signed up for Hemo. We’re here to support your daily health journey.</p>
                          <p style="color:#666666;font-size:12px;line-height:16px;margin:16px 0 8px;">UAE, Dubai · <a href="https://hemo-scd.com" style="color:#A9334D;text-decoration:underline;">hemo-scd.com</a> · <a href="https://hemo-scd.com" style="color:#A9334D;text-decoration:underline;">Unsubscribe</a></p>
                          <p style="color:#666666;font-size:12px;line-height:16px;margin:0;">© 2026 Hemo SCD. All rights reserved.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
        text: `Hi ${recipientName},\n\nWe’re sad to see you go. Your Hemo account and associated health data have been permanently deleted.\n\nThank you for giving Hemo a place in your care journey. If you’re open to sharing, reply to this email and tell us what led to your decision or what we could have done better. Your perspective helps us make Hemo more useful and trustworthy for the sickle cell community.\n\nWishing you well,\nThe Hemo Team\n\nYou’re receiving this because you signed up for Hemo. We’re here to support your daily health journey.\n\nUAE, Dubai · hemo-scd.com · Unsubscribe\n© 2026 Hemo SCD. All rights reserved.`,
      }),
      signal: controller.signal,
    });
    if (!result.ok) {
      console.error(
        "[delete-account] Farewell email failed:",
        result.status,
        (await result.text()).slice(0, 300),
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error("[delete-account] Farewell email failed:", error);
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== "POST")
    return response({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return response({ error: "Unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    console.error("[delete-account] Supabase credentials are not configured");
    return response(
      { error: "Account deletion is temporarily unavailable" },
      503,
    );
  }

  const caller = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await caller.auth.getUser();
  if (userError || !user) return response({ error: "Unauthorized" }, 401);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    for (const bucket of USER_STORAGE_BUCKETS) {
      await removeUserStorage(admin, bucket, user.id);
    }

    // This removes auth.users, refresh-token sessions, and every record linked
    // by our ON DELETE CASCADE foreign keys. Do not soft-delete: the user has
    // explicitly requested permanent account removal.
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) throw new Error(deleteError.message);

    const emailSent = await sendFarewellEmail(user);
    return response({ deleted: true, email_sent: emailSent });
  } catch (error) {
    console.error("[delete-account] Deletion failed:", error);
    return response(
      { error: "Could not delete account. Please try again." },
      500,
    );
  }
});
