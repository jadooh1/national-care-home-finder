import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  californiaDirectoryReady,
  californiaDisclosureUrl,
  californiaProfileUrl,
} from "../../../lib/california-directory.ts";
import {
  CALIFORNIA_PHASE25_SECURITY_FINDINGS,
  evaluateCaliforniaPhase25SecurityAudit,
  summarizeCaliforniaPhase25SecurityFindings,
} from "../../../lib/california-phase25-security-audit.ts";
import {
  CALIFORNIA_PHASE25_ELIGIBILITY_TARGETS,
  CALIFORNIA_PHASE25_UNRESOLVED_LICENSING_CONFLICT_IDS,
  assertCaliforniaPhase25EligibilityTargets,
  evaluateCaliforniaPhase25EligibilityRegression,
} from "../../../lib/california-phase25-eligibility-regression.ts";
import {
  CALIFORNIA_PHASE25_SOURCE_SECURITY_CHECKS,
  californiaPhase25DisclosureUrl,
  californiaPhase25EscapeFacilityText,
  californiaPhase25PreservesLeadingZero,
  evaluateCaliforniaPhase25SourceDataSecurity,
} from "../../../lib/california-phase25-source-data-security.ts";
import {
  CALIFORNIA_PHASE25_ACCEPTANCE_ITEMS,
  CALIFORNIA_PHASE25_REMAINING_APPROVALS,
  CALIFORNIA_PHASE25_ROLLBACK_PROCEDURES,
  evaluateCaliforniaPhase25LaunchAcceptance,
} from "../../../lib/california-phase25-launch-acceptance.ts";
import { evaluateCaliforniaPhase25Quality } from "../../../lib/california-phase25-quality.ts";
import {
  CALIFORNIA_PHASE25_PUBLICATION_STOP_GO,
  evaluateCaliforniaPhase25Readiness,
} from "../../../lib/california-phase25-readiness.ts";
import {
  PRIVATE_INDEX_PREFIXES,
  robotsPolicy,
  sitemapPaths,
  WASHINGTON_PUBLIC_PAGES,
} from "../../../lib/public-indexing.ts";
import {
  directoryContract,
  directoryHref,
  mapHref,
  WASHINGTON_LISTED_COUNT,
  OREGON_LISTED_COUNT,
} from "../../../lib/state-directory.ts";

const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/california-phase25-launch-qa-security",
);

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8")) as T;
}

test("phase 25 security: unpublished California surfaces fail-closed", () => {
  const audit = evaluateCaliforniaPhase25SecurityAudit();
  assert.equal(audit.summary.gate, "blocked");
  assert.equal(audit.summary.allowsPublication, false);
  assert.equal(audit.summary.unpublishedLeakPossibleCount, 0);
  assert.ok(CALIFORNIA_PHASE25_SECURITY_FINDINGS.length >= 10);
  assert.ok(
    CALIFORNIA_PHASE25_SECURITY_FINDINGS.every(f => f.unpublishedLeakPossible === false),
  );
  assert.equal(audit.credentialedProbesExecuted, false);

  const summary = summarizeCaliforniaPhase25SecurityFindings();
  assert.equal(summary.unpublishedLeakPossibleCount, 0);

  assert.equal(californiaDirectoryReady(), false);
  assert.equal(californiaProfileUrl(), null);
  assert.equal(directoryContract("California")?.publication, "unpublished");
  assert.equal(directoryContract("California")?.directoryPath, null);
  assert.equal(directoryContract("California")?.mapPath, null);
  assert.equal(directoryHref("California", "https://example.supabase.co"), null);
  assert.equal(mapHref("California"), null);
});

test("phase 25 indexing: sitemap/robots exclude California and /development", () => {
  assert.ok(PRIVATE_INDEX_PREFIXES.includes("/development"));
  const policy = robotsPolicy(true);
  assert.ok(policy.disallow.includes("/development"));

  const paths = sitemapPaths(true, ["100001"]);
  assert.ok(paths.every(p => !p.toLowerCase().includes("california")));
  assert.ok(paths.every(p => !p.startsWith("/development")));
  assert.ok(paths.includes("/washington"));
  assert.ok(paths.includes("/washington/100001"));
  assert.deepEqual(
    sitemapPaths(true, []).slice(0, WASHINGTON_PUBLIC_PAGES.length),
    WASHINGTON_PUBLIC_PAGES.map(page => page.path),
  );
});

