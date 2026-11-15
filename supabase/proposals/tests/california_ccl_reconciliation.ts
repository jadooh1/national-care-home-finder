import assert from "node:assert/strict";
import test from "node:test";
import { reconcileCaliforniaCclGis } from "../../../lib/california-ccl-reconciliation.ts";

test("reconciles identifiers without inferring numeric GIS status meanings", () => {
  const result = reconcileCaliforniaCclGis(
    [{ facility_number: " 123 ", facility_status: "LICENSED" },
      { facility_number: "456", facility_status: "CLOSED" },
      { facility_number: "456", facility_status: "LICENSED" }],
    [{ FAC_NBR: 123, STATUS: 1, FAC_TYPE_DESC: "RESIDENTIAL CARE ELDERLY", FAC_LATITUDE: "38.5", FAC_LONGITUDE: "-121.5" },
      { FAC_NBR: 789, STATUS: 2, FAC_TYPE_DESC: "ADULT RESIDENTIAL", FAC_LATITUDE: "0", FAC_LONGITUDE: "-121.5" },
      { FAC_NBR: 789, STATUS: null, FAC_TYPE_DESC: null, FAC_LATITUDE: null, FAC_LONGITUDE: null },
      { FAC_NBR: null, STATUS: null, FAC_TYPE_DESC: null, FAC_LATITUDE: "91", FAC_LONGITUDE: "-121" }],
  );
  assert.equal(result.matchedLicenses, 1);
  assert.deepEqual(result.missingFromGis, ["456"]);
  assert.deepEqual(result.gisOnly, ["789"]);
  assert.deepEqual(result.duplicateHistorical, ["456"]);
  assert.deepEqual(result.duplicateGis, ["789"]);
  assert.equal(result.invalidGisIdentifiers, 1);
  assert.equal(result.missingGisCoordinates, 1);
  assert.equal(result.invalidGisCoordinates, 2);
  assert.equal(result.statusConflicts, null);
  assert.equal(result.currentLicenseStatusVerified, false);
  assert.equal(result.publication, "unpublished");
  assert.equal(result.ownerClaimEligible, false);
});

test("rejects malformed identifiers without guessing a match", () => {
  const result = reconcileCaliforniaCclGis(
    [{ facility_number: "A-12", facility_status: "LICENSED" }, { facility_number: "0012", facility_status: "LICENSED" }],
    [{ FAC_NBR: 12, STATUS: 1, FAC_TYPE_DESC: null, FAC_LATITUDE: "37", FAC_LONGITUDE: "-122" }],
  );
  assert.equal(result.historicalDistinctLicenses, 1);
  assert.equal(result.matchedLicenses, 0);
  assert.deepEqual(result.missingFromGis, ["0012"]);
  assert.deepEqual(result.gisOnly, ["12"]);
});

test("empty inputs stay unpublished and do not invent facility counts", () => {
  const result = reconcileCaliforniaCclGis([], []);
  assert.equal(result.historicalRows, 0);
  assert.equal(result.gisRows, 0);
  assert.deepEqual(result.missingFromGis, []);
  assert.equal(result.currentLicenseStatusVerified, false);
  assert.equal(result.publication, "unpublished");
});
