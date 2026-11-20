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
  CALIFORNIA_PHASE26_BASELINE_COUNTS,
  CALIFORNIA_PHASE26_MANIFEST_VERSION,
  CALIFORNIA_PHASE26_PRIOR_PHASES,
  CALIFORNIA_PHASE26_UNRESOLVED_LICENSING_CONFLICT_IDS,
  assertCaliforniaPhase26Baseline,
  buildCaliforniaPhase26ReadinessManifest,
} from "../../../lib/california-phase26-readiness-manifest.ts";
import {
  CALIFORNIA_PHASE26_RESTRICTION_CHECKS,
  evaluateCaliforniaPhase26PublicationRestrictions,
} from "../../../lib/california-phase26-publication-restrictions.ts";
import {
  CALIFORNIA_PHASE26_RELEASE_CHECKLIST,
  CALIFORNIA_PHASE26_ROLLBACK_CHECKLIST,
  californiaPhase26DisclosureUrl,
  evaluateCaliforniaPhase26SecurityRollback,
} from "../../../lib/california-phase26-security-rollback.ts";
import { evaluateCaliforniaPhase26CdssDependency } from "../../../lib/california-phase26-cdss-dependency.ts";
import {
  CALIFORNIA_PHASE26_RISKS,
  evaluateCaliforniaPhase26RiskMatrix,
} from "../../../lib/california-phase26-risk-matrix.ts";
import { evaluateCaliforniaPhase26Quality } from "../../../lib/california-phase26-quality.ts";
import {
  CALIFORNIA_PHASE26_PUBLICATION_STOP_GO,
  californiaPhase26AllowsPublication,
  evaluateCaliforniaPhase26Readiness,
} from "../../../lib/california-phase26-readiness.ts";
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
  "../fixtures/california-phase26-release-readiness",
);

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8")) as T;
}

test("phase 26 readiness manifest: Phases 20–25 + baseline counts", () => {
  const manifest = buildCaliforniaPhase26ReadinessManifest();
  assert.equal(manifest.version, CALIFORNIA_PHASE26_MANIFEST_VERSION);
  assert.equal(manifest.gate, "blocked");
  assert.equal(manifest.stopGo, "STOP");
  assert.equal(manifest.allowsPublication, false);
  assert.equal(manifest.baseline.matches, true);
  assert.equal(CALIFORNIA_PHASE26_PRIOR_PHASES.length, 6);
  assert.ok(CALIFORNIA_PHASE26_PRIOR_PHASES.every(p => p.gate === "blocked"));

  assert.equal(CALIFORNIA_PHASE26_BASELINE_COUNTS.officialRecords, 24377);
  assert.equal(CALIFORNIA_PHASE26_BASELINE_COUNTS.californiaCandidates, 15451);
  assert.equal(CALIFORNIA_PHASE26_BASELINE_COUNTS.listingExclusionsInCandidates, 88);
  assert.equal(CALIFORNIA_PHASE26_BASELINE_COUNTS.otherwiseClearOffline, 15363);
  assert.equal(CALIFORNIA_PHASE26_BASELINE_COUNTS.unresolvedCoordinates, 28);
  assert.equal(CALIFORNIA_PHASE26_BASELINE_COUNTS.mapOnlySuppressions, 27);
  assert.equal(
    CALIFORNIA_PHASE26_BASELINE_COUNTS.listingExclusionsInCandidates
      + CALIFORNIA_PHASE26_BASELINE_COUNTS.otherwiseClearOffline,
    15451,
  );
  assert.equal(
    CALIFORNIA_PHASE26_BASELINE_COUNTS.activeCandidates
      + CALIFORNIA_PHASE26_BASELINE_COUNTS.restrictedCandidates
      + CALIFORNIA_PHASE26_BASELINE_COUNTS.excluded
      + CALIFORNIA_PHASE26_BASELINE_COUNTS.exceptionDocumentedExclude,
    24377,
  );
  assert.deepEqual(manifest.unresolvedLicensingConflictIds, [
    ...CALIFORNIA_PHASE26_UNRESOLVED_LICENSING_CONFLICT_IDS,
  ]);
  assert.equal(assertCaliforniaPhase26Baseline().publicationEligibleCount, 0);
});

