import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  CALIFORNIA_CONTRACT_SOURCE,
  CALIFORNIA_FIELD_ASSESSMENT,
  OREGON_CONTRACT_SOURCE,
  OREGON_FIELD_ASSESSMENT,
  WASHINGTON_FIELD_ASSESSMENT,
  facilityContractViolations,
  washingtonFacilityRecord,
  type FacilityDataRecord,
} from "../../../lib/facility-data-contract.ts";
import { ENABLED_OWNER_FACILITY_STATES } from "../../../lib/owner-facility-read.ts";
import { CALIFORNIA_CDSS_DATASET_URL } from "../../../lib/state-source-validation.ts";
import {
  OREGON_ODHS_PROVIDER_SEARCH,
  OREGON_SOURCE_RETRIEVED_ON,
  WASHINGTON_DSHS_LOCATOR,
  WASHINGTON_SOURCE_RETRIEVED_ON,
  directoryContract,
  washingtonDisclosureUrl,
} from "../../../lib/state-directory.ts";

function washingtonRow(overrides: Partial<FacilityDataRecord> = {}): FacilityDataRecord {
  return {
    ...washingtonFacilityRecord({
      id: "00000000-0000-4000-8000-000000000101",
      canonical_name: "Listed home",
      address_line1: "1 Published Street",
      city: "Kent",
      county: "King",
      state_code: "WA",
      postal_code: "98056",
      license_number: "100001",
      record_status: "source_matched",
      latitude: 47.5,
      longitude: -122.2,
    }),
    ...overrides,
  };
}

test("a Washington listed row keeps its current fields and disclosure link", () => {
  const record = washingtonFacilityRecord({
    id: "00000000-0000-4000-8000-000000000101",
    canonical_name: "Listed home",
    address_line1: "1 Published Street",
    city: "Kent",
    county: "King",
    state_code: "WA",
    postal_code: "98056",
    license_number: "100001",
    record_status: "source_matched",
    latitude: 47.5,
    longitude: -122.2,
  });
  assert.equal(record.facilityId, "00000000-0000-4000-8000-000000000101");
  assert.equal(record.stateCode, "WA");
  assert.equal(record.name, "Listed home");
  assert.deepEqual(record.address, {
    line1: "1 Published Street",
    city: "Kent",
    county: "King",
    postalCode: "98056",
  });
  assert.equal(record.licenseNumber, "100001");
  assert.equal(record.status, "source_matched");
  assert.equal(record.source.sourceName, "wa_dshs_afh");
  assert.equal(record.source.sourceUrl, WASHINGTON_DSHS_LOCATOR);
  assert.equal(record.source.exportDate, WASHINGTON_SOURCE_RETRIEVED_ON);
  assert.equal(record.disclosureUrl, washingtonDisclosureUrl("100001"));
  assert.equal(record.publication, "public");
  assert.equal(record.ownerClaimEligible, true);
  assert.deepEqual(facilityContractViolations([record]), []);
  assert.deepEqual(WASHINGTON_FIELD_ASSESSMENT.recordedGaps, []);
});

test("a listed row without coordinates records them unavailable and does not invent them", () => {
  const listed = washingtonFacilityRecord({
    id: "00000000-0000-4000-8000-000000000101",
    canonical_name: "Listed home",
    address_line1: "1 Published Street",
    city: "Kent",
    county: "King",
    state_code: "WA",
    postal_code: "98056",
    license_number: "100001",
    record_status: "source_matched",
  });
  assert.deepEqual(listed.coordinates, { latitude: null, longitude: null });
  assert.deepEqual(facilityContractViolations([listed]), ["unavailable-coordinates"]);
  assert.equal(listed.publication, "public");
});

