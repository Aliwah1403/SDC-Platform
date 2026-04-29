const NOVU_API_URL = "https://api.novu.co/v1";

export async function triggerNovu(
  workflowId: string,
  subscriberId: string,
  payload: Record<string, unknown>
): Promise<void> {
  const apiKey = process.env.NOVU_API_KEY;
  if (!apiKey) throw new Error("Missing NOVU_API_KEY");

  const res = await fetch(`${NOVU_API_URL}/events/trigger`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `ApiKey ${apiKey}`,
    },
    body: JSON.stringify({
      name: workflowId,
      to: { subscriberId },
      payload,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Novu trigger failed [${workflowId}] status=${res.status} body=${body.slice(0, 200)}`
    );
  }
}
