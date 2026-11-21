import assert from "node:assert/strict";
import test from "node:test";
import {
  CALIFORNIA_EXCLUSION_ACTIVATION_BUCKET_COUNTS,
  CALIFORNIA_EXCLUSION_ACTIVATION_CACHE_SAFEGUARDS,
  CALIFORNIA_EXCLUSION_ACTIVATION_DECISION_BASELINE,
  CALIFORNIA_EXCLUSION_ACTIVATION_DECISION_MATRIX,
  CALIFORNIA_EXCLUSION_ACTIVATION_DECISION_SEPARATION,
  CALIFORNIA_EXCLUSION_ACTIVATION_DECISIONS_REQUIRING_APPROVAL,
  CALIFORNIA_EXCLUSION_ACTIVATION_LIVE_VERIFICATION,
  CALIFORNIA_EXCLUSION_ACTIVATION_REHEARSAL,
  CALIFORNIA_EXCLUSION_ACTIVATION_REMAINING_RISKS,
  CALIFORNIA_EXCLUSION_ACTIVATION_RESIDUAL_IDS,
  CALIFORNIA_EXCLUSION_ACTIVATION_TRUNCATION_PROBES,
  buildCaliforniaExclusionActivationDecisionPreview,
  californiaExclusionActivationDecisionActivated,
  californiaExclusionActivationDecisionAllowsPublication,
  rehearseCaliforniaExclusionActivation,
  rehearseCaliforniaExclusionRollback,
} from "../../../lib/california-exclusion-activation-decision.ts";

test("baseline #207; inactive; publication STOP", () => {
  assert.equal(CALIFORNIA_EXCLUSION_ACTIVATION_DECISION_BASELINE, "50dbad4");
  assert.equal(californiaExclusionActivationDecisionActivated(), false);
  assert.equal(californiaExclusionActivationDecisionAllowsPublication(), false);
});

test("all 22 residual IDs live-verified with exact matches", () => {
  assert.equal(CALIFORNIA_EXCLUSION_ACTIVATION_RESIDUAL_IDS.length, 22);
  assert.equal(CALIFORNIA_EXCLUSION_ACTIVATION_LIVE_VERIFICATION.length, 22);
  assert.equal(
    new Set(CALIFORNIA_EXCLUSION_ACTIVATION_RESIDUAL_IDS).size,
    22,
  );
  assert.ok(
    CALIFORNIA_EXCLUSION_ACTIVATION_LIVE_VERIFICATION.every(
      (row) => row.identifierExactMatch,
    ),
  );
  assert.equal(
    CALIFORNIA_EXCLUSION_ACTIVATION_BUCKET_COUNTS.missingFirstLicenseDate
      + CALIFORNIA_EXCLUSION_ACTIVATION_BUCKET_COUNTS.provisionalLicense
      + CALIFORNIA_EXCLUSION_ACTIVATION_BUCKET_COUNTS.statusConflict,
    22,
  );
  assert.ok(CALIFORNIA_EXCLUSION_ACTIVATION_RESIDUAL_IDS.includes("079201725"));
  assert.ok(CALIFORNIA_EXCLUSION_ACTIVATION_RESIDUAL_IDS.includes("198320787"));
  assert.ok(CALIFORNIA_EXCLUSION_ACTIVATION_RESIDUAL_IDS.includes("502701867"));
  assert.ok(CALIFORNIA_EXCLUSION_ACTIVATION_RESIDUAL_IDS.includes("019201167"));
  assert.ok(CALIFORNIA_EXCLUSION_ACTIVATION_RESIDUAL_IDS.includes("019201133"));
});

test("truncation probes: CDSS canonicalizes and gates must block aliases", () => {
  assert.equal(CALIFORNIA_EXCLUSION_ACTIVATION_TRUNCATION_PROBES.length, 3);
  for (const probe of CALIFORNIA_EXCLUSION_ACTIVATION_TRUNCATION_PROBES) {
    assert.equal(probe.apiReturned, probe.canonicalId);
    assert.equal(probe.exactSetWouldMissWithoutAlias, true);
    assert.equal(probe.blockedAfterHardening, true);
  }
});

test("offline activation rehearsal keeps mapping and publication independent", () => {
  const alone = rehearseCaliforniaExclusionActivation({
    approveExclusionActivation: true,
  });
  assert.equal(alone.exclusionsActivated, true);
  assert.equal(alone.eligibilityMappingActivated, false);
  assert.equal(alone.californiaPublished, false);
  assert.equal(alone.publicationEligible, 0);
  assert.equal(alone.residualIdsLoaded, 22);
  assert.equal(alone.independenceHeld, true);

  const rollback = rehearseCaliforniaExclusionRollback();
  assert.equal(rollback.exclusionsActivated, false);
  assert.equal(rollback.surfacesFailClosed, true);
  assert.equal(rollback.publicationEligible, 0);
  assert.equal(rollback.californiaPublished, false);
  assert.equal(rollback.eligibilityMappingActivated, false);

  assert.equal(CALIFORNIA_EXCLUSION_ACTIVATION_REHEARSAL.databaseWrites, false);
  assert.equal(
    CALIFORNIA_EXCLUSION_ACTIVATION_REHEARSAL.activation
      .wouldActivateEligibilityMapping,
    false,
  );
  assert.equal(
    CALIFORNIA_EXCLUSION_ACTIVATION_REHEARSAL.activation.wouldPublishCalifornia,
    false,
  );
});

test("three decisions remain separate; cache precondition documented", () => {
  const sep = CALIFORNIA_EXCLUSION_ACTIVATION_DECISION_SEPARATION;
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
  assert.equal(sep.exclusionActivation.activatesEligibilityMapping, false);
  assert.equal(sep.exclusionActivation.publishesCalifornia, false);
  assert.equal(
    CALIFORNIA_EXCLUSION_ACTIVATION_CACHE_SAFEGUARDS
      .cacheKeysMustUseCanonicalFacilityNumber,
    true,
  );
  assert.ok(
    CALIFORNIA_EXCLUSION_ACTIVATION_CACHE_SAFEGUARDS.remainingOperationalPrecondition
      .includes("canonical Facility Number"),
  );
});

test("decision matrix and preview: GO readiness, STOP publication", () => {
  const preview = buildCaliforniaExclusionActivationDecisionPreview();
  assert.equal(preview.arithmeticOk, true);
  assert.equal(preview.finalRecommendation, "GO");
  assert.equal(preview.stopGoExclusionActivationReadiness, "GO");
  assert.equal(preview.stopGoPublic, "STOP");
  assert.equal(preview.exclusionsActivated, false);
  assert.equal(preview.allowsPublication, false);
  assert.ok(preview.matrixStop >= 1);
  assert.ok(
    CALIFORNIA_EXCLUSION_ACTIVATION_DECISION_MATRIX.some(
      (r) => r.area === "public-publication" && r.status === "STOP",
    ),
  );
  assert.ok(
    CALIFORNIA_EXCLUSION_ACTIVATION_DECISIONS_REQUIRING_APPROVAL.some(
      (d) =>
        d.id === "activate-california-exclusion-ledger-in-app-db"
        && d.readyForFutureActivation,
    ),
  );
  assert.ok(
    CALIFORNIA_EXCLUSION_ACTIVATION_REMAINING_RISKS.some(
      (r) => r.id === "california-publication-still-stop",
    ),
  );
});
