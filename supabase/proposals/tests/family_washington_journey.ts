import assert from "node:assert/strict";
import test from "node:test";
import {
  DENSITY_BANDS,
  DIRECTORY_MATCH_LABEL,
  DSHS_LOCATOR_URL,
  HOMEPAGE_DIRECTORY_NOTE,
  densityColor,
  dshsDisclosureUrl,
  facilityProfilePath,
  invalidZipMessage,
  mapResultSummary,
  mappedCapacityNote,
  recordedCapacityText,
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

test("official links stay on the DSHS locator and disclosure pages", () => {
  assert.equal(DSHS_LOCATOR_URL, "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHAdvLookup.aspx");
  assert.equal(dshsDisclosureUrl("100001"), "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHServices.aspx?ref=adv&Lic=100001");
  assert.equal(dshsDisclosureUrl(" 100001 "), "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHServices.aspx?ref=adv&Lic=100001");
  assert.equal(dshsDisclosureUrl("ABC109"), null);
  assert.equal(dshsDisclosureUrl(""), null);
  assert.equal(DIRECTORY_MATCH_LABEL.includes("Independently verified"), false);
  assert.equal(DIRECTORY_MATCH_LABEL.includes("license-number match"), true);
});

test("recorded capacity is not labeled as current residents or unavailable beds", () => {
  assert.equal(recordedCapacityText(6), "6");
  assert.equal(recordedCapacityText(6).includes("residents"), false);
  assert.equal(recordedCapacityText(null), "Not available");
  assert.equal(mappedCapacityNote({ ready: false, missing: 0 }), "");
  assert.equal(mappedCapacityNote({ ready: true, missing: 0 }), "Recorded for every mapped home");
  assert.equal(mappedCapacityNote({ ready: true, missing: 2 }), "2 home(s) missing capacity");
  assert.equal(mappedCapacityNote({ ready: true, missing: 0 }).includes("Not available beds"), false);
});

test("the concentration legend uses the same colors as the markers", () => {
  assert.equal(densityColor(25), DENSITY_BANDS[0].color);
  assert.equal(densityColor(12), DENSITY_BANDS[1].color);
  assert.equal(densityColor(7), DENSITY_BANDS[2].color);
  assert.equal(densityColor(2), DENSITY_BANDS[3].color);
  assert.equal(DENSITY_BANDS[2].color, "#eab308");
});
