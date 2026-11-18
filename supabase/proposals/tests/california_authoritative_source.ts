import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  CALIFORNIA_AUTHORITATIVE_API,
  CALIFORNIA_AUTHORITATIVE_PAGE,
  CALIFORNIA_LIVE_RECHECK,
  californiaIsoDate,
  californiaStreetUsable,
  classifyCaliforniaLiveDetail,
  openDataLicensedIsCurrent,
} from "../../../lib/california-authoritative-source.ts";
import { CALIFORNIA_DETAIL_VERIFICATION, californiaDirectoryReady, californiaDisclosureUrl } from "../../../lib/california-directory.ts";
import { mayRepresentCaliforniaRecordAsCurrentlyActive } from "../../../lib/california-publication-readiness.ts";
import { reconcileCaliforniaStatus } from "../../../lib/california-status-reconciliation.ts";
import { directoryContract } from "../../../lib/state-directory.ts";

test("a live closure conflict stays historical and adopts neither an address nor a date", () => {
  for (const liveStatus of ["Closed, Change of Ownership", "Closed, Licensee Initiated"]) {
    const reconciled = reconcileCaliforniaStatus({
      openDataStatus: "LICENSED",
      httpStatus: 200,
      liveStatus,
      identifierMatched: true,
    });
    assert.equal(reconciled.classification, "conflict");
    assert.equal(reconciled.currentlyActive, false);
  }
  const classified = classifyCaliforniaLiveDetail({
    facilityNumber: "12345678",
    facilityType: "ADULT RESIDENTIAL",
    status: "Closed, Licensee Initiated",
    streetAddress: "1 Example Street",
    dateValues: ["05/25/2025", "05252025"],
  });
  assert.equal(classified.originalStatus, "Closed, Licensee Initiated");
  assert.equal(classified.officialIdentifier, "12345678");
  assert.equal(classified.officialPageUrl, californiaDisclosureUrl("12345678"));
  assert.equal(classified.acceptedAddress, null);
  assert.equal(classified.exportDate, null);
  assert.equal(classified.addressUsable, true);
  assert.equal(classified.isoDatePresent, false);
  assert.equal(classified.currentlyActive, false);
  assert.equal(classified.publication, "unpublished");
  assert.equal(classified.ownerClaimEligible, false);
  assert.equal(openDataLicensedIsCurrent(), false);
  assert.equal(mayRepresentCaliforniaRecordAsCurrentlyActive({
    openDataStatus: "LICENSED",
    liveStatus: "Licensed",
    identifierMatched: true,
    httpStatus: 200,
  }), false);
});

test("placeholder addresses and non-ISO dates stay unresolved", () => {
  assert.equal(californiaStreetUsable("Unavailable"), false);
  assert.equal(californiaStreetUsable("See FAQs"), false);
  assert.equal(californiaStreetUsable("  "), false);
  assert.equal(californiaIsoDate(["2026-11-13"]), "2026-11-13");
  const dated = classifyCaliforniaLiveDetail({
    facilityNumber: "12345678",
    facilityType: "RESIDENTIAL CARE ELDERLY",
    status: "Licensed",
    streetAddress: "Unavailable",
    dateValues: ["2026-11-13"],
  });
  assert.equal(dated.exportDate, null);
  assert.equal(dated.isoDatePresent, true);
  assert.equal(dated.addressUsable, false);
  assert.equal(dated.acceptedAddress, null);
  assert.equal(dated.currentlyActive, false);
  assert.equal(dated.officialPageUrl, `${CALIFORNIA_AUTHORITATIVE_PAGE}12345678`);
});

test("the recheck records the completed adult-residential conflict and the failed residential-care query", () => {
  assert.equal(CALIFORNIA_AUTHORITATIVE_API, CALIFORNIA_DETAIL_VERIFICATION.api);
  assert.equal(CALIFORNIA_LIVE_RECHECK.arf, "completed");
  assert.equal(CALIFORNIA_LIVE_RECHECK.arfKnownConflictText, true);
  assert.equal(CALIFORNIA_LIVE_RECHECK.arfLicensedLabel, false);
  assert.equal(CALIFORNIA_LIVE_RECHECK.arfIsoDate, false);
  assert.equal(CALIFORNIA_LIVE_RECHECK.addressAccepted, false);
  assert.equal(CALIFORNIA_LIVE_RECHECK.exportDateAdopted, false);
  assert.equal(CALIFORNIA_LIVE_RECHECK.rcfe, "datastore-http-500");
  assert.equal(CALIFORNIA_LIVE_RECHECK.repeatedAfterFailure, false);
  assert.equal(californiaDirectoryReady(), false);
  assert.equal(directoryContract("California")?.publication, "unpublished");
  assert.equal(directoryContract("California")?.directoryPath, null);
  assert.equal(directoryContract("Washington")?.publication, "public");
  const home = readFileSync(new URL("../../../lib/copy/home.ts", import.meta.url), "utf8");
  const proposal = readFileSync(new URL("../20261114020000_california_authoritative_source.md", import.meta.url), "utf8");
  assert.equal(home.includes("Find the right care home for your loved one."), true);
  assert.equal(proposal.includes("does not download the open-data files again"), true);
  assert.equal(proposal.includes("seven timed-out requests were not repeated"), true);
});
