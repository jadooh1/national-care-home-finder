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

test("Tier 2 RC baseline 056b35f; public map authorization OFF", () => {
  assert.equal(CALIFORNIA_TIER2_RELEASE_BASELINE, "056b35f");
  assert.equal(CALIFORNIA_TIER2_RELEASE_CONTROLS.publicMapAuthorized, false);
  assert.equal(californiaTier2PublicMapAuthorized(), false);
  assert.equal(CALIFORNIA_TIER2_RELEASE_CONTROLS.publicMapPath, null);
  assert.equal(CALIFORNIA_TIER2_RELEASE_CONTROLS.developmentMapPath, "/development/california/map");
  assert.equal(californiaTier2ReleaseCandidateReady(), true);
  const ready = californiaTier2PublicationReadiness();
  assert.equal(ready.publicMap, "STOP");
  assert.equal(ready.developmentMap, "GO");
  assert.equal(ready.tier1Directory, "LIVE");
  assert.equal(ready.oregon, "UNPUBLISHED");
});

test("preserves 15435 directory facilities and 15418 verified map points; 17 excluded", () => {
  assert.equal(CALIFORNIA_TIER2_RELEASE_DIRECTORY_COUNT, 15435);
  assert.equal(CALIFORNIA_TIER2_RELEASE_VERIFIED_MAP_COUNT, 15418);
  assert.equal(CALIFORNIA_TIER2_RELEASE_UNVERIFIED_EXCLUDED, 17);
  assert.equal(loadCaliforniaTier1FullRosterCompact().length, 15435);
  assert.equal(loadCaliforniaTier2MapCoverage().mapPoints.count, 15418);
  assert.equal(CALIFORNIA_TIER2_RELEASE_IDENTITY_REJECTED_ID, "011405838");
  const unmatched = JSON.parse(
    readFileSync(
      "supabase/proposals/fixtures/california-tier2-map/unmatched-ids.json",
      "utf8",
    ),
  ) as string[];
  const rejected = JSON.parse(
    readFileSync(
      "supabase/proposals/fixtures/california-tier2-map/leading-zero-identity-rejected.json",
      "utf8",
    ),
  ) as unknown[];
  assert.equal(unmatched.length + rejected.length, 17);
});

test("public coverage disclosure present; rollback plan preserves WA/Tier1/OR", () => {
  assert.equal(CALIFORNIA_TIER2_PUBLIC_COVERAGE_DISCLOSURE.publicMapAuthorized, false);
  assert.equal(CALIFORNIA_TIER2_PUBLIC_COVERAGE_DISCLOSURE.verifiedCount, 15418);
  assert.equal(CALIFORNIA_TIER2_PUBLIC_COVERAGE_DISCLOSURE.unverifiedExcluded, 17);
  const page = readFileSync("app/california/page.tsx", "utf8");
  assert.ok(page.includes("CALIFORNIA_TIER2_PUBLIC_COVERAGE_DISCLOSURE"));
  assert.ok(page.includes("map coverage disclosure"));
  assert.equal(page.includes('href="/california/map"'), false);
  assert.equal(page.includes('href="/development/california/map"'), false);

  const plan = californiaTier2RollbackPlan();
  assert.ok(plan.steps.length >= 4);
  assert.ok(plan.preserve.some((p) => /Washington/i.test(p)));
  assert.ok(plan.preserve.some((p) => /Tier 1/i.test(p)));
  assert.ok(plan.preserve.some((p) => /Oregon/i.test(p)));
});

test("safeguards: mapPath null, no /california/map, WA Design 2, OR unpublished, owner WA", () => {
  assert.equal(directoryContract("California")?.mapPath, null);
  assert.equal(mapHref("California"), null);
  assert.equal(directoryContract("California")?.publication, "public");
  assert.equal(existsSync("app/california/map/page.tsx"), true);
  assert.ok(readFileSync("app/california/map/page.tsx", "utf8").includes("notFound()"));
  assert.equal(existsSync("app/development/california/map/page.tsx"), true);
  assert.equal(directoryContract("Washington")?.mapPath, "/washington/map");
  assert.ok(WASHINGTON_PUBLIC_PAGES.some((p) => p.path === "/washington/map"));
  assert.ok(sitemapPaths(true, []).includes("/washington/map"));
  assert.equal(directoryContract("Oregon")?.publication, "development");
  assert.deepEqual([...ENABLED_OWNER_FACILITY_STATES], ["WA"]);
  const home = readFileSync("app/page.tsx", "utf8");
  assert.ok(home.length > 0);
});
