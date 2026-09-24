import assert from "node:assert/strict";
import test from "node:test";
import { enrichWithGemini, parseGroundingSources, validateRefinement } from "./gemini-client.ts";

const parsed = {
  provider: "apple_maps", name: "Example Hospital", address: "1 Example Road",
  lat: 25.2, lng: 55.3, countryCode: "AE", sourceUrl: "https://maps.apple.com/?q=Example",
};

const metadata = {
  groundingChunks: [{ web: { uri: "https://hospital.example/contact", title: "Example Hospital" } }],
  groundingSupports: [{ groundingChunkIndices: [0], segment: { text: "Example Hospital lists +971 4 000 0000." } }],
  searchEntryPoint: { renderedContent: "<div>Search suggestions attribution</div>" },
};

function response(text, status = 200) {
  return new Response(JSON.stringify(text), { status, headers: { "content-type": "application/json" } });
}

function fakeFetch(refinement, calls = []) {
  return async (_url, init) => {
    calls.push(JSON.parse(init.body));
    if (calls.length === 1) return response({ candidates: [{ content: { parts: [{ text: "Example Hospital contact evidence." }] }, groundingMetadata: metadata }] });
    return response({ candidates: [{ content: { parts: [{ text: JSON.stringify(refinement) }] } }] });
  };
}

test("parses grounding and accepts indexed official contact evidence", async () => {
  const calls = [];
  const result = await enrichWithGemini(parsed, {
    apiKey: "server-only", fetchImpl: fakeFetch({
      identityDecision: "match", facilityName: "Example Hospital", summary: "Official contact details were found.",
      phone: { value: "+971 4 000 0000", sourceIndex: 0, evidence: "The facility lists this phone number." },
      website: { value: "https://hospital.example", sourceIndex: 0, evidence: "The facility website is listed." },
    }, calls),
  });
  assert.deepEqual(parseGroundingSources(metadata), [{ index: 0, url: "https://hospital.example/contact", title: "Example Hospital" }]);
  assert.equal(calls[0].tools[0].google_search instanceof Object, true);
  assert.equal(calls[0].generationConfig.thinkingConfig.thinkingLevel, "minimal");
  assert.equal(calls[0].generationConfig.temperature, undefined);
  assert.ok(calls[1].generationConfig.responseJsonSchema);
  assert.equal(calls[1].generationConfig.thinkingConfig.thinkingLevel, "minimal");
  assert.equal(calls[1].generationConfig.responseJsonSchema.type, "object");
  assert.deepEqual(calls[1].generationConfig.responseJsonSchema.properties.phone.type, ["object", "null"]);
  assert.equal(result.fields.phone.source, "gemini_search");
  assert.equal(result.fields.phone.sourceId, "https://hospital.example/contact");
  assert.equal(result.fields.website.sourceTitle, "Example Hospital");
  assert.equal(result.groundedResult.sources.length, 1);
});

test("rejects an absent or unlisted grounding source index", async () => {
  const result = await enrichWithGemini(parsed, {
    apiKey: "server-only", fetchImpl: fakeFetch({
      identityDecision: "match", facilityName: "Example Hospital", summary: "Contact.",
      phone: { value: "+971 4 000 0000", sourceIndex: 8, evidence: "Unsupported source." },
      website: null,
    }),
  });
  assert.equal(result.fields.phone.value, null);
  assert.ok(result.warnings.includes("gemini_no_verified_contacts"));
});

test("rejects a source chunk that has no grounding support segment", async () => {
  const noSupport = {
    ...metadata,
    groundingSupports: [],
  };
  const calls = [];
  const result = await enrichWithGemini(parsed, {
    apiKey: "server-only", fetchImpl: async (_url, init) => {
      const body = JSON.parse(init.body);
      calls.push(body);
      if (body.tools) return response({ candidates: [{ content: { parts: [{ text: "Grounded text" }] }, groundingMetadata: noSupport }] });
      return response({ candidates: [{ content: { parts: [{ text: JSON.stringify({
        identityDecision: "match", facilityName: "Example Hospital", summary: "Contact.",
        phone: { value: "+971 4 000 0000", sourceIndex: 0, evidence: "claimed" }, website: null,
      }) }] } }] });
    },
  });
  assert.equal(calls.length, 2);
  assert.ok(result.warnings.includes("gemini_no_verified_contacts"));
});

