import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import {
  CALIFORNIA_PHASE17_DECISION_MATRIX,
  californiaPhase17FacilityExcludableExceptions,
  californiaPhase17HumanApprovalsRequired,
  californiaPhase17StatewideBlockers,
  summarizeCaliforniaPhase17DecisionMatrix,
} from "../../../lib/california-phase17-decision-matrix.ts";
import {
  CALIFORNIA_PHASE17_CDSS_CLARIFICATION,
  CALIFORNIA_PHASE17_FRESHNESS_CHANNELS,
  CALIFORNIA_PHASE17_FRESHNESS_REQUIREMENT,
  evaluateCaliforniaPhase17Freshness,
} from "../../../lib/california-phase17-freshness.ts";
import {
  CALIFORNIA_PHASE17_REGRESSION,
  CALIFORNIA_PHASE17_STATEWIDE_LICENSED_MISSING_DATE_IDS,
  californiaPhase17AllowsCoordinateFabrication,
  californiaPhase17ConflictFacilityAllowsOwnerClaim,
  californiaPhase17ConflictFacilityAllowsPublication,
  californiaPhase17ShouldReprobeUnresolvedCoordinates,
  summarizeCaliforniaPhase17ExceptionRisks,
} from "../../../lib/california-phase17-exceptions.ts";
import {
  CALIFORNIA_PHASE17_DISCLOSURE_COVERAGE,
  californiaPhase17AllowsFullRosterCrawlWithoutApproval,
  californiaPhase17ClaimsStatewideDisclosureCoverage,
  evaluateCaliforniaPhase17DisclosureStrategy,
} from "../../../lib/california-phase17-disclosure-strategy.ts";
import {
  CALIFORNIA_PHASE17_OBSERVED_COUNTS,
  assertCaliforniaPhase17ExclusiveAccounting,
  evaluateCaliforniaPhase17Quality,
} from "../../../lib/california-phase17-quality.ts";
import {
  CALIFORNIA_PHASE17_PUBLICATION_STOP_GO,
  CALIFORNIA_PHASE17_READINESS_DECISION,
  californiaPhase17AllowsPublication,
  evaluateCaliforniaPhase17Readiness,
} from "../../../lib/california-phase17-readiness.ts";
import {
  assembleCaliforniaPhase17LaunchDossier,
  californiaPhase17LaunchAllowsPublication,
} from "../../../lib/california-phase17-launch-readiness.ts";
import { directoryContract } from "../../../lib/state-directory.ts";

const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/california-phase17-launch-readiness",
);

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8")) as T;
}

test("decision matrix separates statewide blockers from facility-excludable exceptions", () => {
  const summary = summarizeCaliforniaPhase17DecisionMatrix();
  assert.equal(summary.gate, "blocked");
  assert.equal(summary.allowsPublication, false);
  assert.equal(summary.publicationReady, false);
  assert.ok(summary.statewidePublicationBlockersOpen.includes("authoritative-iso-export-date"));
  assert.ok(summary.statewidePublicationBlockersOpen.includes("roster-wide-facilitydetail-status"));
  assert.ok(summary.statewidePublicationBlockersOpen.includes("disclosure-link-roster-coverage"));
  assert.ok(
    summary.facilityExcludableExceptions.includes("licensed-missing-initial-date-statewide"),
  );
  assert.ok(summary.facilityExcludableExceptions.includes("official-coordinates-completeness"));

  const freshnessRow = CALIFORNIA_PHASE17_DECISION_MATRIX.find(
    r => r.id === "authoritative-iso-export-date",
  );
  assert.equal(freshnessRow?.canMitigateByExcludingFacilities, false);
  assert.equal(freshnessRow?.preventsStatewidePublication, true);

  const missingDate = CALIFORNIA_PHASE17_DECISION_MATRIX.find(
    r => r.id === "licensed-missing-initial-date-statewide",
  );
  assert.equal(missingDate?.canMitigateByExcludingFacilities, true);
  assert.equal(missingDate?.preventsStatewidePublication, false);

  assert.equal(californiaPhase17StatewideBlockers().length > 0, true);
  assert.equal(californiaPhase17FacilityExcludableExceptions().length > 0, true);
  assert.equal(californiaPhase17HumanApprovalsRequired().length > 0, true);

  const fixture = loadJson<{
    gate: string;
    statewidePublicationBlockersOpen: string[];
  }>("decision-matrix.json");
  assert.equal(fixture.gate, "blocked");
  assert.ok(fixture.statewidePublicationBlockersOpen.includes("authoritative-iso-export-date"));
});