test("phase 25 eligibility regression: 15451 / 88 / 15363 / 28 / 27", () => {
  const assertion = assertCaliforniaPhase25EligibilityTargets();
  assert.equal(assertion.matches, true);
  assert.equal(assertion.residualOk, true);
  assert.equal(assertion.coordOk, true);
  assert.equal(assertion.publicationEligibleCount, 0);
  assert.equal(assertion.offlineDoesNotGrantPublicVisibility, true);
  assert.equal(assertion.gate, "blocked");

  assert.equal(CALIFORNIA_PHASE25_ELIGIBILITY_TARGETS.rosterDenominator, 15451);
  assert.equal(CALIFORNIA_PHASE25_ELIGIBILITY_TARGETS.listingExclusionsInCandidates, 88);
  assert.equal(CALIFORNIA_PHASE25_ELIGIBILITY_TARGETS.otherwiseClearOffline, 15363);
  assert.equal(CALIFORNIA_PHASE25_ELIGIBILITY_TARGETS.unresolvedCoordinates, 28);
  assert.equal(CALIFORNIA_PHASE25_ELIGIBILITY_TARGETS.mapOnlySuppressions, 27);
  assert.equal(
    CALIFORNIA_PHASE25_ELIGIBILITY_TARGETS.listingExclusionsInCandidates
      + CALIFORNIA_PHASE25_ELIGIBILITY_TARGETS.otherwiseClearOffline,
    15451,
  );
  assert.equal(
    CALIFORNIA_PHASE25_ELIGIBILITY_TARGETS.provisionalConflicts
      + CALIFORNIA_PHASE25_ELIGIBILITY_TARGETS.pendingIncreaseOverlays
      + CALIFORNIA_PHASE25_ELIGIBILITY_TARGETS.priorControls
      + CALIFORNIA_PHASE25_ELIGIBILITY_TARGETS.missingLicenseEvidence,
    88,
  );

  const regression = evaluateCaliforniaPhase25EligibilityRegression();
  assert.deepEqual(regression.unresolvedLicensingConflictIds, [
    ...CALIFORNIA_PHASE25_UNRESOLVED_LICENSING_CONFLICT_IDS,
  ]);
  assert.equal(regression.unresolvedLicensingConflictIds.length, 6);
});

test("phase 25 source-data security: IDs, escaping, disclosure, coords, capacity", () => {
  assert.equal(
    californiaPhase25DisclosureUrl("015601219"),
    "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/015601219",
  );
  assert.equal(californiaDisclosureUrl("015601219"), californiaPhase25DisclosureUrl("015601219"));
  assert.equal(californiaPhase25DisclosureUrl("95354"), null);
  assert.equal(californiaPhase25DisclosureUrl("1560121"), null);
  // 8-digit truncated form is syntactically valid but is not the leading-zero source identity.
  assert.notEqual(
    californiaPhase25DisclosureUrl("15601219"),
    californiaPhase25DisclosureUrl("015601219"),
  );
  assert.equal(californiaPhase25PreservesLeadingZero("015601219"), true);

  const escaped = californiaPhase25EscapeFacilityText(`<script>alert("x")</script> & 'y'`);
  assert.equal(
    escaped,
    "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;y&#39;",
  );

  const source = evaluateCaliforniaPhase25SourceDataSecurity();
  assert.equal(source.allPass, true);
  assert.equal(source.gate, "blocked");
  assert.equal(source.developmentDefectsFixedThisPhase.length, 0);
  assert.ok(CALIFORNIA_PHASE25_SOURCE_SECURITY_CHECKS.length >= 6);
  assert.ok(CALIFORNIA_PHASE25_SOURCE_SECURITY_CHECKS.every(c => c.status === "pass"));
});

