import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  CALIFORNIA_TIER2_MAP_SCOPE,
  californiaTier2MapCoverageSummary,
  californiaTier2MapPath,
  californiaTier2PublicMapEnabled,
  loadCaliforniaTier2MapCoverage,
  searchCaliforniaTier2MapPoints,
} from "../../../lib/california-tier2-map.ts";
import { loadCaliforniaTier1FullRosterCompact } from "../../../lib/california-tier1-full-roster.ts";
import { directoryContract, mapHref } from "../../../lib/state-directory.ts";
import { ENABLED_OWNER_FACILITY_STATES } from "../../../lib/owner-facility-read.ts";
import { PRIVATE_INDEX_PREFIXES, sitemapPaths } from "../../../lib/public-indexing.ts";
import { WASHINGTON_PUBLIC_PAGES } from "../../../lib/public-indexing.ts";

const FIXTURE = "supabase/proposals/fixtures/california-tier2-map";

test("Tier 2 public map authorized; owner still WA-only", () => {
  assert.equal(CALIFORNIA_TIER2_MAP_SCOPE.publicMapEnabled, true);
  assert.equal(CALIFORNIA_TIER2_MAP_SCOPE.publicMapPath, "/california/map");
  assert.equal(CALIFORNIA_TIER2_MAP_SCOPE.californiaMapPublished, true);
  assert.equal(CALIFORNIA_TIER2_MAP_SCOPE.verifiedMapPointCount, 15418);
  assert.equal(CALIFORNIA_TIER2_MAP_SCOPE.unverifiedExcluded, 17);
  assert.equal(californiaTier2PublicMapEnabled(), true);
  assert.equal(californiaTier2MapPath(), "/california/map");
  assert.equal(directoryContract("California")?.mapPath, "/california/map");
  assert.equal(directoryContract("California")?.directoryPath, "/california");
  assert.equal(directoryContract("California")?.publication, "public");
  assert.equal(mapHref("California"), "/california/map");
  assert.deepEqual([...ENABLED_OWNER_FACILITY_STATES], ["WA"]);
  assert.ok(PRIVATE_INDEX_PREFIXES.includes("/development"));
  assert.equal(existsSync("app/california/map/page.tsx"), true);
  const publicMap = readFileSync("app/california/map/page.tsx", "utf8");
  assert.ok(publicMap.includes("CaliforniaTier2MapClient"));
  assert.ok(publicMap.includes("californiaTier2PublicMapAuthorized"));
  assert.equal(existsSync("app/development/california/map/page.tsx"), true);
  assert.ok(
    readFileSync("app/development/california/map/page.tsx", "utf8").includes(
      'redirect("/california/map")',
    ),
  );
  const paths = sitemapPaths(true, ["100001"]);
  assert.ok(paths.includes("/california/map"));
  assert.ok(paths.includes("/california"));
  assert.ok(paths.includes("/washington/map"));
  assert.equal(paths.includes("/development/california/map"), false);
});

test("coverage fixture: 15418 verified; 17 unverified excluded", () => {
  const coverage = loadCaliforniaTier2MapCoverage();
  const summary = californiaTier2MapCoverageSummary();
  const roster = loadCaliforniaTier1FullRosterCompact();
  assert.equal(roster.length, 15435);
  assert.equal(coverage.matching.usableOfficialCoords, 15418);
  assert.equal(coverage.mapPoints.count, 15418);
  assert.equal(coverage.mapPoints.publicMapEnabled, true);
  assert.equal(coverage.mapPoints.publicMapPath, "/california/map");
  assert.equal(summary.usable, 15418);
  assert.equal(summary.publicMapEnabled, true);
  assert.equal(
    coverage.matching.unmatched + (coverage.matching.leadingZeroIdentityRejected ?? 0),
    17,
  );

  const points = JSON.parse(readFileSync(`${FIXTURE}/points.json`, "utf8")) as Array<{
    n: string;
    kind: "e" | "z";
  }>;
  assert.equal(points.length, 15418);
  assert.equal(points.some((p) => p.n === "011405838"), false);
  const unmatched = JSON.parse(readFileSync(`${FIXTURE}/unmatched-ids.json`, "utf8")) as string[];
  const rejected = JSON.parse(
    readFileSync(`${FIXTURE}/leading-zero-identity-rejected.json`, "utf8"),
  ) as Array<{ facilityNumber: string }>;
  assert.equal(unmatched.length + rejected.length, 17);
});

test("search links to public profiles and CDSS; rejected ID absent", () => {
  const byZip = searchCaliforniaTier2MapPoints({ zip: "92691" });
  assert.ok(byZip.totalMatched >= 1);
  assert.ok(byZip.points.every((p) => p.disclosureUrl?.includes("FacDetail/")));
  assert.ok(byZip.points.every((p) => p.profilePath?.startsWith("/california/")));
  assert.equal(searchCaliforniaTier2MapPoints({ q: "011405838" }).totalMatched, 0);
});

test("Washington Design 2 map and Oregon unpublished preserved", () => {
  assert.equal(directoryContract("Washington")?.mapPath, "/washington/map");
  assert.equal(mapHref("Washington"), "/washington/map");
  assert.ok(WASHINGTON_PUBLIC_PAGES.some((p) => p.path === "/washington/map"));
  const layout = readFileSync("app/oregon/layout.tsx", "utf8");
  assert.ok(layout.includes("PUBLIC_PRODUCTION_HOSTS"));
  assert.ok(layout.includes("notFound()"));
  assert.equal(directoryContract("Oregon")?.publication, "development");
  assert.equal(directoryContract("Oregon")?.mapPath, null);
});
