export async function enqueueCareLocationEnrichment(
  locationId: string,
  userId: string,
  requestId: string,
): Promise<{ id: string }> {
  const triggerKey = Deno.env.get("TRIGGER_SECRET_KEY");
  if (!triggerKey) throw new Error("TRIGGER_SECRET_KEY not configured");

  const response = await fetch("https://api.trigger.dev/api/v1/tasks/enrich-care-location/trigger", {
    method: "POST",
    headers: { Authorization: `Bearer ${triggerKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      payload: { locationId, userId, requestId },
      options: {
        idempotencyKey: `care-location:${locationId}:${requestId}`,
        tags: [`care-location:${locationId}`],
      },
    }),
  });
  if (!response.ok) throw new Error(`Trigger.dev enqueue failed (${response.status})`);
  return await response.json() as { id: string };
}
