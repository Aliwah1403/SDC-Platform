import assert from "node:assert/strict";
import test from "node:test";
import { chooseFacilityCandidate, distanceMeters, scoreFacilityCandidate } from "./facility-candidate-score.mjs";

const parsed = { name: "Hemo Clinic", lat: 25.2, lng: 55.3 };
const clinic = { id: "place-1", name: "Hemo Clinic", lat: 25.201, lng: 55.301, categories: ["healthcare.clinic"] };

test("scores nearby healthcare candidate strongly", () => {
  const scored = scoreFacilityCandidate(parsed, clinic);
  assert.ok(scored.score >= 0.85);
  assert.equal(scored.hardConflict, false);
  assert.ok(distanceMeters(parsed.lat, parsed.lng, clinic.lat, clinic.lng) < 200);
});

test("hard-conflicts non-healthcare and distant candidates", () => {
  assert.equal(scoreFacilityCandidate(parsed, { ...clinic, categories: ["tourism.hotel"] }).hardConflict, true);
  assert.equal(scoreFacilityCandidate(parsed, { ...clinic, lat: 30, lng: 40 }).hardConflict, true);
});

test("uses review/manual bands instead of silently merging ambiguity", () => {
  const result = chooseFacilityCandidate({ name: "Clinic", lat: 25.2, lng: 55.3 }, [
    { ...clinic, name: "Clinic A" },
    { ...clinic, id: "place-2", name: "Clinic B", lat: 25.2011, lng: 55.3011 },
  ]);
  assert.ok(["review", "manual"].includes(result.decision));
  assert.notEqual(result.decision, "strong_candidate");
});

test("keeps an exact healthcare pin as review when the Maps link has no name", () => {
  const result = chooseFacilityCandidate(
    { lat: 25.2, lng: 55.3, name: null, address: null },
    [{ id: "a", lat: 25.2, lng: 55.3, name: "Nearby Hospital", categories: ["healthcare.hospital"] }],
  );
  assert.equal(result.decision, "review");
  assert.equal(result.selected.candidate.id, "a");
});

test("rejects a candidate in a conflicting country", () => {
  const result = scoreFacilityCandidate(
    { lat: 25.2, lng: 55.3, name: "Example Hospital", countryCode: "AE" },
    { lat: 25.2, lng: 55.3, name: "Example Hospital", countryCode: "GB", categories: ["healthcare.hospital"] },
  );
  assert.equal(result.hardConflict, true);
  assert.ok(result.reasons.includes("country_conflict"));
});
