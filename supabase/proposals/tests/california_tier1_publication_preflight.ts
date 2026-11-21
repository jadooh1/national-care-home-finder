import assert from "node:assert/strict";
import test from "node:test";
import {
  CALIFORNIA_PREFLIGHT_BASELINE,
  CALIFORNIA_PREFLIGHT_CONDITIONAL_REASONS,
  CALIFORNIA_PREFLIGHT_DECISIONS_REQUIRING_APPROVAL,
  CALIFORNIA_PREFLIGHT_DISCLOSURE_POLICY,
  CALIFORNIA_PREFLIGHT_EXCLUSION_IDS,
  CALIFORNIA_PREFLIGHT_MATRIX,
  CALIFORNIA_PREFLIGHT_RECONCILIATION,
  CALIFORNIA_PREFLIGHT_SOURCE,
  CALIFORNIA_PREFLIGHT_STATUS_MAPPING,
  buildCaliforniaTier1PublicationPreflightPreview,
  californiaPreflightFacDetailUrl,
  californiaPublicationPreflightEvaluate,
  californiaTier1PublicationPreflightAllowsPublication,
  californiaTier1PublicationPreflightDirectoryReady,
  isCaliforniaPreflightFacilityNumber,
} from "../../../lib/california-tier1-publication-preflight.ts";

test("baseline #205; publication and directory stay STOP", () => {
  assert.equal(CALIFORNIA_PREFLIGHT_BASELINE, "696da7c");
  assert.equal(californiaTier1PublicationPreflightAllowsPublication(), false);
  assert.equal(californiaTier1PublicationPreflightDirectoryReady(), false);
});

test("reconciles 15429 candidates and 22 exclusions against CDSS evidence", () => {
  const r = CALIFORNIA_PREFLIGHT_RECONCILIATION;
  assert.equal(r.offlineTier1Candidates, 15429);
  assert.equal(r.remainingListingExclusions, 22);
  assert.equal(
    r.otherwiseClearOfflinePreApproval
      + r.pendingIncreaseFutureEligibleUnderApprovedMapping,
    15429,
  );
  assert.equal(
    r.exclusionBuckets.missingFirstDate
      + r.exclusionBuckets.provisional
      + r.exclusionBuckets.priorConflict,
    22,
  );
  assert.equal(
    r.offlineTier1Candidates + r.remainingListingExclusions,
    r.parentActiveRestrictedRoster,
  );
  assert.equal(r.publicationEligible, 0);
  assert.equal(r.exclusionsActivatedInApplicationOrDatabase, false);
  assert.equal(CALIFORNIA_PREFLIGHT_EXCLUSION_IDS.missingFirstDate.length, 14);
  assert.equal(CALIFORNIA_PREFLIGHT_EXCLUSION_IDS.provisional.length, 5);
  assert.equal(CALIFORNIA_PREFLIGHT_EXCLUSION_IDS.priorConflict.length, 3);
});

test("states precisely why eligibility accounting is CONDITIONAL", () => {
  const ids = new Set(
    CALIFORNIA_PREFLIGHT_CONDITIONAL_REASONS.map((reason) => reason.id),
  );
  assert.ok(ids.has("pending-increase-mapping-future-eligibility-only"));
  assert.ok(ids.has("exclusion-ledger-inactive"));
  assert.ok(ids.has("publication-eligible-remains-zero"));
  assert.ok(ids.has("statewide-publication-authorization-absent"));
  assert.equal(CALIFORNIA_PREFLIGHT_CONDITIONAL_REASONS.length, 4);
  assert.equal(
    CALIFORNIA_PREFLIGHT_STATUS_MAPPING.pendingIncreaseMappingHumanApproved,
    true,
  );
  assert.equal(
    CALIFORNIA_PREFLIGHT_STATUS_MAPPING.pendingIncreaseMappingActivated,
    false,
  );
});

