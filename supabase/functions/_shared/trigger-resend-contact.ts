type ResendContactSource = "general" | "waitlist" | "beta";

export async function enqueueResendContact(source: ResendContactSource, recordId: string): Promise<{ id: string }> {
  const triggerKey = Deno.env.get("TRIGGER_SECRET_KEY");
  if (!triggerKey) throw new Error("TRIGGER_SECRET_KEY not configured");

  const response = await fetch("https://api.trigger.dev/api/v1/tasks/sync-resend-contact/trigger", {
    method: "POST",
    headers: { Authorization: `Bearer ${triggerKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      payload: { source, recordId },
      options: { idempotencyKey: `resend-contact:${source}:${recordId}`, tags: [`resend:${source}`] },
    }),
  });
  if (!response.ok) throw new Error(`Trigger.dev enqueue failed (${response.status})`);
  return await response.json() as { id: string };
}
