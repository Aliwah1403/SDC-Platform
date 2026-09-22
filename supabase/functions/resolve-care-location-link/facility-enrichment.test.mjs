import assert from "node:assert/strict";
import test from "node:test";
import { enrichCareLocation } from "./facility-enrichment.ts";

const parsed = {
  provider: "apple_maps",
  name: "Example Hospital",
  address: null,
  lat: 25.2,
  lng: 55.3,
  providerPlaceId: "apple-1",
  sourceUrl: "https://maps.apple.com/?q=Example+Hospital&ll=25.2,55.3",
};

function allowedAdmin() {
  return { rpc: async () => ({ data: true, error: null }) };
}

test("returns parsed fields without calling Geoapify when it is not configured", async () => {
  let calls = 0;
  const result = await enrichCareLocation(parsed, {
    adminClient: allowedAdmin(), userId: "user-1", rateLimitSalt: "test-salt",
    fetchImpl: async () => { calls += 1; throw new Error("should not fetch"); },
  });

  assert.equal(calls, 0);
  assert.equal(result.fields.name.value, "Example Hospital");
  assert.deepEqual(result.warnings, ["geoapify_not_configured"]);
});

test("enriches a strong nearby match and requests details only for missing contact fields", async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    if (url.includes("/reverse")) {
      return new Response(JSON.stringify({ features: [{ properties: { place_id: "address-1", formatted: "1 Example Road" } }] }), { status: 200 });
    }
    if (url.includes("/places?")) {
      return new Response(JSON.stringify({ features: [{ geometry: { coordinates: [55.3, 25.2] }, properties: {
        place_id: "geo-1", name: "Example Hospital", formatted: "1 Example Road", categories: ["healthcare.hospital"],
      } }] }), { status: 200 });
    }
    if (url.includes("/place-details?")) {
      return new Response(JSON.stringify({ features: [{ properties: {
        place_id: "geo-1", contact: { phone: "+971 4 000 0000" }, website: "https://hospital.example",
      } }] }), { status: 200 });
    }
    throw new Error(`Unexpected request: ${url}`);
  };

  const result = await enrichCareLocation(parsed, {
    apiKey: "test-key", adminClient: allowedAdmin(), userId: "user-1", ip: "203.0.113.1",
    rateLimitSalt: "test-salt", fetchImpl,
  });

  assert.equal(result.candidate.decision, "strong_candidate");
  assert.equal(result.fields.address.source, "geoapify_reverse");
  assert.equal(result.fields.phone.source, "geoapify_details");
  assert.equal(result.fields.website.value, "https://hospital.example");
  assert.equal(calls.filter((url) => url.includes("/place-details?")).length, 1);
});

test("falls back without provider calls when the persistent quota denies a lookup", async () => {
  let calls = 0;
  const result = await enrichCareLocation(parsed, {
    apiKey: "test-key",
    adminClient: { rpc: async () => ({ data: false, error: null }) },
    userId: "user-1",
    rateLimitSalt: "test-salt",
    fetchImpl: async () => { calls += 1; throw new Error("should not fetch"); },
  });

  assert.equal(calls, 0);
  assert.deepEqual(result.warnings, ["geoapify_daily_limit"]);
  assert.equal(result.fields.name.value, "Example Hospital");
});

test("keeps parsed Maps data when quota infrastructure throws", async () => {
  let calls = 0;
  const result = await enrichCareLocation(parsed, {
    apiKey: "test-key",
    adminClient: { rpc: async () => { throw new Error("database unavailable"); } },
    userId: "user-1",
    rateLimitSalt: "test-salt",
    fetchImpl: async () => { calls += 1; throw new Error("should not fetch"); },
  });

  assert.equal(calls, 0);
  assert.equal(result.fields.name.value, "Example Hospital");
  assert.deepEqual(result.warnings, ["geoapify_infrastructure_unavailable"]);
});

test("uses a shared cache before consuming quota or calling Geoapify", async () => {
  let rpcCalls = 0;
  let providerCalls = 0;
  const cachedPhone = {
    value: "+971 4 111 1111", source: "geoapify_details", sourceId: "geo-1",
    observedAt: "2026-09-17T00:00:00.000Z", confidence: 0.9, status: "normalized",
  };
  const query = {
    select() { return this; }, eq() { return this; }, gt() { return this; },
    async maybeSingle() {
      return { data: { payload: {
        candidate: { geoapifyPlaceId: "geo-1", identityConfidence: 0.9, decision: "strong_candidate", reasons: [] },
        fields: { phone: cachedPhone }, corroboratedFields: ["name", "coordinates"],
      } }, error: null };
    },
  };
  const result = await enrichCareLocation({ ...parsed, address: "1 Example Road" }, {
    apiKey: "test-key",
    adminClient: { rpc: async () => { rpcCalls += 1; return { data: true, error: null }; }, from: () => query },
    userId: "user-1",
    rateLimitSalt: "test-salt",
    fetchImpl: async () => { providerCalls += 1; throw new Error("should not fetch"); },
  });

  assert.equal(providerCalls, 0);
  assert.equal(rpcCalls, 0);
  assert.equal(result.fields.phone.value, "+971 4 111 1111");
  assert.equal(result.fields.name.status, "corroborated");
  assert.ok(result.warnings.includes("geoapify_cache_hit"));
});

