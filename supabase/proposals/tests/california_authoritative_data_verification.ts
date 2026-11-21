import assert from "node:assert/strict";
import test from "node:test";
import {
  CALIFORNIA_AUTH_VERIFY_APPROVALS_REQUIRED,
  CALIFORNIA_AUTH_VERIFY_FRESHNESS,
  CALIFORNIA_AUTH_VERIFY_LEADING_ZEROS,
  CALIFORNIA_AUTH_VERIFY_REMAINING_BLOCKERS,
  CALIFORNIA_AUTH_VERIFY_STATUS,
  buildCaliforniaAuthoritativeDataVerification,
  californiaAuthoritativeDataAllowsPublication,
  californiaAuthoritativeDataDirectoryReady,
} from "../../../lib/california-authoritative-data-verification.ts";

test("ArcGIS STATUS remains undocumented and unaccepted", () => {
  assert.equal(CALIFORNIA_AUTH_VERIFY_STATUS.layerDomain, null);
  assert.equal(CALIFORNIA_AUTH_VERIFY_STATUS.codedValueDomainPresent, false);
  assert.equal(CALIFORNIA_AUTH_VERIFY_STATUS.officialNumericDomainFound, false);
  assert.equal(CALIFORNIA_AUTH_VERIFY_STATUS.statusCodesAccepted, false);
  assert.equal(CALIFORNIA_AUTH_VERIFY_STATUS.pin2401DocumentsTextStatusesOnly, true);
  assert.equal(CALIFORNIA_AUTH_VERIFY_STATUS.faqDocumentsTextStatusesOnly, true);
  assert.equal(CALIFORNIA_AUTH_VERIFY_STATUS.sampleShowsOneToOneLicensedMapping, false);
  assert.equal(
    CALIFORNIA_AUTH_VERIFY_STATUS.stratifiedFacilityDetailSample.length,
    8,
  );
  assert.equal(
    CALIFORNIA_AUTH_VERIFY_STATUS.stratifiedFacilityDetailSample.every(
      (row) => row.officialStatus === "Licensed",
    ),
    true,
  );
  assert.deepEqual(
    [...new Set(CALIFORNIA_AUTH_VERIFY_STATUS.stratifiedFacilityDetailSample.map((r) => r.gisStatus))].sort(),
    [3, 4, 5, 6],
  );
});

test("leading-zero mismatches are characterized without altering originals", () => {
  const z = CALIFORNIA_AUTH_VERIFY_LEADING_ZEROS;
  assert.equal(z.representationMismatches, 1240);
  assert.equal(z.allNineDigit, true);
  assert.equal(z.allSingleLeadingZero, true);
  assert.equal(z.collapsedGisFormAlwaysEightDigits, true);
  assert.equal(z.historicalLeadingZeroUniverse.exactGisMatchPreservingZeros, 0);
  assert.equal(z.historicalLeadingZeroUniverse.representationMismatchOnly, 1240);
  assert.equal(z.historicalLeadingZeroUniverse.missingEvenIfCollapsed, 570);
  assert.equal(z.policy.originalsUnaltered, true);
  assert.equal(z.policy.refuseStoreTruncatedGisIntegerAsLicense, true);
  assert.equal(z.policy.collapseZerosDoesNotCountAsMatch, true);
  assert.equal(
    z.facilityDetailCanonicalization.canonicalFacilityNumber,
    "015601302",
  );
  assert.equal(z.facilityDetailCanonicalization.truncatedRequest, "15601302");
  assert.equal(
    z.historicalStatusBreakdown.LICENSED
      + z.historicalStatusBreakdown.PENDING
      + z.historicalStatusBreakdown["ON PROBATION"],
    1240,
  );
});

test("authoritative ISO export/version remains absent; clock proxies rejected", () => {
  assert.equal(CALIFORNIA_AUTH_VERIFY_FRESHNESS.authoritativeIsoExportDate, null);
  assert.equal(CALIFORNIA_AUTH_VERIFY_FRESHNESS.authoritativeDatasetVersion, null);
  assert.equal(CALIFORNIA_AUTH_VERIFY_FRESHNESS.blocksTier1, true);
  assert.equal(CALIFORNIA_AUTH_VERIFY_FRESHNESS.cdssClarification.duplicateInquirySent, false);
  assert.equal(
    CALIFORNIA_AUTH_VERIFY_FRESHNESS.rejectedClockProxies.every((c) => c.acceptedAsExport === false),
    true,
  );
  assert.ok(
    CALIFORNIA_AUTH_VERIFY_FRESHNESS.rejectedClockProxies.some(
      (c) => c.clock === "arcgis-dataLastEditDate",
    ),
  );
});

test("verification preview stays STOP and lists approvals that agents cannot invent", () => {
  const report = buildCaliforniaAuthoritativeDataVerification();
  assert.equal(report.statusSampleAllLicensed, true);
  assert.equal(report.leadingZeroArithmeticOk, true);
  assert.equal(report.stopGo, "STOP");
  assert.equal(report.allowsPublication, false);
  assert.equal(report.californiaDirectoryReady, false);
  assert.equal(report.agencyEmailSent, false);
  assert.equal(report.washingtonProductionUnchanged, true);
  assert.equal(report.oregonDevelopmentUnchanged, true);
  assert.equal(report.floridaOhioRestrictionsUnchanged, true);
  assert.equal(californiaAuthoritativeDataAllowsPublication(), false);
  assert.equal(californiaAuthoritativeDataDirectoryReady(), false);
  assert.ok(
    CALIFORNIA_AUTH_VERIFY_REMAINING_BLOCKERS.includes(
      "arcgis-status-numeric-domain-undocumented",
    ),
  );
  assert.ok(
    CALIFORNIA_AUTH_VERIFY_REMAINING_BLOCKERS.includes(
      "no-authoritative-iso-export-or-version",
    ),
  );
  assert.equal(
    CALIFORNIA_AUTH_VERIFY_APPROVALS_REQUIRED.every((a) => a.agentMayInfer === false),
    true,
  );
});