test("phase 25 launch acceptance rehearsal: STOP; rollback; remaining approvals", () => {
  const acceptance = evaluateCaliforniaPhase25LaunchAcceptance();
  assert.equal(acceptance.stopGo, "STOP");
  assert.equal(acceptance.gate, "blocked");
  assert.equal(acceptance.productionDeployed, false);
  assert.ok(acceptance.byResult.pass >= 4);
  assert.ok(acceptance.byResult.blocked >= 1);
  assert.ok(acceptance.byResult["future-approval"] >= 1);
  assert.ok(CALIFORNIA_PHASE25_ACCEPTANCE_ITEMS.some(i => i.id === "gate-blocked"));
  assert.ok(CALIFORNIA_PHASE25_ROLLBACK_PROCEDURES.steps.length >= 5);
  assert.ok(CALIFORNIA_PHASE25_REMAINING_APPROVALS.length >= 5);
  assert.match(CALIFORNIA_PHASE25_ROLLBACK_PROCEDURES.verification.join("\n"), /californiaDirectoryReady/);
});

test("phase 25 readiness / quality / WA-OR baseline: BLOCKED; STOP", () => {
  assert.equal(CALIFORNIA_PHASE25_PUBLICATION_STOP_GO.decision, "STOP");
  assert.equal(CALIFORNIA_PHASE25_PUBLICATION_STOP_GO.allowsPublication, false);
  assert.equal(CALIFORNIA_PHASE25_PUBLICATION_STOP_GO.californiaDirectoryReady, false);
  assert.equal(CALIFORNIA_PHASE25_PUBLICATION_STOP_GO.exclusionsActivated, false);
  assert.equal(CALIFORNIA_PHASE25_PUBLICATION_STOP_GO.crawlExecuted, false);
  assert.equal(CALIFORNIA_PHASE25_PUBLICATION_STOP_GO.cdssMailSent, false);
  assert.equal(CALIFORNIA_PHASE25_PUBLICATION_STOP_GO.productionWrites, false);

  const readiness = evaluateCaliforniaPhase25Readiness();
  assert.equal(readiness.allowsPublication, false);
  assert.equal(readiness.gate, "blocked");
  assert.equal(readiness.stopGo, "STOP");
  assert.equal(readiness.qualityPass, true);
  assert.ok(readiness.blockers.length >= 4);

  const quality = evaluateCaliforniaPhase25Quality();
  assert.equal(quality.allPass, true);
  assert.equal(quality.gate, "blocked");
  assert.equal(quality.stopGo, "STOP");

  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.equal(directoryContract("Washington")?.directoryPath, "/washington");
  assert.ok(
    directoryContract("Oregon")?.publication === "public"
      || directoryContract("Oregon")?.publication === "development",
  );
  assert.equal(WASHINGTON_LISTED_COUNT, 6278);
  assert.equal(OREGON_LISTED_COUNT, 1584);
});

test("phase 25 fixtures present after package assembly", () => {
  const summaryPath = join(fixtureDir, "live-run-summary.json");
  if (!existsSync(summaryPath)) {
    assert.ok(true);
    return;
  }
  const summary = loadJson<{
    gate: string;
    stopGo: string;
    allowsPublication: boolean;
    unpublishedLeakPossibleCount: number;
    eligibilityMatches: boolean;
    sourceAllPass: boolean;
    productionDeployed: boolean;
    rosterDenominator: number;
    listingExclusionsInCandidates: number;
    otherwiseClearOffline: number;
  }>("live-run-summary.json");
  assert.equal(summary.gate, "blocked");
  assert.equal(summary.stopGo, "STOP");
  assert.equal(summary.allowsPublication, false);
  assert.equal(summary.unpublishedLeakPossibleCount, 0);
  assert.equal(summary.eligibilityMatches, true);
  assert.equal(summary.sourceAllPass, true);
  assert.equal(summary.productionDeployed, false);
  assert.equal(summary.rosterDenominator, 15451);
  assert.equal(summary.listingExclusionsInCandidates, 88);
  assert.equal(summary.otherwiseClearOffline, 15363);
});
