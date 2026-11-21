import assert from "node:assert/strict";
import test from "node:test";
import {
  CALIFORNIA_MISSING_BOTH_LICENSE_DATES,
  CALIFORNIA_MISSING_FIRST_EFFECTIVE_PRESENT,
  CALIFORNIA_MISSING_LICENSE_FIRST_IDS,
  CALIFORNIA_PENDING_INCREASE_IDS,
  CALIFORNIA_PENDING_MISSING_BASELINE,
  CALIFORNIA_PENDING_MISSING_COUNTS,
  CALIFORNIA_PENDING_MISSING_DECISION_MATRIX,
  CALIFORNIA_PENDING_MISSING_DOWNLOAD,
  CALIFORNIA_PENDING_MISSING_REMAINING,
  CALIFORNIA_PENDING_MISSING_RESOLVED,
  buildCaliforniaPendingIncreaseMissingDatePreview,
  californiaPendingIncreaseMissingDateAllowsPublication,
  californiaPendingIncreaseMissingDateDirectoryReady,
  classifyCaliforniaPendingIncrease,
  evaluateCaliforniaCapacityChange,
  evaluateCaliforniaMissingDateStaleness,
  evaluateCaliforniaPendingIncreaseStatus,
  reconcileCaliforniaMissingLicenseFirstDate,
} from "../../../lib/california-pending-increase-missing-date.ts";

test("baseline is PR #200 merge; publication stays STOP", () => {
  assert.equal(CALIFORNIA_PENDING_MISSING_BASELINE, "84d9d15");
  assert.equal(californiaPendingIncreaseMissingDateAllowsPublication(), false);
  assert.equal(californiaPendingIncreaseMissingDateDirectoryReady(), false);
});

test("Transparency as-of revalidated unchanged from #199", () => {
  const d = CALIFORNIA_PENDING_MISSING_DOWNLOAD;
  assert.equal(d.adoptedAsOfIso, "2026-11-15");
  assert.equal(d.unchangedFromPr199, true);
  assert.equal(d.cdssFilenameHeaderIsAsOfConfirmed, true);
  assert.match(d.rcfeContentDisposition, /11152026/);
  assert.match(d.arfContentDisposition, /11152026/);
});

test("66 pending-increase and 14 missing-date ID sets are intact", () => {
  assert.equal(CALIFORNIA_PENDING_INCREASE_IDS.length, 66);
  assert.equal(CALIFORNIA_MISSING_LICENSE_FIRST_IDS.length, 14);
  assert.equal(CALIFORNIA_MISSING_BOTH_LICENSE_DATES.length, 5);
  assert.equal(CALIFORNIA_MISSING_FIRST_EFFECTIVE_PRESENT.length, 9);
  assert.equal(
    new Set(CALIFORNIA_PENDING_INCREASE_IDS).size,
    66,
  );
  assert.equal(
    new Set([
      ...CALIFORNIA_MISSING_BOTH_LICENSE_DATES,
      ...CALIFORNIA_MISSING_FIRST_EFFECTIVE_PRESENT,
    ]).size,
    14,
  );
});

test("pending increase: existing license recognized; proposed capacity null", () => {
  const finding = classifyCaliforniaPendingIncrease({
    facilityNumber: "374604742",
    downloadStatus: "LICENSED",
    facilityDetailStatus: "Licensed/Pending Increase",
    downloadCapacity: "4",
    facilityDetailCapacity: "4",
  });
  assert.equal(finding.existingLicenseRecognized, true);
  assert.equal(finding.approvedCapacity, "4");
  assert.equal(finding.proposedCapacityIncrease, null);
  assert.equal(finding.proposedCapacityPublishedInTransparencyApis, false);
  assert.equal(finding.mappingApprovedForPublication, false);
  assert.equal(finding.offlineListingExcluded, true);
  assert.equal(finding.publicationApproved, false);
});

test("capacity change mismatch is stale/fail-closed", () => {
  const match = evaluateCaliforniaCapacityChange({
    downloadCapacity: "6",
    facilityDetailCapacity: "6",
  });
  assert.equal(match.capacitiesMatch, true);
  assert.equal(match.staleOrChangingCapacity, false);
  assert.equal(match.publicationApproved, false);

  const mismatch = evaluateCaliforniaCapacityChange({
    downloadCapacity: "6",
    facilityDetailCapacity: "12",
  });
  assert.equal(mismatch.capacitiesMatch, false);
  assert.equal(mismatch.staleOrChangingCapacity, true);
  assert.equal(mismatch.publicationApproved, false);
  assert.match(mismatch.rationale, /disagree/i);
});

