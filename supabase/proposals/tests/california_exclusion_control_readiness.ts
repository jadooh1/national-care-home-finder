import assert from "node:assert/strict";
import test from "node:test";
import {
  CALIFORNIA_EXCLUSION_CONTROL_ACTIVATION_PLAN,
  CALIFORNIA_EXCLUSION_CONTROL_BASELINE,
  CALIFORNIA_EXCLUSION_CONTROL_CASES,
  CALIFORNIA_EXCLUSION_CONTROL_COUNTS,
  CALIFORNIA_EXCLUSION_CONTROL_DECISION_SEPARATION,
  CALIFORNIA_EXCLUSION_CONTROL_DECISIONS_REQUIRING_APPROVAL,
  CALIFORNIA_EXCLUSION_CONTROL_MATRIX,
  CALIFORNIA_EXCLUSION_CONTROL_MISSING_FIRST_DATE_IDS,
  CALIFORNIA_EXCLUSION_CONTROL_PROVISIONAL_IDS,
  CALIFORNIA_EXCLUSION_CONTROL_STATUS_CONFLICT_IDS,
  buildCaliforniaExclusionControlReadinessPreview,
  californiaExclusionControlActivated,
  californiaExclusionControlAllowsPublication,
  californiaExclusionControlListingGate,
  californiaIsResidualListingExclusion,
} from "../../../lib/california-exclusion-control-readiness.ts";

test("baseline #206; exclusions inactive; publication STOP", () => {
  assert.equal(CALIFORNIA_EXCLUSION_CONTROL_BASELINE, "2a1e2c7");
  assert.equal(californiaExclusionControlActivated(), false);
  assert.equal(californiaExclusionControlAllowsPublication(), false);
  assert.equal(CALIFORNIA_EXCLUSION_CONTROL_ACTIVATION_PLAN.activated, false);
});

test("deterministic 22-case specification: 14 + 5 + 3", () => {
  assert.equal(CALIFORNIA_EXCLUSION_CONTROL_CASES.length, 22);
  assert.equal(CALIFORNIA_EXCLUSION_CONTROL_MISSING_FIRST_DATE_IDS.length, 14);
  assert.equal(CALIFORNIA_EXCLUSION_CONTROL_PROVISIONAL_IDS.length, 5);
  assert.equal(CALIFORNIA_EXCLUSION_CONTROL_STATUS_CONFLICT_IDS.length, 3);
  assert.equal(CALIFORNIA_EXCLUSION_CONTROL_COUNTS.residualExclusions, 22);
  assert.equal(
    CALIFORNIA_EXCLUSION_CONTROL_COUNTS.missingFirstLicenseDate
      + CALIFORNIA_EXCLUSION_CONTROL_COUNTS.provisionalLicense
      + CALIFORNIA_EXCLUSION_CONTROL_COUNTS.statusConflict,
    22,
  );
  const ids = CALIFORNIA_EXCLUSION_CONTROL_CASES.map((c) => c.facilityNumber);
  assert.equal(new Set(ids).size, 22);
  assert.ok(ids.includes("079201725"));
  assert.ok(ids.includes("198320787"));
  assert.ok(ids.includes("502701867"));
  assert.ok(ids.includes("019201167"));
  assert.ok(ids.includes("019201133"));
  assert.ok(
    CALIFORNIA_EXCLUSION_CONTROL_CASES.every(
      (c) => c.publicationEligible === false && c.listingEligibleIfActivated === false,
    ),
  );
});

