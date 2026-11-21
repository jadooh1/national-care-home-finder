import assert from "node:assert/strict";
import test from "node:test";
import {
  CALIFORNIA_PENDING_INCREASE_POLICY_BASELINE,
  CALIFORNIA_PENDING_INCREASE_POLICY_DECISION_REQUIRING_APPROVAL,
  CALIFORNIA_PENDING_INCREASE_POLICY_IDS,
  CALIFORNIA_PENDING_INCREASE_POLICY_STATUS,
  CALIFORNIA_PENDING_INCREASE_PROPOSED_RULES,
  CALIFORNIA_POLICY_MISSING_FIRST_DATE_IDS,
  CALIFORNIA_POLICY_PRIOR_CONFLICT_IDS,
  CALIFORNIA_POLICY_PROVISIONAL_IDS,
  buildCaliforniaPendingIncreasePublicationPolicyPreview,
  californiaPendingIncreasePublicationPolicyAllowsPublication,
  californiaPendingIncreasePublicationPolicyDirectoryReady,
  evaluateCaliforniaPendingIncreasePublicationPolicy,
  simulateCaliforniaPendingIncreasePublicationPolicy,
} from "../../../lib/california-pending-increase-publication-policy.ts";

test("baseline #201; policy not approved; publication STOP", () => {
  assert.equal(CALIFORNIA_PENDING_INCREASE_POLICY_BASELINE, "41338bb");
  assert.equal(CALIFORNIA_PENDING_INCREASE_POLICY_STATUS.humanApproved, false);
  assert.equal(
    CALIFORNIA_PENDING_INCREASE_POLICY_STATUS.activatedInApplicationOrDatabase,
    false,
  );
  assert.equal(californiaPendingIncreasePublicationPolicyAllowsPublication(), false);
  assert.equal(californiaPendingIncreasePublicationPolicyDirectoryReady(), false);
});

test("exact approval decision is documented for human review", () => {
  const d = CALIFORNIA_PENDING_INCREASE_POLICY_DECISION_REQUIRING_APPROVAL;
  assert.equal(
    d.id,
    "approve-licensed-pending-increase-future-publication-mapping",
  );
  assert.equal(d.approvalState, "awaiting-human-approval");
  assert.equal(d.appliesToFacilityCount, 66);
  assert.equal(d.doesNotActivateExclusions, true);
  assert.equal(d.doesNotPublishCalifornia, true);
  assert.match(d.decisionText, /Licensed\/Pending Increase/);
  assert.match(d.decisionText, /approved capacity/i);
  assert.match(d.decisionText, /never inventing/);
  assert.match(d.decisionText, /14 missing/);
});

test("proposed rules require CDSS agreement and refuse effective-date substitution", () => {
  const r = CALIFORNIA_PENDING_INCREASE_PROPOSED_RULES;
  assert.equal(r.requireDownloadAndDetailCapacityAgreement, true);
  assert.equal(r.neverInventProposedCapacityIncrease, true);
  assert.equal(r.neverSubstituteEffectiveDateForFirstDate, true);
  assert.equal(r.continueExcludingMissingFirstLicenseDates, true);
  assert.equal(r.continueExcludingProvisionalConflicts, true);
  assert.equal(r.continueExcludingPriorStatusConflicts, true);
  assert.equal(r.arcgisStatusCannotSatisfyAgreement, true);
  assert.equal(r.futureConsiderationIsNotPublicationApproval, true);
});

test("ledger sizes: 66 pending, 14 missing, 5 provisional, 3 prior", () => {
  assert.equal(CALIFORNIA_PENDING_INCREASE_POLICY_IDS.length, 66);
  assert.equal(CALIFORNIA_POLICY_MISSING_FIRST_DATE_IDS.length, 14);
  assert.equal(CALIFORNIA_POLICY_PROVISIONAL_IDS.length, 5);
  assert.equal(CALIFORNIA_POLICY_PRIOR_CONFLICT_IDS.length, 3);
});

test("pending increase without approval stays excluded even when CDSS agrees", () => {
  const result = evaluateCaliforniaPendingIncreasePublicationPolicy({
    facilityNumber: "374604742",
    downloadStatus: "LICENSED",
    facilityDetailStatus: "Licensed/Pending Increase",
    downloadCapacity: "4",
    facilityDetailCapacity: "4",
    downloadLicenseFirstDate: "9/17/2024",
    facilityDetailLicenseFirstDate: "9/17/2024",
    liveFacilityNumber: "374604742",
  });
  assert.equal(result.cdssSourcesAgree, true);
  assert.equal(result.existingLicenseRecognized, true);
  assert.equal(result.approvedCapacity, "4");
  assert.equal(result.proposedCapacityIncrease, null);
  assert.equal(result.futurePublicationCandidateIfPolicyApproved, false);
  assert.equal(result.publicationApproved, false);
  assert.ok(result.gateFailures.includes("policy-not-human-approved"));
  assert.ok(result.gateFailures.includes("statewide-publication-still-blocked"));
});

test("simulation with policy approved yields future candidate but not publication", () => {
  const result = evaluateCaliforniaPendingIncreasePublicationPolicy({
    facilityNumber: "374604742",
    downloadStatus: "LICENSED",
    facilityDetailStatus: "Licensed/Pending Increase",
    downloadCapacity: "4",
    facilityDetailCapacity: "4",
    downloadLicenseFirstDate: "9/17/2024",
    facilityDetailLicenseFirstDate: "9/17/2024",
    liveFacilityNumber: "374604742",
    simulatePolicyApproved: true,
    statewidePublicationBlocked: true,
  });
  assert.equal(result.futurePublicationCandidateIfPolicyApproved, true);
  assert.equal(result.publicationApproved, false);
  assert.ok(result.gateFailures.includes("statewide-publication-still-blocked"));
});