test("source freshness and disclosure policy verified", () => {
  assert.equal(CALIFORNIA_PREFLIGHT_SOURCE.adoptedAsOfIso, "2026-11-15");
  assert.equal(CALIFORNIA_PREFLIGHT_SOURCE.newerDownloadAvailable, false);
  assert.ok(
    CALIFORNIA_PREFLIGHT_SOURCE.rcfeContentDisposition.includes("11152026"),
  );
  assert.equal(
    CALIFORNIA_PREFLIGHT_DISCLOSURE_POLICY.facilitySpecificFacDetailApproved,
    true,
  );
  assert.equal(
    CALIFORNIA_PREFLIGHT_DISCLOSURE_POLICY.generalSearchLinksSupplementalOnly,
    true,
  );
  assert.equal(
    californiaPreflightFacDetailUrl("015601083"),
    `${CALIFORNIA_PREFLIGHT_SOURCE.facDetailPagePrefix}015601083`,
  );
  assert.equal(californiaPreflightFacDetailUrl("95354"), null);
  assert.equal(isCaliforniaPreflightFacilityNumber("015601083"), true);
});

test("fail-closed when stale, ambiguous, unverified, or excluded", () => {
  const stale = californiaPublicationPreflightEvaluate({
    facilityNumber: "015601083",
    identifierExactMatch: true,
    disclosureUrl: californiaPreflightFacDetailUrl("015601083"),
    sourceAsOfIso: "2026-11-15",
    newerDownloadAvailable: true,
  });
  assert.equal(stale.accepted, false);
  assert.ok(stale.blockers.includes("stale-source-newer-download"));
  assert.ok(stale.blockers.includes("california-publication-blocked"));

  const ambiguous = californiaPublicationPreflightEvaluate({
    facilityNumber: "015601083",
    identifierExactMatch: true,
    disclosureUrl: californiaPreflightFacDetailUrl("015601083"),
    sourceAsOfIso: "2026-11-15",
    sourceAmbiguousOrUnverified: true,
  });
  assert.ok(ambiguous.blockers.includes("source-ambiguous-or-unverified"));

  const invalid = californiaPublicationPreflightEvaluate({
    facilityNumber: "95354",
    sourceAsOfIso: "2026-11-15",
  });
  assert.ok(invalid.blockers.includes("invalid-facility-number"));

  const excluded = californiaPublicationPreflightEvaluate({
    facilityNumber: "079201725",
    identifierExactMatch: true,
    disclosureUrl: californiaPreflightFacDetailUrl("079201725"),
    sourceAsOfIso: "2026-11-15",
    isDocumentedExclusion: true,
  });
  assert.ok(excluded.blockers.includes("documented-listing-exclusion"));

  const nonCanonical = californiaPublicationPreflightEvaluate({
    facilityNumber: "015601083",
    identifierExactMatch: true,
    disclosureUrl: californiaPreflightFacDetailUrl("15601083"),
    sourceAsOfIso: "2026-11-15",
  });
  assert.ok(nonCanonical.blockers.includes("non-canonical-disclosure-url"));
});

test("GO/CONDITIONAL/STOP matrix lists genuine launch decisions only once", () => {
  const preview = buildCaliforniaTier1PublicationPreflightPreview();
  assert.equal(preview.arithmeticOk, true);
  assert.equal(preview.stopGoPublic, "STOP");
  assert.equal(preview.stopGoEligibilityAccounting, "CONDITIONAL");
  assert.ok(preview.matrixStop >= 1);
  assert.ok(preview.matrixConditional >= 3);
  assert.ok(preview.genuineLaunchDecisions >= 4);

  const publication = CALIFORNIA_PREFLIGHT_MATRIX.find(
    (row) => row.area === "publication-authorization",
  );
  assert.equal(publication?.status, "STOP");
  assert.equal(publication?.genuineLaunchDecision, true);

  const eligibility = CALIFORNIA_PREFLIGHT_MATRIX.find(
    (row) => row.area === "eligibility-accounting",
  );
  assert.equal(eligibility?.status, "CONDITIONAL");

  assert.ok(
    CALIFORNIA_PREFLIGHT_DECISIONS_REQUIRING_APPROVAL.some(
      (d) => d.id === "approve-california-statewide-public-publication",
    ),
  );
  assert.ok(
    preview.remainingBlockers.includes("california-publication-blocked"),
  );
});
