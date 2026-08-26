import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { enqueueResendContact } from "../_shared/trigger-resend-contact.ts";

const RESEND_API_URL = "https://api.resend.com/emails";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Same disposable-domain guard as waitlist-signup (functions are self-contained).
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com","guerrillamail.com","guerrillamail.net","guerrillamail.org",
  "guerrillamail.biz","guerrillamail.de","guerrillamail.info","sharklasers.com",
  "guerrillamailblock.com","grr.la","spam4.me","trashmail.com","trashmail.at",
  "trashmail.io","trashmail.me","trashmail.net","trashmail.org","trashmail.xyz",
  "dispostable.com","yopmail.com","yopmail.fr","yopmail.net","cool.fr.nf",
  "jetable.fr.nf","nospam.ze.tc","nomail.xl.cx","mega.zik.dj","speed.1s.fr",
  "courriel.fr.nf","moncourrier.fr.nf","monemail.fr.nf","monmail.fr.nf",
  "tempmail.com","temp-mail.org","temp-mail.io","tempinbox.com","tempr.email",
  "tempm.com","tmpmail.net","tmpmail.org","tmpbox.net","throwam.com",
  "throwaway.email","spamgourmet.com","spamgourmet.net",
  "spamgourmet.org","mailnull.com","fanchatu.com",
  "maildrop.cc","mailnesia.com","mailseal.de","mintemail.com",
  "mohmal.com","mt2014.com","mt2015.com","mt2016.com","mt2017.com",
  "mytrashmail.com","nwldx.com","objectmail.com","obobbo.com","odaymail.com",
  "onewaymail.com","online.ms","oopi.org","opentrash.com","owlpic.com",
  "pjjkp.com","plexolan.de","pooae.com","pookmail.com","powered.name",
  "ppetw.com","proxymail.eu.org","putthisinyourspamdatabase.com","qq.com",
  "rcpt.at","recode.me","recursor.net","regbypass.com","regbypass.comsafe-mail.net",
  "safetymail.info","safetypost.de","sandelf.de","shieldedmail.com",
  "shitmail.me","shitware.nl","sibmail.com","skeefmail.com","slopsbox.com",
  "smellfear.com","snakemail.com","sneakemail.com","snkmail.com","sofimail.com",
  "sofort-mail.de","sogetthis.com","soodonims.com","spam.la","spam.su",
  "spamavert.com","spambob.com","spambob.net","spambob.org","spamcannon.com",
  "spamcannon.net","spamcero.com","spamcon.org","spamcorpse.com","spamday.com",
  "spamex.com","spamfree.eu","spamfree24.com","spamfree24.de","spamfree24.eu",
  "spamfree24.info","spamfree24.net","spamfree24.org","spamgap.com",
  "spamherelots.com","spamherenow.com","spamhole.com","spamify.com",
  "spaminmotion.com","spamkill.info","spaml.com","spaml.de","spammotel.com",
  "spammy.host","spamoff.de","spamslicer.com","spamspot.com","spamstack.net",
  "spamthisplease.com","spamtrail.com","spamtroll.net",
  "supergreatmail.com","supermailer.jp","superrito.com","superstachel.de",
  "suremail.info","svk.jp","sweetxxx.de","tafmail.com","tagyourself.com",
  "talkinator.com","tapchicuoihoi.com","teewars.org","teleworm.com",
  "teleworm.us","tempalias.com","tempail.com","tempe-mail.com","tempemails.com",
  "tempinbox.co.uk","tempmail.it","tempmail2.com","tempmaildemo.com",
  "tempmailer.com","tempmailer.de","tempomail.fr","temporaryemail.net",
  "temporaryemail.us","temporaryforwarding.com","temporaryinbox.com",
  "temporarymailaddress.com","tempsky.com","tempthe.net","tempymail.com",
  "thankyou2010.com","thc.st","thelimestones.com","thisisnotmyrealemail.com",
  "thismail.net","throwam.net","tilien.com","tittbit.in",
  "tizi.com","tmailinator.com","toiea.com","tokuriders.co.jp","toomail.biz",
  "topranklist.de","tormail.net","tormail.org","tp-email.com","tranceversal.com",
  "trash-amil.com","trash-mail.at","trash-mail.com","trash-mail.de",
  "trash-mail.ga","trash-mail.io","trash-mail.net","trash2010.com",
  "trash2011.com","trash2012.com","trash2013.com","trashdevil.com",
  "trashdevil.de","trashemail.de","trashimail.com","trayna.com","trbvm.com",
  "trdermail.com","treemail.de","tryalert.com","turual.com","twinmail.de",
  "tyldd.com","uggsrock.com","uhhu.ru","umail.net","unids.com","uroid.com",
  "us.af","venompen.com","veryrealemail.com","vidchart.com","viditag.com",
  "viewcastmedia.com","viewcastmedia.net","viewcastmedia.org","vomoto.com",
  "vpn.st","vsimcard.com","vubby.com","walala.org","walkmail.net",
  "walkmail.ru","wh4f.org","whyspam.me","wickedmail.com","wilemail.com",
  "willhackforfood.biz","willselfdestruct.com","wmail.cf","wollan.info",
  "worldspace.link","wudet.men","wuzup.net","wuzupmail.net","www.e4ward.com",
  "www.mailinator.com","wwwnew.eu","x1x.spb.ru","xagloo.co","xagloo.com",
  "xemaps.com","xents.com","xmaily.com","xoxy.net","xsmail.com","xzapmail.com",
  "ya.ru","yapped.net","yeah.net","yep.it","yogamaven.com","yomail.info",
  "yopmail.pp.ua","youmail.ga","yourdomain.com","ypmail.webarnak.fr.eu.org",
  "yuurok.com","z1p.biz","za.com","zehnminuten.de","zehnminutenmail.de",
  "zippymail.info","zoaxe.com","zoemail.com","zoemail.net","zoemail.org",
  "zomg.info","zxcv.com","zxcvbnm.com","zzz.com",
]);

