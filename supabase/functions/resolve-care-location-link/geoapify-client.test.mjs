import assert from "node:assert/strict";
import test from "node:test";
import { normalizeFeature, placeDetails } from "./geoapify-client.ts";

test("normalizes Geoapify geometry and validates useful fields", () => {
  const value = normalizeFeature({ geometry: { coordinates: [55.3, 25.2] }, properties: {
    place_id: "geo-1", name: "Hemo Clinic", formatted: "1 Clinic Road", categories: ["healthcare.clinic"], website: "https://clinic.example",
  } });
  assert.deepEqual(value, { id: "geo-1", name: "Hemo Clinic", address: "1 Clinic Road", lat: 25.2, lng: 55.3, phone: null, website: "https://clinic.example", categories: ["healthcare.clinic"], countryCode: null });
  assert.equal(normalizeFeature({ properties: null }), null);
});

test("requests Place Details by selected id", async () => {
  let requested;
  const result = await placeDetails("geo/1", "secret", async (url) => {
    requested = url;
    return new Response(JSON.stringify({ features: [{ geometry: { coordinates: [1, 2] }, properties: { place_id: "geo/1", phone: "+1 555 0100" } }] }), { status: 200 });
  });
  assert.match(requested, /place-details\?id=geo%2F1&apiKey=secret/);
  assert.equal(result.phone, "+1 555 0100");
});

