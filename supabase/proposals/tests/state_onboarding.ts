import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  CALIFORNIA_CANDIDATE_FACILITY_TYPES,
  CALIFORNIA_CCLD_DATASET_URL,
  CALIFORNIA_OPEN_DATA_FIELDS,
  CALIFORNIA_OUT_OF_SCOPE_RESOURCES,
  acceptedExportDate,
  candidateMapReady,
  candidateRefreshReady,
  onboardingDecision,
  withheldCaliforniaFields,
} from "../../../lib/state-onboarding.ts";
import { directoryContract, mapHref, oregonRefreshReady } from "../../../lib/state-directory.ts";
import { verifiedSourceDate } from "../../../lib/state-refresh.ts";

test("Oregon map and refresh stay closed", () => {
  const decision = onboardingDecision("Oregon");
  assert.equal(decision.publication, "development");
  assert.equal(decision.coordinateColumns, false);
  assert.equal(decision.recordedExportDate, null);
  assert.equal(decision.mapEnabled, false);
  assert.equal(decision.refreshEnabled, false);
  assert.ok(decision.blockers.includes("accepted-provider-export-has-no-coordinate-columns"));
  assert.ok(decision.blockers.includes("gis-service-edit-time-is-not-an-export-date"));
  assert.equal(directoryContract("Oregon")?.mapPath, null);
  assert.equal(oregonRefreshReady(), false);
  assert.equal(candidateRefreshReady(), false);
});

test("a supplied date cannot open a candidate map without official columns and a recorded export date", () => {
  assert.equal(acceptedExportDate(null, "2026-11-09"), null);
  assert.equal(acceptedExportDate(null, "2026-11-09"), verifiedSourceDate(null, "2026-11-09"));
  assert.equal(candidateMapReady({
    coordinateColumns: false,
    recordedExportDate: null,
    offeredExportDate: "2026-10-27",
    duplicateIds: [],
    blockers: onboardingDecision("Oregon").blockers,
  }), false);
  assert.equal(candidateMapReady({
    coordinateColumns: true,
    recordedExportDate: "2026-11-09",
    offeredExportDate: "2026-11-09",
    duplicateIds: [],
    blockers: [],
  }), true);
});

test("California stays unpublished and has no coordinate or disclosure adoption", () => {
  const decision = onboardingDecision("California");
  assert.equal(decision.publication, "unpublished");
  assert.equal(decision.mapEnabled, false);
  assert.equal(decision.refreshEnabled, false);
  assert.equal(decision.recordedExportDate, null);
  assert.equal(directoryContract("California")?.publication, "unpublished");
  assert.equal(directoryContract("California")?.directoryPath, null);
  assert.equal(mapHref("California"), null);
  assert.equal(CALIFORNIA_OPEN_DATA_FIELDS.includes("facility_address"), true);
  assert.equal(CALIFORNIA_OPEN_DATA_FIELDS.some(field => /lat|lon/i.test(field)), false);
  assert.deepEqual(withheldCaliforniaFields(CALIFORNIA_OPEN_DATA_FIELDS), [
    "licensee",
    "facility_administrator",
    "facility_telephone_number",
    "facility_address",
  ]);
  assert.deepEqual(CALIFORNIA_CANDIDATE_FACILITY_TYPES, [
    "Residential Care Facilities for the Elderly",
    "Adult Residential Facilities",
  ]);
  assert.ok(CALIFORNIA_OUT_OF_SCOPE_RESOURCES.includes("Child Care Centers"));
  assert.equal(CALIFORNIA_CCLD_DATASET_URL, "https://data.chhs.ca.gov/dataset/ccl-facilities");
});

test("Washington directory and map remain the public contract", () => {
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.equal(directoryContract("Washington")?.directoryPath, "/washington");
  assert.equal(mapHref("Washington"), "/washington/map");
});

test("onboarding does not fetch or write records", () => {
  const source = readFileSync(new URL("../../../lib/state-onboarding.ts", import.meta.url), "utf8");
  assert.equal(source.includes("supabase"), false);
  assert.equal(source.includes("fetch("), false);
  assert.equal(source.includes("insert"), false);
});
