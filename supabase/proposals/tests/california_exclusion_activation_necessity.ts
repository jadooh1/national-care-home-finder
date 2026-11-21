import assert from "node:assert/strict";
import test from "node:test";
import {
  CALIFORNIA_EXCLUSION_ACTIVATION_SEQUENCE,
  CALIFORNIA_EXCLUSION_NECESSITY_BASELINE,
  CALIFORNIA_EXCLUSION_NECESSITY_CURRENT_BLOCKS,
  CALIFORNIA_EXCLUSION_NECESSITY_MATRIX,
  CALIFORNIA_EXCLUSION_NECESSITY_RECOMMENDATION,
  CALIFORNIA_EXCLUSION_NECESSITY_STATE,
  buildCaliforniaExclusionActivationNecessityPreview,
  californiaExclusionNecessityActivated,
  californiaExclusionNecessityAllowsPublication,
  californiaExclusionRequiredBeforePublicationWiring,
  californiaLaunchPrepAllowedWhileExclusionsInactive,
} from "../../../lib/california-exclusion-activation-necessity.ts";

test("baseline #208; inactive; publication STOP", () => {
  assert.equal(CALIFORNIA_EXCLUSION_NECESSITY_BASELINE, "54855fd");
  assert.equal(californiaExclusionNecessityActivated(), false);
  assert.equal(californiaExclusionNecessityAllowsPublication(), false);
  assert.equal(CALIFORNIA_EXCLUSION_NECESSITY_STATE.exclusionsActivated, false);
  assert.equal(CALIFORNIA_EXCLUSION_NECESSITY_STATE.publicationEligible, 0);
});

test("inactive exclusions create no current public leak risk; defer recommended", () => {
  assert.equal(
    CALIFORNIA_EXCLUSION_NECESSITY_RECOMMENDATION.verdict,
    "defer-until-prepublication",
  );
  assert.equal(
    CALIFORNIA_EXCLUSION_NECESSITY_RECOMMENDATION
      .activationNecessaryBeforeContinuingLaunchPrep,
    false,
  );
  assert.equal(
    CALIFORNIA_EXCLUSION_NECESSITY_RECOMMENDATION
      .currentSecurityOrPublicationRiskFromInactiveExclusions,
    "none",
  );
  assert.ok(CALIFORNIA_EXCLUSION_NECESSITY_CURRENT_BLOCKS.length >= 7);
  assert.ok(
    CALIFORNIA_EXCLUSION_NECESSITY_CURRENT_BLOCKS.some(
      (b) => b.id === "no-public-california-app-routes",
    ),
  );
  assert.ok(
    CALIFORNIA_EXCLUSION_NECESSITY_CURRENT_BLOCKS.some(
      (b) => b.id === "no-california-listing-queries",
    ),
  );
});

test("launch prep allowed while inactive; publishing or wiring is not", () => {
  const prep = californiaLaunchPrepAllowedWhileExclusionsInactive();
  assert.equal(prep.allowed, true);

  const publish = californiaLaunchPrepAllowedWhileExclusionsInactive({
    wouldPublishCalifornia: true,
  });
  assert.equal(publish.allowed, false);
  assert.ok(publish.reasons.includes("would-publish-california"));

  const wire = californiaLaunchPrepAllowedWhileExclusionsInactive({
    wouldWirePublicListingPaths: true,
  });
  assert.equal(wire.allowed, false);
  assert.ok(wire.reasons.includes("would-wire-public-listing-paths"));
});

test("publication wiring hard-requires activated ledger and wired residual gate", () => {
  const blocked = californiaExclusionRequiredBeforePublicationWiring({
    exclusionsActivated: false,
    residualGateWiredIntoListingPaths: false,
  });
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.reasons.includes("exclusion-ledger-not-activated"));
  assert.ok(blocked.reasons.includes("residual-exclusion-gate-not-wired"));

  const partial = californiaExclusionRequiredBeforePublicationWiring({
    exclusionsActivated: true,
    residualGateWiredIntoListingPaths: false,
  });
  assert.equal(partial.allowed, false);
  assert.ok(partial.reasons.includes("residual-exclusion-gate-not-wired"));

  const ok = californiaExclusionRequiredBeforePublicationWiring({
    exclusionsActivated: true,
    residualGateWiredIntoListingPaths: true,
  });
  assert.equal(ok.allowed, true);
  assert.deepEqual(ok.reasons, []);
});

test("sequence places activation at prepublication, not now", () => {
  const now = CALIFORNIA_EXCLUSION_ACTIVATION_SEQUENCE.filter(
    (s) => s.phase === "now",
  );
  assert.ok(now.length >= 1);
  assert.ok(now.every((s) => !s.requiresExclusionActivation));

  const activate = CALIFORNIA_EXCLUSION_ACTIVATION_SEQUENCE.find(
    (s) => s.id === "approve-and-activate-exclusion-ledger",
  );
  assert.ok(activate);
  assert.equal(activate?.phase, "prepublication");
  assert.equal(activate?.requiresExclusionActivation, true);

  const publish = CALIFORNIA_EXCLUSION_ACTIVATION_SEQUENCE.find(
    (s) => s.id === "statewide-publication",
  );
  assert.equal(publish?.phase, "separate-approval");
  assert.equal(publish?.requiresExclusionActivation, true);
});

test("matrix and preview: DEFER recommendation, STOP publication", () => {
  const preview = buildCaliforniaExclusionActivationNecessityPreview();
  assert.equal(preview.arithmeticOk, true);
  assert.equal(preview.finalRecommendation, "DEFER");
  assert.equal(preview.stopGoPublic, "STOP");
  assert.ok(preview.matrixStop >= 1);
  assert.ok(
    CALIFORNIA_EXCLUSION_NECESSITY_MATRIX.some(
      (r) =>
        r.area === "activation-needed-before-listing-wire-up"
        && r.status === "CONDITIONAL",
    ),
  );
  assert.ok(
    CALIFORNIA_EXCLUSION_NECESSITY_MATRIX.some(
      (r) => r.area === "public-publication" && r.status === "STOP",
    ),
  );
});
