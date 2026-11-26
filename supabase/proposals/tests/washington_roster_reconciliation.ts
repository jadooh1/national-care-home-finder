import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { WASHINGTON_LISTED_COUNT, directoryContract, mapHref } from "../../../lib/state-directory.ts";
import { ownerSignInHref } from "../../../lib/owner-claim.ts";
import {
  WASHINGTON_AUTHORITATIVE_ROSTER,
  WASHINGTON_HUMAN_DECISIONS_2026_11_26,
  WASHINGTON_LIVE_ARCGIS_PROBE,
  WASHINGTON_PUBLICATION_ELIGIBILITY,
  WASHINGTON_REPORTED_EIGHT_ONE_SEVEN_SEVEN,
  WASHINGTON_ROSTER_RECONCILIATION_BLOCKERS,
  WASHINGTON_SURFACE_COUNTS,
  washingtonAuthoritativeListedCount,
  washingtonRosterReconciliationVerdict,
} from "../../../lib/washington-roster-reconciliation.ts";
import { PUBLICATION_READINESS_SUMMARIES } from "../../../lib/publication-eligibility-readiness.ts";

test("authoritative Washington roster is 6,278 unique OP licenses — not 8,177", () => {
  assert.equal(WASHINGTON_LISTED_COUNT, 6278);
  assert.equal(washingtonAuthoritativeListedCount(), 6278);
  assert.equal(WASHINGTON_AUTHORITATIVE_ROSTER.listedHomes, 6278);
  assert.equal(WASHINGTON_AUTHORITATIVE_ROSTER.uniqueLicenses, 6278);
  assert.equal(WASHINGTON_AUTHORITATIVE_ROSTER.duplicateLicenses, 0);
  assert.equal(WASHINGTON_AUTHORITATIVE_ROSTER.nonOpRows, 0);
  assert.equal(WASHINGTON_AUTHORITATIVE_ROSTER.licensedBedsSum, 36521);
  assert.equal(WASHINGTON_AUTHORITATIVE_ROSTER.humanRetainedAsAuthoritative, true);

  const baseline = readFileSync(WASHINGTON_AUTHORITATIVE_ROSTER.baselinePath, "utf8").trim().split("\n");
  assert.equal(baseline.length - 1, 6278);

  assert.equal(WASHINGTON_REPORTED_EIGHT_ONE_SEVEN_SEVEN.reportedTotal, 8177);
  assert.equal(WASHINGTON_REPORTED_EIGHT_ONE_SEVEN_SEVEN.differenceVsAuthoritative, 1899);
  assert.equal(WASHINGTON_REPORTED_EIGHT_ONE_SEVEN_SEVEN.provenanceFound, false);
  assert.equal(WASHINGTON_REPORTED_EIGHT_ONE_SEVEN_SEVEN.treatedAsDuplicates, false);
  assert.equal(WASHINGTON_REPORTED_EIGHT_ONE_SEVEN_SEVEN.excludedFromLaunchAcceptance, true);
  assert.equal(WASHINGTON_REPORTED_EIGHT_ONE_SEVEN_SEVEN.databaseRecordsDeleted, false);
  assert.equal(
    WASHINGTON_REPORTED_EIGHT_ONE_SEVEN_SEVEN.reportedTotal
      - WASHINGTON_AUTHORITATIVE_ROSTER.listedHomes,
    WASHINGTON_REPORTED_EIGHT_ONE_SEVEN_SEVEN.differenceVsAuthoritative,
  );
});

test("live ArcGIS AF archive-null is deferred; archived AF is not the 1,899 residual", () => {
  assert.equal(WASHINGTON_LIVE_ARCGIS_PROBE.rows, 6296);
  assert.equal(WASHINGTON_LIVE_ARCGIS_PROBE.uniqueLicenses, 6296);
  assert.equal(WASHINGTON_LIVE_ARCGIS_PROBE.facilityStatusOp, 6296);
  assert.equal(WASHINGTON_LIVE_ARCGIS_PROBE.netDeltaVsBaseline, 18);
  assert.equal(WASHINGTON_LIVE_ARCGIS_PROBE.refreshDeferredUntilIndependentValidation, true);
  assert.equal(WASHINGTON_LIVE_ARCGIS_PROBE.refreshApplied, false);
  assert.equal(
    WASHINGTON_LIVE_ARCGIS_PROBE.onlyInLiveVsBaseline - WASHINGTON_LIVE_ARCGIS_PROBE.onlyInBaselineVsLive,
    WASHINGTON_LIVE_ARCGIS_PROBE.netDeltaVsBaseline,
  );
  assert.equal(
    WASHINGTON_LIVE_ARCGIS_PROBE.intersectionWithBaseline
      + WASHINGTON_LIVE_ARCGIS_PROBE.onlyInLiveVsBaseline,
    WASHINGTON_LIVE_ARCGIS_PROBE.rows,
  );
  assert.notEqual(WASHINGTON_LIVE_ARCGIS_PROBE.archivedAfWithNonNullGdlArchiveDate, 1899);
  assert.ok(WASHINGTON_LIVE_ARCGIS_PROBE.archivedAfWithNonNullGdlArchiveDate > 100000);
  assert.equal(WASHINGTON_LIVE_ARCGIS_PROBE.archivedNotPublicationEligible, true);
});