test("missing addresses, duplicate licenses, invalid states, and unavailable coordinates are reported", () => {
  const missingAddress = washingtonRow({
    address: { line1: null, city: "Kent", county: "King", postalCode: "98056" },
  });
  const first = washingtonRow();
  const duplicate = washingtonRow({ facilityId: "00000000-0000-4000-8000-000000000104" });
  const otherState = washingtonRow({
    stateCode: "CA",
    publication: "unpublished",
    ownerClaimEligible: false,
    licenseNumber: "100001",
  });
  const invalid = washingtonRow({ stateCode: "WASHINGTON", publication: "unpublished", ownerClaimEligible: false });
  const partialCoordinates = washingtonRow({ coordinates: { latitude: 47.5, longitude: null } });
  const claimedCalifornia = washingtonRow({
    stateCode: "CA",
    publication: "public",
    ownerClaimEligible: true,
    licenseNumber: "300001",
  });

  assert.equal(facilityContractViolations([missingAddress]).includes("missing-address"), true);
  assert.equal(missingAddress.address.line1, null);
  assert.deepEqual(facilityContractViolations([first, duplicate]), ["duplicate-license"]);
  assert.deepEqual(facilityContractViolations([first, otherState]), []);
  assert.equal(facilityContractViolations([invalid]).includes("invalid-state-code"), true);
  assert.equal(facilityContractViolations([washingtonRow({ stateCode: "XX", publication: "unpublished", ownerClaimEligible: false })]).includes("invalid-state-code"), true);
  assert.equal(facilityContractViolations([partialCoordinates]).includes("unavailable-coordinates"), true);
  assert.deepEqual(facilityContractViolations([claimedCalifornia]), [
    "owner-claim-outside-washington",
    "publication-outside-washington",
  ]);
  assert.deepEqual(facilityContractViolations([
    washingtonRow({ licenseNumber: " " }),
    washingtonRow({ facilityId: "00000000-0000-4000-8000-000000000104", licenseNumber: "" }),
  ]), []);
});

test("California and Oregon gaps stay explicit and both states stay ineligible", () => {
  assert.equal(CALIFORNIA_FIELD_ASSESSMENT.address, "not-accepted");
  assert.equal(CALIFORNIA_FIELD_ASSESSMENT.license, "not-accepted");
  assert.equal(CALIFORNIA_FIELD_ASSESSMENT.status, "unreliable");
  assert.equal(CALIFORNIA_FIELD_ASSESSMENT.disclosureLink, "unreliable");
  assert.equal(CALIFORNIA_FIELD_ASSESSMENT.coordinates, "absent");
  assert.equal(CALIFORNIA_FIELD_ASSESSMENT.publication, "unpublished");
  assert.equal(CALIFORNIA_FIELD_ASSESSMENT.ownerClaimEligible, false);
  assert.equal(CALIFORNIA_CONTRACT_SOURCE.exportDate, null);
  assert.equal(CALIFORNIA_CONTRACT_SOURCE.sourceName, null);
  assert.equal(CALIFORNIA_CONTRACT_SOURCE.sourceUrl, CALIFORNIA_CDSS_DATASET_URL);
  assert.equal(CALIFORNIA_FIELD_ASSESSMENT.recordedGaps.includes("profile-url-is-not-adopted"), true);
  assert.equal(CALIFORNIA_FIELD_ASSESSMENT.recordedGaps.includes("open-data-has-no-coordinate-columns"), true);

  assert.equal(OREGON_FIELD_ASSESSMENT.facilityId, "absent");
  assert.equal(OREGON_FIELD_ASSESSMENT.address, "absent");
  assert.equal(OREGON_FIELD_ASSESSMENT.license, "absent");
  assert.equal(OREGON_FIELD_ASSESSMENT.coordinates, "absent");
  assert.equal(OREGON_FIELD_ASSESSMENT.publication, "unpublished");
  assert.equal(OREGON_FIELD_ASSESSMENT.ownerClaimEligible, false);
  assert.equal(OREGON_CONTRACT_SOURCE.exportDate, OREGON_SOURCE_RETRIEVED_ON);
  assert.equal(OREGON_CONTRACT_SOURCE.sourceUrl, OREGON_ODHS_PROVIDER_SEARCH);
  assert.equal(OREGON_FIELD_ASSESSMENT.recordedGaps.includes("public-license-number-is-absent"), true);
  assert.equal(OREGON_FIELD_ASSESSMENT.recordedGaps.includes("street-address-is-not-an-accepted-public-field"), true);

  assert.deepEqual(ENABLED_OWNER_FACILITY_STATES, ["WA"]);
  assert.equal(washingtonRow().ownerClaimEligible, ENABLED_OWNER_FACILITY_STATES.includes("WA"));
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.equal(directoryContract("Oregon")?.publication, "development");
  assert.equal(directoryContract("California")?.publication, "unpublished");
  assert.equal(directoryContract("Oregon")?.mapPath, null);
  assert.equal(directoryContract("California")?.directoryPath, null);
});

test("the contract does not change Design 2 or add a migration", () => {
  const home = readFileSync(new URL("../../../lib/copy/home.ts", import.meta.url), "utf8");
  const page = readFileSync(new URL("../../../app/page.tsx", import.meta.url), "utf8");
  const proposal = readFileSync(new URL("../20261114003000_facility_data_contract.md", import.meta.url), "utf8");
  assert.equal(home.includes("Find the right care home for your loved one."), true);
  assert.equal(page.includes("{t.heading}"), true);
  assert.equal(proposal.includes("does not add a table"), true);
  assert.equal(proposal.includes("No other state becomes public"), true);
});