test("excluded facilities blocked from search, detail, and API", () => {
  for (const surface of ["search", "detail-page", "api"] as const) {
    for (const id of [
      "079201725",
      "198320787",
      "502701867",
      "019201167",
      "019201133",
    ]) {
      const gate = californiaExclusionControlListingGate({
        facilityNumber: id,
        surface,
      });
      assert.equal(gate.allowed, false);
      assert.ok(
        gate.reasons.some((r) => r.startsWith("residual-exclusion:")),
        `${id} on ${surface}`,
      );
    }
  }
  assert.equal(californiaIsResidualListingExclusion("015601083"), false);
  assert.equal(californiaIsResidualListingExclusion("019201133"), true);

  // CDSS FacilityDetail canonicalizes truncated leading-zero forms; gates must
  // treat them as residual exclusions too.
  assert.equal(californiaIsResidualListingExclusion("19201167"), true);
  assert.equal(californiaIsResidualListingExclusion("19201133"), true);
  assert.equal(californiaIsResidualListingExclusion("79201725"), true);
  const truncGate = californiaExclusionControlListingGate({
    facilityNumber: "19201167",
    surface: "detail-page",
  });
  assert.equal(truncGate.allowed, false);
  assert.ok(truncGate.reasons.includes("leading-zero-truncation-alias"));
  assert.ok(
    truncGate.reasons.some((r) => r.startsWith("residual-exclusion:")),
  );

  const ambiguous = californiaExclusionControlListingGate({
    facilityNumber: "100400070",
    surface: "search",
    sourceAmbiguousOrUnverified: true,
  });
  assert.equal(ambiguous.allowed, false);
  assert.ok(ambiguous.reasons.includes("source-ambiguous-or-unverified"));
});

test("three decisions remain separate; activation plan reversible and inactive", () => {
  const sep = CALIFORNIA_EXCLUSION_CONTROL_DECISION_SEPARATION;
  assert.equal(sep.exclusionActivation.activated, false);
  assert.equal(sep.eligibilityMappingActivation.activated, false);
  assert.equal(sep.californiaPublicPublication.activated, false);
  assert.notEqual(
    sep.exclusionActivation.id,
    sep.eligibilityMappingActivation.id,
  );
  assert.notEqual(
    sep.exclusionActivation.id,
    sep.californiaPublicPublication.id,
  );
  assert.equal(
    CALIFORNIA_EXCLUSION_CONTROL_ACTIVATION_PLAN.doesNotPublishCalifornia,
    true,
  );
  assert.equal(
    CALIFORNIA_EXCLUSION_CONTROL_ACTIVATION_PLAN.doesNotActivateEligibilityMapping,
    true,
  );
  assert.equal(CALIFORNIA_EXCLUSION_CONTROL_ACTIVATION_PLAN.reversible, true);
  assert.ok(CALIFORNIA_EXCLUSION_CONTROL_ACTIVATION_PLAN.rollback.length >= 3);
  assert.ok(
    CALIFORNIA_EXCLUSION_CONTROL_ACTIVATION_PLAN.monitoringChecks.includes(
      "residual-exclusion-id-absent-from-public-search",
    ),
  );
});

test("approval-readiness matrix and preview arithmetic", () => {
  const preview = buildCaliforniaExclusionControlReadinessPreview();
  assert.equal(preview.arithmeticOk, true);
  assert.equal(preview.stopGoPublic, "STOP");
  assert.equal(preview.stopGoExclusionActivation, "CONDITIONAL");
  assert.ok(preview.matrixStop >= 1);
  assert.ok(
    CALIFORNIA_EXCLUSION_CONTROL_MATRIX.some(
      (r) => r.area === "publication-authorization" && r.status === "STOP",
    ),
  );
  assert.ok(
    CALIFORNIA_EXCLUSION_CONTROL_DECISIONS_REQUIRING_APPROVAL.some(
      (d) => d.id === "activate-california-exclusion-ledger-in-app-db",
    ),
  );
  assert.ok(
    CALIFORNIA_EXCLUSION_CONTROL_DECISIONS_REQUIRING_APPROVAL.some(
      (d) => d.id === "approve-california-statewide-public-publication",
    ),
  );
  assert.equal(preview.counts.publicationEligible, 0);
  assert.equal(preview.exclusionsActivated, false);
});