test("production directory/map consistent at 6,278; development synthetic explains 6,279 listed view", () => {
  assert.equal(WASHINGTON_SURFACE_COUNTS.productionListedView, 6278);
  assert.equal(WASHINGTON_SURFACE_COUNTS.productionMapView, 6278);
  assert.equal(WASHINGTON_SURFACE_COUNTS.productionSyntheticFixture, 0);
  assert.equal(WASHINGTON_SURFACE_COUNTS.developmentListedViewIncludingSynthetic, 6279);
  assert.equal(WASHINGTON_SURFACE_COUNTS.developmentMapView, 6278);
  assert.equal(WASHINGTON_SURFACE_COUNTS.developmentSyntheticInListedView, 1);
  assert.equal(WASHINGTON_SURFACE_COUNTS.directoryMapConsistentOnProduction, true);
  assert.equal(WASHINGTON_PUBLICATION_ELIGIBILITY.stateAuthorization, "public");
  assert.equal(WASHINGTON_PUBLICATION_ELIGIBILITY.publicationEligibleHomes, 6278);
  assert.equal(WASHINGTON_PUBLICATION_ELIGIBILITY.liveCheck, false);
  assert.equal(WASHINGTON_PUBLICATION_ELIGIBILITY.design2Preserved, true);
});

test("human decisions lock 6278; 8177 excluded; 6296 deferred; S5/S6 secrets remain blocker", () => {
  assert.equal(WASHINGTON_HUMAN_DECISIONS_2026_11_26.retainAuthoritative6278, true);
  assert.equal(WASHINGTON_HUMAN_DECISIONS_2026_11_26.excludeUnproven8177FromLaunchAcceptance, true);
  assert.equal(WASHINGTON_HUMAN_DECISIONS_2026_11_26.documentDiscrepancyWithoutDeletingRecords, true);
  assert.equal(WASHINGTON_HUMAN_DECISIONS_2026_11_26.deferLive6296RefreshUntilIndependentValidation, true);
  assert.equal(WASHINGTON_HUMAN_DECISIONS_2026_11_26.authorizeControlledProductionS5S6WithTestAccounts, true);
  assert.equal(WASHINGTON_HUMAN_DECISIONS_2026_11_26.noProductionDeployOrConfigOrBilling, true);

  const verdict = washingtonRosterReconciliationVerdict();
  assert.equal(verdict.stopGo, "CONDITIONAL");
  assert.equal(verdict.authoritativeListedHomes, 6278);
  assert.equal(verdict.reported8177ExcludedFromLaunchAcceptance, true);
  assert.equal(verdict.reported8177ProvenanceFound, false);
  assert.equal(verdict.reported8177AccountedAsDuplicates, false);
  assert.equal(verdict.databaseRecordsDeletedFor8177, false);
  assert.equal(verdict.live6296RefreshDeferred, true);
  assert.equal(verdict.productionDirectoryMapConsistent, true);
  assert.equal(verdict.requiresHumanApprovalForRosterRefresh, true);
  assert.deepEqual([...verdict.blockers], [...WASHINGTON_ROSTER_RECONCILIATION_BLOCKERS]);
  assert.equal(verdict.blockers.length, 1);
  assert.equal(
    verdict.blockers[0],
    "production-authenticated-s5-s6-needs-nchf-prod-test-account-secrets",
  );

  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.equal(directoryContract("Washington")?.directoryPath, "/washington");
  assert.equal(mapHref("Washington"), "/washington/map");
  assert.equal(ownerSignInHref("754446"), "/owner?mode=login&license=754446");
  assert.equal(ownerSignInHref(null), "/owner?mode=login");

  const ownerPage = readFileSync("app/owner/page.tsx", "utf8");
  assert.match(ownerPage, /params\.get\("mode"\)/);
  assert.match(ownerPage, /setMode\("login"\)/);

  const washington = PUBLICATION_READINESS_SUMMARIES.find((row) => row.state === "Washington");
  assert.ok(washington);
  assert.equal(washington.stopGo, "GO");
  assert.equal(washington.tierCounts.tier3, 6278);

  assert.equal(existsSync("lib/washington-roster-reconciliation.ts"), true);
  assert.equal(
    existsSync("supabase/proposals/20261126270000_washington_roster_reconciliation.md"),
    true,
  );
});
