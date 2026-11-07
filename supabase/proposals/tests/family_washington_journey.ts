import assert from "node:assert/strict";
import test from "node:test";
import {
  DENSITY_BANDS,
  HOMEPAGE_DIRECTORY_NOTE,
  densityColor,
  facilityProfilePath,
  invalidZipMessage,
  mapResultSummary,
  stateFilterStatus,
} from "../../../lib/family-journey.ts";

test("only a numeric license opens a facility profile", () => {
  assert.equal(facilityProfilePath("100001"), "/washington/100001");
  assert.equal(facilityProfilePath(" 100001 "), "/washington/100001");
  assert.equal(facilityProfilePath("ABC109"), null);
  assert.equal(facilityProfilePath("   "), null);
  assert.equal(facilityProfilePath(null), null);
});

test("the homepage empty state is announced and Washington listings are not described as absent", () => {
  assert.equal(stateFilterStatus(0), "No matching states found.");
  assert.equal(stateFilterStatus(1), "");
  assert.equal(HOMEPAGE_DIRECTORY_NOTE.includes("not yet displayed"), false);
  assert.equal(HOMEPAGE_DIRECTORY_NOTE.includes("Washington"), true);
  assert.equal(HOMEPAGE_DIRECTORY_NOTE.includes("labels only"), true);
});

test("an invalid ZIP does not describe the current map as unavailable", () => {
  const summary = mapResultSummary({ zip: "98056", loading: false, error: "", count: 4 });
  assert.equal(summary, "ZIP 98056 — 4 mapped AFHs");
  assert.equal(summary.includes("Data unavailable"), false);
  assert.equal(invalidZipMessage("98056"), "Enter a five-digit ZIP code. The map is still showing ZIP 98056.");
  assert.equal(mapResultSummary({ zip: "98056", loading: false, error: "Unable to retrieve facility map data.", count: 0 }).includes("Data unavailable"), true);
});

test("the concentration legend uses the same colors as the markers", () => {
  assert.equal(densityColor(25), DENSITY_BANDS[0].color);
  assert.equal(densityColor(12), DENSITY_BANDS[1].color);
  assert.equal(densityColor(7), DENSITY_BANDS[2].color);
  assert.equal(densityColor(2), DENSITY_BANDS[3].color);
  assert.equal(DENSITY_BANDS[2].color, "#eab308");
});
