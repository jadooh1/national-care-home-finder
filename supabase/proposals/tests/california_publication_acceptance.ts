import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { californiaStreetUsable } from "../../../lib/california-authoritative-source.ts";
import { californiaDisclosureUrl } from "../../../lib/california-directory.ts";
import {
  CALIFORNIA_ARF_PUBLICATION_CATEGORIES,
  CALIFORNIA_FILE_EXPORT_DATE,
  CALIFORNIA_MANDATORY_UNRESOLVED,
  CALIFORNIA_OPTIONAL_PUBLICATION_GAPS,
  CALIFORNIA_RCFE_PUBLICATION_CATEGORIES,
  californiaPublicationAcceptance,
  type CaliforniaAcceptanceInput,
} from "../../../lib/california-publication-acceptance.ts";
import { mayRepresentCaliforniaRecordAsCurrentlyActive } from "../../../lib/california-publication-readiness.ts";
import {
  CALIFORNIA_ARF_ACCEPTED_CATEGORIES,
  CALIFORNIA_OPTIONAL_ENHANCEMENTS,
  CALIFORNIA_RCFE_ACCEPTED_CATEGORIES,
  CALIFORNIA_RECORDED_STATUS_CONFLICTS,
} from "../../../lib/california-source-readiness.ts";
import { reconcileCaliforniaStatus } from "../../../lib/california-status-reconciliation.ts";
import { directoryContract } from "../../../lib/state-directory.ts";

function ready(overrides: Partial<CaliforniaAcceptanceInput> = {}): CaliforniaAcceptanceInput {
  const facilityNumber = "12345678";
  return {
    file: "ARF",
    originalFacilityNumber: facilityNumber,
    liveFacilityNumber: facilityNumber,
    originalCategory: "ADULT RESIDENTIAL",
    liveFacilityType: "ADULT RESIDENTIAL",
    originalStatus: "LICENSED",
    liveStatus: "Licensed",
    liveHttpStatus: 200,
    identifierMatched: true,
    streetAddress: "1 Example Street",
    city: "Sacramento",
    zipCode: "95814",
    sourceDate: "2026-11-13",
    sourceDateProvenance: "authoritative-export",
    disclosureUrl: `https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/${facilityNumber}`,
    coordinatesPresent: false,
    ...overrides,
  };
}

test("a complete live row still fails closed without an authoritative export date", () => {
  const decision = californiaPublicationAcceptance(ready());
  assert.equal(decision.accepted, false);
  assert.equal(decision.acceptedLicense, null);
  assert.equal(decision.acceptedName, null);
  assert.equal(decision.acceptedAddress, null);
  assert.equal(decision.acceptedStatus, null);
  assert.equal(decision.exportDate, null);
  assert.deepEqual(decision.fieldFailures, ["authoritative-export-date"]);
  assert.deepEqual(decision.mandatoryUnresolved, [...CALIFORNIA_MANDATORY_UNRESOLVED]);
  assert.deepEqual(decision.optionalMissing, ["coordinates"]);
  assert.equal(decision.officialPageUrl, californiaDisclosureUrl("12345678"));
  assert.equal(CALIFORNIA_FILE_EXPORT_DATE, null);
  assert.equal(mayRepresentCaliforniaRecordAsCurrentlyActive({
    openDataStatus: "LICENSED",
    liveStatus: "Licensed",
    identifierMatched: true,
    httpStatus: 200,
  }), false);
});

test("recorded conflicts, placeholders, and inconclusive responses are not accepted", () => {
  for (const conflict of CALIFORNIA_RECORDED_STATUS_CONFLICTS) {
    const reconciled = reconcileCaliforniaStatus({
      openDataStatus: conflict.openDataStatus,
      httpStatus: 200,
      liveStatus: conflict.liveStatus,
      identifierMatched: true,
    });
    assert.equal(reconciled.classification, "conflict");
    const decision = californiaPublicationAcceptance(ready({
      file: conflict.file,
      originalCategory: conflict.file === "RCFE" ? "RESIDENTIAL CARE ELDERLY" : "ADULT RESIDENTIAL",
      liveFacilityType: conflict.file === "RCFE" ? "RESIDENTIAL CARE ELDERLY" : "ADULT RESIDENTIAL",
      originalStatus: conflict.openDataStatus,
      liveStatus: conflict.liveStatus,
    }));
    assert.equal(decision.accepted, false);
    assert.equal(decision.originals.status, "LICENSED");
    assert.equal(decision.originals.status, conflict.openDataStatus);
    assert.equal(decision.fieldFailures.includes("live-status-licensed"), true);
    assert.equal(decision.fieldFailures.includes("no-status-conflict"), true);
    assert.equal(decision.acceptedStatus, null);
  }

  const placeholder = californiaPublicationAcceptance(ready({ streetAddress: "Unavailable" }));
  assert.equal(placeholder.fieldFailures.includes("usable-street-address"), true);
  assert.equal(placeholder.acceptedAddress, null);
  assert.equal(placeholder.originals.streetAddress, "Unavailable");
  assert.equal(californiaStreetUsable("See FAQs"), false);
  assert.equal(californiaPublicationAcceptance(ready({ streetAddress: "See FAQs" })).fieldFailures.includes("usable-street-address"), true);
  assert.equal(californiaPublicationAcceptance(ready({ streetAddress: "   " })).fieldFailures.includes("usable-street-address"), true);

  const timedOut = californiaPublicationAcceptance(ready({ liveHttpStatus: null, liveStatus: null, identifierMatched: false }));
  assert.equal(timedOut.fieldFailures.includes("current-status-from-detail-api"), true);
  assert.equal(timedOut.accepted, false);
  const datastoreFailure = californiaPublicationAcceptance(ready({ liveHttpStatus: 500, liveStatus: null }));
  assert.equal(datastoreFailure.fieldFailures.includes("current-status-from-detail-api"), true);
  assert.equal(datastoreFailure.acceptedStatus, null);
});

