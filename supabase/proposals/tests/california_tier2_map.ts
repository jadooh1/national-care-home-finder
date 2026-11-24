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

test("Tier 2 map stays development-only; public CA map OFF; Tier 1 directory live", () => {
  assert.equal(CALIFORNIA_TIER2_MAP_SCOPE.publicMapEnabled, false);
  assert.equal(CALIFORNIA_TIER2_MAP_SCOPE.publicMapPath, null);
  assert.equal(CALIFORNIA_TIER2_MAP_SCOPE.californiaMapPublished, false);
  assert.equal(CALIFORNIA_TIER2_MAP_SCOPE.verifiedMapPointCount, 15418);
  assert.equal(CALIFORNIA_TIER2_MAP_SCOPE.unverifiedExcluded, 17);
  assert.equal(CALIFORNIA_TIER2_MAP_SCOPE.validationBaseline, "056b35f");
  assert.equal(californiaTier2PublicMapEnabled(), false);
  assert.equal(californiaTier2MapPath(), "/development/california/map");
  assert.equal(directoryContract("California")?.mapPath, null);
  assert.equal(directoryContract("California")?.directoryPath, "/california");
  assert.equal(directoryContract("California")?.publication, "public");
  assert.equal(mapHref("California"), null);
  assert.deepEqual([...ENABLED_OWNER_FACILITY_STATES], ["WA"]);
  assert.ok(PRIVATE_INDEX_PREFIXES.includes("/development"));
  assert.equal(existsSync("app/california/page.tsx"), true);
  assert.equal(existsSync("app/california/map/page.tsx"), true);
  const publicMapPage = readFileSync("app/california/map/page.tsx", "utf8");
  assert.ok(publicMapPage.includes("notFound()"));
  assert.equal(publicMapPage.includes("CaliforniaTier2MapClient"), false);
  assert.equal(existsSync("app/development/california/map/page.tsx"), true);
  const paths = sitemapPaths(true, ["100001"]);
  assert.equal(paths.includes("/development/california/map"), false);
  assert.equal(paths.includes("/california/map"), false);
  assert.ok(paths.includes("/washington/map"));
});

test("coverage fixture: 15418 verified; 17 unverified excluded", () => {
  const coverage = loadCaliforniaTier2MapCoverage();
  const summary = californiaTier2MapCoverageSummary();
  const roster = loadCaliforniaTier1FullRosterCompact();
  assert.equal(roster.length, 15435);
  assert.equal(coverage.roster.listableCount, 15435);
  assert.equal(coverage.matching.eligibleCount, 15435);
  assert.equal(coverage.matching.exactMatchWithValidCoords, 14058);
  assert.equal(coverage.matching.leadingZeroCollapsedUniqueWithValidCoords, 1360);
  assert.equal(coverage.matching.leadingZeroIdentityVerified, 1360);
  assert.equal(coverage.matching.leadingZeroIdentityRejected, 1);
  assert.equal(coverage.matching.usableOfficialCoords, 15418);
  assert.equal(coverage.matching.unmatched, 16);
  assert.equal(coverage.matching.ambiguousRejected, 0);
  assert.equal(coverage.source.fabricatedCoordinates, 0);
  assert.equal(coverage.source.geocoded, false);
  assert.equal(coverage.mapPoints.count, 15418);
  assert.equal(summary.usable, 15418);
  assert.equal(summary.leadingZeroIdentityRejected, 1);
  assert.equal(
    coverage.matching.unmatched + (coverage.matching.leadingZeroIdentityRejected ?? 0),
    17,
  );

  const points = JSON.parse(readFileSync(`${FIXTURE}/points.json`, "utf8")) as Array<{
    n: string;
    kind: "e" | "z";
  }>;
  assert.equal(points.length, 15418);
  assert.equal(points.filter((p) => p.kind === "z").length, 1360);
  assert.equal(points.some((p) => p.n === "011405838"), false);

  const unmatched = JSON.parse(
    readFileSync(`${FIXTURE}/unmatched-ids.json`, "utf8"),
  ) as string[];
  const rejected = JSON.parse(
    readFileSync(`${FIXTURE}/leading-zero-identity-rejected.json`, "utf8"),
  ) as Array<{ facilityNumber: string }>;
  assert.equal(unmatched.length + rejected.length, 17);
  assert.ok(unmatched.every((id) => !points.some((p) => p.n === id)));
  assert.ok(rejected.every((r) => !points.some((p) => p.n === r.facilityNumber)));
});

test("search links to public Tier 1 profiles and CDSS; rejected ID absent", () => {
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
  assert.ok(sitemapPaths(true, []).includes("/washington/map"));
  const layout = readFileSync("app/oregon/layout.tsx", "utf8");
  assert.ok(layout.includes("PUBLIC_PRODUCTION_HOSTS"));
  assert.ok(layout.includes("notFound()"));
  assert.equal(directoryContract("Oregon")?.publication, "development");
  assert.equal(directoryContract("Oregon")?.mapPath, null);
});