test("freshness: no authoritative ISO; mailbox unavailable; no duplicate inquiry", () => {
  const freshness = evaluateCaliforniaPhase17Freshness();
  assert.equal(freshness.authoritativeIsoExportDate, null);
  assert.equal(freshness.freshnessRequirementSatisfied, false);
  assert.equal(freshness.gate, "blocked");
  assert.equal(freshness.allowsPublication, false);
  assert.equal(freshness.acceptedAuthoritativeIsoChannels, 0);
  assert.equal(CALIFORNIA_PHASE17_FRESHNESS_REQUIREMENT.acceptsFilenameMmddyyyyAlone, false);
  assert.equal(CALIFORNIA_PHASE17_FRESHNESS_REQUIREMENT.acceptsWeeklyUpdateFaqAlone, false);
  assert.equal(CALIFORNIA_PHASE17_CDSS_CLARIFICATION.duplicateInquiryAllowed, false);
  assert.equal(CALIFORNIA_PHASE17_CDSS_CLARIFICATION.status, "sent-awaiting-response");
  assert.equal(CALIFORNIA_PHASE17_CDSS_CLARIFICATION.mailboxCheck.available, false);
  assert.equal(CALIFORNIA_PHASE17_CDSS_CLARIFICATION.mailboxCheck.duplicateInquirySent, false);
  assert.ok(
    CALIFORNIA_PHASE17_FRESHNESS_CHANNELS.some(c => c.id === "cdss-clarification-mailbox-check"
      && c.verdict === "mailbox-unavailable"),
  );
  assert.equal(
    CALIFORNIA_PHASE17_FRESHNESS_CHANNELS.filter(c => c.verdict === "accepted-authoritative-iso")
      .length,
    0,
  );

  const matched = evaluateCaliforniaPhase17Freshness({
    downloadSha256: {
      rcfe: "e7de752883225faec4d5b0d73007cad48b9039370219514f40e84881f348728e",
      arf: "f2cf8a87d0b91534564136c52b02dcd4827a39369504c064f190201981889fbe",
    },
  });
  assert.equal(matched.downloadSha256MatchesBaseline, true);

  const fixture = loadJson<{
    authoritativeIsoExportDate: string | null;
    gate: string;
    cdssClarification: { duplicateInquiryAllowed: boolean; status: string };
  }>("freshness-channels.json");
  assert.equal(fixture.authoritativeIsoExportDate, null);
  assert.equal(fixture.gate, "blocked");
  assert.equal(fixture.cdssClarification.duplicateInquiryAllowed, false);
  assert.equal(fixture.cdssClarification.status, "sent-awaiting-response");
});

test("exception risks: 14 statewide missing-date + sampled conflicts remain ineligible", () => {
  assert.equal(CALIFORNIA_PHASE17_STATEWIDE_LICENSED_MISSING_DATE_IDS.length, 14);
  const risks = summarizeCaliforniaPhase17ExceptionRisks();
  assert.equal(risks.phase16SampledFindings, 21);
  assert.equal(risks.phase16StatewideLicensedMissingDate, 14);
  assert.equal(risks.preservesFailClosed, true);
  assert.equal(risks.allowsFabrication, false);
  assert.equal(risks.avoidsRepeatingUnsuccessfulCoordChecks, true);
  assert.equal(risks.publicationEligibleAnyExceptionRow, false);
  assert.equal(risks.statewidePublicationBlockersFromExceptionsAlone.length, 0);
  assert.equal(californiaPhase17AllowsCoordinateFabrication(), false);
  assert.equal(californiaPhase17ShouldReprobeUnresolvedCoordinates(false), false);
  assert.equal(californiaPhase17ShouldReprobeUnresolvedCoordinates(true), true);
  assert.equal(californiaPhase17ConflictFacilityAllowsPublication(), false);
  assert.equal(californiaPhase17ConflictFacilityAllowsOwnerClaim(), false);
  assert.equal(CALIFORNIA_PHASE17_REGRESSION.unresolvedCoordsBaseline, 28);
  assert.equal(CALIFORNIA_PHASE17_REGRESSION.statusConflictUnknownIneligible, "502701867");
  assert.equal(CALIFORNIA_PHASE17_REGRESSION.invalidIdRefuseClosed, "95354");

  const fixture = loadJson<{
    phase16StatewideLicensedMissingDate: number;
    preservesFailClosed: boolean;
  }>("exception-risks.json");
  assert.equal(fixture.phase16StatewideLicensedMissingDate, 14);
  assert.equal(fixture.preservesFailClosed, true);
});