type Platform = "ios" | "android";

function isKnownDisposableDomain(email: string): boolean {
  const domain = email.split("@")[1];
  return domain ? DISPOSABLE_DOMAINS.has(domain) : false;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  return `${local[0]}***@${domain}`;
}

async function sendEmail(resendApiKey: string, payload: object, label: string): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      console.error(`[beta-signup] ${label} Resend error: status=${res.status}`);
      return;
    }
    console.log(`[beta-signup] ${label} sent`);
  } catch (err) {
    clearTimeout(timeoutId);
    const message = controller.signal.aborted ? "timed out" : "failed";
    console.error(`[beta-signup] ${label} ${message}`, err);
  }
}

async function isDisposableEmail(email: string): Promise<boolean> {
  const apiKey = Deno.env.get("ABSTRACT_API_KEY");
  if (!apiKey) return false;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4_000);

  try {
    const url = `https://emailreputation.abstractapi.com/v1/?api_key=${apiKey}&email=${encodeURIComponent(email)}`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return false;
    const data = await res.json();
    return data?.email_quality?.is_disposable === true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

function fail(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: jsonHeaders,
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  let body: {
    name?: unknown;
    email?: unknown;
    platform?: unknown;
    google_email?: unknown;
    device_model?: unknown;
    founding_consent?: unknown;
    wishes?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return fail("Invalid request", 400);
  }

  // Name (required)
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 100) : "";
  if (!name) {
    return fail("Please enter your name.", 400);
  }

  // Email (required + valid + not disposable)
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_REGEX.test(email)) {
    return fail("Invalid email address", 400);
  }
  if (isKnownDisposableDomain(email) || (await isDisposableEmail(email))) {
    return fail("Please use a permanent email address.", 422);
  }

  // Platform (required, ios | android)
  const platform = body.platform;
  if (platform !== "ios" && platform !== "android") {
    return fail("Please choose your device.", 400);
  }

  // Google account email — required for Android, ignored for iOS
  let googleEmail: string | null = null;
  if (platform === "android") {
    const raw =
      typeof body.google_email === "string"
        ? body.google_email.trim().toLowerCase()
        : "";
    if (!EMAIL_REGEX.test(raw)) {
      return fail("A valid Google account email is required for Android.", 400);
    }
    googleEmail = raw;
  }

  const deviceModel =
    typeof body.device_model === "string" && body.device_model.trim()
      ? body.device_model.trim().slice(0, 100)
      : null;

  const foundingConsent = body.founding_consent === true;

  const wishes =
    typeof body.wishes === "string" && body.wishes.trim()
      ? body.wishes.trim().slice(0, 1000)
      : null;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseKey) {
    console.error("[beta-signup] Supabase env vars not configured");
    return fail("Service misconfigured", 500);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Reconcile against the waitlist so Curtis can see who from the list responded.
  const { data: waitlistMatch } = await supabase
    .from("waitlist_signups")
    .select("id")
    .eq("email", email)
    .limit(1)
    .maybeSingle();
  const onWaitlist = Boolean(waitlistMatch);

  const { data: inserted, error } = await supabase
    .from("beta_signups")
    .insert({
      name,
      email,
      platform: platform as Platform,
      google_email: googleEmail,
      device_model: deviceModel,
      founding_consent: foundingConsent,
      wishes,
      on_waitlist: onWaitlist,
    })
    .select("id, created_at")
    .single();

  if (error) {
    console.error("[beta-signup] Insert failed:", error.code);
    return fail("Could not submit. Please try again.", 500);
  }

  if (inserted?.id) {
    try {
      await enqueueResendContact("beta", String(inserted.id));
    } catch (err) {
      console.error("[beta-signup] Contact sync enqueue failed:", err);
    }
  }

  // Notify admin (mirrors waitlist-signup). Non-blocking on failure — the row is
  // already saved, so the submitter still gets a success response regardless.
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const adminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL")?.trim();
  if (resendApiKey && adminEmail) {
    const signedUpAt = inserted?.created_at
      ? new Date(inserted.created_at).toLocaleString("en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "UTC",
        }) + " UTC"
      : new Date().toISOString();

    const platformLabel = platform === "ios" ? "iPhone" : "Android";
    const esc = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

    const rows: [string, string][] = [
      ["Name", name],
      ["Email", email],
      ["Device", platformLabel],
      ["Google account", googleEmail ?? "—"],
      ["Phone model", deviceModel ?? "—"],
      ["Already on waitlist", onWaitlist ? "Yes" : "No"],
      ["Signed up at", signedUpAt],
      ["Wishes", wishes ?? "—"],
    ];
    const rowsHtml = rows
      .map(
        ([k, v], index) =>
          `<tr><td style="padding:14px 0;${index < rows.length - 1 ? "border-bottom:1px solid #eaeaea;" : ""}">` +
          `<p style="margin:0;color:#666666;font-size:12px;font-weight:700;letter-spacing:0.04em;line-height:16px;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">${k}</p>` +
          `<p style="margin:4px 0 0;color:#020304;font-size:16px;line-height:24px;font-family:Arial,Helvetica,sans-serif;">${esc(v)}</p>` +
          `</td></tr>`,
      )
      .join("");

    const adminHtml =
      `<!DOCTYPE html><html lang="en"><body style="background-color:#ffffff;margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;">` +
      `<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color:#ffffff;"><tr><td align="center" style="padding:0;">` +
      `<table width="600" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width:600px;width:100%;background-color:#ffffff;">` +
      `<tr><td align="center" style="padding:20px 16px 32px;"><img src="https://di867tnz6fwga.cloudfront.net/brand-kits/0b06e40e-c16e-4eb6-ae76-6209b4ec6cdf/primary/f336d4b2-3732-4539-9bf2-f7c844495736.png" alt="Hemo SCD Logo" width="200" height="80" style="display:block;border:0;max-width:200px;width:200px;height:auto;" /></td></tr>` +
      `<tr><td style="padding:0 32px;color:#020304;font-size:16px;line-height:24px;">` +
      `<h1 style="color:#020304;font-size:26px;font-weight:700;line-height:32px;margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;">Someone joined the beta</h1>` +
      `<p style="margin:0 0 16px;color:#020304;font-size:16px;line-height:24px;font-family:Arial,Helvetica,sans-serif;">A new person has signed up to try Hemo. Their responses are below so you can follow up with the right context.</p>` +
      `<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-top:1px solid #eaeaea;border-bottom:1px solid #eaeaea;">${rowsHtml}</table>` +
      `<p style="margin:20px 0 0;color:#666666;font-size:16px;line-height:24px;font-family:Arial,Helvetica,sans-serif;">Keep their feedback close as you prepare the next beta conversation.</p>` +
      `</td></tr>` +
      `<tr><td style="border-top:1px solid #eaeaea;margin-top:32px;padding:24px 32px 32px;text-align:center;">` +
      `<img src="https://resend-attachments.s3.amazonaws.com/7e243de0-f0c8-456b-b2ac-9dc2135bd2de" alt="Hemo fingerprint icon" width="65" height="65" style="display:block;border:0;margin:0 auto;" />` +
      `<p style="color:#666666;font-size:12px;line-height:16px;margin:16px 0 8px;font-family:Arial,Helvetica,sans-serif;">You’re receiving this because you signed up for Hemo. We’re here to support your daily health journey.</p>` +
      `<p style="color:#666666;font-size:12px;line-height:16px;margin:16px 0 8px;font-family:Arial,Helvetica,sans-serif;">UAE, Dubai · <a href="https://hemo-scd.com" style="color:#A9334D;text-decoration:underline;">hemo-scd.com</a> · <a href="https://hemo-scd.com" style="color:#A9334D;text-decoration:underline;">Unsubscribe</a></p>` +
      `<p style="color:#666666;font-size:12px;line-height:16px;margin:0;font-family:Arial,Helvetica,sans-serif;">© 2026 Hemo SCD. All rights reserved.</p>` +
      `</td></tr></table></td></tr></table></body></html>`;

    const adminText =
      "Someone joined the beta\n\n" +
      "A new person has signed up to try Hemo. Their responses are below so you can follow up with the right context.\n\n" +
      rows.map(([k, v]) => `${k}: ${v}`).join("\n") +
      "\n\nKeep their feedback close as you prepare the next beta conversation.";

    await sendEmail(
      resendApiKey,
      {
        from: "Hemo <hello@info.hemo-scd.com>",
        to: [adminEmail],
        subject: `New beta signup: ${email} (${platformLabel})`,
        html: adminHtml,
        text: adminText,
      },
      `Admin beta notification for ${maskEmail(email)}`,
    );
  } else if (!resendApiKey) {
    console.error("[beta-signup] RESEND_API_KEY not configured — skipping admin email");
  } else {
    console.log("[beta-signup] ADMIN_NOTIFICATION_EMAIL not set — skipping admin email");
  }

  return new Response(JSON.stringify({ ok: true }), { headers: jsonHeaders });
});
