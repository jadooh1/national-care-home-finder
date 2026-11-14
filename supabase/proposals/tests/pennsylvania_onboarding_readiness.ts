import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { facilityContractViolations } from "../../../lib/facility-data-contract.ts";
import { PENNSYLVANIA_PUBLICATION_REQUIREMENTS, onboardingProfile } from "../../../lib/nationwide-onboarding.ts";
import {
  PENNSYLVANIA_GEOREFERENCE_ACCURACY,
  PENNSYLVANIA_OPTIONAL_GAPS,
  PENNSYLVANIA_PUBLICATION_BLOCKERS,
  pennsylvaniaCoordinateSuitableForMap,
  pennsylvaniaOnboardingRecord,
} from "../../../lib/pennsylvania-onboarding-readiness.ts";
import {
  PENNSYLVANIA_DATASET_URL,
  PENNSYLVANIA_OFFICIAL_VALIDATION,
  usablePennsylvaniaStreet,
  pennsylvaniaDirectoryReady,
  pennsylvaniaMapReady,
} from "../../../lib/pennsylvania-licensing.ts";
import { directoryContract } from "../../../lib/state-directory.ts";

const OBSERVED = PENNSYLVANIA_OFFICIAL_VALIDATION;

test("the recorded Pennsylvania file still has 989 rows and 13 unusable streets", () => {
  assert.equal(OBSERVED.rows, 989);
  assert.equal(OBSERVED.usableStreetRows, 976);
  assert.equal(OBSERVED.letterOnlyStreetRows, 13);
  assert.equal(OBSERVED.letterOnlyWithAdditionalText, 6);
  assert.equal(OBSERVED.letterOnlyNamedStreetWithoutNumber, 7);
  assert.equal(OBSERVED.licenseNumberColumn, false);
  assert.equal(OBSERVED.statusColumn, false);
  assert.equal(OBSERVED.publicationEligibleRows, 0);
  assert.equal(OBSERVED.licensingCoordinateRows, 0);
  assert.equal(OBSERVED.georeferencedRows, 989);
});

test("a source row keeps its original values and does not become a published facility", () => {
  const letterOnly = pennsylvaniaOnboardingRecord({
    objectId: "100001",
    name: "Example Home",
    street: "OAK LANE",
    streetAdditional: "12 BUILDING A",
    city: "Reading",
    zip: "19605",
    state: "PA",
    latitude: 40.3,
    longitude: -75.9,
    accuracy: "5",
  });
  assert.equal(letterOnly.facilityId, null);
  assert.equal(letterOnly.sourceRecordId, "100001");
  assert.equal(letterOnly.licenseNumber, null);
  assert.equal(letterOnly.status, null);
  assert.equal(letterOnly.originalStreet, "OAK LANE");
  assert.equal(letterOnly.originalStreetAdditional, "12 BUILDING A");
  assert.equal(letterOnly.addressLine1, null);
  assert.equal(letterOnly.addressLine1, usablePennsylvaniaStreet("OAK LANE"));
  assert.equal(letterOnly.exportDate, null);
  assert.equal(letterOnly.disclosureUrl, null);
  assert.equal(letterOnly.publicationEligible, false);
  assert.equal(letterOnly.ownerClaimEligible, false);
  assert.equal(letterOnly.publication, "unpublished");
  assert.equal(letterOnly.sourceUrl, PENNSYLVANIA_DATASET_URL);
  const numbered = pennsylvaniaOnboardingRecord({
    objectId: "100002",
    name: "Numbered Home",
    street: "12 Oak Lane",
    streetAdditional: "",
    city: "Reading",
    zip: "19605",
    state: "PA",
    latitude: 40.3,
    longitude: -75.9,
    accuracy: "4",
  });
  assert.equal(numbered.addressLine1, "12 Oak Lane");
  assert.equal(numbered.publicationEligible, false);
  assert.equal(facilityContractViolations([{
    facilityId: numbered.facilityId,
    stateCode: numbered.stateCode,
    name: numbered.name,
    address: { line1: numbered.addressLine1, city: numbered.city, county: null, postalCode: numbered.postalCode },
    licenseNumber: numbered.licenseNumber,
    status: numbered.status,
    source: { sourceName: null, sourceUrl: numbered.sourceUrl, exportDate: numbered.exportDate },
    disclosureUrl: numbered.disclosureUrl,
    coordinates: { latitude: null, longitude: null },
    publication: "public",
    ownerClaimEligible: true,
  }]).includes("publication-outside-washington"), true);
});

test("georeferenced points are not suitable for a Pennsylvania map", () => {
  assert.equal(OBSERVED.accuracyInterpolated, 975);
  assert.equal(OBSERVED.accuracyStreetCentroid, 4);
  assert.equal(OBSERVED.accuracyZip4Centroid, 2);
  assert.equal(OBSERVED.accuracyZipCentroid, 7);
  assert.equal(OBSERVED.accuracyIntersection, 1);
  for (const code of Object.keys(PENNSYLVANIA_GEOREFERENCE_ACCURACY)) {
    assert.equal(pennsylvaniaCoordinateSuitableForMap(code), false);
  }
  const record = pennsylvaniaOnboardingRecord({
    objectId: "100003",
    name: "Mapped Home",
    street: "4 Main Street",
    streetAdditional: "",
    city: "Reading",
    zip: "19605",
    state: "PA",
    latitude: 40.3,
    longitude: -75.9,
    accuracy: "5",
  });
  assert.deepEqual(record.georeferenced, { latitude: 40.3, longitude: -75.9, accuracy: "5" });
  assert.equal(record.licensingCoordinates, null);
  assert.equal(record.mapSuitable, false);
  assert.equal(pennsylvaniaMapReady(), false);
  assert.equal(pennsylvaniaDirectoryReady(), false);
});

test("publication blockers stay closed and Pennsylvania stays unpublished", () => {
  for (const requirement of PENNSYLVANIA_PUBLICATION_REQUIREMENTS) {
    assert.equal(PENNSYLVANIA_PUBLICATION_BLOCKERS.includes(requirement.blocker), true);
  }
  assert.equal(PENNSYLVANIA_PUBLICATION_BLOCKERS.includes("georeferenced-coordinates-are-not-licensing-coordinates"), true);
  assert.equal(PENNSYLVANIA_OPTIONAL_GAPS.includes("phone-and-capacity-fields-are-not-accepted"), true);
  assert.equal(PENNSYLVANIA_PUBLICATION_BLOCKERS.includes("phone-and-capacity-fields-are-not-accepted"), false);
  assert.equal(onboardingProfile("Pennsylvania").publication, "unpublished");
  assert.equal(directoryContract("Pennsylvania")?.directoryPath, null);
  assert.equal(directoryContract("Pennsylvania")?.mapPath, null);
  assert.equal(directoryContract("Washington")?.publication, "public");
  const home = readFileSync(new URL("../../../lib/copy/home.ts", import.meta.url), "utf8");
  const proposal = readFileSync(new URL("../20261114033000_pennsylvania_onboarding_readiness.md", import.meta.url), "utf8");
  assert.equal(home.includes("Find the right care home for your loved one."), true);
  assert.equal(proposal.includes("They are not suitable for a Pennsylvania map."), true);
  assert.equal(proposal.includes("does not download that file again"), true);
});