test("disclosure strategy: pause small samples; full roster needs separate approval", () => {
  const strategy = evaluateCaliforniaPhase17DisclosureStrategy();
  assert.equal(strategy.additionalSmallSamplesMeaningfullyImproveLaunchReadiness, false);
  assert.equal(strategy.decision, "pause-small-incremental-samples");
  assert.equal(strategy.proposedFullRosterPlan.requiresSeparateHumanApproval, true);
  assert.equal(strategy.proposedFullRosterPlan.performNow, false);
  assert.equal(strategy.allowsUncontrolledStatewideRequests, false);
  assert.equal(strategy.coverage.cumulativeVerifiedCount, 462);
  assert.equal(strategy.coverage.rosterDenominator, 15451);
  assert.equal(strategy.coverage.statewideCoverageClaimed, false);
  assert.equal(CALIFORNIA_PHASE17_DISCLOSURE_COVERAGE.cumulativeVerifiedCount, 462);
  assert.equal(californiaPhase17ClaimsStatewideDisclosureCoverage(), false);
  assert.equal(californiaPhase17AllowsFullRosterCrawlWithoutApproval(), false);

  const fixture = loadJson<{
    decision: string;
    coverage: { cumulativeVerifiedCount: number; statewideCoverageClaimed: boolean };
    proposedFullRosterPlan: { performNow: boolean; requiresSeparateHumanApproval: boolean };
  }>("disclosure-strategy.json");
  assert.equal(fixture.decision, "pause-small-incremental-samples");
  assert.equal(fixture.coverage.cumulativeVerifiedCount, 462);
  assert.equal(fixture.coverage.statewideCoverageClaimed, false);
  assert.equal(fixture.proposedFullRosterPlan.performNow, false);
  assert.equal(fixture.proposedFullRosterPlan.requiresSeparateHumanApproval, true);
});

