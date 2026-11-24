import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  CALIFORNIA_TIER2_PUBLIC_COVERAGE_DISCLOSURE,
  CALIFORNIA_TIER2_RELEASE_BASELINE,
  CALIFORNIA_TIER2_RELEASE_CONTROLS,
  CALIFORNIA_TIER2_RELEASE_DIRECTORY_COUNT,
  CALIFORNIA_TIER2_RELEASE_IDENTITY_REJECTED_ID,
  CALIFORNIA_TIER2_RELEASE_UNVERIFIED_EXCLUDED,
  CALIFORNIA_TIER2_RELEASE_VERIFIED_MAP_COUNT,
  CALIFORNIA_TIER2_ROLLBACK_MAIN,
  californiaTier2PublicMapAuthorized,
  californiaTier2PublicationReadiness,
  californiaTier2ReleaseCandidateReady,
  californiaTier2RollbackPlan,
} from "../../../lib/california-tier2-release.ts";
import { loadCaliforniaTier1FullRosterCompact } from "../../../lib/california-tier1-full-roster.ts";
import { loadCaliforniaTier2MapCoverage } from "../../../lib/california-tier2-map.ts";
import { directoryContract, mapHref } from "../../../lib/state-directory.ts";
import { ENABLED_OWNER_FACILITY_STATES } from "../../../lib/owner-facility-read.ts";
import { sitemapPaths, WASHINGTON_PUBLIC_PAGES } from "../../../lib/public-indexing.ts";

test("Tier 2 activation baseline 30c508c; public map authorization ON", () => {
  assert.equal(CALIFORNIA_TIER2_RELEASE_BASELINE, "30c508c");
  assert.equal(CALIFORNIA_TIER2_RELEASE_CONTROLS.publicMapAuthorized, true);
  assert.equal(californiaTier2PublicMapAuthorized(), true);
  assert.equal(CALIFORNIA_TIER2_RELEASE_CONTROLS.publicMapPath, "/california/map");
  assert.equal(californiaTier2ReleaseCandidateReady(), true);
  const ready = californiaTier2PublicationReadiness();
  assert.equal(ready.publicMap, "GO");
  assert.equal(ready.developmentMap, "GO");
  assert.equal(ready.tier1Directory, "LIVE");
  assert.equal(ready.oregon, "UNPUBLISHED");
  assert.equal(ready.rollbackTo, "b07a1ac");
  assert.equal(CALIFORNIA_TIER2_ROLLBACK_MAIN, "b07a1ac");
});

test("preserves 15435 directory and 15418 verified map points; 17 excluded", () => {
  assert.equal(CALIFORNIA_TIER2_RELEASE_DIRECTORY_COUNT, 15435);
  assert.equal(CALIFORNIA_TIER2_RELEASE_VERIFIED_MAP_COUNT, 15418);
  assert.equal(CALIFORNIA_TIER2_RELEASE_UNVERIFIED_EXCLUDED, 17);
  assert.equal(loadCaliforniaTier1FullRosterCompact().length, 15435);
  assert.equal(loadCaliforniaTier2MapCoverage().mapPoints.count, 15418);
  assert.equal(CALIFORNIA_TIER2_RELEASE_IDENTITY_REJECTED_ID, "011405838");
  assert.equal(CALIFORNIA_TIER2_RELEASE_CONTROLS.sourceAsOfIso, "2026-11-22");
  assert.equal(CALIFORNIA_TIER2_RELEASE_CONTROLS.fabricatedCoordinates, 0);
  assert.equal(CALIFORNIA_TIER2_RELEASE_CONTROLS.geocoded, false);
  assert.equal(CALIFORNIA_TIER2_RELEASE_CONTROLS.ownerClaimsEnabled, false);
  assert.equal(CALIFORNIA_TIER2_RELEASE_CONTROLS.enhancedFeaturesEnabled, false);
});

test("public coverage disclosure + map nav; rollback to b07a1ac", () => {
  assert.equal(CALIFORNIA_TIER2_PUBLIC_COVERAGE_DISCLOSURE.publicMapAuthorized, true);
  assert.equal(CALIFORNIA_TIER2_PUBLIC_COVERAGE_DISCLOSURE.mapPath, "/california/map");
  const page = readFileSync("app/california/page.tsx", "utf8");
  assert.ok(page.includes("CALIFORNIA_TIER2_PUBLIC_COVERAGE_DISCLOSURE"));
  assert.ok(page.includes('href="/california/map"'));
  assert.ok(page.includes("not a vacancy") || page.includes("CALIFORNIA_TIER2_PUBLIC_COVERAGE_DISCLOSURE"));
  const plan = californiaTier2RollbackPlan();
  assert.equal(plan.rollbackToMainSha, "b07a1ac");
  assert.ok(plan.steps.some((s) => s.id === "revert-main-to-b07a1ac"));
  assert.ok(plan.preserve.some((p) => /Washington/i.test(p)));
  assert.ok(plan.preserve.some((p) => /Oregon/i.test(p)));
});

test("safeguards: public mapPath, sitemap map, WA Design 2, OR unpublished, owner WA", () => {
  assert.equal(directoryContract("California")?.mapPath, "/california/map");
  assert.equal(mapHref("California"), "/california/map");
  assert.ok(sitemapPaths(true, []).includes("/california/map"));
  assert.equal(sitemapPaths(true, []).includes("/development/california/map"), false);
  assert.equal(existsSync("app/california/map/page.tsx"), true);
  assert.ok(
    readFileSync("app/california/map/page.tsx", "utf8").includes(
      "CaliforniaTier2MapClient",
    ),
  );
  assert.equal(directoryContract("Washington")?.mapPath, "/washington/map");
  assert.ok(WASHINGTON_PUBLIC_PAGES.some((p) => p.path === "/washington/map"));
  assert.ok(sitemapPaths(true, []).includes("/washington/map"));
  assert.equal(directoryContract("Oregon")?.publication, "development");
  assert.deepEqual([...ENABLED_OWNER_FACILITY_STATES], ["WA"]);
  const oregon = readFileSync("app/oregon/layout.tsx", "utf8");
  assert.ok(oregon.includes("notFound()"));
});
