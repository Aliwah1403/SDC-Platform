import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const RESEND_API_URL = "https://api.resend.com/emails";

interface EmailPayload {
  user: {
    id: string;
    email: string;
    user_metadata?: Record<string, string>;
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
    new_email?: string;
  };
}

interface TemplateConfig {
  id: string;
  getVars: (payload: EmailPayload) => Record<string, string>;
}

const TEMPLATE_MAP: Record<string, TemplateConfig> = {
  signup: {
    id: "signup-confirmation",
    getVars: (p) => ({ CONFIRMATION_URL: buildVerifyUrl(p) }),
  },
  recovery: {
    id: "password-reset-verification",
    getVars: (p) => ({ TOKEN: p.email_data.token }),
  },
  magiclink: {
    id: "magic-link",
    getVars: (p) => ({ MAGIC_LINK_URL: buildVerifyUrl(p) }),
  },
  email_change: {
    id: "email-change-confirmation",
    getVars: (p) => ({
      NEW_EMAIL: p.email_data.new_email ?? "",
      CONFIRMATION_URL: buildVerifyUrl(p),
    }),
  },
  invite: {
    id: "user-invite",
    getVars: (p) => ({
      INVITE_URL: buildVerifyUrl(p),
      INVITER_NAME: "The Hemo Team",
    }),
  },
  reauthentication: {
    id: "password-reset-verification",
    getVars: (p) => ({ TOKEN: p.email_data.token }),
  },
};

function buildVerifyUrl(payload: EmailPayload): string {
  const { token_hash, email_action_type, redirect_to } = payload.email_data;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const params = new URLSearchParams({
    token: token_hash,
    type: email_action_type,
    redirect_to: redirect_to ?? "",
  });
  return `${supabaseUrl}/auth/v1/verify?${params}`;
}

function getFirstName(user: EmailPayload["user"]): string {
  const meta = user?.user_metadata ?? {};
  if (meta.first_name) return meta.first_name;
  if (meta.full_name) return meta.full_name.split(" ")[0];
  if (meta.name) return meta.name.split(" ")[0];
  return "there";
}

Deno.serve(async (req: Request) => {
  const rawBody = await req.text();

  // Supabase sends the hook secret as "v1,whsec_<base64>" — strip "v1," for the library
  const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET");
  if (hookSecret) {
    try {
      const secret = hookSecret.startsWith("v1,") ? hookSecret.slice(3) : hookSecret;
      const wh = new Webhook(secret);
      wh.verify(rawBody, {
        "webhook-id": req.headers.get("webhook-id") ?? "",
        "webhook-timestamp": req.headers.get("webhook-timestamp") ?? "",
        "webhook-signature": req.headers.get("webhook-signature") ?? "",
      });
    } catch (err) {
      console.error("[send-email] Signature verification failed:", err.message);
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.error("[send-email] RESEND_API_KEY not configured");
    return new Response(JSON.stringify({ error: "Email service not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let payload: EmailPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const { user, email_data } = payload;
  const actionType = email_data?.email_action_type;
  const template = TEMPLATE_MAP[actionType];

  if (!template) {
    console.warn(`[send-email] Unhandled email_action_type: ${actionType}`);
    return new Response(JSON.stringify({}), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: [user.email],
      template: {
        id: template.id,
        variables: {
          FIRST_NAME: getFirstName(user),
          ...template.getVars(payload),
        },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[send-email] Resend error: status=${res.status} body=${body.slice(0, 300)}`);
    return new Response(JSON.stringify({ error: "Failed to send email" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({}), {
    headers: { "Content-Type": "application/json" },
  });
});