test("looks up contact details even when Maps already supplied core identity fields", async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    if (url.includes("/search?")) {
      return new Response(JSON.stringify({ features: [{ geometry: { coordinates: [55.3, 25.2] }, properties: {
        place_id: "geo-1", name: "Example Hospital", formatted: "1 Example Road", categories: ["healthcare.hospital"],
      } }] }), { status: 200 });
    }
    return new Response(JSON.stringify({ features: [{ properties: {
      place_id: "geo-1", contact: { phone: "+971 4 222 2222" }, website: "https://hospital.example",
    } }] }), { status: 200 });
  };

  const result = await enrichCareLocation({ ...parsed, address: "1 Example Road" }, {
    apiKey: "test-key", adminClient: allowedAdmin(), userId: "user-1",
    rateLimitSalt: "test-salt", fetchImpl,
  });

  assert.equal(result.fields.phone.value, "+971 4 222 2222");
  assert.equal(result.fields.website.value, "https://hospital.example");
  assert.equal(calls.some((url) => url.includes("/reverse")), false);
  assert.equal(calls.some((url) => url.includes("bias=proximity%3A55.3%2C25.2")), true);
  assert.equal(calls.filter((url) => url.includes("/place-details?")).length, 1);
});

test("falls back to nearby healthcare when exact facility search has no usable match", async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    if (url.includes("/search?")) {
      return new Response(JSON.stringify({ features: [] }), { status: 200 });
    }
    if (url.includes("/places?")) {
      return new Response(JSON.stringify({ features: [{ geometry: { coordinates: [55.3, 25.2] }, properties: {
        place_id: "geo-nearby", name: "Example Hospital", formatted: "1 Example Road", categories: ["healthcare.hospital"],
      } }] }), { status: 200 });
    }
    if (url.includes("/place-details?")) {
      return new Response(JSON.stringify({ features: [{ properties: {
        place_id: "geo-nearby", contact: { phone: "+971 4 333 3333" },
      } }] }), { status: 200 });
    }
    throw new Error(`Unexpected request: ${url}`);
  };

  const result = await enrichCareLocation({ ...parsed, address: "1 Example Road" }, {
    apiKey: "test-key", adminClient: allowedAdmin(), userId: "user-1",
    rateLimitSalt: "test-salt", fetchImpl,
  });

  assert.equal(result.fields.phone.value, "+971 4 333 3333");
  assert.deepEqual(result.lookupStages.slice(0, 2), [
    { stage: "exact_search", candidateCount: 0 },
    { stage: "nearby_healthcare", candidateCount: 1 },
  ]);
});

test("Gemini quota uses existing RPC scopes with provider-namespaced hashes", async () => {
  const quotaCalls = [];
  const adminClient = { rpc: async (_name, params) => { quotaCalls.push(params); return { data: true, error: null }; } };
  const fetchImpl = async (_url, init) => {
    const body = JSON.parse(init.body);
    if (body.tools) return new Response(JSON.stringify({ candidates: [{
      content: { parts: [{ text: "Grounded contact evidence" }] },
      groundingMetadata: {
        groundingChunks: [{ web: { uri: "https://hospital.example/contact", title: "Example Hospital" } }],
        groundingSupports: [{ groundingChunkIndices: [0], segment: { text: "Call +971 4 000 0000." } }],
        searchEntryPoint: { renderedContent: "<div>Attribution</div>" },
      },
    }] }), { status: 200 });
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({
      identityDecision: "match", facilityName: "Example Hospital", summary: "Official contact.",
      phone: { value: "+971 4 000 0000", sourceIndex: 0, evidence: "The facility lists this number." }, website: null,
    }) }] } }] }), { status: 200 });
  };
  const result = await enrichCareLocation(parsed, {
    geminiEnabled: true, geminiApiKey: "server-key", geminiRateLimitSalt: "server-salt",
    adminClient, userId: "user-1", fetchImpl,
  });
  assert.equal(result.fields.phone.sourceId, "https://hospital.example/contact");
  assert.deepEqual(quotaCalls.map((call) => call.p_scope), ["global", "user"]);
  assert.ok(quotaCalls.every((call) => call.p_key_hash.length === 64));
});
