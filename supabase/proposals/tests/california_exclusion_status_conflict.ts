import assert from "node:assert/strict";
import test from "node:test";
import {
  CALIFORNIA_EXCLUSION_OUTSIDE_RESIDUAL,
  CALIFORNIA_EXCLUSION_STATUS_CONFLICT_BASELINE,
  CALIFORNIA_EXCLUSION_STATUS_CONFLICT_COUNTS,
  CALIFORNIA_EXCLUSION_STATUS_CONFLICT_REMAINING,
  CALIFORNIA_EXCLUSION_STATUS_CONFLICT_RESOLVED,
  CALIFORNIA_LISTING_EXCLUSION_MISSING_DATE,
  CALIFORNIA_LISTING_EXCLUSION_PENDING_INCREASE,
  CALIFORNIA_LISTING_EXCLUSION_PRIOR,
  CALIFORNIA_LISTING_EXCLUSION_PROVISIONAL,
  CALIFORNIA_LISTING_EXCLUSION_RULE_SUPPORT,
  buildCaliforniaExclusionStatusConflictPreview,
  californiaExclusionStatusConflictAllowsPublication,
  californiaExclusionStatusConflictDirectoryReady,
  californiaListingExclusionCategoryForId,
  californiaListingExclusionIds,
  evaluateCaliforniaStatusConflict,
  tryClearCdssConflictWithArcGisStatus,
} from "../../../lib/california-exclusion-status-conflict.ts";

test("baseline is PR #199 merge; publication stays STOP", () => {
  assert.equal(CALIFORNIA_EXCLUSION_STATUS_CONFLICT_BASELINE, "41458b8");
  assert.equal(californiaExclusionStatusConflictAllowsPublication(), false);
  assert.equal(californiaExclusionStatusConflictDirectoryReady(), false);
});

test("88 listing exclusions = 5+66+3+14 with unique IDs", () => {
  const ids = californiaListingExclusionIds();
  const unique = new Set(ids);
  assert.equal(CALIFORNIA_LISTING_EXCLUSION_PROVISIONAL.length, 5);
  assert.equal(CALIFORNIA_LISTING_EXCLUSION_PENDING_INCREASE.length, 66);
  assert.equal(CALIFORNIA_LISTING_EXCLUSION_PRIOR.length, 3);
  assert.equal(CALIFORNIA_LISTING_EXCLUSION_MISSING_DATE.length, 14);
  assert.equal(ids.length, 88);
  assert.equal(unique.size, 88);
  assert.equal(
    CALIFORNIA_EXCLUSION_STATUS_CONFLICT_COUNTS.listingExclusionsOffline,
    88,
  );
  assert.equal(
    CALIFORNIA_EXCLUSION_STATUS_CONFLICT_COUNTS.otherwiseClearOffline,
    15363,
  );
  assert.equal(
    CALIFORNIA_EXCLUSION_STATUS_CONFLICT_COUNTS.publicationEligible,
    0,
  );
});

test("all four exclusion categories are CDSS-backed; none rely on ArcGIS", () => {
  assert.equal(CALIFORNIA_LISTING_EXCLUSION_RULE_SUPPORT.length, 4);
  for (const row of CALIFORNIA_LISTING_EXCLUSION_RULE_SUPPORT) {
    assert.equal(row.supportedByAuthoritativeCdssEvidence, true);
    assert.equal(row.reliesOnArcGisStatus, false);
    assert.equal(row.mappingApprovedForPublication, false);
    assert.equal(row.facilityNumbers.length, row.count);
  }
  assert.equal(
    CALIFORNIA_EXCLUSION_STATUS_CONFLICT_COUNTS.arcgisSupportedExclusionRules,
    0,
  );
  assert.equal(
    CALIFORNIA_EXCLUSION_OUTSIDE_RESIDUAL.invalidIdentifier[0],
    "95354",
  );
  assert.equal(CALIFORNIA_EXCLUSION_OUTSIDE_RESIDUAL.withdrawn.length, 5);
});