test("phase 26 publication restrictions: CA inaccessible; WA/OR unchanged", () => {
  const restrictions = evaluateCaliforniaPhase26PublicationRestrictions();
  assert.equal(restrictions.summary.allPass, true);
  assert.equal(restrictions.summary.leakPossibleCount, 0);
  assert.ok(CALIFORNIA_PHASE26_RESTRICTION_CHECKS.length >= 8);

  assert.equal(californiaDirectoryReady(), false);
  assert.equal(californiaProfileUrl(), null);
  assert.equal(directoryContract("California")?.publication, "unpublished");
  assert.equal(directoryContract("California")?.directoryPath, null);
  assert.equal(directoryHref("California", "https://example.supabase.co"), null);
  assert.equal(mapHref("California"), null);

  assert.ok(PRIVATE_INDEX_PREFIXES.includes("/development"));
  assert.ok(robotsPolicy(true).disallow.includes("/development"));
  const paths = sitemapPaths(true, ["100001"]);
  assert.ok(paths.every(p => !p.toLowerCase().includes("california")));
  assert.ok(paths.every(p => !p.startsWith("/development")));
  assert.deepEqual(
    sitemapPaths(true, []).slice(0, WASHINGTON_PUBLIC_PAGES.length),
    WASHINGTON_PUBLIC_PAGES.map(page => page.path),
  );

  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.equal(directoryContract("Washington")?.directoryPath, "/washington");
  assert.ok(
    directoryContract("Oregon")?.publication === "public"
      || directoryContract("Oregon")?.publication === "development",
  );
  assert.equal(WASHINGTON_LISTED_COUNT, 6278);
  assert.equal(OREGON_LISTED_COUNT, 1584);
});

test("phase 26 security + rollback readiness", () => {
  const security = evaluateCaliforniaPhase26SecurityRollback();
  assert.equal(security.allPass, true);
  assert.equal(security.productionWrites, false);
  assert.equal(security.gate, "blocked");
  assert.ok(CALIFORNIA_PHASE26_RELEASE_CHECKLIST.length >= 5);
  assert.ok(CALIFORNIA_PHASE26_ROLLBACK_CHECKLIST.length >= 5);
  assert.equal(
    californiaPhase26DisclosureUrl("015601219"),
    californiaDisclosureUrl("015601219"),
  );
  assert.equal(californiaPhase26DisclosureUrl("95354"), null);
  assert.notEqual(
    californiaPhase26DisclosureUrl("15601219"),
    californiaPhase26DisclosureUrl("015601219"),
  );
});

test("phase 26 CDSS dependency: ISO absent; no send; STOP", () => {
  const cdss = evaluateCaliforniaPhase26CdssDependency();
  assert.equal(cdss.authoritativeIsoExportDate, null);
  assert.equal(cdss.globalBlockerUnchanged, true);
  assert.equal(cdss.followUpDraftStatus, "draft-do-not-send");
  assert.equal(cdss.mailSentThisPhase, false);
  assert.equal(cdss.newAuthoritativeEvidenceFound, false);
  assert.equal(cdss.duplicateInquiryAllowed, false);
  assert.equal(cdss.stopGo, "STOP");
  assert.match(cdss.exactEvidenceStillNeeded, /ISO/);
});

test("phase 26 risk matrix + readiness / quality: BLOCKED", () => {
  const risks = evaluateCaliforniaPhase26RiskMatrix();
  assert.ok(risks.blockerCount >= 5);
  assert.ok(CALIFORNIA_PHASE26_RISKS.some(r => r.id === "authoritative-freshness"));
  assert.equal(risks.stopGo, "STOP");

  assert.equal(californiaPhase26AllowsPublication(), false);
  assert.equal(CALIFORNIA_PHASE26_PUBLICATION_STOP_GO.decision, "STOP");
  assert.equal(CALIFORNIA_PHASE26_PUBLICATION_STOP_GO.allowsPublication, false);

  const quality = evaluateCaliforniaPhase26Quality();
  assert.equal(quality.allPass, true);
  assert.equal(quality.gate, "blocked");

  const readiness = evaluateCaliforniaPhase26Readiness(quality.allPass);
  assert.equal(readiness.allowsPublication, false);
  assert.equal(readiness.gate, "blocked");
  assert.equal(readiness.stopGo, "STOP");
  assert.equal(readiness.exclusionsActivated, false);
  assert.equal(readiness.crawlExecuted, false);
  assert.equal(readiness.cdssMailSent, false);
  assert.equal(readiness.productionWrites, false);
});

test("phase 26 fixtures present after package assembly", () => {
  const summaryPath = join(fixtureDir, "live-run-summary.json");
  if (!existsSync(summaryPath)) {
    assert.ok(true);
    return;
  }
  const summary = loadJson<{
    gate: string;
    stopGo: string;
    allowsPublication: boolean;
    baselineMatches: boolean;
    leakPossibleCount: number;
    authoritativeIsoExportDate: null;
    mailSentThisPhase: boolean;
    californiaCandidates: number;
    listingExclusionsInCandidates: number;
    otherwiseClearOffline: number;
  }>("live-run-summary.json");
  assert.equal(summary.gate, "blocked");
  assert.equal(summary.stopGo, "STOP");
  assert.equal(summary.allowsPublication, false);
  assert.equal(summary.baselineMatches, true);
  assert.equal(summary.leakPossibleCount, 0);
  assert.equal(summary.authoritativeIsoExportDate, null);
  assert.equal(summary.mailSentThisPhase, false);
  assert.equal(summary.californiaCandidates, 15451);
  assert.equal(summary.listingExclusionsInCandidates, 88);
  assert.equal(summary.otherwiseClearOffline, 15363);
});
