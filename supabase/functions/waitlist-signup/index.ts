import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { enqueueResendContact } from "../_shared/trigger-resend-contact.ts";

const RESEND_API_URL = "https://api.resend.com/emails";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  "throwaway.email","throwam.com","spamgourmet.com","spamgourmet.net",
  "spamgourmet.org","spamgourmet.com","mailnull.com","fanchatu.com",
  "maildrop.cc","mailnesia.com","mailnull.com","mailseal.de","mintemail.com",
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
  "spamthisplease.com","spamtrail.com","spamtroll.net","speed.1s.fr",
  "supergreatmail.com","supermailer.jp","superrito.com","superstachel.de",
  "suremail.info","svk.jp","sweetxxx.de","tafmail.com","tagyourself.com",
  "talkinator.com","tapchicuoihoi.com","teewars.org","teleworm.com",
  "teleworm.us","tempalias.com","tempail.com","tempe-mail.com","tempemails.com",
  "tempinbox.co.uk","tempmail.it","tempmail2.com","tempmaildemo.com",
  "tempmailer.com","tempmailer.de","tempomail.fr","temporaryemail.net",
  "temporaryemail.us","temporaryforwarding.com","temporaryinbox.com",
  "temporarymailaddress.com","tempsky.com","tempthe.net","tempymail.com",
  "thankyou2010.com","thc.st","thelimestones.com","thisisnotmyrealemail.com",
  "thismail.net","throwam.com","throwam.net","tilien.com","tittbit.in",
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

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  return `${local[0]}***@${domain}`;
}

function isKnownDisposableDomain(email: string): boolean {
  const domain = email.split("@")[1];
  return domain ? DISPOSABLE_DOMAINS.has(domain) : false;
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
      console.error(`[waitlist-signup] ${label} Resend error: status=${res.status}`);
      return;
    }
    console.log(`[waitlist-signup] ${label} sent`);
  } catch (err) {
    clearTimeout(timeoutId);
    const message = controller.signal.aborted ? "timed out" : "failed";
    console.error(`[waitlist-signup] ${label} ${message}`, err);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  let body: { email?: unknown; source?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_REGEX.test(email)) {
    return new Response(JSON.stringify({ error: "Invalid email address" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const disposable = isKnownDisposableDomain(email) || await isDisposableEmail(email);
  if (disposable) {
    return new Response(
      JSON.stringify({ error: "Please use a permanent email address." }),
      {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const source =
    typeof body.source === "string"
      ? body.source.slice(0, 100)
      : "landing-page";

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseKey) {
    console.error("[waitlist-signup] Supabase env vars not configured");
    return new Response(JSON.stringify({ error: "Service misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: inserted, error } = await supabase
    .from("waitlist_signups")
    .insert({ email, source })
    .select("id, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.error("[waitlist-signup] Insert failed:", error.code);
    return new Response(
      JSON.stringify({ error: "Could not join waitlist. Please try again." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    await enqueueResendContact("waitlist", String(inserted.id));
  } catch (err) {
    console.error("[waitlist-signup] Contact sync enqueue failed:", err);
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.error("[waitlist-signup] RESEND_API_KEY not configured — skipping emails");
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const signedUpAt = inserted?.created_at
    ? new Date(inserted.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC"
    : new Date().toISOString();

  const sends: Promise<void>[] = [
    sendEmail(
      resendApiKey,
      { to: [email], template: { id: "waitlist-email" } },
      `Welcome email to ${maskEmail(email)}`,
    ),
  ];

  const adminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL")?.trim();
  if (adminEmail) {
    sends.push(
      sendEmail(
        resendApiKey,
        {
          to: [adminEmail],
          template: { id: "admin-waitlist-notification" },
          variables: {
            SIGNUP_EMAIL: email,
            SOURCE: source,
            SIGNED_UP_AT: signedUpAt,
          },
        },
        "Admin waitlist notification",
      ),
    );
  }

  await Promise.all(sends);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