test("capacity disagreement fails closed", () => {
  const result = evaluateCaliforniaPendingIncreasePublicationPolicy({
    facilityNumber: "015601083",
    downloadStatus: "LICENSED",
    facilityDetailStatus: "Licensed/Pending Increase",
    downloadCapacity: "99",
    facilityDetailCapacity: "120",
    downloadLicenseFirstDate: "11/23/2004",
    liveFacilityNumber: "015601083",
    simulatePolicyApproved: true,
  });
  assert.equal(result.cdssSourcesAgree, false);
  assert.equal(result.futurePublicationCandidateIfPolicyApproved, false);
  assert.ok(result.gateFailures.includes("capacity-disagreement"));
});

test("missing first-date facility stays excluded; effective date refused", () => {
  const result = evaluateCaliforniaPendingIncreasePublicationPolicy({
    facilityNumber: "502701889",
    downloadStatus: "LICENSED",
    facilityDetailStatus: "Licensed",
    downloadCapacity: "6",
    facilityDetailCapacity: "6",
    downloadLicenseFirstDate: "",
    facilityDetailLicenseFirstDate: null,
    facilityDetailLicenseEffectiveDate: "9/22/2026",
    liveFacilityNumber: "502701889",
    simulatePolicyApproved: true,
  });
  assert.equal(result.futurePublicationCandidateIfPolicyApproved, false);
  assert.ok(result.gateFailures.includes("missing-first-date-facility"));
  assert.ok(result.gateFailures.includes("effective-date-substitution-refused"));
  assert.ok(result.gateFailures.includes("download-license-first-date-missing"));
});

test("provisional and prior conflicts remain excluded", () => {
  const provisional = evaluateCaliforniaPendingIncreasePublicationPolicy({
    facilityNumber: "198320787",
    downloadStatus: "LICENSED",
    facilityDetailStatus: "Provisional License",
    downloadCapacity: "4",
    facilityDetailCapacity: "4",
    downloadLicenseFirstDate: "8/12/2026",
    liveFacilityNumber: "198320787",
    simulatePolicyApproved: true,
  });
  assert.ok(provisional.gateFailures.includes("provisional-conflict-facility"));
  assert.equal(provisional.futurePublicationCandidateIfPolicyApproved, false);

  const prior = evaluateCaliforniaPendingIncreasePublicationPolicy({
    facilityNumber: "502701867",
    downloadStatus: "LICENSED",
    facilityDetailStatus: "Pending Incomplete Application",
    downloadCapacity: "6",
    facilityDetailCapacity: "6",
    downloadLicenseFirstDate: "",
    liveFacilityNumber: "502701867",
    simulatePolicyApproved: true,
  });
  assert.ok(prior.gateFailures.includes("prior-status-conflict-facility"));
  assert.equal(prior.futurePublicationCandidateIfPolicyApproved, false);
});

test("mismatched identifier and ArcGIS-only status fail closed", () => {
  const mismatch = evaluateCaliforniaPendingIncreasePublicationPolicy({
    facilityNumber: "015601302",
    downloadStatus: "LICENSED",
    facilityDetailStatus: "Licensed",
    downloadCapacity: "6",
    facilityDetailCapacity: "6",
    downloadLicenseFirstDate: "5/20/2010",
    liveFacilityNumber: "15601302",
    simulatePolicyApproved: true,
  });
  assert.ok(mismatch.gateFailures.includes("invalid-or-mismatched-facility-number"));

  const arcgisOnly = evaluateCaliforniaPendingIncreasePublicationPolicy({
    facilityNumber: "374604742",
    downloadStatus: "LICENSED",
    facilityDetailStatus: null,
    downloadCapacity: "4",
    facilityDetailCapacity: "4",
    downloadLicenseFirstDate: "9/17/2024",
    liveFacilityNumber: "374604742",
    arcgisStatusInteger: 3,
    simulatePolicyApproved: true,
  });
  assert.ok(arcgisOnly.gateFailures.includes("facility-detail-status-not-allowed"));
  assert.ok(arcgisOnly.gateFailures.includes("arcgis-status-rejected-as-agreement"));
  assert.equal(arcgisOnly.futurePublicationCandidateIfPolicyApproved, false);
});

test("impact simulation: 88→22 exclusions hypothetical; publicationEligible stays 0", () => {
  const sim = simulateCaliforniaPendingIncreasePublicationPolicy();
  assert.equal(sim.policyApproved, false);
  assert.equal(sim.current.listingExclusionsOffline, 88);
  assert.equal(sim.current.otherwiseClearOffline, 15363);
  assert.equal(
    sim.hypotheticalIfPolicyApprovedAndCdssAgree.pendingIncreaseFutureCandidates,
    66,
  );
  assert.equal(
    sim.hypotheticalIfPolicyApprovedAndCdssAgree.listingExclusionsRemaining,
    22,
  );
  assert.equal(
    sim.hypotheticalIfPolicyApprovedAndCdssAgree.otherwiseClearOffline,
    15429,
  );
  assert.equal(
    sim.hypotheticalIfPolicyApprovedAndCdssAgree.missingFirstDateStillExcluded,
    14,
  );
  assert.equal(sim.hypotheticalIfPolicyApprovedAndCdssAgree.publicationEligible, 0);

  const preview = buildCaliforniaPendingIncreasePublicationPolicyPreview();
  assert.equal(preview.arithmeticOk, true);
  assert.equal(preview.stopGoPublic, "STOP");
  assert.ok(
    preview.remainingBlockers.includes(
      "awaiting-human-approval-of-pending-increase-publication-mapping",
    ),
  );
});
