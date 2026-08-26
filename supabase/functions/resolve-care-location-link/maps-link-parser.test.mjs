import assert from "node:assert/strict";
import test from "node:test";
import { classifyMapsUrl, isPrivateOrLocalIp, parseMapsUrl, resolveMapsLink } from "./maps-link-parser.mjs";

test("parses Google canonical place coordinates and name", () => {
  const result = parseMapsUrl("https://www.google.com/maps/place/Fake+Care+Hospital/@25.2001,55.3002,15z");
  assert.equal(result.provider, "google_maps");
  assert.equal(result.name, "Fake Care Hospital");
  assert.deepEqual([result.lat, result.lng], [25.2001, 55.3002]);
});

test("parses Google search and place identifier", () => {
  const result = parseMapsUrl("https://www.google.com/maps/search/?api=1&query=Example+Clinic&query_place_id=FAKE_PLACE_ID");
  assert.equal(result.name, "Example Clinic");
  assert.equal(result.providerPlaceId, "FAKE_PLACE_ID");
});

test("parses Google directions address", () => {
  const result = parseMapsUrl("https://www.google.com/maps/dir/?api=1&destination=1+Example+Road%2C+Testville&destination_place_id=FAKE_DESTINATION_ID");
  assert.equal(result.address, "1 Example Road, Testville");
  assert.equal(result.providerPlaceId, "FAKE_DESTINATION_ID");
});

test("parses legacy and unified Apple Maps links", () => {
  const legacy = parseMapsUrl("https://maps.apple.com/?q=Example+Hospital&ll=51.5001,-0.1002&address=1+Example+Street");
  assert.equal(legacy.name, "Example Hospital");
  assert.equal(legacy.address, "1 Example Street");
  const unified = parseMapsUrl("https://maps.apple.com/place?name=Example+Clinic&coordinate=24.4001,54.5002&place-id=FAKE_APPLE_ID");
  assert.deepEqual([unified.lat, unified.lng], [24.4001, 54.5002]);
  assert.equal(unified.providerPlaceId, "FAKE_APPLE_ID");
});

test("returns a partial deterministic candidate", () => {
  const result = parseMapsUrl("https://maps.apple.com/?q=Example+Hospital");
  assert.equal(result.name, "Example Hospital");
  assert.equal(result.address, null);
  assert.equal(result.lat, null);
  assert.equal(result.confidence.coordinates, "unavailable");
});

test("rejects malformed, non-HTTPS, unsupported, and non-map Google URLs", () => {
  for (const url of ["not-a-url", "http://maps.apple.com/?q=x", "https://example.test/maps", "https://www.google.com/search?q=x", "https://goo.gl/not-maps"]) {
    assert.equal(classifyMapsUrl(url), null);
  }
});

test("flags private, local, link-local, and mapped addresses", () => {
  for (const ip of ["127.0.0.1", "10.0.0.1", "172.16.0.1", "192.168.1.1", "169.254.1.1", "::1", "fd00::1", "fe80::1", "::ffff:127.0.0.1"]) {
    assert.equal(isPrivateOrLocalIp(ip), true, ip);
  }
  assert.equal(isPrivateOrLocalIp("8.8.8.8"), false);
  assert.equal(isPrivateOrLocalIp("2606:4700:4700::1111"), false);
});

test("expands maps.app.goo.gl through a validated redirect", async () => {
  const fetchImpl = async () => new Response(null, { status: 302, headers: { location: "https://www.google.com/maps/place/Fake+Hospital/@1.2,3.4,15z" } });
  const result = await resolveMapsLink("https://maps.app.goo.gl/FAKE", { fetchImpl, resolveHost: async () => ["8.8.8.8"] });
  assert.equal(result.name, "Fake Hospital");
  assert.equal(result.originalUrl, "https://maps.app.goo.gl/FAKE");
});

test("rejects redirect-domain escapes and private DNS targets", async () => {
  const escapeFetch = async () => new Response(null, { status: 302, headers: { location: "https://example.test/private" } });
  await assert.rejects(
    resolveMapsLink("https://maps.app.goo.gl/FAKE", { fetchImpl: escapeFetch, resolveHost: async () => ["8.8.8.8"] }),
    (error) => error.code === "unsafe_redirect",
  );
  await assert.rejects(
    resolveMapsLink("https://maps.app.goo.gl/FAKE", { fetchImpl: escapeFetch, resolveHost: async () => ["127.0.0.1"] }),
    (error) => error.code === "unsafe_target",
  );
});

test("enforces redirect and response-size limits", async () => {
  const loopFetch = async () => new Response(null, { status: 302, headers: { location: "https://maps.app.goo.gl/FAKE" } });
  await assert.rejects(
    resolveMapsLink("https://maps.app.goo.gl/FAKE", { fetchImpl: loopFetch, resolveHost: async () => ["8.8.8.8"], maxRedirects: 1 }),
    (error) => error.code === "too_many_redirects",
  );
  const largeFetch = async () => new Response(null, { status: 200, headers: { "content-length": "70000" } });
  await assert.rejects(
    resolveMapsLink("https://maps.app.goo.gl/FAKE", { fetchImpl: largeFetch, resolveHost: async () => ["8.8.8.8"] }),
    (error) => error.code === "response_too_large",
  );
});
