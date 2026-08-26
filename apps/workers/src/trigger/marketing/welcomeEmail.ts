import { AbortTaskRunError, schemaTask } from "@trigger.dev/sdk";
import { Resend } from "resend";
import { z } from "zod";
import { supabase } from "../../lib/supabase";

const welcomePayload = z.object({ userId: z.string().uuid() });

function getFirstName(
  user: { user_metadata?: Record<string, unknown>; email?: string },
  profile?: { nickname?: string | null; full_name?: string | null } | null,
) {
  const profileName = profile?.nickname || profile?.full_name;
  const metadataName = user.user_metadata?.full_name;
  const name = profileName || (typeof metadataName === "string" ? metadataName : "");
  const firstName = name.trim().split(/\s+/).filter(Boolean)[0];
  return firstName || user.email?.split("@")[0] || "there";
}

async function syncWelcomeContact(email: string, firstName: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not configured");

  const segmentId = process.env.RESEND_GENERAL_SEGMENT_ID;
  const resend = new Resend(apiKey);
  const lookup = await resend.contacts.get({ email });

  if (lookup.error && (lookup.error as { statusCode?: number }).statusCode !== 404) {
    throw lookup.error;
  }

  if (lookup.data) {
    const { error } = await resend.contacts.update({
      email,
      firstName,
      properties: { hemo_source: "welcome" },
    });
    if (error) throw error;

    if (segmentId) {
      const segments = await resend.contacts.segments.list({ email });
      if (segments.error) throw segments.error;
      if (!segments.data?.data.some((segment) => segment.id === segmentId)) {
        const { error: segmentError } = await resend.contacts.segments.add({ email, segmentId });
        if (segmentError) throw segmentError;
      }
    }
    return;
  }

  const { error } = await resend.contacts.create({
    email,
    firstName,
    properties: { hemo_source: "welcome" },
    ...(segmentId ? { segments: [{ id: segmentId }] } : {}),
  });
  if (error) throw error;
}

export const welcomeEmail = schemaTask({
  id: "welcome-email",
  schema: welcomePayload,
  retry: { maxAttempts: 5, minTimeoutInMs: 2_000, maxTimeoutInMs: 30_000, factor: 2 },
  run: async ({ userId }) => {
    const { data: userResult, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError) throw userError;
    if (!userResult.user?.email) throw new AbortTaskRunError("Registered user has no email");

    const { data: profile } = await supabase
      .from("profiles")
      .select("nickname, full_name")
      .eq("user_id", userId)
      .maybeSingle();

    const email = userResult.user.email;
    const firstName = getFirstName(userResult.user, profile);
    await syncWelcomeContact(email, firstName);

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY not configured");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `welcome-email/${userId}`,
      },
      body: JSON.stringify({
        from: "Hemo <hello@info.hemo-scd.com>",
        to: [email],
        template: {
          id: "welcome",
          variables: { FIRST_NAME: firstName },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Resend welcome email failed: ${response.status} ${(await response.text()).slice(0, 300)}`);
    }

    return { email, firstName };
  },
});