test("readiness gate stays blocked; stop/go is STOP; accounting preserved", () => {
  const readiness = evaluateCaliforniaPhase17Readiness();
  assert.equal(readiness.gate, "blocked");
  assert.equal(readiness.publicationReady, false);
  assert.equal(readiness.allowsPublication, false);
  assert.equal(californiaPhase17AllowsPublication(), false);
  assert.equal(californiaPhase17LaunchAllowsPublication(), false);
  assert.equal(readiness.publication, "unpublished");
  assert.equal(readiness.ownerClaimEligible, false);
  assert.equal(readiness.authoritativeIsoExportDate, null);
  assert.equal(readiness.cdssClarification.duplicateInquiryAllowed, false);
  assert.equal(readiness.cdssClarification.status, "sent-awaiting-response");
  assert.equal(readiness.cdssClarification.mailboxCheckAvailable, false);
  assert.equal(readiness.baselinePreserved.officialRecords, 24377);
  assert.equal(readiness.baselinePreserved.activeRestrictedCandidates, 15451);
  assert.equal(readiness.baselinePreserved.verifiedCoords, 15423);
  assert.equal(readiness.baselinePreserved.unresolvedCoords, 28);
  assert.equal(readiness.disclosureAudit.cumulativeVerifiedCount, 462);
  assert.equal(readiness.disclosureAudit.additionalSmallSamplesRecommended, false);
  assert.equal(readiness.disclosureAudit.fullRosterCrawlRequiresSeparateApproval, true);
  assert.equal(readiness.exceptions.statewideLicensedMissingDate, 14);
  assert.equal(readiness.exceptions.sampledFindings, 21);
  assert.equal(readiness.exceptions.allowsFabrication, false);
  assert.equal(readiness.statusMapping.inventedClosedStarEquivalence, false);
  assert.equal(readiness.statusMapping.treatsWithdrawnAsLicensed, false);
  assert.equal(CALIFORNIA_PHASE17_PUBLICATION_STOP_GO.recommendation, "STOP");
  assert.equal(CALIFORNIA_PHASE17_PUBLICATION_STOP_GO.publicationReady, false);
  assert.ok(CALIFORNIA_PHASE17_PUBLICATION_STOP_GO.agentMustNot.includes("open-or-weaken-publication-gate"));
  assert.ok(CALIFORNIA_PHASE17_PUBLICATION_STOP_GO.agentMustNot.includes("send-duplicate-cdss-inquiry"));
  assert.deepEqual(readiness, CALIFORNIA_PHASE17_READINESS_DECISION);

  const accounting = assertCaliforniaPhase17ExclusiveAccounting(
    CALIFORNIA_PHASE17_OBSERVED_COUNTS.buckets,
    CALIFORNIA_PHASE17_OBSERVED_COUNTS.rowCount,
  );
  assert.equal(accounting.holds, true);
  assert.equal(accounting.rowCount, 24377);

  const quality = evaluateCaliforniaPhase17Quality();
  assert.equal(quality.gate, "blocked");
  assert.equal(quality.allowsPublication, false);
  assert.equal(quality.verifiedCoverage.cumulativeVerifiedCount, 462);
  assert.equal(quality.verifiedCoverage.statewideCoverageClaimed, false);

  const dossier = assembleCaliforniaPhase17LaunchDossier({
    decisionMatrixSummary: {
      statewidePublicationBlockersOpen: ["authoritative-iso-export-date"],
      facilityExcludableExceptions: ["licensed-missing-initial-date-statewide"],
      humanApprovalsRequired: ["check-cdss-mailbox-and-interpret-reply"],
    },
    freshness: {
      authoritativeIsoExportDate: null,
      downloadSha256MatchesBaseline: true,
      cdssReplyObserved: false,
      mailboxAvailable: false,
      gate: "blocked",
    },
    exceptions: {
      phase16SampledFindings: 21,
      phase16StatewideLicensedMissingDate: 14,
      preservesFailClosed: true,
      avoidsRepeatingUnsuccessfulCoordChecks: true,
    },
    disclosure: {
      cumulativeVerifiedCount: 462,
      rosterDenominator: 15451,
      additionalSmallSamplesRecommended: false,
      fullRosterCrawlRequiresSeparateApproval: true,
      statewideCoverageClaimed: false,
    },
    accounting: {
      officialRecords: 24377,
      activeRestrictedCandidates: 15451,
      verifiedCoords: 15423,
      unresolvedCoords: 28,
    },
    stopGo: { recommendation: "STOP", publicationReady: false },
    humanDecisionsRequired: [...readiness.humanDecisionsRequired],
  });
  assert.equal(dossier.gate, "blocked");
  assert.equal(dossier.allowsPublication, false);
  assert.equal(dossier.publicationReady, false);
  assert.equal(dossier.stopGo.recommendation, "STOP");

  const readinessFixture = loadJson<{
    gate: string;
    publicationReady: boolean;
    stopGo: { recommendation: string };
    cdssClarification: { duplicateInquiryAllowed: boolean };
  }>("readiness-report.json");
  assert.equal(readinessFixture.gate, "blocked");
  assert.equal(readinessFixture.publicationReady, false);
  assert.equal(readinessFixture.stopGo.recommendation, "STOP");
  assert.equal(readinessFixture.cdssClarification.duplicateInquiryAllowed, false);

  assert.equal(californiaDirectoryReady(), false);
  assert.equal(directoryContract("California")?.publication, "unpublished");
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.ok(
    directoryContract("Oregon")?.publication === "public"
      || directoryContract("Oregon")?.publication === "development",
  );
});
