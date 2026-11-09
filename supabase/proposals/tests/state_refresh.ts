import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ODHS_EXPORT_HEADER } from "../../../lib/oregon-odhs-roster.ts";
import { OREGON_SOURCE_RETRIEVED_ON, WASHINGTON_SOURCE_RETRIEVED_ON, oregonRefreshReady } from "../../../lib/state-directory.ts";
import {
  assessStateRefresh,
  classifyCoordinate,
  duplicateSourceIds,
  headerHasOfficialCoordinates,
  verifiedSourceDate,
} from "../../../lib/state-refresh.ts";

const WASHINGTON_HEADER = [
  "LicenseNumber",
  "FacilityName",
  "LocationAddress",
  "LocationCity",
  "LocationCounty",
  "LocationZipCode",
  "LicensedBedCount",
  "FacilityStatus",
  "Latitude",
  "Longitude",
];

test("an unrecorded source date cannot be supplied later", () => {
  assert.equal(verifiedSourceDate(null, null), null);
  assert.equal(verifiedSourceDate(null, "2026-11-09"), null);
  assert.equal(verifiedSourceDate(WASHINGTON_SOURCE_RETRIEVED_ON, "2026-11-01"), null);
  assert.equal(verifiedSourceDate(WASHINGTON_SOURCE_RETRIEVED_ON, WASHINGTON_SOURCE_RETRIEVED_ON), "2026-11-09");
  assert.equal(OREGON_SOURCE_RETRIEVED_ON, null);
});

test("duplicate source ids are reported once and sorted", () => {
  assert.deepEqual(duplicateSourceIds(["100", "200", "100", "50", "50"]), ["100", "50"].sort());
  assert.deepEqual(duplicateSourceIds(["100", "200"]), []);
});

test("the official Oregon export has no coordinate columns", () => {
  assert.equal(headerHasOfficialCoordinates(ODHS_EXPORT_HEADER), false);
  assert.equal(headerHasOfficialCoordinates(WASHINGTON_HEADER), true);
  assert.equal(ODHS_EXPORT_HEADER.includes("Address"), true);
  assert.equal(ODHS_EXPORT_HEADER.includes("Latitude"), false);
});

test("coordinates are validated only inside the named state", () => {
  assert.equal(classifyCoordinate("Oregon", "", ""), "absent");
  assert.equal(classifyCoordinate("Oregon", null, null), "absent");
  assert.equal(classifyCoordinate("Oregon", "44.9429", "-123.0351"), "valid");
  assert.equal(classifyCoordinate("Oregon", "47.6062", "-122.3321"), "invalid");
  assert.equal(classifyCoordinate("Washington", "47.6062", "-122.3321"), "valid");
  assert.equal(classifyCoordinate("Oregon", "44.9429", ""), "invalid");
  assert.equal(classifyCoordinate("Oregon", "not-a-point", "-123.0351"), "invalid");
});

test("Oregon stays unmapped and unrefreshed while its source date is absent", () => {
  const audit = assessStateRefresh({
    state: "Oregon",
    recordedRetrievedOn: OREGON_SOURCE_RETRIEVED_ON,
    offeredRetrievedOn: "2026-11-09",
    header: ODHS_EXPORT_HEADER,
    sourceIds: ["0000000183", "0000000183", "529480"],
    coordinates: [{ latitude: "44.9429", longitude: "-123.0351" }],
  });
  assert.equal(audit.retrievedOn, null);
  assert.deepEqual(audit.duplicateIds, ["0000000183"]);
  assert.equal(audit.coordinateStatus, "absent");
  assert.equal(audit.mapReady, false);
  assert.equal(audit.refreshReady, false);
  assert.equal(audit.written, false);
  assert.equal(oregonRefreshReady(), false);
});

test("a complete official coordinate set can be mapped without turning refresh on", () => {
  const ready = assessStateRefresh({
    state: "Washington",
    recordedRetrievedOn: WASHINGTON_SOURCE_RETRIEVED_ON,
    offeredRetrievedOn: WASHINGTON_SOURCE_RETRIEVED_ON,
    header: WASHINGTON_HEADER,
    sourceIds: ["758500"],
    coordinates: [{ latitude: "47.6062", longitude: "-122.3321" }],
  });
  const partial = assessStateRefresh({
    state: "Washington",
    recordedRetrievedOn: WASHINGTON_SOURCE_RETRIEVED_ON,
    offeredRetrievedOn: WASHINGTON_SOURCE_RETRIEVED_ON,
    header: WASHINGTON_HEADER,
    sourceIds: ["758500", "756067"],
    coordinates: [
      { latitude: "47.6062", longitude: "-122.3321" },
      { latitude: "", longitude: "" },
    ],
  });
  assert.equal(ready.mapReady, true);
  assert.equal(ready.refreshReady, false);
  assert.equal(ready.written, false);
  assert.equal(partial.coordinateStatus, "invalid");
  assert.equal(partial.mapReady, false);
});

test("the refresh module does not persist an audit row or draw a map", () => {
  const source = readFileSync("lib/state-refresh.ts", "utf8");
  assert.equal(source.includes("supabase"), false);
  assert.equal(source.includes("insert"), false);
  assert.equal(source.includes("fetch("), false);
  assert.equal(readFileSync("app/oregon/page.tsx", "utf8").includes("/washington/map"), false);
  assert.equal(readFileSync("app/washington/page.tsx", "utf8").includes("WASHINGTON_DSHS_LOCATOR"), true);
});
