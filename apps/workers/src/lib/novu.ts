const NOVU_API_URL = "https://api.novu.co/v1";
const BULK_CHUNK_SIZE = 100;

export async function triggerNovu(
  workflowId: string,
  subscriberId: string,
  payload: Record<string, unknown>,
  options?: { idempotencyKey?: string }
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
      ...(options?.idempotencyKey
        ? { transactionId: options.idempotencyKey }
        : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Novu trigger failed [${workflowId}] status=${res.status} body=${body.slice(0, 200)}`
    );
  }
}

type BulkEvent = {
  workflowId: string;
  subscriberId: string;
  payload: Record<string, unknown>;
  idempotencyKey?: string;
};

export async function triggerNovuBulk(events: BulkEvent[]): Promise<{ failedCount: number }> {
  if (events.length === 0) return { failedCount: 0 };

  const apiKey = process.env.NOVU_API_KEY;
  if (!apiKey) throw new Error("Missing NOVU_API_KEY");

  let failedCount = 0;

  for (let i = 0; i < events.length; i += BULK_CHUNK_SIZE) {
    const chunk = events.slice(i, i + BULK_CHUNK_SIZE);

    const res = await fetch(`${NOVU_API_URL}/events/trigger/bulk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `ApiKey ${apiKey}`,
      },
      body: JSON.stringify({
        events: chunk.map((e) => ({
          name: e.workflowId,
          to: { subscriberId: e.subscriberId },
          payload: e.payload,
          ...(e.idempotencyKey ? { transactionId: e.idempotencyKey } : {}),
        })),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `Novu bulk trigger failed status=${res.status} body=${body.slice(0, 200)}`
      );
    }

    // Novu has returned both a top-level array and a `{ data: [...] }` envelope
    // from this endpoint. Accept both shapes so a successful delivery is not
    // reported as a failed Trigger.dev run after Novu has already queued it.
    const body = (await res.json()) as unknown;
    const results = Array.isArray(body)
      ? body
      : body &&
          typeof body === "object" &&
          Array.isArray((body as { data?: unknown }).data)
        ? (body as {
            data: Array<{ error?: unknown; acknowledged?: boolean }>;
          }).data
        : null;
    if (!results) {
      throw new Error("Novu bulk trigger returned an unexpected response shape");
    }

    for (const r of results) {
      if (r.error || r.acknowledged === false) failedCount++;
    }
  }

  return { failedCount };
}