test("pending increase status: still overlay vs cleared vs conflict", () => {
  const still = evaluateCaliforniaPendingIncreaseStatus({
    facilityNumber: "015601083",
    downloadStatus: "LICENSED",
    facilityDetailStatus: "Licensed/Pending Increase",
  });
  assert.equal(still.stillPendingIncrease, true);
  assert.equal(still.offlineListingExcluded, true);
  assert.equal(still.publicationApproved, false);

  const cleared = evaluateCaliforniaPendingIncreaseStatus({
    facilityNumber: "015601083",
    downloadStatus: "LICENSED",
    facilityDetailStatus: "Licensed",
  });
  assert.equal(cleared.clearedToExactLicensed, true);
  assert.equal(cleared.offlineListingExcluded, true);
  assert.equal(cleared.publicationApproved, false);

  const conflict = evaluateCaliforniaPendingIncreaseStatus({
    facilityNumber: "015601083",
    downloadStatus: "LICENSED",
    facilityDetailStatus: "Provisional License",
  });
  assert.equal(conflict.conflictingUnexpectedStatus, true);
  assert.equal(conflict.publicationApproved, false);
});

test("missing first date: effective date not adopted as first date", () => {
  const both = reconcileCaliforniaMissingLicenseFirstDate({
    facilityNumber: "079201725",
    downloadLicenseFirstDate: "",
    facilityDetailLicenseFirstDate: null,
    facilityDetailLicenseEffectiveDate: null,
  });
  assert.equal(both.subclass, "both-license-dates-empty");
  assert.equal(both.treatEffectiveAsFirstDate, false);
  assert.equal(both.offlineListingExcluded, true);

  const effectiveOnly = reconcileCaliforniaMissingLicenseFirstDate({
    facilityNumber: "502701889",
    downloadLicenseFirstDate: "",
    facilityDetailLicenseFirstDate: null,
    facilityDetailLicenseEffectiveDate: "9/22/2026",
  });
  assert.equal(effectiveOnly.subclass, "first-empty-effective-present");
  assert.equal(effectiveOnly.treatEffectiveAsFirstDate, false);
  assert.equal(effectiveOnly.publicationApproved, false);
});

test("missing-date staleness never clears exclusion", () => {
  const stale = evaluateCaliforniaMissingDateStaleness({
    downloadLicenseFirstDate: "",
    facilityDetailLicenseFirstDate: null,
    facilityDetailLicenseEffectiveDate: "9/22/2026",
  });
  assert.equal(stale.downloadFirstStillEmpty, true);
  assert.equal(stale.staleRelativeToEffective, true);
  assert.equal(stale.exclusionCleared, false);
  assert.equal(stale.publicationApproved, false);
});

test("decision matrix documents resolved vs remaining blockers", () => {
  const preview = buildCaliforniaPendingIncreaseMissingDatePreview();
  assert.equal(preview.arithmeticOk, true);
  assert.equal(preview.stopGoPublic, "STOP");
  assert.equal(preview.exclusionsActivated, false);
  assert.equal(preview.counts.pendingIncreaseClearedToExactLicensed, 0);
  assert.equal(preview.counts.missingClearedOnDownload, 0);
  assert.ok(preview.resolvedDecisionRows >= 5);
  assert.ok(preview.openOrPolicyDecisionRows >= 2);
  assert.equal(CALIFORNIA_PENDING_MISSING_DECISION_MATRIX.length, 7);
  assert.ok(
    CALIFORNIA_PENDING_MISSING_RESOLVED.includes(
      "proposed-capacity-increase-not-published-in-transparency-apis",
    ),
  );
  assert.ok(
    CALIFORNIA_PENDING_MISSING_REMAINING.includes(
      "pending-increase-mapping-not-approved-for-publication",
    ),
  );
  assert.ok(
    CALIFORNIA_PENDING_MISSING_REMAINING.includes(
      "missing-date-requires-download-first-date-or-human-adoption",
    ),
  );
  assert.equal(CALIFORNIA_PENDING_MISSING_COUNTS.publicationEligible, 0);
});
