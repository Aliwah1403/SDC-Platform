import { Resend } from "resend";
import { AbortTaskRunError, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";
import { supabase } from "../lib/supabase";

const sourceSchema = z.enum(["general", "waitlist", "beta"]);
const segmentEnvBySource = {
  general: "RESEND_GENERAL_SEGMENT_ID",
  waitlist: "RESEND_WAITLIST_SEGMENT_ID",
  beta: "RESEND_BETA_SEGMENT_ID",
} as const;

type ContactDetails = { email: string; firstName?: string; lastName?: string };

async function getContactDetails(source: z.infer<typeof sourceSchema>, recordId: string): Promise<ContactDetails> {
  if (source === "general") {
    const { data, error } = await supabase
      .from("profiles")
      .select("email, full_name, onboarding_complete")
      .eq("user_id", recordId)
      .single();
    if (error || !data) throw new AbortTaskRunError("Profile not found");
    if (!data.onboarding_complete) throw new AbortTaskRunError("Onboarding is not complete");
    if (!data.email) throw new AbortTaskRunError("Profile email is missing");
    const [firstName, ...lastNameParts] = (data.full_name ?? "").trim().split(/\s+/).filter(Boolean);
    return { email: data.email, firstName, lastName: lastNameParts.join(" ") || undefined };
  }

  if (source === "waitlist") {
    const { data, error } = await supabase
      .from("waitlist_signups")
      .select("email")
      .eq("id", recordId)
      .single();
    if (error || !data?.email) throw new AbortTaskRunError("Waitlist signup not found");
    return { email: data.email };
  }

  const { data, error } = await supabase
    .from("beta_signups")
    .select("email, name")
    .eq("id", recordId)
    .single();
  if (error || !data?.email) throw new AbortTaskRunError("Beta signup not found");
  const [firstName, ...lastNameParts] = data.name.trim().split(/\s+/).filter(Boolean);
  return { email: data.email, firstName, lastName: lastNameParts.join(" ") || undefined };
}

export const syncResendContact = schemaTask({
  id: "sync-resend-contact",
  retry: { maxAttempts: 5, minTimeoutInMs: 2_000, maxTimeoutInMs: 30_000, factor: 2 },
  schema: z.object({ source: sourceSchema, recordId: z.string().min(1) }),
  run: async ({ source, recordId }) => {
    const apiKey = process.env.RESEND_API_KEY;
    const segmentId = process.env[segmentEnvBySource[source]];
    if (!apiKey) throw new Error("RESEND_API_KEY not configured");
    if (!segmentId) throw new Error(`${segmentEnvBySource[source]} not configured`);

    const contact = await getContactDetails(source, recordId);
    const resend = new Resend(apiKey);
    const properties = { hemo_source: source };
    const lookup = await resend.contacts.get({ email: contact.email });

    if (lookup.error && (lookup.error as { statusCode?: number }).statusCode !== 404) throw lookup.error;

    if (lookup.data) {
      const { error } = await resend.contacts.update({
        email: contact.email,
        ...(contact.firstName ? { firstName: contact.firstName } : {}),
        ...(contact.lastName ? { lastName: contact.lastName } : {}),
        properties,
      });
      if (error) throw error;
      const segments = await resend.contacts.segments.list({ email: contact.email });
      if (segments.error) throw segments.error;
      if (!segments.data?.data.some((segment) => segment.id === segmentId)) {
        const { error: segmentError } = await resend.contacts.segments.add({ email: contact.email, segmentId });
        if (segmentError) throw segmentError;
      }
      return { created: false, email: contact.email, source };
    }

    const { error } = await resend.contacts.create({
      email: contact.email,
      ...(contact.firstName ? { firstName: contact.firstName } : {}),
      ...(contact.lastName ? { lastName: contact.lastName } : {}),
      properties,
      segments: [{ id: segmentId }],
    });
    if (error) throw error;
    return { created: true, email: contact.email, source };
  },
});