test("provisional conflict: FacilityDetail Provisional keeps unknown-ineligible", () => {
  const result = evaluateCaliforniaStatusConflict({
    facilityNumber: "198320787",
    downloadStatus: "LICENSED",
    facilityDetailStatus: "Provisional License",
    downloadLicenseFirstDate: "8/12/2026",
    liveFacilityNumber: "198320787",
    httpStatus: 200,
    found: true,
    arcgisStatusInteger: 3,
  });
  assert.equal(result.listingExclusionCategory, "provisional-license-conflict");
  assert.equal(result.offlineListingExcluded, true);
  assert.equal(result.offlineCandidate, false);
  assert.equal(result.publicationApproved, false);
  assert.equal(result.cdssConflictPresent, true);
  assert.equal(result.arcgisOverrodeCdss, false);
  assert.equal(result.arcgisCannotClearCdssConflict, true);
  assert.equal(result.activatedInApplicationOrDatabase, false);
});

test("pending increase: CDSS overlay without publication mapping", () => {
  const result = evaluateCaliforniaStatusConflict({
    facilityNumber: "374604742",
    downloadStatus: "LICENSED",
    facilityDetailStatus: "Licensed/Pending Increase",
    downloadLicenseFirstDate: "9/17/2024",
    liveFacilityNumber: "374604742",
    httpStatus: 200,
    found: true,
    arcgisStatusInteger: 4,
  });
  assert.equal(
    result.listingExclusionCategory,
    "licensed-pending-increase-overlay",
  );
  assert.equal(result.offlineCandidate, false);
  assert.equal(result.publicationApproved, false);
  assert.equal(result.arcgisOverrodeCdss, false);
});

test("prior conflict 502701867: Pending Incomplete Application", () => {
  const result = evaluateCaliforniaStatusConflict({
    facilityNumber: "502701867",
    downloadStatus: "LICENSED",
    facilityDetailStatus: "Pending Incomplete Application",
    liveFacilityNumber: "502701867",
    httpStatus: 200,
    found: true,
    arcgisStatusInteger: 5,
  });
  assert.equal(result.listingExclusionCategory, "prior-status-conflict");
  assert.equal(result.eligibility, "pending-ineligible");
  assert.equal(result.publicationApproved, false);
  assert.equal(result.arcgisOverrodeCdss, false);
});

test("missing license evidence fails closed on empty download date", () => {
  const result = evaluateCaliforniaStatusConflict({
    facilityNumber: "079201725",
    downloadStatus: "LICENSED",
    facilityDetailStatus: "Licensed",
    downloadLicenseFirstDate: "",
    facilityDetailLicenseFirstDate: null,
    liveFacilityNumber: "079201725",
    httpStatus: 200,
    found: true,
    arcgisStatusInteger: 6,
  });
  assert.equal(result.listingExclusionCategory, "missing-license-evidence");
  assert.equal(result.offlineCandidate, false);
  assert.equal(result.publicationApproved, false);
});

test("FacilityDetail date alone does not clear download missing-date exclusion", () => {
  const result = evaluateCaliforniaStatusConflict({
    facilityNumber: "502701889",
    downloadStatus: "LICENSED",
    facilityDetailStatus: "Licensed",
    downloadLicenseFirstDate: "",
    facilityDetailLicenseFirstDate: "9/22/2026",
    liveFacilityNumber: "502701889",
    httpStatus: 200,
    found: true,
    arcgisStatusInteger: 3,
  });
  assert.equal(result.listingExclusionCategory, "missing-license-evidence");
  assert.equal(result.offlineListingExcluded, true);
  assert.equal(result.publicationApproved, false);
  assert.equal(result.arcgisOverrodeCdss, false);
});

test("mismatched identifier is invalid-id-ineligible", () => {
  const result = evaluateCaliforniaStatusConflict({
    facilityNumber: "015601302",
    downloadStatus: "LICENSED",
    facilityDetailStatus: "Licensed",
    liveFacilityNumber: "15601302",
    httpStatus: 200,
    found: true,
    arcgisStatusInteger: 3,
  });
  assert.equal(result.eligibility, "invalid-id-ineligible");
  assert.equal(result.offlineCandidate, false);
  assert.equal(result.publicationApproved, false);
});

test("invalid short ID 95354 is refuse-closed", () => {
  const result = evaluateCaliforniaStatusConflict({
    facilityNumber: "95354",
    downloadStatus: "LICENSED",
    facilityDetailStatus: "Licensed",
    arcgisStatusInteger: 3,
  });
  assert.equal(result.eligibility, "invalid-id-ineligible");
  assert.equal(result.offlineCandidate, false);
});