test("bad identifiers, categories, dates, and links fail without using coordinates as a requirement", () => {
  assert.equal(californiaPublicationAcceptance(ready({ originalFacilityNumber: "01234567", liveFacilityNumber: "01234567" })).fieldFailures.includes("official-facility-identifier"), true);
  assert.equal(californiaPublicationAcceptance(ready({ originalFacilityNumber: "0", liveFacilityNumber: "0" })).officialIdentifier, null);
  assert.equal(californiaPublicationAcceptance(ready({
    originalCategory: "ADULT DAY PROGRAM",
    liveFacilityType: "ADULT DAY PROGRAM",
  })).fieldFailures.includes("accepted-category"), true);
  assert.equal(californiaPublicationAcceptance(ready({
    originalCategory: "",
    liveFacilityType: "",
    originalStatus: "9/2/1997",
    liveStatus: null,
    liveHttpStatus: null,
  })).fieldFailures.includes("accepted-category"), true);
  const licenseDate = californiaPublicationAcceptance(ready({
    sourceDate: "2026-11-13",
    sourceDateProvenance: "license-date",
  }));
  assert.equal(licenseDate.fieldFailures.includes("authoritative-export-date"), true);
  assert.equal(licenseDate.exportDate, null);
  assert.equal(licenseDate.originals.sourceDate, "2026-11-13");
  assert.equal(californiaPublicationAcceptance(ready({
    sourceDate: "05252025",
    sourceDateProvenance: "open-data-file-date",
  })).originals.sourceDate, "05252025");
  const wrongLink = californiaPublicationAcceptance(ready({ disclosureUrl: "https://www.ccld.dss.ca.gov/carefacilitysearch/" }));
  assert.equal(wrongLink.fieldFailures.includes("facility-specific-disclosure-link"), true);
  assert.equal(wrongLink.accepted, false);
  const withCoordinates = californiaPublicationAcceptance(ready({ coordinatesPresent: true }));
  assert.deepEqual(withCoordinates.optionalMissing, []);
  assert.equal(withCoordinates.fieldFailures.includes("coordinates"), false);
  assert.equal(withCoordinates.accepted, false);
  assert.deepEqual(CALIFORNIA_OPTIONAL_PUBLICATION_GAPS, ["coordinates"]);
  assert.equal(CALIFORNIA_OPTIONAL_ENHANCEMENTS.includes("open-data-has-no-coordinate-columns"), true);
});

test("accepted categories match the recorded lists and California stays unpublished", () => {
  assert.deepEqual(CALIFORNIA_RCFE_PUBLICATION_CATEGORIES, CALIFORNIA_RCFE_ACCEPTED_CATEGORIES);
  assert.deepEqual(CALIFORNIA_ARF_PUBLICATION_CATEGORIES, CALIFORNIA_ARF_ACCEPTED_CATEGORIES);
  assert.equal(directoryContract("California")?.publication, "unpublished");
  assert.equal(directoryContract("California")?.directoryPath, null);
  assert.equal(directoryContract("Washington")?.publication, "public");
  const home = readFileSync(new URL("../../../lib/copy/home.ts", import.meta.url), "utf8");
  const proposal = readFileSync(new URL("../20261114023000_california_publication_acceptance.md", import.meta.url), "utf8");
  assert.equal(home.includes("Find the right care home for your loved one."), true);
  assert.equal(proposal.includes("Coordinates are optional."), true);
  assert.equal(proposal.includes("California stays unpublished."), true);
});
