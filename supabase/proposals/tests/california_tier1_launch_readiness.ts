import assert from "node:assert/strict";
import test from "node:test";
import {
  CALIFORNIA_TIER1_LAUNCH_ASSESSMENT,
  CALIFORNIA_TIER1_LAUNCH_BASELINE,
  CALIFORNIA_TIER1_LAUNCH_DECISIONS_REQUIRING_APPROVAL,
  CALIFORNIA_TIER1_LAUNCH_DOWNLOAD,
  CALIFORNIA_TIER1_LAUNCH_REMAINING_BLOCKERS,
  CALIFORNIA_TIER1_LAUNCH_RESOLVED,
  CALIFORNIA_TIER1_LIVE_VALIDATION,
  CALIFORNIA_TIER1_MISSING_FIRST_DATE_IDS,
  CALIFORNIA_TIER1_OFFLINE_COUNTS,
  CALIFORNIA_TIER1_PENDING_INCREASE_IDS,
  CALIFORNIA_TIER1_PENDING_INCREASE_MAPPING,
  CALIFORNIA_TIER1_PRIOR_CONFLICT_IDS,
  CALIFORNIA_TIER1_PROVISIONAL_IDS,
  buildCaliforniaTier1LaunchReadinessPreview,
  californiaTier1LaunchAllowsPublication,
  californiaTier1LaunchDirectoryReady,
} from "../../../lib/california-tier1-launch-readiness.ts";

test("baseline #202; mapping approved future-only; publication STOP", () => {
  assert.equal(CALIFORNIA_TIER1_LAUNCH_BASELINE, "c9d9f6c");
  assert.equal(
    CALIFORNIA_TIER1_PENDING_INCREASE_MAPPING
      .humanApprovedForFutureEligibilityConsideration,
    true,
  );
  assert.equal(
    CALIFORNIA_TIER1_PENDING_INCREASE_MAPPING.activatedInApplicationOrDatabase,
    false,
  );
  assert.equal(
    CALIFORNIA_TIER1_PENDING_INCREASE_MAPPING.californiaPublicationAllowed,
    false,
  );
  assert.equal(californiaTier1LaunchAllowsPublication(), false);
  assert.equal(californiaTier1LaunchDirectoryReady(), false);
});

test("Transparency as-of unchanged; no newer download", () => {
  const d = CALIFORNIA_TIER1_LAUNCH_DOWNLOAD;
  assert.equal(d.adoptedAsOfIso, "2026-11-15");
  assert.equal(d.newerDownloadAvailable, false);
  assert.equal(d.unchangedFromPr199, true);
  assert.match(d.rcfeContentDisposition, /11152026/);
});

test("all 66 Pending Increase pass CDSS agreement; no new conflicts", () => {
  const v = CALIFORNIA_TIER1_LIVE_VALIDATION.pendingIncrease;
  assert.equal(CALIFORNIA_TIER1_PENDING_INCREASE_IDS.length, 66);
  assert.equal(v.probed, 66);
  assert.equal(v.facilityNumberExactMatch, 66);
  assert.equal(v.downloadStatusLicensed, 66);
  assert.equal(v.facilityDetailLicensedPendingIncrease, 66);
  assert.equal(v.clearedToExactLicensed, 0);
  assert.equal(v.downloadLicenseFirstDatePresent, 66);
  assert.equal(v.downloadDetailCapacityAgreement, 66);
  assert.equal(v.cdssAgreementPass, 66);
  assert.equal(v.newConflictsDetected, 0);
});

test("remaining 22 exclusions reconfirmed", () => {
  assert.equal(CALIFORNIA_TIER1_MISSING_FIRST_DATE_IDS.length, 14);
  assert.equal(CALIFORNIA_TIER1_PROVISIONAL_IDS.length, 5);
  assert.equal(CALIFORNIA_TIER1_PRIOR_CONFLICT_IDS.length, 3);
  assert.equal(CALIFORNIA_TIER1_LIVE_VALIDATION.missingFirstDate.stillExcluded, 14);
  assert.equal(
    CALIFORNIA_TIER1_LIVE_VALIDATION.missingFirstDate
      .stillEmptyDownloadLicenseFirstDate,
    14,
  );
  assert.equal(CALIFORNIA_TIER1_LIVE_VALIDATION.provisional.stillExcluded, 5);
  assert.equal(CALIFORNIA_TIER1_LIVE_VALIDATION.priorConflicts.stillExcluded, 3);
  assert.equal(
    CALIFORNIA_TIER1_LIVE_VALIDATION.priorConflicts.statuses["502701867"],
    "Pending Incomplete Application",
  );
});

test("offline Tier 1 recalculated to 15429; publicationEligible 0", () => {
  const c = CALIFORNIA_TIER1_OFFLINE_COUNTS;
  assert.equal(c.listingExclusionsBeforeMappingApproval, 88);
  assert.equal(c.pendingIncreaseFutureEligibleUnderApprovedMapping, 66);
  assert.equal(c.remainingListingExclusions, 22);
  assert.equal(c.tier1OfflineEligibleUnderApprovedMapping, 15429);
  assert.equal(c.otherwiseClearOfflinePreApproval, 15363);
  assert.equal(c.publicationEligible, 0);
  assert.equal(c.exclusionsActivatedInApplicationOrDatabase, false);
  assert.equal(
    c.activeRestrictedCandidates,
    c.tier1OfflineEligibleUnderApprovedMapping + c.remainingListingExclusions,
  );
});

test("launch assessment: public STOP; data integrity GO; security GO", () => {
  const byArea = Object.fromEntries(
    CALIFORNIA_TIER1_LAUNCH_ASSESSMENT.map((r) => [r.area, r]),
  );
  assert.equal(byArea["data-integrity"].stopGo, "GO");
  assert.equal(byArea.security.stopGo, "GO");
  assert.equal(byArea.disclosures.stopGo, "STOP");
  assert.equal(byArea["publication-gate"].stopGo, "STOP");
  assert.equal(byArea["eligibility-accounting"].stopGo, "CONDITIONAL");
});

test("only remaining human decisions are listed (mapping already approved)", () => {
  const ids = CALIFORNIA_TIER1_LAUNCH_DECISIONS_REQUIRING_APPROVAL.map((d) => d.id);
  assert.deepEqual(ids.sort(), [
    "activate-california-exclusion-ledger-in-app-db",
    "approve-california-statewide-public-publication",
    "reclassify-prior-control-pending-increase-ids",
  ].sort());
  assert.ok(
    !ids.includes("approve-licensed-pending-increase-future-publication-mapping"),
  );
  assert.ok(
    CALIFORNIA_TIER1_LAUNCH_RESOLVED.includes(
      "pending-increase-mapping-approved-for-future-eligibility-consideration",
    ),
  );
  assert.ok(
    CALIFORNIA_TIER1_LAUNCH_REMAINING_BLOCKERS.includes(
      "california-publication-blocked",
    ),
  );
});

test("preview arithmetic and public STOP", () => {
  const preview = buildCaliforniaTier1LaunchReadinessPreview();
  assert.equal(preview.arithmeticOk, true);
  assert.equal(preview.stopGoPublic, "STOP");
  assert.equal(preview.allowsPublication, false);
  assert.equal(preview.exclusionsActivated, false);
  assert.equal(preview.assessmentStop, 2);
  assert.equal(preview.decisionsRequiringApproval.length, 3);
});
