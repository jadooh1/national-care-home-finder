import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyCaliforniaGisFacilityType,
  reconcileCaliforniaCclGis,
} from "../../../lib/california-ccl-reconciliation.ts";

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
  assert.deepEqual(result.leadingZeroRepresentationMismatches, []);
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
  assert.deepEqual(result.leadingZeroRepresentationMismatches, ["0012"]);
});

test("leading-zero GIS integer truncation is reported without becoming a match", () => {
  const result = reconcileCaliforniaCclGis(
    [{ facility_number: "015601302", facility_status: "LICENSED" },
      { facility_number: "100400070", facility_status: "LICENSED" }],
    [{ FAC_NBR: 15601302, STATUS: 3, FAC_TYPE_DESC: "RESIDENTIAL-ELDERLY", FAC_LATITUDE: "37.5", FAC_LONGITUDE: "-122.0" },
      { FAC_NBR: 100400070, STATUS: 3, FAC_TYPE_DESC: "RESIDENTIAL-ELDERLY", FAC_LATITUDE: "36.7", FAC_LONGITUDE: "-119.7" }],
  );
  assert.equal(result.matchedLicenses, 1);
  assert.deepEqual(result.missingFromGis, ["015601302"]);
  assert.deepEqual(result.leadingZeroRepresentationMismatches, ["015601302"]);
  assert.equal(result.currentLicenseStatusVerified, false);
  assert.equal(result.publication, "unpublished");
});

test("GIS facility-type prefixes classify RCFE/ARF-like rows without accepting STATUS", () => {
  assert.equal(classifyCaliforniaGisFacilityType("RESIDENTIAL-ELDERLY "), "rcfe-like");
  assert.equal(classifyCaliforniaGisFacilityType("RESIDENTIAL ELDERLY-"), "rcfe-like");
  assert.equal(classifyCaliforniaGisFacilityType("ADULT RESIDENTIAL   "), "arf-like");
  assert.equal(classifyCaliforniaGisFacilityType("ARF-ENHANCED BEHAVIO"), "arf-like");
  assert.equal(classifyCaliforniaGisFacilityType("ARFPSHN"), "arf-like");
  assert.equal(classifyCaliforniaGisFacilityType("COMMUNITY CRISIS HOM"), "arf-like");
  assert.equal(classifyCaliforniaGisFacilityType("DAY CARE CENTER"), "other");
  assert.equal(classifyCaliforniaGisFacilityType("ENHANCED BEHAVIORAL SUPPORTS HOME - GH"), "other");
});

test("empty inputs stay unpublished and do not invent facility counts", () => {
  const result = reconcileCaliforniaCclGis([], []);
  assert.equal(result.historicalRows, 0);
  assert.equal(result.gisRows, 0);
  assert.deepEqual(result.missingFromGis, []);
  assert.deepEqual(result.leadingZeroRepresentationMismatches, []);
  assert.equal(result.currentLicenseStatusVerified, false);
  assert.equal(result.publication, "unpublished");
});