test("rejects directory, social, aggregator, and Maps source links", async () => {
  const badMetadata = {
    ...metadata,
    groundingChunks: [
      { web: { uri: "https://www.yelp.com/biz/example", title: "Directory" } },
      { web: { uri: "https://maps.google.com/?cid=1", title: "Maps" } },
      { web: { uri: "https://directory.example/contact", title: "Directory" } },
      { web: { uri: "https://social.example/contact", title: "Social" } },
      { web: { uri: "https://aggregator.example/contact", title: "Aggregator" } },
    ],
  };
  assert.deepEqual(parseGroundingSources(badMetadata), []);
  const validation = validateRefinement({
    identityDecision: "match", facilityName: "Example Hospital", phone: { value: "+971 4 000 0000", sourceIndex: 0, evidence: "x" }, website: null,
  }, parsed, [], badMetadata);
  assert.equal(validation.ok, true);
  assert.deepEqual(validation.contacts, {});
});

test("keeps Gemini grounding redirect citations as source links but never as websites", async () => {
  const redirect = "https://vertexaisearch.cloud.google.com/grounding-api-redirect/abc123";
  const sources = parseGroundingSources({ groundingChunks: [{ web: { uri: redirect, title: "Grounded source" } }] });
  assert.equal(sources[0].url, redirect);
  const result = await enrichWithGemini(parsed, {
    apiKey: "server-only", fetchImpl: fakeFetch({
      identityDecision: "match", facilityName: "Example Hospital", summary: "Contact.",
      phone: null, website: { value: redirect, sourceIndex: 0, evidence: "redirect" },
    }),
  });
  assert.ok(result.warnings.includes("gemini_no_verified_contacts"));
});

test("requires Search attribution links and rendered entry point", async () => {
  const noAttribution = async (_url, init) => {
    const body = JSON.parse(init.body);
    if (body.tools) return response({ candidates: [{ content: { parts: [{ text: "A result" }] }, groundingMetadata: { groundingChunks: metadata.groundingChunks } }] });
    throw new Error("refinement should not run");
  };
  const result = await enrichWithGemini(parsed, { apiKey: "server-only", fetchImpl: noAttribution });
  assert.deepEqual(result.warnings, ["gemini_grounding_unusable"]);
});

test("no-match and provider failures are safe outcomes", async () => {
  const noMatch = await enrichWithGemini(parsed, {
    apiKey: "server-only", fetchImpl: fakeFetch({ identityDecision: "ambiguous", facilityName: "Other Hospital", summary: "Ambiguous.", phone: null, website: null }),
  });
  assert.ok(noMatch.warnings.includes("gemini_identity_ambiguous"));
  const failed = await enrichWithGemini(parsed, { apiKey: "server-only", fetchImpl: async () => response({ error: "down" }, 500) });
  assert.deepEqual(failed.warnings, ["gemini_provider_failed"]);
});

test("reports unavailable models and authentication failures without retrying as outages", async () => {
  const unavailable = await enrichWithGemini(parsed, {
    apiKey: "server-only", fetchImpl: async () => response({ error: "gone" }, 404),
  });
  assert.deepEqual(unavailable.warnings, ["gemini_model_unavailable"]);

  const unauthenticated = await enrichWithGemini(parsed, {
    apiKey: "server-only", fetchImpl: async () => response({ error: "bad key" }, 403),
  });
  assert.deepEqual(unauthenticated.warnings, ["gemini_authentication"]);
});