test("duplicate facility numbers fail closed", () => {
  const result = evaluateCaliforniaStatusConflict({
    facilityNumber: "100400070",
    downloadStatus: "LICENSED",
    facilityDetailStatus: "Licensed",
    liveFacilityNumber: "100400070",
    duplicateFacilityNumberCount: 2,
    httpStatus: 200,
    found: true,
    arcgisStatusInteger: 3,
  });
  assert.equal(result.eligibility, "unknown-ineligible");
  assert.equal(result.offlineListingExcluded, true);
  assert.equal(result.publicationApproved, false);
  assert.match(result.rationale, /Duplicate/i);
});

test("stale unresolved CDSS mismatch is not cleared by ArcGIS", () => {
  const result = evaluateCaliforniaStatusConflict({
    facilityNumber: "100400070",
    downloadStatus: "LICENSED",
    facilityDetailStatus: "Application Denied",
    downloadLicenseFirstDate: "3/20/1985",
    liveFacilityNumber: "100400070",
    httpStatus: 200,
    found: true,
    arcgisStatusInteger: 3,
  });
  assert.equal(result.cdssConflictPresent, true);
  assert.equal(result.offlineCandidate, false);
  assert.equal(result.arcgisOverrodeCdss, false);
  const attempt = tryClearCdssConflictWithArcGisStatus({
    cdssConflictPresent: true,
    arcgisStatusInteger: 3,
  });
  assert.equal(attempt.overrideSucceeded, false);
  assert.equal(attempt.arcgisStatusPresent, true);
});

test("clear Licensed control is offline candidate only — not publication-approved", () => {
  const result = evaluateCaliforniaStatusConflict({
    facilityNumber: "100400070",
    downloadStatus: "LICENSED",
    facilityDetailStatus: "Licensed",
    downloadLicenseFirstDate: "3/20/1985",
    liveFacilityNumber: "100400070",
    httpStatus: 200,
    found: true,
    arcgisStatusInteger: 3,
  });
  assert.equal(result.offlineCandidate, true);
  assert.equal(result.offlineListingExcluded, false);
  assert.equal(result.publicationApproved, false);
  assert.equal(result.eligibility, "active-candidate-offline-only");
  assert.equal(result.arcgisOverrodeCdss, false);
  assert.equal(
    californiaListingExclusionCategoryForId("100400070"),
    null,
  );
});

test("Arcgis override helper never succeeds", () => {
  assert.deepEqual(
    tryClearCdssConflictWithArcGisStatus({
      cdssConflictPresent: false,
      arcgisStatusInteger: 6,
    }),
    {
      arcgisStatusPresent: true,
      overrideSucceeded: false,
      reason:
        "ArcGIS STATUS is non-authoritative even when no CDSS conflict is present; it cannot authorize publication.",
    },
  );
});

test("preview arithmetic and remaining blockers", () => {
  const preview = buildCaliforniaExclusionStatusConflictPreview();
  assert.equal(preview.arithmeticOk, true);
  assert.equal(preview.allEightyEightCdssBacked, true);
  assert.equal(preview.exclusionsActivated, false);
  assert.equal(preview.allowsPublication, false);
  assert.equal(preview.stopGoPublic, "STOP");
  assert.equal(preview.stopGoDevelopmentPreview, "GO");
  assert.equal(preview.stopGoArcGisRoster, "STOP");
  assert.ok(
    CALIFORNIA_EXCLUSION_STATUS_CONFLICT_RESOLVED.includes(
      "arcgis-status-cannot-override-cdss-safeguard-encoded",
    ),
  );
  assert.ok(
    CALIFORNIA_EXCLUSION_STATUS_CONFLICT_REMAINING.includes(
      "exclusion-policy-inactive",
    ),
  );
  assert.ok(
    CALIFORNIA_EXCLUSION_STATUS_CONFLICT_REMAINING.includes(
      "california-publication-blocked",
    ),
  );
  assert.ok(
    preview.preservedRestrictions.includes(
      "offline-candidates-are-not-publication-approved",
    ),
  );
});
